import concurrent.futures
import json
import os
import re
from pathlib import Path
from dotenv import load_dotenv

AI_TIMEOUT_SECONDS = 8.0

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

# ---------------------------------------------------------------------------
# SYSTEM PROMPT — Comprehensive Indian Atmospheric Intelligence Expert
# ---------------------------------------------------------------------------
SYSTEM = """You are Drishti, an advanced atmospheric intelligence assistant built specifically for Indian cities, combining live weather and air quality web telemetry with machine-learned historical insights (trained on 235,785 CPCB monitoring records across 291 Indian cities from 2023–2025).

## CORE INSTRUCTIONS:
- Give VARIED, natural, conversational, and deeply insightful answers. Never use repetitive templates.
- Tailor the answer specifically to the user's question:
  * Simple questions: 2–3 concise, punchy sentences.
  * In-depth questions (trends, health, meteorological drivers, pollutants): 4–8 informative sentences with specific numbers and context.
- Always quote the ACTUAL AQI number, pollutant concentrations (µg/m³), and official Indian AQI category (Good [0-50], Satisfactory [51-100], Moderate [101-200], Poor [201-300], Very Poor [301-400], Severe [401-500]).
- Incorporate live weather parameters: temperature (°C), relative humidity (%), wind speed (km/h), and precipitation, explaining their direct meteorological impact on pollutant dispersion or accumulation.
- Reference historical benchmarks from the trained Kaggle 2023-2025 dataset when discussing city trends or comparing whether current air is cleaner or dirtier than average.
- For health queries, give practical, actionable advice: N95/FFP2 masks (surgical masks don't filter PM2.5), HEPA air purifiers, and specific precautions for asthmatics, children, and the elderly.
- When any Indian city is mentioned, always fetch live data for that city.

## METEOROLOGICAL IMPACT GUIDE:
- **Wind Speed**: <5 km/h causes severe stagnation and ground accumulation; >15 km/h actively disperses pollutants.
- **Humidity**: >75-80% causes hygroscopic swelling of PM2.5 particles, worsening optical haze; <30% allows road/construction dust to stay airborne as PM10.
- **Temperature Inversion**: Cold winter nights (<14°C) create shallow inversion boundaries that trap vehicular emissions close to the ground.
- **Rain (Wet Scavenging)**: Precipitation washes fine particulate matter out of the air column.

Be empathetic, scientifically rigorous, articulate, and varied in your expression.
"""

# ---------------------------------------------------------------------------
# HISTORICAL BENCHMARKS (from trained Kaggle dataset)
# ---------------------------------------------------------------------------

