import time
from pathlib import Path
import joblib
import pandas as pd

from cities import nearest_city
from data import get_recent
from features import make_features

MODELS_DIR = Path(__file__).resolve().parent / "models"
_models, _cache = {}, {}


def _load(city):
    if city not in _models:
        model_path = MODELS_DIR / f"{city}.pkl"
        _models[city] = joblib.load(model_path)
    return _models[city]


def forecast_next_24h(lat, lon):
    key = (round(lat, 2), round(lon, 2))
    hit = _cache.get(key)
    if hit and time.time() - hit[0] < 1800:        # reuse for 30 minutes
        return hit[1]

    models = _load(nearest_city(lat, lon))
    df = get_recent(lat, lon)
    now = pd.Timestamp.now(tz="Asia/Kolkata").tz_localize(None).floor("h")
    t0 = df.loc[:now, "us_aqi"].last_valid_index()

    hours = []
    for h in range(1, 25):
        X = make_features(df, h).loc[[t0]]
        pred = float(models[h].predict(X)[0])
        hours.append({"time": (t0 + pd.Timedelta(hours=h)).strftime("%Y-%m-%dT%H:%M"),
                      "aqi": max(0, round(pred))})

    result = {"now": {"time": t0.strftime("%Y-%m-%dT%H:%M"),
                      "aqi": round(float(df.loc[t0, "us_aqi"]))},
              "hours": hours}
    _cache[key] = (time.time(), result)
    return result