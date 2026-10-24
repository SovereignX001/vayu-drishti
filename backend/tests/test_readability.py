import os
import sys
import time
import re
from pathlib import Path
from typing import List, Dict, Any

# Ensure backend directory is in path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

# Force UTF-8 on Windows stdout to prevent charmap encoding errors
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

import requests
from main import app
from starlette.testclient import TestClient

BANNED_JARGON = [
    r"µg/m³",
    r"ug/m3",
    r"ug/m\^3",
    r"\binversion\s+ceiling\b",
    r"\btemperature\s+inversion\b",
    r"\binversion\b",
    r"\bboundary\s+layer\b",
    r"\bparticulates?\b",
    r"\baerosols?\b",
    r"\bdispersions?\b",
    r"\bdispersing\b",
    r"\bstagnations?\b",
    r"\btelemetry\b",
    r"\bbronchial\b",
    r"\balveoli\b",
    r"\bpersistence\s+baseline\b",
    r"\bhorizons?\b",
    r"\bCAMS\b",
    r"\breanalysis\b",
    r"\bPM\s*2\.5\b",
    r"\bPM\s*10\b",
    r"\bLightGBM\b",
    r"\bregressor\b",
]

MARKDOWN_SYMBOLS = [
    r"\*",
    r"#",
    r"`",
    r"•",
    r"^\s*[\-\+]\s+",
]

TEST_QUESTIONS = [
    "when can i go for a 5km run",
    "is it safe for my 6 year old with asthma to play outside today",
    "best day this week for a picnic",
    "should i open my windows now",
    "can i cycle to work tomorrow at 8am",
    "what about tomorrow?",
    "compare Delhi and Bengaluru right now",
    "air quality in Modinagar",
    "why is winter pollution worse in north india",
    "explain in detail how you predict air quality",
    "asdfgh",
]

DETAIL_QUESTIONS = {
    "why is winter pollution worse in north india",
    "explain in detail how you predict air quality",
}

CITIES = [
    {"name": "Meerut", "lat": 28.9845, "lon": 77.7064},
    {"name": "Jaipur", "lat": 26.9124, "lon": 75.7873},
]


