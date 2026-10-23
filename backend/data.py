import requests, pandas as pd
from datetime import date, timedelta

AQ_URL = "https://air-quality-api.open-meteo.com/v1/air-quality"
WX_ARCHIVE = "https://archive-api.open-meteo.com/v1/archive"
WX_FORECAST = "https://api.open-meteo.com/v1/forecast"
AQ_VARS = "pm2_5,pm10,us_aqi"
WX_VARS = "temperature_2m,relative_humidity_2m,wind_speed_10m"
TZ = "Asia/Kolkata"


def _get(url, params):
    r = requests.get(url, params=params, timeout=90)
    if r.status_code != 200:
        raise RuntimeError(f"Open-Meteo error {r.status_code}: {r.text[:300]}")
    return r.json()["hourly"]


def _merge(aq, wx):
    df = pd.DataFrame(aq).merge(pd.DataFrame(wx), on="time")
    df["time"] = pd.to_datetime(df["time"])
    return df.set_index("time")


def get_history(lat, lon, start="2023-01-01"):
    """Years of past hourly data, used for TRAINING."""
    end = (date.today() - timedelta(days=2)).isoformat()
    aq = _get(AQ_URL, {"latitude": lat, "longitude": lon, "start_date": start,
                       "end_date": end, "hourly": AQ_VARS, "timezone": TZ})
    wx = _get(WX_ARCHIVE, {"latitude": lat, "longitude": lon, "start_date": start,
                           "end_date": end, "hourly": WX_VARS, "timezone": TZ})
    df = _merge(aq, wx)
    return df.asfreq("h").interpolate(limit=6).dropna()


def get_recent(lat, lon):
    """Last 8 days + next 2 days, used LIVE when someone asks a question."""
    aq = _get(AQ_URL, {"latitude": lat, "longitude": lon, "past_days": 8,
                       "forecast_days": 2, "hourly": AQ_VARS, "timezone": TZ})
    wx = _get(WX_FORECAST, {"latitude": lat, "longitude": lon, "past_days": 8,
                            "forecast_days": 2, "hourly": WX_VARS, "timezone": TZ})
    return _merge(aq, wx)