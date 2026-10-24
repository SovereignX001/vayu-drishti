import json
from pathlib import Path
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import joblib
from pydantic import BaseModel

from forecast import forecast_next_24h
from llm import chat

MODELS_DIR = Path(__file__).resolve().parent / "models"
DATA_DIR = Path(__file__).resolve().parent / "data"

app = FastAPI(
    title="Vayu Drishti API",
    description="Hyper-Local Predictive Air Quality Intelligence Platform",
    version="1.0.0",
)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

_rf_model = None
_label_encoder = None


def get_rf_classifier():
    global _rf_model, _label_encoder
    if _rf_model is None:
        model_path = MODELS_DIR / "rf_status_classifier.pkl"
        le_path = MODELS_DIR / "label_encoder.pkl"
        if model_path.exists() and le_path.exists():
            _rf_model = joblib.load(model_path)
            _label_encoder = joblib.load(le_path)
    return _rf_model, _label_encoder


class Q(BaseModel):
    question: str
    lat: float = 28.6139
    lon: float = 77.2090
    history: Optional[list] = None


class ClassifyRequest(BaseModel):
    aqi_value: float
    number_of_monitoring_stations: float = 1.0
    note: float = 0.0


@app.get("/")
def root():
    return {
        "name": "Vayu Drishti API",
        "status": "online",
        "docs_url": "/docs",
        "redoc_url": "/redoc",
        "endpoints": {
            "health": "/health",
            "forecast": "/forecast?lat=28.6139&lon=77.2090",
            "chat": "/chat",
            "classify": "/classify",
            "analytics_national": "/analytics/national",
            "metrics": "/metrics",
        },
    }


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/chat")
def ask(q: Q):
    return {"answer": chat(q.question, q.lat, q.lon, history=q.history)}


@app.get("/forecast")
def forecast(lat: float = 28.6139, lon: float = 77.2090):
    try:
        return forecast_next_24h(lat, lon)
    except Exception as e:
        raise HTTPException(status_code=503, detail=str(e))


@app.post("/classify")
def classify_status(req: ClassifyRequest):
    model, le = get_rf_classifier()
    if not model or not le:
        raise HTTPException(status_code=503, detail="Classification model not ready. Run train_kaggle.py first.")
    features = [[req.aqi_value, req.number_of_monitoring_stations, req.note]]
    pred_idx = model.predict(features)[0]
    probs = model.predict_proba(features)[0]
    classes = list(le.classes_)
    status = le.inverse_transform([pred_idx])[0]
    confidence = float(probs[pred_idx])
    return {
        "status": status,
        "confidence": round(confidence * 100, 1),
        "probabilities": {cls: round(float(p) * 100, 1) for cls, p in zip(classes, probs)},
    }


@app.get("/analytics/national")
def national_analytics():
    stats_path = DATA_DIR / "national_aqi_stats.json"
    if not stats_path.exists():
        raise HTTPException(status_code=404, detail="National statistics not found")
    with open(stats_path, "r", encoding="utf-8") as f:
        return json.load(f)


@app.get("/metrics")
def metrics():
    metrics_path = MODELS_DIR / "metrics.json"
    if not metrics_path.exists():
        raise HTTPException(status_code=404, detail="Metrics file not found")
    with open(metrics_path, "r", encoding="utf-8") as f:
        return json.load(f)