INTENT_TEST_TABLE = [
    {
        "question": "should i go to office today",
        "expected_activity": "commute",
        "expected_topics": ["office", "commute", "travel", "road", "mask", "recirculation"],
        "forbidden_topics": ["workout", "exercise", "run", "jog", "gym", "treadmill", "cricket", "yoga"],
        "history": [],
    },
    {
        "question": "is it safe to commute to work",
        "expected_activity": "commute",
        "expected_topics": ["commute", "work", "office", "travel", "road", "mask", "recirculation"],
        "forbidden_topics": ["workout", "exercise", "run", "jog", "gym", "treadmill", "cricket", "yoga"],
        "history": [],
    },
    {
        "question": "can i take my bike to office tomorrow morning",
        "expected_activity": "commute",
        "expected_topics": ["office", "commute", "travel", "mask", "road"],
        "forbidden_topics": ["workout", "exercise", "run", "jog", "gym", "treadmill", "cricket", "yoga"],
        "history": [],
    },
    {
        "question": "going to the market this evening",
        "expected_activity": "commute",
        "expected_topics": ["commute", "market", "travel", "mask", "outside", "errands"],
        "forbidden_topics": ["workout", "exercise", "run", "jog", "gym", "treadmill", "cricket", "yoga"],
        "history": [],
    },
    {
        "question": "drop my kid to school",
        "expected_activity": "commute",
        "expected_topics": ["school", "commute", "travel", "mask", "road"],
        "forbidden_topics": ["workout", "exercise", "run", "jog", "gym", "treadmill", "cricket", "yoga"],
        "history": [],
    },
    {
        "question": "should i go for a run",
        "expected_activity": "running",
        "expected_topics": ["run", "running", "jog"],
        "forbidden_topics": ["commute", "office", "metro", "bus", "two-wheeler"],
        "history": [],
    },
    {
        "question": "can i play cricket after 5",
        "expected_activity": "outdoor_workout",
        "expected_topics": ["exercise", "cricket", "sports", "workout", "play"],
        "forbidden_topics": ["commute", "office", "metro", "bus", "two-wheeler"],
        "history": [],
    },
    {
        "question": "can i open my windows",
        "expected_activity": "open_windows",
        "expected_topics": ["window", "windows", "ventilat", "air purifier"],
        "forbidden_topics": ["workout", "exercise", "run", "jog", "gym", "treadmill", "commute", "office"],
        "history": [],
    },
    {
        "question": "is the air ok to go out",
        "expected_activity": "general_outdoor",
        "expected_topics": ["step outside", "outside", "outdoors", "go outside"],
        "forbidden_topics": ["workout", "exercise", "run", "jog", "gym", "treadmill"],
        "history": [],
    },
    {
        "question": "what about tomorrow?",
        "expected_activity": "commute",
        "expected_topics": ["office", "commute", "travel", "mask", "road"],
        "forbidden_topics": ["workout", "exercise", "run", "jog", "gym", "treadmill", "cricket", "yoga"],
        "history": [
            {"sender": "user", "text": "should i go to office today"},
            {"sender": "ai", "text": "It is not a good time to head to the office or commute today. The air is quite dirty today with an AQI of 185. There are no clean hours in the forecast, though tomorrow at 7:00 AM has the least dirt. Wear an N95 mask on the road and keep car windows rolled up with air recirculation on."}
        ],
    },
    {
        "question": "i am going outside",
        "expected_activity": "general_outdoor",
        "expected_topics": ["outside", "step outside", "outdoors", "go outside"],
        "forbidden_topics": ["workout", "exercise", "run", "jog", "gym", "treadmill"],
        "history": [],
    },
    {
        "question": "asdfgh",
        "expected_activity": "unknown",
        "expected_topics": ["could not understand", "help you plan", "outdoor activities safely"],
        "forbidden_topics": [],
        "history": [],
    },
]


def check_reply(text: str, is_detail: bool) -> Dict[str, Any]:
    words = text.split()
    word_count = len(words)

    # Split sentences on terminal punctuation
    sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", text) if s.strip()]
    sentence_count = len(sentences)

    # Check banned terms
    banned_found = []
    for pat in BANNED_JARGON:
        if re.search(pat, text, re.IGNORECASE):
            banned_found.append(pat.replace(r"\b", "").replace(r"\s+", " "))

    # Check markdown
    md_found = []
    for pat in MARKDOWN_SYMBOLS:
        if re.search(pat, text, re.MULTILINE):
            md_found.append(pat.replace(r"\*", "*"))

    failures = []
    if is_detail:
        if word_count > 130:
            failures.append(f"Word count {word_count} exceeds detail limit (130)")
    else:
        if word_count < 40 or word_count > 70:
            failures.append(f"Word count {word_count} outside default range (40-70)")
        if sentence_count < 2 or sentence_count > 4:
            failures.append(f"Sentence count {sentence_count} outside default range (2-4)")

    if banned_found:
        failures.append(f"Banned jargon found: {', '.join(banned_found)}")
    if md_found:
        failures.append(f"Markdown symbols found: {', '.join(md_found)}")

    return {
        "word_count": word_count,
        "sentence_count": sentence_count,
        "banned_found": banned_found,
        "md_found": md_found,
        "failures": failures,
        "passed": len(failures) == 0,
    }


