import pandas as pd


def make_features(df, h):
    """Clues for predicting AQI h hours into the future."""
    X = pd.DataFrame(index=df.index)
    for lag in [0, 1, 3, 6, 12, 24, 48, 168]:
        X[f"aqi_lag{lag}"] = df["us_aqi"].shift(lag)      # AQI some hours ago
    X["pm25_now"] = df["pm2_5"]
    X["pm10_now"] = df["pm10"]
    for col, name in [("temperature_2m", "temp"), ("relative_humidity_2m", "hum"),
                      ("wind_speed_10m", "wind")]:
        X[f"{name}_now"] = df[col]
        X[f"{name}_future"] = df[col].shift(-h)            # weather at the target hour
    target = df.index + pd.Timedelta(hours=h)
    X["target_hour"] = target.hour
    X["target_dow"] = target.dayofweek
    X["month"] = target.month
    return X