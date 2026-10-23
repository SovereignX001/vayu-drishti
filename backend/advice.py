LIMITS = {"run": 100, "walk": 150, "cycling": 100, "kids_play": 100,
          "open_windows": 100, "picnic": 100}


def category(aqi):
    for cap, name in [(50, "Good"), (100, "Moderate"), (150, "Unhealthy for sensitive groups"),
                      (200, "Unhealthy"), (300, "Very unhealthy")]:
        if aqi <= cap:
            return name
    return "Hazardous"


def check_activity(fc, activity, after_hour=5, before_hour=22, sensitive=False):
    limit = LIMITS.get(activity, 100)
    if sensitive:                       # asthma, heart/lung issues, elderly, kids
        limit = int(limit * 0.7)
    now = fc["now"]
    window = [h for h in fc["hours"] if after_hour <= int(h["time"][11:13]) <= before_hour]
    best = min(window, key=lambda h: h["aqi"]) if window else None
    first_ok = next((h for h in window if h["aqi"] <= limit), None)
    return {
        "activity": activity,
        "now_time": now["time"],
        "current_aqi": now["aqi"],
        "current_category": category(now["aqi"]),
        "safe_limit_aqi": limit,
        "ok_now": now["aqi"] <= limit,
        "best_time": best["time"] if best else None,
        "best_aqi": best["aqi"] if best else None,
        "first_ok_time": first_ok["time"] if first_ok else None,
        "any_ok_window": first_ok is not None,
    }


def summarize_forecast(fc):
    hrs = fc["hours"]
    return {
        "now": {**fc["now"], "category": category(fc["now"]["aqi"])},
        "every_3_hours": [{**h, "category": category(h["aqi"])} for h in hrs[2::3]],
        "best_hour": min(hrs, key=lambda h: h["aqi"]),
        "worst_hour": max(hrs, key=lambda h: h["aqi"]),
    }


def guess_activity(q):
    q = q.lower()
    for words, act in [(("run", "jog", "exercise", "workout"), "run"),
                       (("kid", "child", "play"), "kids_play"),
                       (("window", "ventilat"), "open_windows"),
                       (("cycl", "bike"), "cycling"),
                       (("picnic", "park"), "picnic")]:
        if any(w in q for w in words):
            return act
    return "walk"