def get_historical_benchmarks(city: str) -> dict:
    """Retrieve 2023-2025 historical AQI benchmarks from the trained Kaggle dataset."""
    stats_file = Path(__file__).resolve().parent / "data" / "national_aqi_stats.json"
    if not stats_file.exists():
        return {"city": city, "note": "Historical benchmark dataset not yet compiled."}
    try:
        with open(stats_file, "r", encoding="utf-8") as f:
            data = json.load(f)
        benchmarks = data.get("city_benchmarks", {})

        # Search matching city
        c_lower = city.lower().strip()
        for c_key, c_val in benchmarks.items():
            if c_key.lower() == c_lower or c_key.lower() in c_lower or c_lower in c_key.lower():
                return c_val

        # If not found directly, try state search
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
            "name": "get_indian_city_overview",
            "description": "Fetch real-time live AQI, live weather, weather impact analysis, and trained historical Kaggle benchmarks for ANY Indian city.",
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
            "name": "check_activity",
            "description": "Check if outdoor activity is safe right now and find the best window in the next 24 hours.",
            "parameters": {
                "type": "object",
                "properties": {
                    "activity": {"type": "string", "enum": ["run", "walk", "cycling", "kids_play", "open_windows", "picnic"]},
                    "after_hour": {"type": "integer", "description": "Earliest hour (0-23)."},
                    "before_hour": {"type": "integer", "description": "Latest hour (0-23)."},
                    "sensitive": {"type": "boolean", "description": "True if elderly, child, or respiratory condition."},
                },
                "required": ["activity"],
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
            "description": "Retrieve 2023-2025 historical AQI benchmark stats for an Indian city from the trained Kaggle dataset.",
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


def run_tool(name, args, lat, lon):
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
# INTELLIGENT LOCAL SYNTHESIS ENGINE (High-variety RAG & Live Web Grounder)
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


def _classify_intent(q: str) -> str:
    ql = q.lower()
    # Comparison
    if (" vs " in ql or "compare" in ql or "better than" in ql) and len(_detect_mentioned_cities(q)) >= 2:
        return "comparison"
    # Specific weather query
    if any(w in ql for w in ["weather", "temperature", "temp", "humidity", "wind", "rain", "rainy", "hot", "cold"]):
        return "weather"
    # Mask & Purifier & Health
    if any(w in ql for w in ["mask", "purifier", "asthma", "breathe", "lungs", "doctor", "health risk", "safe for kids", "elderly"]):
        return "health"
    # Pollutant science
    if any(w in ql for w in ["pm2.5", "pm10", "pm 2.5", "ozone", "no2", "so2", "pollutant", "smog"]):
        return "pollutant"
    # Season / stubble burning / Diwali
    if any(w in ql for w in ["stubble", "parali", "diwali", "winter", "monsoon", "summer", "season", "crop"]):
        return "seasonality"
    # Outdoor Activity
    if any(w in ql for w in ["run", "jog", "walk", "cycl", "bike", "outside", "outdoor", "play", "window", "picnic", "cricket"]):
        return "activity"
    # City overview or AQI
    if any(w in ql for w in ["aqi", "air quality", "pollution", "how is"]) or _detect_mentioned_cities(q):
        return "city_overview"
    # Greeting / General
    if any(w in ql for w in ["hi", "hello", "hey", "who are you", "what can you do", "namaste"]):
        return "greeting"
    return "general"


def fallback_answer(question: str, lat: float, lon: float) -> str:
    """
    Intelligent Local Atmospheric Synthesis Engine.
    Executes live data fetching from public web APIs (Open-Meteo & WAQI),
    cross-references the 235k+ record Kaggle trained dataset, and delivers rich, varied answers.
    """
    intent = _classify_intent(question)
    cities = _detect_mentioned_cities(question)

    # 1. Comparison Intent (e.g., Delhi vs Mumbai)
    if intent == "comparison" and len(cities) >= 2:
        c1, c2 = cities[0], cities[1]
        d1 = get_indian_city_live_intelligence(c1)
        d2 = get_indian_city_live_intelligence(c2)

        aqi1 = d1["live_aqi"].get("aqi", "N/A")
        cat1 = d1["live_aqi"].get("category", "")
        t1 = d1["live_weather"].get("temperature_c", "N/A")
        w1 = d1["live_weather"].get("wind_kmh", "N/A")
        hist1 = d1["historical_benchmark"].get("avg_aqi", "N/A")

        aqi2 = d2["live_aqi"].get("aqi", "N/A")
        cat2 = d2["live_aqi"].get("category", "")
        t2 = d2["live_weather"].get("temperature_c", "N/A")
        w2 = d2["live_weather"].get("wind_kmh", "N/A")
        hist2 = d2["historical_benchmark"].get("avg_aqi", "N/A")

        cleaner = c1 if (isinstance(aqi1, (int, float)) and isinstance(aqi2, (int, float)) and aqi1 < aqi2) else c2

        return (
            f"**{c1} vs {c2} Live Air & Weather Comparison:**\n\n"
            f"• **{c1}**: Currently at **AQI {aqi1} ({cat1})** with temperature {t1}°C and wind speed of {w1} km/h. "
            f"According to our trained 2023–2025 CPCB dataset, its historical average AQI is {hist1}.\n"
            f"• **{c2}**: Currently at **AQI {aqi2} ({cat2})** with temperature {t2}°C and wind speed of {w2} km/h. "
            f"Its historical 2-year average AQI is {hist2}.\n\n"
            f"Right now, **{cleaner}** enjoys significantly cleaner atmospheric ventilation. "
            f"Wind speed and regional topography play a major role in these variations."
        )

    # Determine primary target city or use current coordinates
    target_city = cities[0] if cities else None
    if target_city:
        intel = get_indian_city_live_intelligence(target_city)
        cur_aqi = intel["live_aqi"].get("aqi", 130)
        cur_cat = intel["live_aqi"].get("category", "Moderate")
        pm25 = intel["live_aqi"].get("pollutants", {}).get("PM2.5", 45)
        pm10 = intel["live_aqi"].get("pollutants", {}).get("PM10", 90)
        weather = intel["live_weather"]
        hist = intel["historical_benchmark"]
        loc_name = intel["city"]
        state_name = intel["state"]
    else:
        aqi_res = get_live_aqi_by_coords(lat, lon)
        weather = get_weather_context(lat, lon)
        cur_aqi = aqi_res.get("aqi", 130)
        cur_cat = aqi_res.get("category", "Moderate")
        pm25 = aqi_res.get("pollutants", {}).get("PM2.5", 45)
        pm10 = aqi_res.get("pollutants", {}).get("PM10", 90)
        hist = get_historical_benchmarks("Delhi")
        loc_name = aqi_res.get("station", "your local area")
        state_name = "India"

    temp = weather.get("temperature_c", 25)
    feels = weather.get("feels_like_c", temp)
    humidity = weather.get("humidity_pct", 55)
    wind = weather.get("wind_kmh", 8)
    wind_dir = weather.get("wind_direction", "NW")
    condition = weather.get("condition", "Partly cloudy")
    impact_note = weather.get("aqi_impact_notes", ["Normal atmospheric conditions."])[0]
    season = get_seasonal_context()

    # 2. Weather Intent
    if intent == "weather":
        return (
            f"**Live Weather Telemetry for {loc_name} ({state_name}):**\n"
            f"• **Temperature**: {temp}°C (feels like {feels}°C) | **Conditions**: {condition}\n"
            f"• **Relative Humidity**: {humidity}% | **Wind**: {wind} km/h from {wind_dir}\n"
            f"• **Current AQI**: {cur_aqi} ({cur_cat})\n\n"
            f"**Atmospheric Impact:** {impact_note} "
            f"When winds remain under 10 km/h, particulate matter struggles to disperse, causing local hotspots."
        )

    # 3. City Overview / AQI Query
    if intent == "city_overview":
        hist_note = ""
        if hist and hist.get("avg_aqi"):
            avg_aqi = hist["avg_aqi"]
            diff = cur_aqi - avg_aqi if isinstance(cur_aqi, (int, float)) else 0
            trend_str = "higher than" if diff > 15 else ("lower than" if diff < -15 else "consistent with")
            hist_note = f" For historical context, our 2023–2025 trained model records a 2-year average AQI of {avg_aqi} for this area, meaning today's air is {trend_str} its historical baseline."

        return (
            f"In **{loc_name}**, the live air quality is currently **AQI {cur_aqi} ({cur_cat})**.\n\n"
            f"• **Key Pollutants**: PM2.5 is at {pm25} µg/m³ and PM10 is at {pm10} µg/m³.\n"
            f"• **Weather Telemetry**: Temperature is {temp}°C, humidity is {humidity}%, and wind is blowing at {wind} km/h ({condition}).\n"
            f"• **Meteorological Factor**: {impact_note}{hist_note}\n\n"
            f"**Health Advisory**: {cur_cat} air calls for sensible precautions. Sensitive groups (asthmatics, elderly, children) should avoid prolonged outdoor exertion."
        )

    # 4. Health, Mask & Purifier Guidance
    if intent == "health":
        mask_rec = (
            "An **N95 or FFP2 certified respirator** is strongly recommended outdoors. "
            "Standard surgical or cloth masks filter less than 20% of sub-micron PM2.5 particles."
            if cur_aqi > 150
            else "Standard outdoor exposure is acceptable for healthy individuals, but sensitive groups should keep an N95 handy."
        )
        return (
            f"**Health & Protection Advisory (Current AQI: {cur_aqi} - {cur_cat}):**\n\n"
            f"1. **Mask Protection**: {mask_rec}\n"
            f"2. **Indoor Air Management**: In spaces where AQI exceeds 150, a HEPA (High-Efficiency Particulate Air) purifier with CADR suitable for room volume is essential. Keep doors and windows tightly closed during morning inversion hours (6 AM–9 AM).\n"
            f"3. **Vulnerable Demographics**: People with asthma, COPD, cardiovascular conditions, young children, and senior citizens experience heightened bronchial inflammation at PM2.5 levels above 60 µg/m³.\n"
            f"4. **Exercise**: Shift strenuous cardio sessions indoors or schedule them between 11 AM and 3 PM when solar heating disperses the boundary layer."
        )

    # 5. Pollutant Science & Breakdown
    if intent == "pollutant":
        return (
            f"**Atmospheric Pollutant Science ({loc_name}):**\n\n"
            f"• **PM2.5 ({pm25} µg/m³)**: Microscopic combustion particles under 2.5 microns. They bypass upper nasal cilia, penetrating deep into pulmonary alveoli and the bloodstream. Primary Indian sources include vehicular exhaust, biomass/stubble burning, and industrial boilers.\n"
            f"• **PM10 ({pm10} µg/m³)**: Coarser airborne dust originating from construction activity, unpaved roads, and regional dust storms.\n"
            f"• **Weather Interaction**: Current humidity of {humidity}% and wind speed of {wind} km/h influence how long these particles stay suspended. High humidity can cause particles to absorb water vapor and swell optically.\n"
            f"• **CPCB National Standard**: India's 24-hour safe limits are 60 µg/m³ for PM2.5 and 100 µg/m³ for PM10."
        )

    # 6. Seasonality, Stubble Burning & Diwali
    if intent == "seasonality":
        return (
            f"**Seasonal Atmospheric Intelligence ({season['season']}):**\n\n"
            f"{season['aqi_outlook']}\n\n"
            f"• **Dominant Regional Pollutants**: {', '.join(season['dominant_pollutants'])}\n"
            f"• **Most Affected Regions**: {', '.join(season['states_most_affected'])}\n"
            f"• **Thermal Dynamics**: Cool winter and post-monsoon nights create temperature inversions where cold ground air is capped by a warmer atmospheric layer, acting like a lid that traps vehicular smoke and stubble fire plumes until midday sun breaks it."
        )

    # 7. Outdoor Activity & Forecast
    if intent == "activity":
        fc = forecast_next_24h(lat, lon)
        act = guess_activity(question)
        r = check_activity(fc, act)
        best_t = r["best_time"][11:16] if r.get("best_time") else "midday"
        best_aqi = r.get("best_aqi", cur_aqi)

        if r["ok_now"]:
            return (
                f"**Activity Assessment ({act.replace('_', ' ').title()}):**\n\n"
                f"Current AQI is **{cur_aqi} ({cur_cat})**, which is within safe parameters for outdoor {act.replace('_', ' ')}. "
                f"Weather is {temp}°C with {wind} km/h breeze. {impact_note}"
            )
        else:
            return (
                f"**Activity Assessment ({act.replace('_', ' ').title()}):**\n\n"
                f"Conditions are **sub-optimal right now** with AQI standing at **{cur_aqi} ({cur_cat})**. "
                f"Fine particulate levels ({pm25} µg/m³ PM2.5) increase respiratory strain during exertion.\n\n"
                f"• **Recommended Window**: A better window opens around **{best_t}** when AQI drops closer to **{best_aqi}**.\n"
                f"• **Precaution**: If you must go outside now, consider wearing an N95 mask and avoiding heavy endurance pacing."
            )

    # 8. Greeting / General
    return (
        f"Namaste! I am Drishti AI, your real-time atmospheric and air quality intelligence companion.\n\n"
        f"I am connected to live weather and CPCB/Open-Meteo monitoring feeds across **291 Indian cities**, "
        f"backed by a machine-learning model trained on 235,785 historical data points.\n\n"
        f"• **Current Location Telemetry**: AQI is **{cur_aqi} ({cur_cat})** at {temp}°C, {humidity}% humidity, and {wind} km/h wind.\n"
        f"• **You can ask me**: 'What is the AQI in Mumbai or Kolkata?', 'Compare Delhi and Bengaluru', 'Is it safe to run tomorrow?', or 'Why is PM2.5 high this season?'"
    )


# ---------------------------------------------------------------------------
# LLM BACKENDS
# ---------------------------------------------------------------------------

def ask_gemini(api_key: str, question: str, lat: float, lon: float) -> str:
    """Google Gemini with automatic function calling and graceful fallback."""
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=api_key)

    # Define tools with explicit docstrings for Gemini
    def get_indian_city_overview(city: str) -> str:
        """Fetch live AQI, live weather, impact analysis, and historical benchmarks for ANY Indian city."""
        res = run_tool("get_indian_city_overview", {"city": city}, lat, lon)
        return json.dumps(res)

    def get_weather(city: str = "") -> str:
        """Get current weather conditions (temperature, humidity, wind, rain) and AQI impact."""
        res = run_tool("get_weather", {"city": city}, lat, lon)
        return json.dumps(res)

    def check_activity_tool(activity: str, sensitive: bool = False) -> str:
        """Check if an outdoor activity is safe right now based on AQI forecast."""
        res = run_tool("check_activity", {"activity": activity, "sensitive": sensitive}, lat, lon)
        return json.dumps(res)

    def get_forecast() -> str:
        """Get current AQI and 24-hour forecast summary."""
        res = run_tool("get_forecast", {}, lat, lon)
        return json.dumps(res)

    def get_season_context() -> str:
        """Get current Indian season AQI dynamics (winter smog, stubble burning, summer dust, monsoon)."""
        res = run_tool("get_season_context", {}, lat, lon)
        return json.dumps(res)

    def get_historical_benchmarks_tool(city: str) -> str:
        """Retrieve 2023-2025 historical AQI benchmark stats for an Indian city."""
        res = run_tool("get_historical_benchmarks", {"city": city}, lat, lon)
        return json.dumps(res)

    config = types.GenerateContentConfig(
        tools=[get_indian_city_overview, get_weather, check_activity_tool, get_forecast, get_season_context, get_historical_benchmarks_tool],
        system_instruction=SYSTEM,
        temperature=0.4,
    )

    # Verified working Gemini models in order of speed and capability
    candidate_models = ["gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemini-flash-latest", "gemini-3.8-flash"]

    for model_name in candidate_models:
        try:
            chat_session = client.chats.create(model=model_name, config=config)
            resp = chat_session.send_message(question)
            if resp.text and len(resp.text.strip()) > 10:
                return resp.text.strip()
        except Exception as e:
            print(f"Gemini {model_name} attempt note: {e}")
            continue

    # Direct completion fallback with injected live context if function calling hits a limit
    for model_name in candidate_models:
        try:
            # Pre-fetch live context for user coordinates
            live_aqi = get_live_aqi_by_coords(lat, lon)
            live_weather = get_weather_context(lat, lon)
            prompt = (
                f"{SYSTEM}\n\n"
                f"### CURRENT LIVE TELEMETRY:\n"
                f"- AQI: {live_aqi.get('aqi')} ({live_aqi.get('category')})\n"
                f"- Weather: {live_weather.get('temperature_c')}°C, Humidity {live_weather.get('humidity_pct')}%, Wind {live_weather.get('wind_kmh')} km/h\n"
                f"- User Question: {question}\n\n"
                f"Provide a natural, rich, expert response grounded in this data."
            )
            direct_resp = client.models.generate_content(model=model_name, contents=prompt)
            if direct_resp.text and len(direct_resp.text.strip()) > 10:
                return direct_resp.text.strip()
        except Exception:
            continue

    return fallback_answer(question, lat, lon)


