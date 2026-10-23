import json, os, time
import joblib
import lightgbm as lgb
import pandas as pd
from sklearn.metrics import mean_absolute_error, r2_score

from cities import CITIES
from data import get_history
from features import make_features

os.makedirs("models", exist_ok=True)
metrics = {}

for city, (lat, lon) in CITIES.items():
    print(f"\n=== {city} ===")
    df = get_history(lat, lon)
    split_time = df.index[int(len(df) * 0.85)]       # last 15% = hidden test
    models, per_h = {}, {}

    for h in range(1, 25):
        X = make_features(df, h)
        y = df["us_aqi"].shift(-h).rename("y")
        data = pd.concat([X, y], axis=1).dropna()
        train = data[data.index < split_time]
        test = data[data.index >= split_time]

        m = lgb.LGBMRegressor(n_estimators=300, learning_rate=0.05, num_leaves=31, verbose=-1)
        m.fit(train.drop(columns="y"), train["y"])

        pred = m.predict(test.drop(columns="y"))
        mae = mean_absolute_error(test["y"], pred)
        base = mean_absolute_error(test["y"], test["aqi_lag0"])   # "same as now" guess
        r2 = r2_score(test["y"], pred)
        per_h[h] = {"mae": round(mae, 2), "baseline_mae": round(base, 2), "r2": round(r2, 3)}
        models[h] = m
        print(f"  +{h:2d}h  model error {mae:6.1f} | 'same as now' error {base:6.1f} | R2 {r2:.2f}")

    joblib.dump(models, f"models/{city}.pkl")
    avg = lambda k: round(sum(v[k] for v in per_h.values()) / 24, 2)
    metrics[city] = {
        "avg_mae": avg("mae"),
        "avg_baseline_mae": avg("baseline_mae"),
        "avg_r2": avg("r2"),
        "improvement_pct": round((avg("baseline_mae") - avg("mae")) / avg("baseline_mae") * 100, 1),
        "by_hour": per_h,
    }
    time.sleep(1)

with open("models/metrics.json", "w") as f:
    json.dump(metrics, f, indent=2)
print("\nDone. Models saved in backend/models/")