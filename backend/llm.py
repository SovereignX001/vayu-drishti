import concurrent.futures
import json
import os
import re
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple
from dotenv import load_dotenv

AI_TIMEOUT_SECONDS = 5.5

load_dotenv(override=True)

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
from planner import plan_activity, ACTIVITY_PROFILES

# ---------------------------------------------------------------------------
# SYSTEM PROMPT — Single AQI Scale (US Scale), Strict Answer Structure
# ---------------------------------------------------------------------------
SYSTEM = """You are Drishti, an advanced air quality and atmospheric intelligence assistant for Indian cities.
You provide precise, honest, data-backed guidance on air quality and whether or when it is safe to conduct outdoor activities.

AQI SCALE:
- The platform operates on the US AQI scale (US EPA standard from Open-Meteo).
- Always refer to air quality as "AQI [value] (US scale)" the first time you mention it.
- Use only standard US AQI categories: Good (0-50), Moderate (51-100), Unhealthy for Sensitive Groups (101-150), Unhealthy (151-200), Very Unhealthy (201-300), Hazardous (301-500). Never mix Indian NAQI category names.

ACTIVITY & OUTDOOR TIMING QUESTIONS:
When asked WHEN, WHETHER, or IF it is safe to do any outdoor activity (running, cycling, walking, picnic, sports, kids playing, opening windows, yoga, commute), ALWAYS call the plan_activity tool.

STRICT ANSWER STRUCTURE FOR ACTIVITY QUESTIONS:
Every activity answer MUST follow this exact 5-part order in short plain paragraphs (4 to 7 sentences total):
1) Verdict in one sentence: State clearly whether to go now, wait until a specific time, not go today, or that no clean window exists in the forecast.
2) Why with 2-3 real numbers: Quote the current AQI with "(US scale)" named once, dominant pollutant (e.g. PM2.5), wind speed in km/h, and temperature or humidity.
3) When with exact windows: Quote the primary window and one backup with weekday, date and local time (e.g., "Tomorrow, Sun 25 Oct, 2:00-3:00 PM IST, AQI about 78"). Quote only times returned by tools.
4) If no safe window exists: State this plainly, give the least-bad window with its AQI, provide an indoor or mask alternative, and state what atmospheric change (wind or rain from the forecast) would be needed to improve conditions.
5) Caveat: Add a brief sentence only when relevant that forecast accuracy drops beyond 24 hours and numbers represent regional airshed models rather than a sensor at their specific doorstep.

STYLE & FORMATTING RULES:
- NO MARKDOWN: Never use asterisks (**), headers (#), or bullet points (•, -). Use natural flowing paragraphs.
- Never reuse the same opening sentence across replies; vary phrasing.
- Do not diagnose illnesses or give medical dosage recommendations.
- Adapt to user parameters (asthma, age, children, commute mode, distance).
- If the question is ambiguous, answer for the most likely case and invite a follow-up in one short line.
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
            "description": "Determine safe time windows for any outdoor activity (running, cycling, walking, kids playing, opening windows, yoga, sports, commute) across a 1 to 5 day forecast. Always call this tool when the user asks WHEN, WHETHER, or IF it is safe to do something outdoors.",
            "parameters": {
                "type": "object",
                "properties": {
                    "activity": {
                        "type": "string",
                        "description": "Activity name: running, cycling, outdoor_workout, kids_play, outdoor_walk, commute, open_windows, outdoor_yoga.",
                    },
                    "duration_min": {
                        "type": "integer",
                        "description": "Expected duration in minutes (e.g. 30, 45, 60, 120). Default 60.",
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
# POST-GENERATION TIME GUARD
# ---------------------------------------------------------------------------

def _extract_clock_times_normalized(text: str) -> Set[str]:
    """Extract clock times from text normalized to 24h HH:MM and 12h formats."""
    result = set()
    # Match HH:MM or H:MM with optional AM/PM
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

    # Match H AM / H PM without minutes
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

    # Clean markdown
    cleaned = re.sub(r"\*+", "", answer)
    cleaned = re.sub(r"^[•\-\*#]+\s*", "", cleaned, flags=re.MULTILINE)
    cleaned = cleaned.strip()

    if not planner_result:
        return cleaned

    # Gather all allowed clock times from tool output and query
    tool_text = json.dumps(planner_result)
    allowed_times = _extract_clock_times_normalized(tool_text) | _extract_clock_times_normalized(user_query)

    # Extract times from generated answer
    answer_times = _extract_clock_times_normalized(cleaned)

    # If answer contains clock times that were completely absent from tool output & query:
    hallucinated = [t for t in answer_times if t not in allowed_times]
    if hallucinated:
        # Fall back directly to the deterministic formatted answer
        return planner_result.get("formatted_summary", cleaned)

    return cleaned


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
    return found


def _infer_activity_context(question: str, history: Optional[list]) -> Tuple[str, int, bool]:
    """Detect activity, duration, and sensitive flag from question and recent history."""
    combined = question
    if history:
        recent_text = " ".join(turn.get("text", "") for turn in history[-4:])
        combined = f"{recent_text} {question}"

    cl = combined.lower()
    ql = question.lower()

    # Sensitivity
    sensitive = any(w in cl for w in ["asthma", "child", "kid", "baby", "elderly", "pregnant", "heart", "breath", "lung"])

    # Duration
    duration = 60
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

    # Activity matching
    if any(w in ql for w in ["run", "jog", "5k", "sprint"]):
        return ("running", duration, sensitive)
    if any(w in ql for w in ["cycl", "bike"]):
        return ("cycling", duration, sensitive)
    if any(w in ql for w in ["play", "kid", "child"]):
        return ("kids_play", duration, sensitive)
    if any(w in ql for w in ["window", "ventil"]):
        return ("open_windows", duration, sensitive)
    if any(w in ql for w in ["yoga", "pranayam"]):
        return ("outdoor_yoga", duration, sensitive)
    if any(w in ql for w in ["workout", "sports", "cricket"]):
        return ("outdoor_workout", duration, sensitive)
    if any(w in ql for w in ["commute", "travel", "office"]):
        return ("commute", duration, sensitive)
    if any(w in ql for w in ["walk", "picnic", "stroll"]):
        return ("outdoor_walk", duration, sensitive)

    # If question is a follow up ("what about tomorrow?") use history
    if any(w in ql for w in ["tomorrow", "what about", "how about", "later", "this week"]):
        if any(w in cl for w in ["run", "jog"]):
            return ("running", duration, sensitive)
        if any(w in cl for w in ["cycl", "bike"]):
            return ("cycling", duration, sensitive)
        if any(w in cl for w in ["kid", "child", "play"]):
            return ("kids_play", duration, sensitive)
        if any(w in cl for w in ["window", "ventil"]):
            return ("open_windows", duration, sensitive)
        if any(w in cl for w in ["walk", "picnic"]):
            return ("outdoor_walk", duration, sensitive)

    return ("outdoor_walk", duration, sensitive)


def _is_activity_query(question: str, history: Optional[list] = None) -> bool:
    """Check if query is asking whether or when to conduct an outdoor activity."""
    ql = question.lower()
    activity_words = [
        "run", "jog", "5km", "10km", "cycl", "bike", "walk", "picnic", "play", "kid", "child",
        "window", "ventil", "yoga", "workout", "sports", "cricket", "commute", "outside",
        "when can i", "is it safe", "best time", "best day", "can i", "should i"
    ]
    if any(w in ql for w in activity_words):
        return True

    # If question is a temporal follow-up ("what about tomorrow?"), check history for prior activity
    if history and any(w in ql for w in ["tomorrow", "what about", "how about", "later", "this week", "next day"]):
        hist_text = " ".join([str(h.get("text", "")).lower() for h in history[-4:]])
        if any(w in hist_text for w in ["run", "jog", "cycl", "bike", "walk", "picnic", "play", "kid", "child", "window", "yoga", "workout", "sports"]):
            return True

    return False


def fallback_answer(question: str, lat: float, lon: float, history: Optional[list] = None) -> str:
    """
    Intelligent Local Atmospheric Synthesis Engine.
    Executes live data fetching from public web APIs, adheres to the US AQI scale,
    and formats answers without markdown asterisks or bullet lists.
    """
    ql = question.lower()

    # 1. Nonsense or Incomprehensible query guard first
    if len(ql.strip()) < 3 or not re.search(r"[a-z]{3,}", ql) or (all(c in "asdfghjklqwertyuiopzxcvbnm1234567890" for c in ql.strip()[:6]) and len(ql.split()) <= 1 and not any(w in ql for w in ["run", "jog", "walk", "cycl", "bike"])):
        return (
            "I am Drishti, your personal air quality and atmospheric intelligence companion. "
            "I could not understand that request, but I can help you plan outdoor runs, walks, cycling, or provide live air quality and weather forecasts across Indian cities. "
            "Please feel free to ask about your neighborhood or a specific activity."
        )

    # 2. Activity Scheduling Intent
    if _is_activity_query(question, history):
        act_name, duration, sensitive = _infer_activity_context(question, history)
        plan_res = plan_activity(
            activity=act_name,
            lat=lat,
            lon=lon,
            duration_min=duration,
            sensitive=sensitive,
        )
        return plan_res.get("formatted_summary", "")

    # Non-activity queries: fetch live telemetry
    cities = _detect_mentioned_cities(question)
    target_city = cities[0] if cities else None

    if target_city:
        intel = get_indian_city_live_intelligence(target_city)
        cur_aqi = intel["live_aqi"].get("aqi", 130)
        cur_cat = intel["live_aqi"].get("category", "Moderate")
        pm25 = intel["live_aqi"].get("pollutants", {}).get("PM2.5", 45)
        pm10 = intel["live_aqi"].get("pollutants", {}).get("PM10", 90)
        weather = intel["live_weather"]
        loc_name = intel["city"]
        state_name = intel["state"]
    else:
        aqi_res = get_live_aqi_by_coords(lat, lon)
        weather = get_weather_context(lat, lon)
        cur_aqi = aqi_res.get("aqi", 130)
        cur_cat = aqi_res.get("category", "Moderate")
        pm25 = aqi_res.get("pollutants", {}).get("PM2.5", 45)
        pm10 = aqi_res.get("pollutants", {}).get("PM10", 90)
        loc_name = aqi_res.get("station", "your local area")
        state_name = "India"

    temp = weather.get("temperature_c", 25)
    humidity = weather.get("humidity_pct", 55)
    wind = weather.get("wind_kmh", 8)
    condition = weather.get("condition", "Partly cloudy")
    impact_note = weather.get("aqi_impact_notes", ["Normal atmospheric conditions."])[0]

    # 3. Weather Query
    if any(w in ql for w in ["weather", "temperature", "temp", "humidity", "wind", "rain"]):
        return (
            f"Live weather telemetry for {loc_name} ({state_name}) indicates a temperature of {temp}°C with {humidity}% relative humidity and winds at {wind} km/h under {condition.lower()} skies. "
            f"Air quality currently stands at AQI {cur_aqi} (US scale) with PM2.5 at {pm25} µg/m³. "
            f"{impact_note} When surface winds remain light, airborne particulates settle close to the breathing zone."
        )

    # 4. Mask / Health Query
    if any(w in ql for w in ["mask", "purifier", "asthma", "breathe", "doctor", "health"]):
        mask_text = (
            "A certified N95 or FFP2 respirator is strongly advised outdoors, as standard surgical masks do not filter sub-micron particles."
            if cur_aqi > 150
            else "Standard outdoor exposure is manageable for healthy individuals, though sensitive groups should carry an N95 mask."
        )
        return (
            f"Health precautions are advised with local air currently at AQI {cur_aqi} (US scale), falling into the {cur_cat.lower()} category. "
            f"Fine particulates measure {pm25} µg/m³ PM2.5, alongside {temp}°C temperature and {wind} km/h wind speed. "
            f"{mask_text} "
            f"Indoors, running a HEPA air purifier on medium speed and keeping windows closed during morning rush hours prevents particulate penetration."
        )

    # 5. Default City Overview / Greeting
    return (
        f"In {loc_name}, air quality currently measures AQI {cur_aqi} (US scale) with {pm25} µg/m³ PM2.5 as the main particulate driver. "
        f"Weather readings show {temp}°C with {humidity}% relative humidity and a wind speed of {wind} km/h. "
        f"{impact_note} "
        f"You can ask me to evaluate safe time windows for running, cycling, walks, or whether to open home windows today."
    )


# ---------------------------------------------------------------------------
# LLM BACKENDS WITH FUNCTION CALLING & POST-GENERATION GUARD
# ---------------------------------------------------------------------------

def _build_context_header(lat: float, lon: float, history: Optional[list]) -> str:
    """Format rich real-time context and recent history into the prompt."""
    now_ist = datetime.now().strftime("%A, %d %b %Y, %I:%M %p IST")
    aqi_data = get_live_aqi_by_coords(lat, lon)
    wx_data = get_weather_context(lat, lon)

    context = (
        f"### REAL-TIME CONTEXT:\n"
        f"- Local Timestamp: {now_ist}\n"
        f"- Location Coordinates: {lat:.4f}°N, {lon:.4f}°E ({aqi_data.get('station', 'Local Area')})\n"
        f"- Live Air Quality: AQI {aqi_data.get('aqi', 120)} (US scale), Dominant Pollutant PM2.5 ({aqi_data.get('pollutants', {}).get('PM2.5', 40)} µg/m³)\n"
        f"- Live Weather: {wx_data.get('temperature_c', 25)}°C, Humidity {wx_data.get('humidity_pct', 55)}%, Wind {wx_data.get('wind_kmh', 8)} km/h\n"
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

    def plan_activity_tool(activity: str, duration_min: int = 60, sensitive: bool = False) -> str:
        """Determine safe time windows for outdoor activities (running, cycling, walking, kids play, windows, yoga, sports) across a 1-5 day forecast."""
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
    )

    context_header = _build_context_header(lat, lon, history)
    augmented_prompt = f"{context_header}\nUser Query: {question}"

    candidate_models = ["gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemini-flash-latest", "gemini-3.8-flash"]

    for model_name in candidate_models:
        try:
            chat_session = client.chats.create(model=model_name, config=config)
            resp = chat_session.send_message(augmented_prompt)
            if resp.text and len(resp.text.strip()) > 10:
                return _verify_and_clean_answer(resp.text.strip(), planner_payload.get("result"), question)
        except Exception:
            continue

    return fallback_answer(question, lat, lon, history)


def ask_groq(api_key: str, question: str, lat: float, lon: float, history: Optional[list] = None) -> str:
    """Groq Cloud — Llama 3.3 70B with function calling and hallucination guard."""
    from groq import Groq

    client = Groq(api_key=api_key)
    planner_payload = {}

    context_header = _build_context_header(lat, lon, history)

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
            max_tokens=700,
            temperature=0.3,
        )
        msg = resp.choices[0].message
        if not msg.tool_calls:
            return _verify_and_clean_answer(msg.content or "", planner_payload.get("result"), question)

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

    return fallback_answer(question, lat, lon, history)


# ---------------------------------------------------------------------------
# MAIN CHAT ENTRYPOINT
# ---------------------------------------------------------------------------

def _try_llm_call(question: str, lat: float, lon: float, history: Optional[list] = None) -> str:
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
    load_dotenv(override=True)

    gemini_key = os.getenv("GEMINI_API_KEY", "").strip()
    groq_key = os.getenv("GROQ_API_KEY", "").strip()

    if not gemini_key and not groq_key:
        return fallback_answer(question, lat, lon, history)

    try:
        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
            future = executor.submit(_try_llm_call, question, lat, lon, history)
            return future.result(timeout=AI_TIMEOUT_SECONDS)
    except concurrent.futures.TimeoutError:
        print(f"AI response exceeded {AI_TIMEOUT_SECONDS}s deadline. Falling back to local rules engine.")
        return fallback_answer(question, lat, lon, history)
    except Exception as e:
        print("Chat orchestration exception:", e)
        return fallback_answer(question, lat, lon, history)
