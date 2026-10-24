import concurrent.futures
import json
import os
import re
import unicodedata
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple
from dotenv import load_dotenv

AI_TIMEOUT_SECONDS = 7.5

load_dotenv(override=False)

from advice import check_activity, summarize_forecast, guess_activity
from forecast import forecast_next_24h
from live_data import (
    get_live_aqi_by_coords,
    get_live_aqi_by_city,
    get_weather_context,
    get_seasonal_context,
    get_indian_city_live_intelligence,
    geocode_indian_city,
    INDIAN_CITIES,
)
from planner import plan_activity, ACTIVITY_PROFILES, detect_activity

# ---------------------------------------------------------------------------
# SYSTEM PROMPT — Short, Simple, Plain Language for Ordinary Citizens
# ---------------------------------------------------------------------------
SYSTEM = """You are Drishti, a friendly air quality assistant for Indian cities.
You give SHORT, SIMPLE, EASY-TO-READ answers for ordinary citizens and 12-year-old readers.

CORE STYLE RULES (ALWAYS FOLLOW):
1. Default Length: 2 to 4 short sentences, about 40 to 70 words total, in ONE short paragraph.
2. Structure (in order):
   - Sentence 1: The direct answer in plain words (e.g. "Not a good time to go out right now." or "Yes, it is fine to commute right now." or "Wait until 7 PM.").
   - Sentence 2: ONE simple reason, using at most ONE number (e.g. "The air is quite dirty today, AQI 184."). Name the AQI scale only if it is not obvious.
   - Sentence 3: What to do and when, with the exact time if there is one (e.g. "Best departure time: 8 AM." or "Keep vehicle windows closed on the road."). If there is no good time in the forecast, say that plainly and give the least-bad time or a practical alternative for that specific activity.
   - Optional sentence 4: A very short tip (mask, windows, drink water), only if useful.
3. Language for a 12-year-old:
   - Use short words and everyday language.
   - Use "tiny dust particles" instead of PM2.5 or particulate matter.
   - Use "bigger dust" instead of PM10.
   - Use "wind is very weak, so smoke stays near the ground" instead of stagnation, boundary layer, or inversion.
   - Use "air gets cleaner in the afternoon when sunlight warms the ground" instead of solar thermal dispersion.
   - Use "model" or "forecast" instead of LightGBM or regressor.
   - NEVER USE THESE BANNED WORDS: µg/m³, inversion ceiling, boundary layer, particulate, aerosol, dispersion, stagnation, telemetry, bronchial, alveoli, persistence baseline, horizon, CAMS, reanalysis.
4. Formatting:
   - NO MARKDOWN AT ALL. Never use asterisks (**), hashes (#), bullet points (- or •), or backticks.
   - Write in plain text, single paragraph.
5. Behavior:
   - Answer only about what the user asked. Never suggest a different activity (like exercising or working out) unless they asked about it. If unsure what they plan to do, ask one short question.
   - Never mention internal tools, models, data sources, or how the answer was produced unless the user asks.
   - Do not diagnose or give medical advice. For children, asthma, or elderly users, be a little more cautious in wording, still short.
   - Vary opening phrasing naturally across turns; do not repeat the same opening sentence.
   - End with at most one very short follow-up offer ONLY when it adds value (e.g. "Want a plan for tomorrow too?"). Do not include on every reply.
   - When asked when, whether, or if it is safe to do outdoor activities, call the plan_activity tool to get exact safe times.

LONGER ANSWERS ONLY WHEN ASKED:
- If the user explicitly asks for detail ("explain", "why", "tell me more", "in detail", "how does it work"), allow up to about 120 words. Still plain language, still no banned jargon, and no bullets unless requested.
- If the user asks to compare two cities, give one short sentence per city plus one sentence of advice (max ~60 words total).
- NEVER exceed 130 words in any reply.
"""

# ---------------------------------------------------------------------------
# HISTORICAL BENCHMARKS (from trained dataset)
# ---------------------------------------------------------------------------

def get_historical_benchmarks(city: str) -> dict:
    """Retrieve historical AQI benchmarks from the national statistics dataset."""
    stats_file = Path(__file__).resolve().parent / "data" / "national_aqi_stats.json"
    if not stats_file.exists():
        return {"city": city, "note": "Historical benchmark dataset not yet compiled."}
    try:
        with open(stats_file, "r", encoding="utf-8") as f:
            data = json.load(f)
        benchmarks = data.get("city_benchmarks", {})

        c_lower = city.lower().strip()
        for c_key, c_val in benchmarks.items():
            if c_key.lower() == c_lower or c_key.lower() in c_lower or c_lower in c_key.lower():
                return c_val

        state_benchmarks = data.get("state_benchmarks", {})
        for s_key, s_val in state_benchmarks.items():
            if s_key.lower() in c_lower or c_lower in s_key.lower():
                return s_val

        return {
            "city": city,
            "note": "City not individually indexed. National benchmark:",
            "national_average_aqi": 118.5,
            "national_status_distribution": data.get("status_distribution", [])[:4],
        }
    except Exception as e:
        return {"error": str(e)}


# ---------------------------------------------------------------------------
# TOOL DEFINITIONS & EXECUTION ROUTER
# ---------------------------------------------------------------------------

