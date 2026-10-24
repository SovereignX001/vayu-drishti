# Vayu Drishti — Technical Audit Report

**Audit Date**: October 24, 2026 | **Auditor**: Senior Software Engineer (Read-Only Audit)  
**Repository State**: Git `main` (commit `f9bf1a2`) | **Status**: Active Dev / Feature Freeze Pre-Check

---

## 1. Project Snapshot

* **Frontend Stack**: React 19.3.1, Vite 8.3.5, Tailwind CSS 3.4.19, Leaflet 1.9.4, Lucide React 1.61.0.
* **Backend Location**: [`backend/`](file:///c:/Users/Deval/Desktop/HackX/Vayu Drishti/backend) (Python 3.14, FastAPI 0.161.1, Uvicorn 0.54.0, LightGBM 4.7.0, Scikit-Learn 1.9.1, Pandas 3.1.0).
* **Frontend-to-Backend Connectivity**: Proxied via Vite dev server [`vite.config.js:8-14`](file:///c:/Users/Deval/Desktop/HackX/Vayu Drishti/vite.config.js#L8-L14) (`/api/*` -> `http://localhost:8000/*`). Production client reads `VITE_API_URL` with fallback to `/api` ([`src/lib/api.js:1`](file:///c:/Users/Deval/Desktop/HackX/Vayu Drishti/src/lib/api.js#L1)).
* **Unused Dependencies in `package.json`**: `react-leaflet`, `clsx`, `tailwind-merge` are declared in `package.json:13,18,19` but never imported anywhere in `src/`.
* **Dead Component Files**: 8 files in `src/components/` are never imported by any active view: `Header.jsx`, `HeroCard.jsx`, `Highlights.jsx`, `MicroTrendChart.jsx`, `PreemptiveActionCard.jsx`, `RiskBarChart.jsx`, `TelemetryPanel.jsx`, `ZoneCards.jsx`.
* **Git Hygiene & Security Warning**: Commit `f9bf1a2` tracked `backend/.env` containing a real `GEMINI_API_KEY`. Although `.gitignore:28` now lists it, the secret remains in the Git object history.
* **Build Status**: `npm run build` succeeds (1.80s). Output: `index.html` (1.15 kB), CSS (61.81 kB), JS (532.19 kB). Triggers Rolldown warning: *Chunk larger than 500 kB*.
* **Lint Status**: `npm run lint` (`oxlint`) passes with **0 errors, 72 warnings** (primarily unused imports, unused parameters, and direct `setState` inside `useEffect` in [`BreatheEasyHero.jsx:62`](file:///c:/Users/Deval/Desktop/HackX/Vayu Drishti/src/components/BreatheEasyHero.jsx#L62)).

---

## 2. Feature Status Table

| Feature | Tab / Component | Status | Data Source | Evidence / File Responsible |
| :--- | :--- | :--- | :--- | :--- |
| **Location Search** | Home / Forecast | **Partial** | Mock Math + Real Geocode | [`LocationSearchBar.jsx:69-86`](file:///c:/Users/Deval/Desktop/HackX/Vayu Drishti/src/components/LocationSearchBar.jsx#L69-L86) generates pseudo-random AQI using `Math.sin(lat * 10)`. |
| **Browser GPS Lock** | Home / Forecast | **Working** | Real GPS + Fallback | [`ForecastView.jsx:75-104`](file:///c:/Users/Deval/Desktop/HackX/Vayu Drishti/src/components/ForecastView.jsx#L75-L104) reads `navigator.geolocation`, falls back to Meerut. |
| **Multi-City Map** | Locations | **Working** | Scraped Google Tiles + Hardcoded Spots | [`InteractiveMap.jsx:45`](file:///c:/Users/Deval/Desktop/HackX/Vayu Drishti/src/components/InteractiveMap.jsx#L45) scrapes `mt1.google.com`. 8 cities hardcoded in [`airData.js:3-800`](file:///c:/Users/Deval/Desktop/HackX/Vayu Drishti/src/data/airData.js#L3-L800). |
| **Pollution Heatmap** | Locations | **Partial** | Hardcoded Leaflet Circles | [`InteractiveMap.jsx:136`](file:///c:/Users/Deval/Desktop/HackX/Vayu Drishti/src/components/InteractiveMap.jsx#L136) draws static SVG circles from [`airData.js:12-21`](file:///c:/Users/Deval/Desktop/HackX/Vayu Drishti/src/data/airData.js#L12-L21); not a dynamic raster. |
| **24h Trajectory** | Forecast | **Fake** | Hardcoded Math Multipliers | [`ForecastView.jsx:111-130`](file:///c:/Users/Deval/Desktop/HackX/Vayu Drishti/src/components/ForecastView.jsx#L111-L130) multiplies base AQI by `1.55` and `0.42`. Ignores backend `/forecast`. |
| **Citizen Advice Cards** | Home | **Hardcoded** | Static Arrays | [`BreatheEasyHero.jsx:495-580`](file:///c:/Users/Deval/Desktop/HackX/Vayu Drishti/src/components/BreatheEasyHero.jsx#L495-L580) hardcoded Meerut text; ignores active city. |
| **Accuracy Panels** | Forecast | **Fake** | Hardcoded JSX Strings | [`ForecastView.jsx:317,336,355`](file:///c:/Users/Deval/Desktop/HackX/Vayu Drishti/src/components/ForecastView.jsx#L317) hardcodes `97.4%`, `0.962`, `96.8%`. |
| **National EDA / ML** | Analytics | **Working** | Real Trained Model + API | [`AnalyticsView.jsx:32,49`](file:///c:/Users/Deval/Desktop/HackX/Vayu Drishti/src/components/AnalyticsView.jsx#L32) hits `/analytics/national` and `/classify` (RandomForest on 235k Kaggle rows). |
| **Drishti AI Assistant** | Ask Drishti AI | **Working** | Real Web Telemetry + Gemini / Groq | [`AIAssistantView.jsx:64`](file:///c:/Users/Deval/Desktop/HackX/Vayu Drishti/src/components/AIAssistantView.jsx#L64) calls `/chat`. Live weather/AQI retrieval via Open-Meteo. |
| **Air Planner** | Air Planner | **Broken** | Runtime Crash | [`PlannerView.jsx:48,52,56`](file:///c:/Users/Deval/Desktop/HackX/Vayu Drishti/src/components/PlannerView.jsx#L48) crashes on `isLodhi is not defined` (`ReferenceError`). |
| **Calendar Transit** | Calendar | **Hardcoded** | Static Array | [`CalendarView.jsx:5-42`](file:///c:/Users/Deval/Desktop/HackX/Vayu Drishti/src/components/CalendarView.jsx#L5-L42) fixed 4-slot Meerut schedule. |
| **Settings & Alerts** | Settings | **Fake** | Local Ephemeral State | [`SettingsView.jsx:5-8`](file:///c:/Users/Deval/Desktop/HackX/Vayu Drishti/src/components/SettingsView.jsx#L5-L8) local React state; no backend, resets on page switch. |
| **Sidebar Collapse** | Global Layout | **Working** | State Toggle | [`Sidebar.jsx:35-80`](file:///c:/Users/Deval/Desktop/HackX/Vayu Drishti/src/components/Sidebar.jsx#L35-L80) expands/collapses width, but breaks on mobile screens. |

---

## 3. Fake Data and False Claims List

1. **"PINN-AeroFlow GAN v4.2" & "Neural Downscaling"**:
   * **Claim**: UI copy in [`DownscalingModal.jsx:28,75,127`](file:///c:/Users/Deval/Desktop/HackX/Vayu Drishti/src/components/DownscalingModal.jsx#L28) and [`README.md:3`](file:///c:/Users/Deval/Desktop/HackX/Vayu Drishti/README.md#L3) claims physics-informed neural network downscaling using satellite TROPOMI + ECMWF boundary physics.
   * **Reality**: Zero GAN, zero PINN, and zero satellite code exists in repo. Backend contains only LightGBM tabular lag models and a scikit-learn Random Forest classifier.
   * **Action**: **Relabel** to "Multi-source Meteorological Fusion & Tabular ML" in UI within 5 minutes.
2. **Model Accuracy Figures (97.4%, R² = 0.962, 96.8%)**:
   * **Claim**: [`ForecastView.jsx:317,336,355`](file:///c:/Users/Deval/Desktop/HackX/Vayu Drishti/src/components/ForecastView.jsx#L317) and [`README.md:26-27`](file:///c:/Users/Deval/Desktop/HackX/Vayu Drishti/README.md#L26-L27).
   * **Reality**: Hardcoded `<span className="text-5xl">97.4%</span>`. Real LightGBM evaluation from [`backend/models/metrics.json`](file:///c:/Users/Deval/Desktop/HackX/Vayu Drishti/backend/models/metrics.json) shows Meerut `avg_r2: 0.76` and `improvement_pct: 23.9%`.
   * **Action**: **Replace** static spans with dynamic readings from `GET /metrics` or relabel as "Cross-Validation Accuracy".
3. **Simulated Geocoding AQI (`LocationSearchBar.jsx`)**:
   * **Claim**: "Simulate downscaled AQI calculation from coordinates" ([`LocationSearchBar.jsx:69`](file:///c:/Users/Deval/Desktop/HackX/Vayu Drishti/src/components/LocationSearchBar.jsx#L69)).
   * **Reality**: Uses `Math.round(90 + Math.abs(Math.sin(lat * 10) * 160))` and hardcoded `windSpeed: '7 km/h'`, `trafficDensity: '74%'`.
   * **Action**: **Replace** with `getLiveAqiByCoords` or mark as demo estimate.
4. **"Broadcast to 1,240 Contacts" & Audio Chime**:
   * **Claim**: [`App.jsx:82`](file:///c:/Users/Deval/Desktop/HackX/Vayu Drishti/src/App.jsx#L82) toast claims SMS broadcast was dispatched to 1,240 contacts.
   * **Reality**: Plays local Web Audio API synthesized sine tone ([`App.jsx:39-64`](file:///c:/Users/Deval/Desktop/HackX/Vayu Drishti/src/App.jsx#L39-L64)). No SMS gateway exists.
   * **Action**: **Relabel** toast message to "Local Simulation Alert Triggered".

---

## 4. AI Assistant Diagnosis

* **Request-Response Trace**:
  1. Frontend user submits prompt in [`AIAssistantView.jsx:49-64`](file:///c:/Users/Deval/Desktop/HackX/Vayu Drishti/src/components/AIAssistantView.jsx#L49-L64).
  2. Sends `POST /api/chat` with body `{ question, lat, lon }` via [`src/lib/api.js:3-11`](file:///c:/Users/Deval/Desktop/HackX/Vayu Drishti/src/lib/api.js#L3-L11).
  3. FastAPI endpoint [`backend/main.py:71-73`](file:///c:/Users/Deval/Desktop/HackX/Vayu Drishti/backend/main.py#L71-L73) routes to `chat()` in [`backend/llm.py:440`](file:///c:/Users/Deval/Desktop/HackX/Vayu Drishti/backend/llm.py#L440).
  4. Attempts Gemini API call (`gemini-3.5-flash-lite`, `gemini-3.1-flash-lite`) with tool calling (`get_indian_city_overview`, `get_weather`, etc.).
  5. If Gemini is unavailable, falls back to the local synthesis engine ([`backend/llm.py:228-400`](file:///c:/Users/Deval/Desktop/HackX/Vayu Drishti/backend/llm.py#L228-L400)) which fetches real-time Open-Meteo weather and compares against trained 235k Kaggle historical benchmarks.
* **Live Context & State**:
  * AI receives current `lat` and `lon` from frontend, but **does not send conversation history** (stateless 1-turn chat).
  * Backend dynamically queries live APIs for coordinates or mentioned Indian cities.
* **Repetitive Answers Root Cause**:
  * Previously, `ask_gemini` tried defunct model `gemini-2.5-flash` (404), throwing errors and falling back to a static 3-sentence activity template. This was resolved by migrating to `gemini-3.5-flash-lite` and building an intent-aware local RAG engine.
* **Security & Failure Vulnerabilities**:
  * API key is stored server-side in `backend/.env`. However, the key was committed in Git history (`f9bf1a2`).
  * If the LLM tool-calling cycle exceeds 10 seconds (observed during stress testing), frontend `fetch` hangs without a client-side timeout.

### 5-Query Variety Verification (Actual Responses Shortened)
1. *What is the AQI in Mumbai?*  
   `"Mumbai's current AQI stands at 172, placing the air in the Moderate category. The dominant pollutant is PM2.5 hovering at 76.6 µg/m³ with light 1.9 km/h winds..."`
2. *Is it going to rain in Delhi today?*  
   `"No, rainfall isn't expected in Delhi today—skies are clear with 0.0 mm of precipitation recorded and temperature at 21.6°C..."`
3. *Should I wear an N95 mask?*  
   `"Yes, wearing an N95 or FFP2 respirator is strongly recommended right now. The current AQI stands at 181, which falls into the Moderate to Unhealthy category..."`
4. *Why is air pollution worse in winter?*  
   `"Air pollution spikes dramatically in Indian winters primarily due to shallow meteorological boundary layers (thermal inversions) trapping vehicular smoke..."`
5. *Compare Delhi and Bengaluru*  
   `"Delhi vs Bengaluru Live Comparison: Delhi is at AQI 181 (wind 3.3 km/h), while Bengaluru is at AQI 53 (wind 8.5 km/h). Bengaluru enjoys significantly cleaner ventilation..."`

---

## 5. Issues Table

| ID | Issue | Severity | Evidence (file:line) | Fix Effort | Demo Impact |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **ISS-01** | `isLodhi is not defined` crashes Air Planner tab on click | **Blocker** | [`src/components/PlannerView.jsx:48,52,56`](file:///c:/Users/Deval/Desktop/HackX/Vayu Drishti/src/components/PlannerView.jsx#L48) | 2 min | **High** |
| **ISS-02** | Committed Gemini API key in Git commit history | **High** | Git log commit `f9bf1a2398` on `backend/.env` | 5 min | **Low** |
| **ISS-03** | `ForecastView` ignores backend `/forecast` API, uses fake math | **High** | [`src/components/ForecastView.jsx:111-130`](file:///c:/Users/Deval/Desktop/HackX/Vayu Drishti/src/components/ForecastView.jsx#L111-L130) | 10 min | **High** |
| **ISS-04** | Sidebar has no mobile drawer; breaks layout on 375px screens | **High** | [`src/App.jsx:99`](file:///c:/Users/Deval/Desktop/HackX/Vayu Drishti/src/App.jsx#L99) & [`src/components/Sidebar.jsx:35`](file:///c:/Users/Deval/Desktop/HackX/Vayu Drishti/src/components/Sidebar.jsx#L35) | 8 min | **High** |
| **ISS-05** | No client-side timeout or AbortController on `askDrishti` fetch | **Medium** | [`src/lib/api.js:4`](file:///c:/Users/Deval/Desktop/HackX/Vayu Drishti/src/lib/api.js#L4) | 4 min | **High** |
| **ISS-06** | 8 dead/unused component files clobbering bundle and maintenance | **Medium** | `src/components/Header.jsx`, `HeroCard.jsx`, `TelemetryPanel.jsx`, etc. | 5 min | **Low** |
| **ISS-07** | Hardcoded claims: "PINN-AeroFlow GAN", "250m", "97.4%" | **Medium** | [`src/components/DownscalingModal.jsx:28`](file:///c:/Users/Deval/Desktop/HackX/Vayu Drishti/src/components/DownscalingModal.jsx#L28), [`ForecastView.jsx:317`](file:///c:/Users/Deval/Desktop/HackX/Vayu Drishti/src/components/ForecastView.jsx#L317) | 6 min | **Med** |
| **ISS-08** | Unused dependencies in `package.json` (`react-leaflet`, `clsx`, `tailwind-merge`) | **Low** | [`package.json:13,18,19`](file:///c:/Users/Deval/Desktop/HackX/Vayu Drishti/package.json#L13) | 2 min | **Low** |
| **ISS-09** | Large uncompressed asset `delhi-map.png` (690 kB) unused in bundle | **Low** | [`src/assets/delhi-map.png`](file:///c:/Users/Deval/Desktop/HackX/Vayu Drishti/src/assets/delhi-map.png) | 1 min | **Low** |
| **ISS-10** | Missing accessibility: Icon buttons lack `aria-label` / `title` | **Low** | [`src/components/Sidebar.jsx:70`](file:///c:/Users/Deval/Desktop/HackX/Vayu Drishti/src/components/Sidebar.jsx#L70), [`TopNav.jsx:39`](file:///c:/Users/Deval/Desktop/HackX/Vayu Drishti/src/components/TopNav.jsx#L39) | 5 min | **Med** |

---

## 6. Top 10 Quick Wins (< 10 Minutes Each, Ranked by Impact)

1. **Fix `isLodhi` ReferenceError in `PlannerView.jsx:48,52,56`** (2 min): Define `const isLodhi = locationName.includes('Lodhi');` to stop the entire Air Planner tab from crashing.
2. **Wire Real Forecast API to `ForecastView.jsx`** (8 min): Import `getForecast` from `../lib/api` in [`ForecastView.jsx`](file:///c:/Users/Deval/Desktop/HackX/Vayu Drishti/src/components/ForecastView.jsx) so the 24-hour slots render actual LightGBM hourly predictions instead of `baseAqi * 1.55`.
3. **Add 10-Second AbortSignal to `src/lib/api.js:4`** (3 min): Prevents the AI chat UI from hanging indefinitely if Gemini takes >10 seconds.
4. **Auto-Collapse Sidebar on Mobile Screen (`< 768px`)** (4 min): Set `isSidebarCollapsed` default to `true` when `window.innerWidth < 768` in [`src/App.jsx:24`](file:///c:/Users/Deval/Desktop/HackX/Vayu Drishti/src/App.jsx#L24) so mobile screens don't get squashed.
5. **Add Unified Startup Script to `package.json`** (3 min): Add `"dev:all": "concurrently \"uvicorn backend.main:app --port 8000\" \"vite\""` so judges don't have to manually start backend and frontend in separate terminals.
6. **Replace Hardcoded "PINN-AeroFlow GAN" with "ML Multi-Source Telemetry"** (3 min): Fix UI copy in [`DownscalingModal.jsx:28`](file:///c:/Users/Deval/Desktop/HackX/Vayu Drishti/src/components/DownscalingModal.jsx#L28) to protect team credibility during judging.
7. **Replace Hardcoded "97.4%" with Real Model R² Score** (4 min): Wire [`backend/models/metrics.json`](file:///c:/Users/Deval/Desktop/HackX/Vayu Drishti/backend/models/metrics.json) to display actual validation stats (76.0% R²).
8. **Delete 8 Orphan Component Files** (2 min): Delete unused files (`Header.jsx`, `HeroCard.jsx`, `TelemetryPanel.jsx`, etc.) to clean up project structure.
9. **Update `README.md` Setup Instructions** (4 min): Document Python environment setup (`pip install -r backend/requirements.txt`) and backend startup steps.
10. **Make `TopNav` "Air Alert" Pill Functional** (5 min): Add an `onClick` toggle so the pill actually toggles alert notifications rather than acting as a static div.

---

## 7. Top 5 Risks That Could Fail a Live Demo

1. **Clicking the "Air Planner" Sidebar Item**:
   * *Mechanism*: Uncaught `ReferenceError: isLodhi is not defined` triggers a React boundary unmount, resulting in a blank white screen during presentation.
2. **Presenting Without Starting the FastAPI Backend**:
   * *Mechanism*: The README only instructs running `npm run dev`. Without `uvicorn main:app`, the Analytics tab and Ask Drishti AI throw connection errors.
3. **Presenter Machine Losing Internet Connection**:
   * *Mechanism*: Google Map tile layers (`mt1.google.com`) fail to render, Open-Meteo live API times out, and Gemini API calls fail.
4. **Judge Asking to Inspect the 250m Neural Downscaling Code**:
   * *Mechanism*: Explaining "PINN-AeroFlow GAN v4.2" when the backend only contains tabular LightGBM and RandomForest will fail code scrutiny.
5. **Google Rate-Limiting or High Demand on Gemini API**:
   * *Mechanism*: Spike errors (HTTP 503 / 429) can cause AI response latency to exceed 12 seconds, creating awkward dead air during the live demo.

---

## 8. Things You Could Not Verify

1. **Headless Visual Regression Screenshots**: Could not visually snapshot rendered tabs at 375px mobile and 1440px desktop viewports due to lack of a headless browser runtime in the environment (`UNVERIFIED`).
2. **Long-Term Google Tile Scraping Reliability**: Could not verify whether `https://mt1.google.com/vt/lyrs=m...` will trigger HTTP 429/403 IP blocks during prolonged demo usage (`UNVERIFIED`).
3. **Cross-Browser Audio Context Compatibility**: Could not verify whether synthesized Web Audio chimes ([`App.jsx:41`](file:///c:/Users/Deval/Desktop/HackX/Vayu Drishti/src/App.jsx#L41)) trigger Safari autoplay restrictions without explicit gesture pairing (`UNVERIFIED`).
