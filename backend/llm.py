import json
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(override=True)

from advice import check_activity, summarize_forecast, guess_activity
from forecast import forecast_next_24h

SYSTEM = """You are Drishti, a friendly air-quality assistant for Indian cities.
ALWAYS call a tool to get AQI data. Never guess or invent numbers.
AQI values are US AQI. Times in tool results are local (IST); say them like '6 PM'.
Answer in 2-4 short sentences: a clear yes/no first, the reason (AQI and category),
then a better time or a practical tip (mask, windows, purifier) if relevant.
If asked about historical trends or how today compares to past years, call get_historical_benchmarks."""

ANTHROPIC_TOOLS = [
    {
        "name": "check_activity",
        "description": "Check if an activity is OK right now and find the best time in the next 24 hours.",
        "input_schema": {
            "type": "object",
            "properties": {
                "activity": {"type": "string", "enum": ["run", "walk", "cycling", "kids_play", "open_windows", "picnic"]},
                "after_hour": {"type": "integer", "description": "Earliest hour of day (0-23) the person can go. Default 5."},
                "before_hour": {"type": "integer", "description": "Latest hour of day (0-23). Default 22."},
                "sensitive": {"type": "boolean", "description": "True if asthma, heart/lung condition, elderly or child."},
            },
            "required": ["activity"],
        },
    },
    {
        "name": "get_forecast",
        "description": "Get current AQI and a 24-hour forecast summary (best and worst hours).",
        "input_schema": {"type": "object", "properties": {}},
    },
    {
        "name": "get_historical_benchmarks",
        "description": "Retrieve 2023-2025 historical AQI benchmarks (average AQI, peak AQI, dominant pollutants) for an Indian city.",
        "input_schema": {
            "type": "object",
            "properties": {
                "city": {"type": "string", "description": "City name, e.g. Meerut, Delhi, Noida, Lucknow"}
            },
            "required": ["city"],
        },
    },
]

GROQ_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "check_activity",
            "description": "Check if an activity is OK right now and find the best time in the next 24 hours.",
            "parameters": {
                "type": "object",
                "properties": {
                    "activity": {"type": "string", "enum": ["run", "walk", "cycling", "kids_play", "open_windows", "picnic"]},
                    "after_hour": {"type": "integer", "description": "Earliest hour of day (0-23) the person can go. Default 5."},
                    "before_hour": {"type": "integer", "description": "Latest hour of day (0-23). Default 22."},
                    "sensitive": {"type": "boolean", "description": "True if asthma, heart/lung condition, elderly or child."},
                },
                "required": ["activity"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_forecast",
            "description": "Get current AQI and a 24-hour forecast summary (best and worst hours).",
            "parameters": {
                "type": "object",
                "properties": {},
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_historical_benchmarks",
            "description": "Retrieve 2023-2025 historical AQI benchmarks (average AQI, peak AQI, dominant pollutants) for an Indian city.",
            "parameters": {
                "type": "object",
                "properties": {
                    "city": {"type": "string", "description": "City name, e.g. Meerut, Delhi, Noida, Lucknow"}
                },
                "required": ["city"],
            },
        },
    },
]


def get_historical_benchmarks(city: str) -> dict:
    """Retrieve 2023-2025 historical AQI benchmarks from the Kaggle dataset."""
    stats_file = Path(__file__).resolve().parent / "data" / "national_aqi_stats.json"
    if not stats_file.exists():
        return {"error": "Historical benchmark data not available"}
    try:
        with open(stats_file, "r", encoding="utf-8") as f:
            data = json.load(f)
        benchmarks = data.get("city_benchmarks", {})
        for c_key, c_val in benchmarks.items():
            if c_key.lower() in city.lower() or city.lower() in c_key.lower():
                return c_val
        return {
            "city": city,
            "national_stats": {
                "total_records": data.get("total_records"),
                "status_distribution": data.get("status_distribution")[:3],
                "top_pollutants": data.get("pollutant_distribution")[:3],
            },
        }
    except Exception as e:
        return {"error": str(e)}


def run_tool(name, args, lat, lon):
    fc = forecast_next_24h(lat, lon)
    if name == "check_activity":
        return check_activity(
            fc,
            args.get("activity", "walk"),
            args.get("after_hour", 5),
            args.get("before_hour", 22),
            args.get("sensitive", False),
        )
    if name == "get_forecast":
        return summarize_forecast(fc)
    if name == "get_historical_benchmarks":
        return get_historical_benchmarks(args.get("city", "Meerut"))
    return {"error": "unknown tool"}


