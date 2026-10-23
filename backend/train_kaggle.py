import json
import os
from pathlib import Path
import joblib
import kagglehub
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder

BASE_DIR = Path(__file__).resolve().parent
MODELS_DIR = BASE_DIR / "models"
DATA_DIR = BASE_DIR / "data"

MODELS_DIR.mkdir(parents=True, exist_ok=True)
DATA_DIR.mkdir(parents=True, exist_ok=True)


def load_dataset():
    """Download or locate cached Kaggle dataset."""
    print("Loading Kaggle India AQI dataset...")
    try:
        download_path = kagglehub.dataset_download("saikiranudayana/india-air-quality-index-aqi-dataset-20232025")
        csv_path = Path(download_path) / "aqi.csv"
        if csv_path.exists():
            return pd.read_csv(csv_path)
    except Exception as e:
        print("Kagglehub download fallback:", e)

    # Fallback to local cache path
    cache_path = Path(os.environ.get("USERPROFILE", "")) / ".cache" / "kagglehub" / "datasets" / "saikiranudayana" / "india-air-quality-index-aqi-dataset-20232025" / "versions" / "1" / "aqi.csv"
    if cache_path.exists():
        return pd.read_csv(cache_path)

    raise FileNotFoundError("Could not find aqi.csv dataset.")


def train_and_export():
    df = load_dataset()
    print(f"Dataset loaded: {len(df):,} rows.")

    # 1. Clean data according to Kaggle notebook pipeline
    df["date_parsed"] = pd.to_datetime(df["date"], format="%d-%m-%Y", errors="coerce")
    df["aqi_value"] = pd.to_numeric(df["aqi_value"], errors="coerce")
    df["number_of_monitoring_stations"] = pd.to_numeric(df["number_of_monitoring_stations"], errors="coerce")
    df["note"] = pd.to_numeric(df["note"], errors="coerce").fillna(0)

    clean_df = df.dropna(subset=["aqi_value", "air_quality_status"]).copy()
    print(f"Cleaned records for modeling: {len(clean_df):,}")

    # 2. Train Random Forest Classifier from notebook
    le = LabelEncoder()
    y = le.fit_transform(clean_df["air_quality_status"])
    X = clean_df[["aqi_value", "number_of_monitoring_stations", "note"]].fillna(0)

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    print("Training RandomForestClassifier...")
    clf = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
    clf.fit(X_train, y_train)

    preds = clf.predict(X_test)
    acc = accuracy_score(y_test, preds)
    print(f"Model test accuracy: {acc * 100:.2f}%")

    # Save model artifacts
    joblib.dump(clf, MODELS_DIR / "rf_status_classifier.pkl")
    joblib.dump(le, MODELS_DIR / "label_encoder.pkl")
    print(f"Saved classifier & label encoder to {MODELS_DIR}")

    # 3. Compute EDA Analytics & Historical Insights for Frontend & Drishti AI
    total_clean = len(clean_df)
    status_counts = clean_df["air_quality_status"].value_counts().to_dict()
    status_distribution = [
        {"category": k, "count": int(v), "percentage": round(float(v) / total_clean * 100, 1)}
        for k, v in status_counts.items()
    ]

    pollutant_counts = clean_df["prominent_pollutants"].dropna().value_counts().head(8).to_dict()
    pollutant_total = sum(pollutant_counts.values()) or 1
    pollutant_distribution = [
        {"pollutant": k, "count": int(v), "percentage": round(float(v) / pollutant_total * 100, 1)}
        for k, v in pollutant_counts.items()
    ]

    # Target key cities in Northern India / NCR
    tracked_cities = ["Meerut", "Delhi", "Noida", "Ghaziabad", "Gurugram", "Lucknow", "Agra", "Jaipur"]
    city_benchmarks = {}

    for city in tracked_cities:
        sub = clean_df[clean_df["area"].str.contains(city, case=False, na=False)]
        if not sub.empty:
            dom = sub["prominent_pollutants"].mode()
            dominant = dom[0] if not dom.empty else "PM2.5"
            city_benchmarks[city] = {
                "city": city,
                "records": int(len(sub)),
                "avg_aqi": round(float(sub["aqi_value"].mean()), 1),
                "min_aqi": int(sub["aqi_value"].min()),
                "max_aqi": int(sub["aqi_value"].max()),
                "dominant_pollutant": dominant,
                "status_breakdown": {k: int(v) for k, v in sub["air_quality_status"].value_counts().items()},
            }

    # Monthly trends (2023 - 2025)
    monthly = clean_df.dropna(subset=["date_parsed"]).copy()
    monthly["year_month"] = monthly["date_parsed"].dt.strftime("%Y-%m")
    trend = monthly.groupby("year_month")["aqi_value"].mean().round(1).tail(24).to_dict()
    monthly_trends = [{"month": k, "avg_aqi": float(v)} for k, v in sorted(trend.items())]

    output_data = {
        "dataset_name": "India Air Quality Index (AQI) Dataset 2023-2025",
        "total_records": total_clean,
        "model_accuracy": round(acc * 100, 2),
        "classes": list(le.classes_),
        "feature_importances": {col: round(float(imp), 4) for col, imp in zip(X.columns, clf.feature_importances_)},
        "status_distribution": status_distribution,
        "pollutant_distribution": pollutant_distribution,
        "city_benchmarks": city_benchmarks,
        "monthly_trends": monthly_trends,
    }

    json_path = DATA_DIR / "national_aqi_stats.json"
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(output_data, f, indent=2)

    print(f"Exported national analytics summary to {json_path}")
    return output_data


if __name__ == "__main__":
    train_and_export()