def check_intent_alignment(reply: str, case: dict) -> List[str]:
    failures = []
    reply_lower = reply.lower()

    # Check expected topic keywords
    expected = case.get("expected_topics", [])
    if expected:
        matched = any(exp in reply_lower for exp in expected)
        if not matched:
            failures.append(f"Reply missed expected topics: {expected}")

    # Check forbidden topics
    forbidden = case.get("forbidden_topics", [])
    for forb in forbidden:
        pattern = r"\b" + re.escape(forb) + r"\b"
        if forb == "run":
            # Exclude appliance operation like "run an air purifier" / "run a purifier"
            clean_for_run = re.sub(r"\brun\s+(?:an?\s+)?(?:air\s+)?purifier\b", "", reply_lower)
            if re.search(pattern, clean_for_run):
                failures.append(f"Forbidden off-topic word '{forb}' found in reply for activity '{case.get('expected_activity')}'")
        else:
            if re.search(pattern, reply_lower):
                failures.append(f"Forbidden off-topic word '{forb}' found in reply for activity '{case.get('expected_activity')}'")

    return failures


def send_chat_request(client, question: str, lat: float, lon: float, history: list = None) -> tuple:
    payload = {"question": question, "lat": lat, "lon": lon, "history": history or []}
    t0 = time.perf_counter()
    resp = client.post("/chat", json=payload)
    elapsed = time.perf_counter() - t0
    if resp.status_code != 200:
        return f"ERROR {resp.status_code}: {resp.text}", elapsed
    return resp.json().get("answer", ""), elapsed


def run_tests() -> bool:
    client = TestClient(app)
    all_passed = True
    total_tests = 0
    passed_tests = 0

    print("=" * 75)
    print("VAYU DRISHTI - READABILITY & JARGON AUDIT SUITE")
    print("=" * 75)

    for city in CITIES:
        print(f"\n>>> TESTING CITY: {city['name']} (Lat: {city['lat']}, Lon: {city['lon']})")
        print("-" * 75)
        history = []

        for q in TEST_QUESTIONS:
            total_tests += 1
            is_detail = q in DETAIL_QUESTIONS
            ans, duration = send_chat_request(client, q, city["lat"], city["lon"], history=history)

            # Update history for continuity in "what about tomorrow?"
            history.append({"sender": "user", "text": q})
            history.append({"sender": "ai", "text": ans})

            res = check_reply(ans, is_detail)
            status_tag = "PASS" if res["passed"] else "FAIL"

            if not res["passed"]:
                all_passed = False
            else:
                passed_tests += 1

            print(f"\nQ: \"{q}\" [{'DETAIL' if is_detail else 'DEFAULT'}]", flush=True)
            print(f"Reply: \"{ans}\"", flush=True)
            print(f"Status: [{status_tag}] | Words: {res['word_count']} | Sentences: {res['sentence_count']} | Time: {duration:.2f}s", flush=True)

            if res["failures"]:
                for f in res["failures"]:
                    print(f"  [X] FAILURE: {f}", flush=True)

    print("\n" + "=" * 75, flush=True)
    print("TASK 5: INTENT ALIGNMENT & ACTIVITY CONFLICT TEST TABLE", flush=True)
    print("=" * 75, flush=True)

    for case in INTENT_TEST_TABLE:
        total_tests += 1
        q = case["question"]
        hist = case.get("history", [])
        ans, duration = send_chat_request(client, q, 28.6139, 77.2090, history=hist)

        res = check_reply(ans, is_detail=False)
        intent_failures = check_intent_alignment(ans, case)
        all_failures = res["failures"] + intent_failures
        passed = len(all_failures) == 0

        status_tag = "PASS" if passed else "FAIL"
        if not passed:
            all_passed = False
        else:
            passed_tests += 1

        print(f"\nQ: \"{q}\" [EXPECTED: {case['expected_activity']}]", flush=True)
        print(f"Reply: \"{ans}\"", flush=True)
        print(f"Status: [{status_tag}] | Words: {res['word_count']} | Sentences: {res['sentence_count']} | Time: {duration:.2f}s", flush=True)

        if all_failures:
            for f in all_failures:
                print(f"  [X] FAILURE: {f}", flush=True)

    print("\n" + "=" * 75, flush=True)
    print(f"AUDIT SUMMARY: {passed_tests}/{total_tests} passed. Overall: {'SUCCESS' if all_passed else 'FAILED'}", flush=True)
    print("=" * 75, flush=True)
    return all_passed


if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