def fallback_answer(question, lat, lon):
    """Used if external LLMs are unreachable or unconfigured, so the platform always works."""
    r = check_activity(forecast_next_24h(lat, lon), guess_activity(question))
    if r["ok_now"]:
        return f"Yes. AQI is {r['current_aqi']} ({r['current_category']}) right now, which is fine for this."
    if r["any_ok_window"]:
        return (
            f"Not right now: AQI is {r['current_aqi']} ({r['current_category']}). "
            f"It should be better around {r['first_ok_time'][11:16]}."
        )
    return (
        f"No. AQI is {r['current_aqi']} ({r['current_category']}) and stays high for the next 24 hours. "
        f"The best time is {r['best_time'][11:16]} (AQI {r['best_aqi']})."
    )


def ask_groq(api_key, question, lat, lon):
    """Free, lightning-fast inference using Groq Cloud (Llama 3.3 70B)."""
    from groq import Groq

    client = Groq(api_key=api_key)
    messages = [
        {"role": "system", "content": SYSTEM},
        {"role": "user", "content": question},
    ]

    for _ in range(5):
        resp = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            tools=GROQ_TOOLS,
            tool_choice="auto",
            max_tokens=600,
            temperature=0.2,
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


def ask_gemini(api_key, question, lat, lon):
    """Free Google Gemini via official google-genai SDK with automatic tool calling."""
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=api_key)

    def check_activity(activity: str, after_hour: int = 5, before_hour: int = 22, sensitive: bool = False) -> str:
        """Check if an outdoor activity is safe right now based on local AQI and find the best time in the next 24 hours."""
        res = run_tool(
            "check_activity",
            {"activity": activity, "after_hour": after_hour, "before_hour": before_hour, "sensitive": sensitive},
            lat,
            lon,
        )
        return json.dumps(res)

    def get_forecast() -> str:
        """Get current AQI and 24-hour hyper-local forecast summary including best and worst hours."""
        res = run_tool("get_forecast", {}, lat, lon)
        return json.dumps(res)

    def get_historical_benchmarks_tool(city: str) -> str:
        """Retrieve 2023-2025 historical AQI benchmark stats (average AQI, peak AQI, dominant pollutant) for an Indian city like Meerut or Delhi."""
        res = run_tool("get_historical_benchmarks", {"city": city}, lat, lon)
        return json.dumps(res)

    config = types.GenerateContentConfig(
        tools=[check_activity, get_forecast, get_historical_benchmarks_tool],
        system_instruction=SYSTEM,
        temperature=0.2,
    )

    candidate_models = ["gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-flash-latest"]
    for model_name in candidate_models:
        try:
            chat_session = client.chats.create(model=model_name, config=config)
            resp = chat_session.send_message(question)
            if resp.text:
                return resp.text.strip()
        except Exception as e:
            print(f"Gemini model {model_name} error:", e)
            continue

    return fallback_answer(question, lat, lon)


def ask_anthropic(api_key, question, lat, lon):
    """Anthropic Claude API."""
    import anthropic

    client = anthropic.Anthropic(api_key=api_key)
    messages = [{"role": "user", "content": question}]

    for _ in range(5):
        r = client.messages.create(
            model="claude-sonnet-5-5",
            max_tokens=600,
            system=SYSTEM,
            tools=ANTHROPIC_TOOLS,
            messages=messages,
        )
        if r.stop_reason != "tool_use":
            return "".join(b.text for b in r.content if b.type == "text")

        messages.append({"role": "assistant", "content": r.content})
        results = [
            {
                "type": "tool_result",
                "tool_use_id": b.id,
                "content": json.dumps(run_tool(b.name, b.input, lat, lon)),
            }
            for b in r.content
            if b.type == "tool_use"
        ]
        messages.append({"role": "user", "content": results})

    return fallback_answer(question, lat, lon)


def chat(question, lat, lon):
    """Main chat router supporting Free Groq (Llama 3.3), Free Google Gemini, Anthropic, or Local Fallback."""
    load_dotenv(override=True)

    # 1. Try Groq (Free, ultra-fast Llama 3.3 70B)
    groq_key = os.getenv("GROQ_API_KEY", "").strip()
    if groq_key:
        try:
            return ask_groq(groq_key, question, lat, lon)
        except Exception as e:
            print("Groq API error, trying next provider:", e)

    # 2. Try Google Gemini (Free tier)
    gemini_key = os.getenv("GEMINI_API_KEY", "").strip()
    if gemini_key:
        try:
            return ask_gemini(gemini_key, question, lat, lon)
        except Exception as e:
            print("Gemini API error, trying next provider:", e)

    # 3. Try Anthropic (if key provided and valid)
    anthropic_key = os.getenv("ANTHROPIC_API_KEY", "").strip()
    if anthropic_key and not anthropic_key.startswith("sk-ant-usr-"):
        try:
            return ask_anthropic(anthropic_key, question, lat, lon)
        except Exception as e:
            print("Anthropic API error, using local fallback:", e)

    # 4. Built-in Local Fallback using LightGBM model telemetry
    return fallback_answer(question, lat, lon)