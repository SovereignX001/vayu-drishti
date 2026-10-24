import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import TopNav from './components/TopNav';
import BreatheEasyHero from './components/BreatheEasyHero';
import InteractiveMap from './components/InteractiveMap';
import AIAssistantView from './components/AIAssistantView';
import PlannerView from './components/PlannerView';
import CalendarView from './components/CalendarView';
import ForecastView from './components/ForecastView';
import SettingsView from './components/SettingsView';
import ZoneSelectorModal from './components/ZoneSelectorModal';
import Toast from './components/Toast';
import DownscalingModal from './components/DownscalingModal';
import AnalyticsView from './components/AnalyticsView';
import ErrorBoundary from './components/ErrorBoundary';
import { ZONES, POPULAR_SEARCH_LOCATIONS, DEFAULT_CITY } from './data/airData';

export default function App() {
  // Navigation active tab: 'home' | 'locations' | 'forecast' | 'planner' | 'analytics' | 'calendar' | 'ai' | 'settings'
  const [activeTab, setActiveTab] = useState('home');
  const [selectedZoneId, setSelectedZoneId] = useState('school-zone');
  const [timeframe, setTimeframe] = useState('now');
  const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(() => {
    try {
      const saved = localStorage.getItem('vayu_last_searched_location');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.lat === 'number' && typeof parsed.lng === 'number') {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse saved location from localStorage:', e);
    }
    return POPULAR_SEARCH_LOCATIONS[0];
  });

  const handleSelectLocation = (loc) => {
    if (!loc) return;
    setCurrentLocation(loc);
    try {
      localStorage.setItem('vayu_last_searched_location', JSON.stringify(loc));
    } catch (e) {
      console.error('Failed to save last searched location:', e);
    }
  };
  const [selectedCity, setSelectedCity] = useState(DEFAULT_CITY);

  // Alert State & Toast
  const [alertState, setAlertState] = useState({
    dispatched: false,
    zoneId: null,
    alertId: null,
  });
  const [toast, setToast] = useState(null);

  const selectedZone = ZONES.find((z) => z.id === selectedZoneId) || ZONES[1];

  // Synthesize Web Audio chime for action dispatch
  const playDispatchChime = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
      osc.frequency.exponentialRampToValueAtTime(1174.66, now + 0.3);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.3, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.7);
    } catch (e) {
      console.log('Audio chime error:', e);
    }
  };

  const handleTriggerAlert = (zone, isReset = false) => {
    if (isReset) {
      setAlertState({ dispatched: false, zoneId: null, alertId: null });
      setToast(null);
      return;
    }

    playDispatchChime();
    setAlertState({
      dispatched: true,
      zoneId: zone.id,
      alertId: `DEMO-${Math.floor(1000 + Math.random() * 9000)}`,
    });


  };

  // Air Alert Toggle State with localStorage persistence
  const [isAlertsEnabled, setIsAlertsEnabled] = useState(() => {
    try {
      const saved = localStorage.getItem('vayu_air_alerts_enabled');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const toggleAlerts = () => {
    setIsAlertsEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('vayu_air_alerts_enabled', JSON.stringify(next));
      } catch {
        // Ignore localStorage write error
      }
      return next;
    });
  };



  return (
    <div className="min-h-screen w-full bg-[#FAF8F5] flex flex-row relative font-sans antialiased text-ink-900 overflow-x-hidden">
      
      {/* 1. White Slim Retractable Sidebar with Orange Indicator */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={(tab) => setActiveTab(tab)} 
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        isMobileOpen={isMobileNavOpen}
        onCloseMobile={() => setIsMobileNavOpen(false)}
      />

      {/* 2. Main Content Canvas - Full Screen Cover */}
      <div className="flex-1 min-w-0 flex flex-col bg-[#F8FAF9] overflow-hidden min-h-screen">
        
        {/* Top Navigation Bar with Greeting, Pill Search & Soft Round Icon Buttons */}
        <TopNav
          currentZone={selectedZone}
          timeframe={timeframe}
          onOpenMobileNav={() => setIsMobileNavOpen(true)}
          isAlertsEnabled={isAlertsEnabled}
          onToggleAlerts={toggleAlerts}
          currentLocation={currentLocation}
          onSelectLocation={handleSelectLocation}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

          {/* Dynamic Viewport according to activeTab */}
          <main className="flex-1 p-3.5 sm:p-5 md:p-6 lg:p-8 space-y-6 overflow-y-auto min-w-0 max-w-full">
            <ErrorBoundary key={activeTab}>
            {/* TAB 1: HOME (Universal Public Advice: Picnics, Masks, Travel Delays) */}
          {activeTab === 'home' && (
            <BreatheEasyHero
              zone={selectedZone}
              timeframe={timeframe}
              onTriggerAlert={handleTriggerAlert}
              alertState={alertState}
              onOpenMap={() => setActiveTab('locations')}
              onOpenAi={() => setActiveTab('ai')}
              selectedZoneId={selectedZoneId}
              onSelectZone={(id) => setSelectedZoneId(id)}
              currentLocation={currentLocation}
              onSelectLocation={handleSelectLocation}
            />
          )}

          {/* TAB 1.5: NATIONAL ANALYTICS & ML (Kaggle Dataset & Random Forest Model) */}
          {activeTab === 'analytics' && (
            <AnalyticsView currentLocation={currentLocation} />
          )}

          {/* TAB 2: WORKING MULTI-CITY MAP (LOCATIONS WITH REAL-TIME LANDMARK SWITCHER) */}
          {activeTab === 'locations' && (
            <div className="space-y-4 animate-in fade-in duration-150 max-w-[1720px] mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-ink-900 font-sans">
                    Interactive Pollution Density Map
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Live OpenStreetMap Standard engine with multi-shade AQI density heatmap and city landmark switcher
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('home')}
                  className="px-5 py-2.5 rounded-full bg-white border border-slate-200 text-ink-900 text-xs font-bold hover:bg-slate-50 shadow-soft transition-all cursor-pointer active:scale-95"
                >
                  ← Back to Home
                </button>
              </div>

              <InteractiveMap
                zones={ZONES}
                selectedCity={selectedCity}
                onSelectCity={setSelectedCity}
                selectedZoneId={selectedZoneId}
                onSelectZone={(id) => setSelectedZoneId(id)}
                timeframe={timeframe}
                currentLocation={currentLocation}
                onSelectLocation={handleSelectLocation}
              />
            </div>
          )}

          {/* TAB 3: AIR PLANNER (10-HOUR OUTING PROJECTIONS) */}
          {activeTab === 'planner' && (
            <PlannerView 
              onTriggerAlert={handleTriggerAlert}
              toast={toast}
              setToast={setToast}
            />
          )}

          {/* TAB 4: DRISHTI AI ASSISTANT (PERSONALIZED OUTING & TRAVEL TIPS) */}
          {activeTab === 'ai' && (
            <AIAssistantView 
              onTriggerAlert={handleTriggerAlert}
              currentLocation={currentLocation}
              selectedCity={selectedCity}
            />
          )}

          {/* TAB 5: FORECAST */}
          {activeTab === 'forecast' && (
            <ForecastView 
              timeframe={timeframe} 
              setTimeframe={setTimeframe} 
              currentZone={selectedZone}
              currentLocation={currentLocation}
              onSelectLocation={handleSelectLocation}
            />
          )}

          {/* TAB 6: CALENDAR (DAILY OUTING & TRANSIT SCHEDULES) */}
          {activeTab === 'calendar' && (
            <CalendarView 
              onTriggerAlert={handleTriggerAlert} 
              alertState={alertState} 
            />
          )}

          {/* TAB 7: SETTINGS */}
          {activeTab === 'settings' && (
            <SettingsView />
          )}
          </ErrorBoundary>
        </main>

        {/* Attribution Footer */}
        <footer className="px-5 sm:px-7 lg:px-9 py-3 border-t border-slate-200 text-center text-xs text-slate-500 font-sans">
          Live weather and air-quality data:{' '}
          <a
            href="https://open-meteo.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-700 hover:text-[#00B37E] underline font-medium"
          >
            Open-Meteo
          </a>{' '}
          (
          <a
            href="https://atmosphere.copernicus.eu"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-700 hover:text-[#00B37E] underline font-medium"
          >
            Copernicus CAMS
          </a>
          ). Forecasts: LightGBM models trained on historical Indian AQI data. Geocoding: OpenStreetMap.
        </footer>

      </div>

      {/* Micro-Zone Selector Modal */}
      <ZoneSelectorModal
        isOpen={isZoneModalOpen}
        onClose={() => setIsZoneModalOpen(false)}
        selectedZoneId={selectedZoneId}
        onSelectZone={(id) => setSelectedZoneId(id)}
      />



      {/* Architecture Explainer Modal */}
      <DownscalingModal
        isOpen={isModelModalOpen}
        onClose={() => setIsModelModalOpen(false)}
      />

    </div>
  );
}
