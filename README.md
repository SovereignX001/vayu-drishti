# Vayu Drishti — Location-Specific Predictive Air Quality Intelligence

**Vayu Drishti** (वायु दृष्टि) is a sleek, modern, public-centric air quality intelligence platform providing location-specific air quality telemetry and machine learning forecasts across India. By combining live weather and atmospheric model data (Open-Meteo / Copernicus CAMS) with LightGBM forecasting models, Vayu Drishti empowers citizens with practical, preemptive outdoor guidance.

---

## 🌟 Key Features

### 1. **Live Geocoded Location Search (Home & Forecast Tabs)**
- **Autocomplete & Geocoding**: Search any Indian city, neighborhood, or landmark using OpenStreetMap Nominatim with fast debounced geocoding.
- **Direct Google Maps Link**: One-click **"Google Maps"** button opens coordinates directly in Google Maps.
- **GPS Telemetry Lock**: Instant browser geolocation with real-time Open-Meteo live AQI and weather synchronization.

### 2. **Multi-City Interactive Map (Location Tab)**
- **Interactive Leaflet Map Engine**: Pan and zoom with CartoDB Positron (Light), OpenStreetMap standard, and Esri World Imagery Satellite tile layers.
- **Offline Resilient Tiles**: If tile servers are unreachable, overlays and station markers remain fully responsive with an unobtrusive notice.
- **City Quick Switcher**: Switch between **Meerut**, **Delhi NCR**, **Noida**, **Gurugram**, **Ghaziabad**, **Lucknow**, **Agra**, and **Jaipur**.
- **Dynamic Landmark Switching**: Numbered landmark pins and metadata tables update dynamically for the selected city.
- **Visual Air Quality Heatmap**: Color-coded overlay displaying pollution variations across urban centers and green zones.

### 3. **Actionable Citizen Directives**
- **Picnics & Outdoor Activities**: Category-specific advice on whether conditions are safe for family outings, morning jogs, or outdoor dining.
- **Commute & Road Transit**: Guidance on mask usage (e.g. N95 respirators) and vehicle cabin recirculation during high particulate hours.
- **Home Windows & Ventilation**: Practical tips on when to open windows for natural air exchange vs keeping purifiers active indoors.

### 4. **Machine Learning 24-Hour Forward Trajectory**
- **Hourly Predictions**: Multi-horizon predictive trajectory powered by LightGBM models trained on historical hourly data.
- **Peak Danger & Clean Air Windows**: Automatically identifies the cleanest outdoor window and highest pollution periods of the day.

### 5. **Drishti AI Assistant**
- Context-aware assistant providing conversational advice for neighborhood air quality, outdoor plans, and travel precautions.
- Powered by Google Gemini with an 8-second execution budget and automatic fallback to an intelligent deterministic local synthesis engine.

### 6. **National ML Analytics (Kaggle Dataset)**
- Random Forest classifier trained on 235,785 historical national records from the Kaggle India Air Quality Index Dataset (2023–2025).
- Interactive status predictions and national pollutant breakdowns.

---

## 📊 Model Validation & Performance Metrics

Forecasting models are evaluated on a strict **held-out 15% temporal test split** using continuous out-of-sample data. Metrics are computed across all 24 forward hourly horizons:

| City | Mean MAE (AQI) | Baseline MAE (AQI) | Mean R² | MAE Improvement vs Persistence* |
|---|---|---|---|---|
| **Meerut** | 28.51 | 37.48 | 0.76 | +23.9% |
| **Delhi** | 37.97 | 50.33 | 0.80 | +24.6% |
| **Noida** | 92.28 | 123.33 | 0.86 | +25.2% |
| **Gurugram** | 91.96 | 123.33 | 0.86 | +25.4% |
| **Ghaziabad** | 28.37 | 37.48 | 0.76 | +24.3% |
| **Lucknow** | 11.05 | 15.64 | 0.79 | +29.3% |
| **Agra** | 55.80 | 75.09 | 0.86 | +25.7% |
| **Jaipur** | 15.50 | 15.54 | 0.61 | +0.3% |

*\*Improvement is measured against the naive persistence baseline (assuming AQI at hour $t+h$ equals the current hour $t$).*

---

## ⚠️ Limitations & Disclaimers

- **Atmospheric Model Estimates**: Live air quality data is sourced from Open-Meteo (Copernicus Atmosphere Monitoring Service - CAMS model output and reanalysis) rather than a direct physical ground sensor at every street corner.
- **City-Specific Forecast Coverage**: The 24-hour LightGBM forecasting models are trained specifically for the 8 supported cities (Meerut, Delhi, Noida, Gurugram, Ghaziabad, Lucknow, Agra, Jaipur). Locations outside these regions use nearest-city model approximations.
- **Offline Saved-Data Fallback**: When the backend or network is temporarily unreachable during a live presentation, previously fetched telemetry, forecasts, and national statistics are loaded from `localStorage` cache (retained for up to 6 hours) with an amber **"Offline: showing data saved X min ago"** badge.
- **Demo Preview Labels**: The **Settings** ("Demo preview"), **Calendar** ("Sample schedule"), and **Air Planner** ("Sample schedule") tabs are prototype demonstration views illustrating citizen workflows with local state persistence and simulated alerts.

---

## 🛠️ Architecture & Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS, Leaflet, Lucide React
- **Backend**: FastAPI, Uvicorn, Python 3.10+
- **Machine Learning**: LightGBM (24 recursive regression horizons), Scikit-learn (RandomForest status classifier)
- **Data Providers**: Open-Meteo Air Quality & Weather APIs (Copernicus CAMS), OpenStreetMap Nominatim (Geocoding), Kaggle India AQI Dataset (2023–2025, 235k+ rows)
- **AI Model**: Google Gemini with strict 8s timeout and intelligent local rule-based fallback

---

## 🚀 Quick Start (One Command)

From the project root:

```bash
# 1. Install frontend dependencies
npm install

# 2. Install backend Python dependencies
pip install -r backend/requirements.txt

# 3. Start both backend and frontend together
npm run dev:all
```

`npm run dev:all` automatically detects your Python environment (`backend/venv`, `backend/.venv`, or system Python), boots FastAPI on port `8000`, starts Vite on port `5173`, prefixes logs with `[api]` and `[web]`, and handles clean shutdown on Ctrl+C.

Open `http://localhost:5173/` in your browser.

---

### Alternative: Manual Two-Terminal Start

**Terminal 1 (Backend):**
```bash
cd backend
# Optional: create & activate venv
# python -m venv venv
# Windows: venv\Scripts\activate | macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

**Terminal 2 (Frontend):**
```bash
npm install
npm run dev
```

---

## 📄 License
MIT License. Built for hackathon prototyping and public environmental intelligence.