GROQ_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "plan_activity",
            "description": "Determine safe time windows for activities across a 1 to 5 day forecast. Call this tool when the user asks WHEN, WHETHER, or IF it is safe to do something outdoors, commute, open windows, or step outside.",
            "parameters": {
                "type": "object",
                "properties": {
                    "activity": {
                        "type": "string",
                        "enum": [
                            "commute",
                            "running",
                            "cycling",
                            "outdoor_workout",
                            "kids_play",
                            "outdoor_walk",
                            "picnic",
                            "open_windows",
                            "outdoor_yoga",
                            "general_outdoor"
                        ],
                        "description": (
                            "Activity type: 'commute' (office, work, job, school run, market, errands, travel, cab, bus, driving); "
                            "'running' (runs, jogging, 5k); 'cycling' (cycling workout, bike training); "
                            "'outdoor_workout' (gym, cricket, football, sports, exercise); 'kids_play' (children playing outside); "
                            "'outdoor_walk' (walking, stroll); 'picnic' (picnic, family outing); "
                            "'open_windows' (opening windows, ventilation, balcony); 'outdoor_yoga' (yoga, pranayama); "
                            "or 'general_outdoor' (general air check, stepping outside, going out)."
                        ),
                    },
                    "duration_min": {
                        "type": "integer",
                        "description": "Expected duration in minutes (e.g. 30, 45, 60, 120). Default 45.",
                    },
                    "sensitive": {
                        "type": "boolean",
                        "description": "True if user mentions asthma, breathing issues, elderly, child, kid, baby, heart condition, or pregnancy.",
                    },
                },
                "required": ["activity"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_indian_city_overview",
            "description": "Fetch real-time live AQI, live weather, weather impact analysis, and historical benchmarks for ANY Indian city.",
            "parameters": {
                "type": "object",
                "properties": {
                    "city": {"type": "string", "description": "Indian city name, e.g. Delhi, Mumbai, Bengaluru, Kolkata, Chennai, Hyderabad, Pune, Jaipur, Lucknow, Meerut, etc."}
                },
                "required": ["city"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "Get real-time weather conditions (temp, humidity, wind, rain) and their meteorological impact on AQI for user location or a specific city.",
            "parameters": {
                "type": "object",
                "properties": {
                    "city": {"type": "string", "description": "Optional city name. If blank, uses current user location."}
                },
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_forecast",
            "description": "Get current AQI and 24-hour hyper-local forecast summary.",
            "parameters": {"type": "object", "properties": {}},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_season_context",
            "description": "Get current Indian season AQI dynamics, stubble burning, Diwali, winter smog fog, or monsoon impacts.",
            "parameters": {"type": "object", "properties": {}},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_historical_benchmarks",
            "description": "Retrieve historical AQI benchmark stats for an Indian city.",
            "parameters": {
                "type": "object",
                "properties": {
                    "city": {"type": "string", "description": "City name"}
                },
                "required": ["city"],
            },
        },
    },
]


def run_tool(name: str, args: dict, lat: float, lon: float) -> dict:
    if name == "plan_activity":
        return plan_activity(
            activity=args.get("activity", "outdoor_walk"),
            lat=lat,
            lon=lon,
            duration_min=args.get("duration_min", 60),
            sensitive=args.get("sensitive", False),
        )
    if name == "get_indian_city_overview":
        return get_indian_city_live_intelligence(args.get("city", "Delhi"))
    if name == "get_city_aqi":
        return get_live_aqi_by_city(args.get("city", "Delhi"))
    if name == "get_weather":
        city = args.get("city")
        if city:
            geo = geocode_indian_city(city)
            return get_weather_context(geo["lat"], geo["lon"], city_name=geo["name"])
        return get_weather_context(lat, lon)
    if name == "check_activity":
        fc = forecast_next_24h(lat, lon)
        return check_activity(
            fc,
            args.get("activity", "walk"),
            args.get("after_hour", 5),
            args.get("before_hour", 22),
            args.get("sensitive", False),
        )
    if name == "get_forecast":
        fc = forecast_next_24h(lat, lon)
        return summarize_forecast(fc)
    if name == "get_live_aqi":
        return get_live_aqi_by_coords(lat, lon)
    if name == "get_season_context":
        return get_seasonal_context()
    if name == "get_historical_benchmarks":
        return get_historical_benchmarks(args.get("city", "Delhi"))
    return {"error": "unknown tool"}


# ---------------------------------------------------------------------------
# POST-GENERATION TIME GUARD & TEXT CLEANER
# ---------------------------------------------------------------------------

def is_detail_query(question: str) -> bool:
    """Check if user explicitly asked for longer details or explanations."""
    ql = question.lower()
    detail_triggers = [
        "explain", "why", "tell me more", "in detail", "how does it work",
        "how do you predict", "how it works", "elaborate", "give more detail"
    ]
    return any(t in ql for t in detail_triggers)


def clean_reply(text: str, detail: bool = False, fallback_summary: str = "") -> str:
    """
    Post-processing guard applied to every reply from every path:
    1. Strip all markdown symbols (*, #, backticks, leading bullets/dashes) and collapse whitespace.
    2. Replace remaining jargon terms from the banned list with plain language.
    3. Cut at the last complete sentence within limit (40-70 words default, 130 detail).
    4. Ensure reply is never empty.
    """
    if not text or not text.strip():
        return fallback_summary or "The air quality is moderate right now. You can safely go outside, but take care during peak dusty hours. Drink plenty of water and keep your windows closed."

    # 1. Strip markdown symbols
    cleaned = re.sub(r"```[\s\S]*?```", "", text)
    cleaned = re.sub(r"`([^`]+)`", r"\1", cleaned)
    cleaned = re.sub(r"\*+", "", cleaned)
    cleaned = re.sub(r"^#{1,6}\s*", "", cleaned, flags=re.MULTILINE)
    cleaned = re.sub(r"^[•\-\*+]\s+", "", cleaned, flags=re.MULTILINE)
    cleaned = re.sub(r"^\d+[\.\)]\s+", "", cleaned, flags=re.MULTILINE)
    cleaned = re.sub(r">+\s*", "", cleaned)
    cleaned = unicodedata.normalize('NFKD', cleaned).encode('ascii', 'ignore').decode('ascii')

    # 2. Replace banned jargon terms
    cleaned = re.sub(r"\b\d+(?:\.\d+)?\s*(?:µg/m³|µg/m3|ug/m3|ug/m\^3|micrograms(?:/m3)?)\s*PM\s*2\.5\b", "tiny dust particles", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\bPM\s*2\.5\s*(?:at|of|is)?\s*\d+(?:\.\d+)?\s*(?:µg/m³|ug/m3|ug/m\^3|micrograms(?:/m3)?)?", "tiny dust particles", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\b\d+(?:\.\d+)?\s*(?:µg/m³|ug/m3|ug/m\^3|micrograms(?:/m3)?)\s*PM\s*10\b", "bigger dust", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\bPM\s*10\s*(?:at|of|is)?\s*\d+(?:\.\d+)?\s*(?:µg/m³|ug/m3|ug/m\^3|micrograms(?:/m3)?)?", "bigger dust", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\b\d+(?:\.\d+)?\s*(?:µg/m³|ug/m3|ug/m\^3|micrograms(?:/m3)?)\b", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"µg/m³|ug/m3|ug/m\^3", "", cleaned, flags=re.IGNORECASE)

    replacements = [
        (r"\bPM\s*2\.5\b", "tiny dust particles"),
        (r"\bPM\s*10\b", "bigger dust"),
        (r"\bparticulate\s+matter\b", "tiny dust particles"),
        (r"\bparticulates\b", "tiny dust"),
        (r"\bparticulate\b", "dust"),
        (r"\baerosols\b", "dust particles"),
        (r"\baerosol\b", "dust"),
        (r"\binversion\s+ceiling\b", "weak air movement near the ground"),
        (r"\btemperature\s+inversion\b", "weak air movement near the ground"),
        (r"\binversion\s+layer\b", "weak air movement near the ground"),
        (r"\binversion\b", "weak air movement near the ground"),
        (r"\bboundary\s+layer\b", "air near the ground"),
        (r"\bsolar\s+thermal\s+dispersion\b", "air gets cleaner in the afternoon when sunlight warms the ground"),
        (r"\bthermal\s+dispersion\b", "sunlight warming the air"),
        (r"\bconvective\s+dispersion\b", "sunlight warming the air"),
        (r"\bconvection\b", "warm air rising"),
        (r"\bdispersion\b", "clearing"),
        (r"\bdispersing\b", "clearing"),
        (r"\bstagnation\b", "wind is very weak, so smoke stays near the ground"),
        (r"\bstagnant\b", "still"),
        (r"\btelemetry\b", "readings"),
        (r"\bbronchial\b", "breathing"),
        (r"\balveoli\b", "lungs"),
        (r"\bpersistence\s+baseline\b", "past forecast"),
        (r"\bhorizon\b", "forecast"),
        (r"\bCAMS\b", "satellite forecast"),
        (r"\bCopernicus\b", "satellite forecast"),
        (r"\breanalysis\b", "weather history"),
        (r"\bLightGBM\b", "forecast model"),
        (r"\bregressor\b", "model"),
    ]
    for pat, repl in replacements:
        cleaned = re.sub(pat, repl, cleaned, flags=re.IGNORECASE)

    # Collapse extra whitespace and clean punctuation artifacts
    cleaned = re.sub(r"[ \t]+", " ", cleaned)
    cleaned = re.sub(r"\s*,\s*,", ",", cleaned)
    cleaned = re.sub(r"\s+([.,!?;:])", r"\1", cleaned)
    cleaned = re.sub(r"\n\s*\n+", "\n\n", cleaned).strip()

    # Split into sentences
    sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", cleaned) if s.strip()]
    if not sentences and cleaned.strip():
        sentences = [cleaned.strip() + "."]

    if detail:
        # Task 2: allow up to ~120 words, never exceed 130 words
        total_words = sum(len(s.split()) for s in sentences)
        if total_words > 130:
            trimmed = []
            curr = 0
            for s in sentences:
                cnt = len(s.split())
                if curr + cnt <= 130:
                    trimmed.append(s)
                    curr += cnt
                else:
                    break
            if trimmed:
                sentences = trimmed
            else:
                words = sentences[0].split()[:120]
                sentences = [" ".join(words) + "."]
        result = " ".join(sentences).strip()
    else:
        # Default mode: 2 to 4 sentences, 40 to 70 words total, one short paragraph
        if len(sentences) > 4:
            sentences = sentences[:4]

        # Enforce max word limit of 70 words by dropping last sentences
        total_words = sum(len(s.split()) for s in sentences)
        while len(sentences) > 2 and total_words > 70:
            sentences.pop()
            total_words = sum(len(s.split()) for s in sentences)

        # If still > 70 words with 2 sentences:
        if total_words > 70 and len(sentences) >= 2:
            s0_words = len(sentences[0].split())
            rem = max(10, 70 - s0_words)
            s1_words = sentences[1].split()[:rem]
            sentences[1] = " ".join(s1_words).rstrip(" ,;:-") + "."

        # If < 2 sentences and words >= 40: try splitting on conjunction or semicolon
        if len(sentences) < 2 and sentences:
            s_full = sentences[0]
            split_match = re.split(r"(?:,\s*(?:so|but|and|or)\s+|;\s+)", s_full, maxsplit=1)
            if len(split_match) == 2 and len(split_match[0].split()) >= 8 and len(split_match[1].split()) >= 8:
                sentences = [split_match[0].rstrip(".!? ") + ".", split_match[1][0].upper() + split_match[1][1:].rstrip(".!? ") + "."]

        # Enforce minimum word count of 40 words by adding a short tip sentence if helpful
        total_words = sum(len(s.split()) for s in sentences)
        if total_words < 40 and len(sentences) < 4:
            tips = [
                "Drink plenty of water and keep your windows closed during dusty hours.",
                "Stay well hydrated throughout the day and keep windows closed during dusty hours.",
                "Keep windows closed during morning hours and stay well hydrated today.",
            ]
            for tip in tips:
                if total_words + len(tip.split()) <= 70 and len(sentences) < 4:
                    sentences.append(tip)
                    total_words += len(tip.split())
                    break

        result = " ".join(sentences).strip()

    if not result or not result.strip():
        return fallback_summary or "The air quality is moderate right now. You can safely go outside, but take care during peak dusty hours. Drink plenty of water and keep your windows closed."

    if not detail:
        result = re.sub(r"\s*\n+\s*", " ", result).strip()

    return result


def _extract_clock_times_normalized(text: str) -> Set[str]:
    """Extract clock times from text normalized to 24h HH:MM and 12h formats."""
    result = set()
    for m in re.finditer(r"\b(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?\b", text):
        h = int(m.group(1))
        minute = int(m.group(2))
        ampm = m.group(3)
        if ampm:
            if ampm.upper() == "PM" and h < 12:
                h += 12
            elif ampm.upper() == "AM" and h == 12:
                h = 0
        if 0 <= h <= 23 and 0 <= minute <= 59:
            result.add(f"{h:02d}:{minute:02d}")
            h12 = h % 12 or 12
            ap = "AM" if h < 12 else "PM"
            result.add(f"{h12}:{minute:02d} {ap}")
            result.add(f"{h12} {ap}")

    for m in re.finditer(r"\b(\d{1,2})\s*(AM|PM|am|pm)\b", text):
        h = int(m.group(1))
        ampm = m.group(2).upper()
        if 1 <= h <= 12:
            h24 = h
            if ampm == "PM" and h < 12:
                h24 += 12
            elif ampm == "AM" and h == 12:
                h24 = 0
            result.add(f"{h24:02d}:00")
            result.add(f"{h} {ampm}")
            result.add(f"{h}:00 {ampm}")

    return result


def _verify_and_clean_answer(
    answer: str,
    planner_result: Optional[dict],
    user_query: str,
) -> str:
    """
    Guard: ensures model answers only quote clock times from tools or query.
    Removes stray markdown formatting (*, #, bullets).
    """
    if not answer:
        return planner_result.get("formatted_summary", "") if planner_result else ""

    cleaned = re.sub(r"\*+", "", answer)
    cleaned = re.sub(r"^[•\-\*#]+\s*", "", cleaned, flags=re.MULTILINE)
    cleaned = cleaned.strip()

    if not planner_result:
        return cleaned

    tool_text = json.dumps(planner_result)
    allowed_times = _extract_clock_times_normalized(tool_text) | _extract_clock_times_normalized(user_query)
    answer_times = _extract_clock_times_normalized(cleaned)

    hallucinated = [t for t in answer_times if t not in allowed_times]
    if hallucinated:
        return planner_result.get("formatted_summary", cleaned)

    return cleaned


EXERCISE_WORDS_PATTERN = re.compile(
    r"\b(?:workouts?|work\s+out|working\s+out|exercises?|exercising|runs?|running|jogs?|jogging|gyms?|treadmills?|cricket|football|soccer|badminton|tennis|yoga|pranayama)\b",
    re.IGNORECASE
)

COMMUTE_WORDS_PATTERN = re.compile(
    r"\b(?:commutes?|commuting|office|workplace|traffic|two-wheelers?|school\s*run|market|bazaar|errands|driving)\b",
    re.IGNORECASE
)

VENTILATION_WORDS_PATTERN = re.compile(
    r"\b(?:windows?|ventilat(?:e|ion|ing)|balcony|air\s*purifier|air\s*out)\b",
    re.IGNORECASE
)


def verify_activity_alignment(reply: str, expected_activity: str) -> bool:
    """
    Guard: verifies reply does not mention an unrelated activity.
    Returns True if aligned, False if off-topic.
    """
    if not reply or not expected_activity or expected_activity in ("unknown",):
        return True

    # Strip appliance usage phrasing like "run an air purifier" before exercise detection
    clean_reply_for_check = re.sub(r"\brun\s+(?:an?\s+)?(?:air\s+)?purifier\b", "", reply, flags=re.IGNORECASE)

    has_exercise = bool(EXERCISE_WORDS_PATTERN.search(clean_reply_for_check))
    has_commute = bool(COMMUTE_WORDS_PATTERN.search(clean_reply_for_check))

    if expected_activity == "commute":
        if has_exercise:
            return False
    elif expected_activity == "open_windows":
        if has_exercise or has_commute:
            return False
    elif expected_activity == "general_outdoor":
        if has_exercise:
            return False
    elif expected_activity in ("running", "outdoor_workout", "cycling", "outdoor_yoga"):
        if has_commute and not has_exercise:
            return False

    return True


# ---------------------------------------------------------------------------
# INTELLIGENT LOCAL SYNTHESIS ENGINE (Deterministic RAG & Web Grounder)
# ---------------------------------------------------------------------------

def _detect_mentioned_cities(text: str) -> list:
    """Extract mentioned Indian cities from query."""
    text_lower = text.lower()
    found = []
    for key, info in INDIAN_CITIES.items():
        pattern = r"\b" + re.escape(key) + r"\b"
        if re.search(pattern, text_lower):
            if info["name"] not in found:
                found.append(info["name"])

    # Detect other Indian cities like "in Modinagar"
    m = re.search(r"\b(?:in|for|at|around)\s+([a-zA-Z]{3,20})\b", text_lower)
    if m:
        candidate = m.group(1).strip()
        stop_words = {"the", "my", "today", "tomorrow", "this", "your", "area", "here", "work", "week", "home"}
        if candidate not in stop_words and candidate not in [f.lower() for f in found]:
            try:
                geo = geocode_indian_city(candidate)
                if geo and geo.get("name") and geo.get("name") not in found:
                    found.append(geo["name"])
            except Exception:
                pass

    return found


def _infer_activity_context(question: str, history: Optional[list]) -> Tuple[str, int, bool]:
    """Detect activity, duration, and sensitive flag using detect_activity."""
    combined = question
    if history:
        recent_text = " ".join(turn.get("text", "") for turn in history[-4:])
        combined = f"{recent_text} {question}"

    cl = combined.lower()

    # Sensitivity
    sensitive = any(w in cl for w in ["asthma", "child", "kid", "baby", "elderly", "pregnant", "heart", "breath", "lung"])

    # Duration
    duration = 45
    dur_match = re.search(r"\b(\d+)\s*(?:min|minute|hour|hr)\b", cl)
    if "5km" in cl or "5k" in cl or "30 min" in cl:
        duration = 30
    elif "10km" in cl or "10k" in cl:
        duration = 60
    elif dur_match:
        val = int(dur_match.group(1))
        if "hour" in cl or "hr" in cl:
            val *= 60
        duration = max(15, min(300, val))

    det = detect_activity(question, history)
    act = det.get("activity", "general_outdoor")
    if act == "unknown":
        act = "general_outdoor"

    return (act, duration, sensitive)


def _is_activity_query(question: str, history: Optional[list] = None) -> bool:
    """Check if query is asking whether or when to conduct an outdoor activity."""
    det = detect_activity(question, history)
    act = det.get("activity")
    if act in [
        "commute", "running", "cycling", "outdoor_workout", "kids_play",
        "outdoor_walk", "picnic", "open_windows", "outdoor_yoga"
    ]:
        return True
    if act == "general_outdoor" and det.get("confidence") in ("high", "medium"):
        return True
    return False


def fallback_answer(question: str, lat: float, lon: float, history: Optional[list] = None) -> str:
    """
    Intelligent Local Atmospheric Synthesis Engine.
    Produces short, simple, plain-language answers (2-4 sentences, 40-70 words).
    """
    ql = question.lower()
    detail = is_detail_query(question)

    # 1. Nonsense or Incomprehensible query guard first
    if len(ql.strip()) < 3 or not re.search(r"[a-z]{3,}", ql) or (all(c in "asdfghjklqwertyuiopzxcvbnm1234567890" for c in ql.strip()[:6]) and len(ql.split()) <= 1 and not any(w in ql for w in ["run", "jog", "walk", "cycl", "bike"])):
        return (
            "I could not understand that request, but I am here to help you plan outdoor activities safely. "
            "You can ask me when it is safe to run, walk, or cycle outdoors. "
            "You can also ask about the current air quality or weather in your city."
        )

    # 2. Explicit Detail Queries (when LLM is offline)
    if detail:
        if "winter" in ql or ("north" in ql and "pollution" in ql):
            return (
                "Winter pollution is worse in northern India because the air gets cold and heavy. "
                "During winter, wind is very weak, so smoke from vehicles, fires, and dust cannot blow away and stays trapped near the ground. "
                "Farmers also burn crop leftovers around this time, adding extra smoke to the air. "
                "In summer, sunlight warms the ground and lifts the smoke high into the sky, but cold winter air keeps it pinned down where we breathe. "
                "To stay safe, plan outdoor activities for the afternoon when sunlight warms the ground, and keep windows closed during cold mornings and nights."
            )
        if any(w in ql for w in ["predict", "how", "work", "model"]):
            return (
                "We predict air quality by combining live weather forecasts with historical air patterns. "
                "Our forecast model looks at wind speed, temperature, humidity, and upcoming rain from weather satellites. "
                "When winds are strong or rain falls, dust and smoke get washed away or blown clean. "
                "When wind is very weak, smoke stays near the ground. "
                "The model uses these patterns to estimate the AQI for each hour over the next few days. "
                "This helps you find the cleanest hours for walking, running, or opening windows without guessing."
            )

    # 3. Activity Scheduling Intent
    det = detect_activity(question, history)
    act_name = det.get("activity")
    if act_name not in ("unknown",):
        if act_name != "general_outdoor" or _is_activity_query(question, history):
            act_name, duration, sensitive = _infer_activity_context(question, history)
            plan_res = plan_activity(
                activity=act_name,
                lat=lat,
                lon=lon,
                duration_min=duration,
                sensitive=sensitive,
            )
            return plan_res.get("formatted_summary", "")

    # Non-activity queries: fetch live data
    cities = _detect_mentioned_cities(question)

    # 4. Compare Two Cities Query
    if len(cities) >= 2 or ("compare" in ql and len(cities) >= 1):
        c1_name = cities[0]
        c2_name = cities[1] if len(cities) > 1 else ("Bengaluru" if "delhi" in ql else "Delhi")
        c1_intel = get_indian_city_live_intelligence(c1_name)
        c2_intel = get_indian_city_live_intelligence(c2_name)
        c1_aqi = c1_intel["live_aqi"].get("aqi", 140)
        c2_aqi = c2_intel["live_aqi"].get("aqi", 60)
        cleaner = c1_name if c1_aqi < c2_aqi else c2_name
        dirtier = c2_name if c1_aqi < c2_aqi else c1_name
        return (
            f"{c1_name} currently has an AQI of {c1_aqi} today. "
            f"In contrast, {c2_name} currently records an AQI of {c2_aqi}. "
            f"The air is cleaner in {cleaner}, so plan outdoor time for {cleaner} and take care in {dirtier}. "
            f"Keep your windows closed and limit heavy outdoor exertion in {dirtier}."
        )

    target_city = cities[0] if cities else None

    if target_city:
        intel = get_indian_city_live_intelligence(target_city)
        cur_aqi = intel["live_aqi"].get("aqi", 130)
        cur_cat = intel["live_aqi"].get("category", "Moderate")
        weather = intel["live_weather"]
        loc_name = intel["city"]
        state_name = intel["state"]
    else:
        aqi_res = get_live_aqi_by_coords(lat, lon)
        weather = get_weather_context(lat, lon)
        cur_aqi = aqi_res.get("aqi", 130)
        cur_cat = aqi_res.get("category", "Moderate")
        loc_name = aqi_res.get("station", "your local area")
        state_name = "India"

    temp = weather.get("temperature_c", 25)
    condition = weather.get("condition", "Partly cloudy")

    air_label = "clean" if cur_aqi <= 50 else ("fairly clean" if cur_aqi <= 100 else ("somewhat dirty" if cur_aqi <= 150 else "quite dirty"))

    # 5. Weather Query
    if any(w in ql for w in ["weather", "temperature", "temp", "humidity", "wind", "rain"]):
        return (
            f"The weather in {loc_name} is currently {condition.lower()} with a temperature of {temp}°C. "
            f"The air quality stands at AQI {cur_aqi}, meaning the air is {air_label}. "
            f"It is best to plan your outdoor activities for the afternoon when sunlight warms the ground. "
            f"Remember to drink plenty of water if you spend time outdoors today."
        )

    # 6. Mask / Health Query
    if any(w in ql for w in ["mask", "purifier", "asthma", "breathe", "doctor", "health"]):
        if cur_aqi > 150:
            return (
                f"You should wear a mask if you go outdoors in {loc_name} today. "
                f"The air is quite dirty with an AQI of {cur_aqi}. "
                f"It is best to stay indoors and keep your windows closed until the air clears up. "
                f"A good mask or staying inside a clean room will protect your breathing."
            )
        else:
            return (
                f"Most people do not need a mask outdoors in {loc_name} right now. "
                f"The air quality is acceptable today with an AQI of {cur_aqi}. "
                f"Sensitive groups like children or people with asthma should still take it easy outside. "
                f"Keep windows closed during busy traffic hours to keep indoor air clean."
            )

    # 7. Default City Overview / Greeting (e.g. "air quality in Modinagar")
    return (
        f"The air quality in {loc_name} is {air_label} right now. "
        f"Current air quality measures at AQI {cur_aqi} today. "
        f"It is best to plan your time outside for the afternoon when sunlight warms the ground. "
        f"Keep windows closed during early morning hours to keep indoor air clean."
    )


# ---------------------------------------------------------------------------
# LLM BACKENDS WITH FUNCTION CALLING & POST-GENERATION GUARD
# ---------------------------------------------------------------------------

def _build_context_header(lat: float, lon: float, history: Optional[list], detected_intent: Optional[dict] = None) -> str:
    """Format rich real-time context and recent history into the prompt."""
    now_ist = datetime.now().strftime("%A, %d %b %Y, %I:%M %p IST")
    aqi_data = get_live_aqi_by_coords(lat, lon)
    wx_data = get_weather_context(lat, lon)

    context = (
        f"### REAL-TIME CONTEXT:\n"
        f"- Local Timestamp: {now_ist}\n"
        f"- Location Coordinates: {lat:.4f}°N, {lon:.4f}°E ({aqi_data.get('station', 'Local Area')})\n"
        f"- Live Air Quality: AQI {aqi_data.get('aqi', 120)} (US scale)\n"
        f"- Live Weather: {wx_data.get('temperature_c', 25)}°C, Humidity {wx_data.get('humidity_pct', 55)}%, Wind {wx_data.get('wind_kmh', 8)} km/h\n"
    )

    if detected_intent and detected_intent.get("activity") not in ("unknown",):
        act = detected_intent["activity"]
        subj = detected_intent.get("subject", act)
        context += (
            f"- Detected User Intent: {act} (Topic: {subj})\n"
            f"- TOPIC GUARD: Answer only about {subj}. Never suggest or mention unrelated activities (such as workouts, running, or exercise) for commute, ventilation, or general outdoor questions.\n"
        )

    if history:
        context += "- Recent Conversation History (Last 6 turns):\n"
        for h in history[-6:]:
            sender = h.get("sender", "user")
            text = h.get("text", "")
            context += f"  * {sender}: {text}\n"

    return context


def ask_gemini(api_key: str, question: str, lat: float, lon: float, history: Optional[list] = None) -> str:
    """Google Gemini with plan_activity function calling and hallucination guard."""
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=api_key)
    planner_payload = {}
    detail = is_detail_query(question)
    max_tokens = 250 if detail else 160
    det = detect_activity(question, history)

    def plan_activity_tool(activity: str, duration_min: int = 60, sensitive: bool = False) -> str:
        """Determine safe time windows for activities across a 1 to 5 day forecast.
        
        Args:
            activity: Activity type enum: 'commute' (office, work, job, commute, drive, travel, market, school run); 'running' (runs, jogging); 'cycling' (cycling workout); 'outdoor_workout' (gym, sports, cricket, exercise); 'kids_play' (children playing outside); 'outdoor_walk' (walking, stroll); 'picnic' (picnic, family outing); 'open_windows' (opening windows, ventilation); 'outdoor_yoga' (yoga, pranayama); or 'general_outdoor' (general air check, stepping outside, going out).
            duration_min: Duration in minutes. Default 45.
            sensitive: True if user mentions asthma, child, elderly, or breathing difficulty.
        """
        res = run_tool("plan_activity", {"activity": activity, "duration_min": duration_min, "sensitive": sensitive}, lat, lon)
        planner_payload["result"] = res
        return json.dumps(res)

    def get_indian_city_overview(city: str) -> str:
        """Fetch live AQI, weather, and benchmarks for ANY Indian city."""
        return json.dumps(run_tool("get_indian_city_overview", {"city": city}, lat, lon))

    def get_weather(city: str = "") -> str:
        """Get current weather conditions and air dispersion impact."""
        return json.dumps(run_tool("get_weather", {"city": city}, lat, lon))

    def get_forecast() -> str:
        """Get current AQI and 24-hour forecast summary."""
        return json.dumps(run_tool("get_forecast", {}, lat, lon))

    def get_season_context() -> str:
        """Get Indian seasonal AQI dynamics."""
        return json.dumps(run_tool("get_season_context", {}, lat, lon))

    config = types.GenerateContentConfig(
        tools=[plan_activity_tool, get_indian_city_overview, get_weather, get_forecast, get_season_context],
        system_instruction=SYSTEM,
        temperature=0.3,
        max_output_tokens=max_tokens,
    )

    context_header = _build_context_header(lat, lon, history, detected_intent=det)
    augmented_prompt = f"{context_header}\nUser Query: {question}"

    candidate_models = ["gemini-3.5-flash-lite"]

    for model_name in candidate_models:
        try:
            chat_session = client.chats.create(model=model_name, config=config)
            resp = chat_session.send_message(augmented_prompt)
            if resp.text and len(resp.text.strip()) > 10:
                raw_ans = _verify_and_clean_answer(resp.text.strip(), planner_payload.get("result"), question)
                # Task 3: Off-topic verification guard
                if not verify_activity_alignment(raw_ans, det.get("activity")):
                    corr_prompt = (
                        f"Correction: The user asked about '{det.get('subject', det.get('activity'))}'. "
                        f"Your previous reply was off-topic. Answer ONLY about '{det.get('subject', det.get('activity'))}'. "
                        f"Never mention or recommend working out, exercising, or running unless they asked for it."
                    )
                    resp_retry = chat_session.send_message(corr_prompt)
                    if resp_retry.text and len(resp_retry.text.strip()) > 10:
                        raw_ans_retry = _verify_and_clean_answer(resp_retry.text.strip(), planner_payload.get("result"), question)
                        if verify_activity_alignment(raw_ans_retry, det.get("activity")):
                            return clean_reply(raw_ans_retry, detail=detail, fallback_summary=planner_payload.get("result", {}).get("formatted_summary", ""))

                    if det.get("activity") not in ("unknown",):
                        fallback_plan = plan_activity(activity=det["activity"], lat=lat, lon=lon, duration_min=45, sensitive=False)
                        return clean_reply(fallback_plan.get("formatted_summary", ""), detail=detail)

                return clean_reply(raw_ans, detail=detail, fallback_summary=planner_payload.get("result", {}).get("formatted_summary", ""))
        except Exception:
            continue

    return clean_reply(fallback_answer(question, lat, lon, history), detail=detail)


def ask_groq(api_key: str, question: str, lat: float, lon: float, history: Optional[list] = None) -> str:
    """Groq Cloud — Llama 3.3 70B with function calling and hallucination guard."""
    from groq import Groq

    client = Groq(api_key=api_key)
    planner_payload = {}
    detail = is_detail_query(question)
    max_tokens = 250 if detail else 160
    det = detect_activity(question, history)

    context_header = _build_context_header(lat, lon, history, detected_intent=det)

    messages = [
        {"role": "system", "content": f"{SYSTEM}\n\n{context_header}"},
    ]

    # Add historical turns if present
    if history:
        for turn in history[-4:]:
            role = "assistant" if turn.get("sender") == "ai" else "user"
            messages.append({"role": role, "content": turn.get("text", "")})

    messages.append({"role": "user", "content": question})

    for _ in range(5):
        resp = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            tools=GROQ_TOOLS,
            tool_choice="auto",
            max_tokens=max_tokens,
            temperature=0.3,
        )
        msg = resp.choices[0].message
        if not msg.tool_calls:
            raw_ans = _verify_and_clean_answer(msg.content or "", planner_payload.get("result"), question)
            # Task 3: Off-topic verification guard
            if not verify_activity_alignment(raw_ans, det.get("activity")):
                messages.append(msg)
                messages.append({
                    "role": "user",
                    "content": (
                        f"Correction: The user asked about '{det.get('subject', det.get('activity'))}'. "
                        f"Your reply mentioned an unrelated activity. Answer ONLY about '{det.get('subject', det.get('activity'))}'."
                    ),
                })
                retry_resp = client.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=messages,
                    max_tokens=max_tokens,
                    temperature=0.2,
                )
                retry_content = retry_resp.choices[0].message.content or ""
                raw_ans_retry = _verify_and_clean_answer(retry_content, planner_payload.get("result"), question)
                if verify_activity_alignment(raw_ans_retry, det.get("activity")):
                    return clean_reply(raw_ans_retry, detail=detail, fallback_summary=planner_payload.get("result", {}).get("formatted_summary", ""))

                if det.get("activity") not in ("unknown",):
                    fallback_plan = plan_activity(activity=det["activity"], lat=lat, lon=lon, duration_min=45, sensitive=False)
                    return clean_reply(fallback_plan.get("formatted_summary", ""), detail=detail)

            return clean_reply(raw_ans, detail=detail, fallback_summary=planner_payload.get("result", {}).get("formatted_summary", ""))

        messages.append(msg)
        for tc in msg.tool_calls:
            args = (
                json.loads(tc.function.arguments)
                if isinstance(tc.function.arguments, str)
                else (tc.function.arguments or {})
            )
            result = run_tool(tc.function.name, args, lat, lon)
            if tc.function.name == "plan_activity":
                planner_payload["result"] = result

            messages.append({
                "role": "tool",
                "tool_call_id": tc.id,
                "name": tc.function.name,
                "content": json.dumps(result),
            })

    return clean_reply(fallback_answer(question, lat, lon, history), detail=detail)