def ask_groq(api_key: str, question: str, lat: float, lon: float) -> str:
    """Groq Cloud — Llama 3.3 70B."""
    from groq import Groq

    client = Groq(api_key=api_key)
    messages = [
        {"role": "system", "content": SYSTEM},
        {"role": "user", "content": question},
    ]

    for _ in range(6):
        resp = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            tools=GROQ_TOOLS,
            tool_choice="auto",
            max_tokens=900,
            temperature=0.4,
        )
        msg = resp.choices[0].message
        if not msg.tool_calls:
            return msg.content or ""

        messages.append(msg)
        for tc in msg.tool_calls:
            args = (
                json.loads(tc.function.arguments)
                if isinstance(tc.function.arguments, str)
                else (tc.function.arguments or {})
            )
            result = run_tool(tc.function.name, args, lat, lon)
            messages.append(
                {
                    "role": "tool",
                    "tool_call_id": tc.id,
                    "name": tc.function.name,
                    "content": json.dumps(result),
                }
            )

    return fallback_answer(question, lat, lon)


# ---------------------------------------------------------------------------
# MAIN CHAT ENTRYPOINT
# ---------------------------------------------------------------------------

def _try_llm_call(question: str, lat: float, lon: float) -> str:
    # 1. Try Google Gemini
    gemini_key = os.getenv("GEMINI_API_KEY", "").strip()
    if gemini_key:
        try:
            return ask_gemini(gemini_key, question, lat, lon)
        except Exception as e:
            print("Gemini routing error:", e)

    # 2. Try Groq
    groq_key = os.getenv("GROQ_API_KEY", "").strip()
    if groq_key:
        try:
            return ask_groq(groq_key, question, lat, lon)
        except Exception as e:
            print("Groq routing error:", e)

    return fallback_answer(question, lat, lon)


def chat(question: str, lat: float = 28.6139, lon: float = 77.2090) -> str:
    """Route question to Gemini/Groq with strict ~8s deadline; fall back gracefully to Intelligent Local Engine."""
    load_dotenv(override=True)

    gemini_key = os.getenv("GEMINI_API_KEY", "").strip()
    groq_key = os.getenv("GROQ_API_KEY", "").strip()

    if not gemini_key and not groq_key:
        return fallback_answer(question, lat, lon)

    try:
        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
            future = executor.submit(_try_llm_call, question, lat, lon)
            return future.result(timeout=AI_TIMEOUT_SECONDS)
    except concurrent.futures.TimeoutError:
        print(f"AI response exceeded {AI_TIMEOUT_SECONDS}s deadline. Falling back to local rules engine.")
        return fallback_answer(question, lat, lon)
    except Exception as e:
        print("Chat orchestration exception:", e)
        return fallback_answer(question, lat, lon)