# ---------------------------------------------------------------------------
# MAIN CHAT ENTRYPOINT
# ---------------------------------------------------------------------------

def _try_llm_call(question: str, lat: float, lon: float, history: Optional[list] = None) -> str:
    if os.getenv("DISABLE_LLM") == "1":
        return fallback_answer(question, lat, lon, history)

    # 1. Try Google Gemini
    gemini_key = os.getenv("GEMINI_API_KEY", "").strip()
    if gemini_key:
        try:
            return ask_gemini(gemini_key, question, lat, lon, history)
        except Exception as e:
            print("Gemini routing error:", e)

    # 2. Try Groq
    groq_key = os.getenv("GROQ_API_KEY", "").strip()
    if groq_key:
        try:
            return ask_groq(groq_key, question, lat, lon, history)
        except Exception as e:
            print("Groq routing error:", e)

    return fallback_answer(question, lat, lon, history)


def chat(question: str, lat: float = 28.6139, lon: float = 77.2090, history: Optional[list] = None) -> str:
    """Route question to Gemini/Groq with strict ~8s deadline; fall back gracefully to Intelligent Local Engine."""
    load_dotenv(override=False)
    detail = is_detail_query(question)

    if os.getenv("DISABLE_LLM") == "1":
        return clean_reply(fallback_answer(question, lat, lon, history), detail=detail)

    gemini_key = os.getenv("GEMINI_API_KEY", "").strip()
    groq_key = os.getenv("GROQ_API_KEY", "").strip()

    if not gemini_key and not groq_key:
        return clean_reply(fallback_answer(question, lat, lon, history), detail=detail)

    executor = concurrent.futures.ThreadPoolExecutor(max_workers=1)
    future = executor.submit(_try_llm_call, question, lat, lon, history)
    try:
        ans = future.result(timeout=AI_TIMEOUT_SECONDS)
        executor.shutdown(wait=False, cancel_futures=True)
        return clean_reply(ans, detail=detail)
    except concurrent.futures.TimeoutError:
        executor.shutdown(wait=False, cancel_futures=True)
        print(f"AI response exceeded {AI_TIMEOUT_SECONDS}s deadline. Falling back to local rules engine.")
        return clean_reply(fallback_answer(question, lat, lon, history), detail=detail)
    except Exception as e:
        executor.shutdown(wait=False, cancel_futures=True)
        print("Chat orchestration exception:", e)
        return clean_reply(fallback_answer(question, lat, lon, history), detail=detail)
