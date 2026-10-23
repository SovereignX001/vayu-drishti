import React, { useState } from 'react';
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
import { ZONES, POPULAR_SEARCH_LOCATIONS, DEFAULT_CITY } from './data/airData';

export default function App() {
  // Navigation active tab: 'home' | 'locations' | 'forecast' | 'planner' | 'analytics' | 'calendar' | 'ai' | 'settings'
  const [activeTab, setActiveTab] = useState('home');
  const [selectedZoneId, setSelectedZoneId] = useState('school-zone');
  const [timeframe, setTimeframe] = useState('now');
  const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(POPULAR_SEARCH_LOCATIONS[0]);
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
      alertId: `VAYU-${Math.floor(1000 + Math.random() * 9000)}`,
    });

    setToast({
      title: 'Vayu Drishti Alert Dispatched',
      message: 'Clean air travel advisory & mask warning broadcast to 1,240 contacts',
    });
  };

  return (
    <div className="min-h-screen w-full bg-[#F4F6F8] text-slate-800 flex flex-row font-sans antialiased select-none overflow-x-hidden">
      
      {/* 1. White Retractable Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={(tab) => setActiveTab(tab)} 
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
      />

      {/* 2. Main Canvas (Pinned sidebar with smooth retractable margin transition) */}
      <div className={`flex-1 min-w-0 flex flex-col bg-[#F4F6F8] min-h-screen transition-all duration-300 ease-in-out ${
        isSidebarCollapsed ? 'ml-20' : 'ml-60 lg:ml-64'
      }`}>
        
        {/* Top Navigation Bar with General Outing Status, Air Alert On & Temp */}
        <TopNav
          currentZone={selectedZone}
          timeframe={timeframe}
        />

        {/* Dynamic Viewport according to activeTab */}
        <main className="flex-1 p-5 sm:p-7 lg:p-9 space-y-6 overflow-y-auto">
          
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
              onSelectLocation={setCurrentLocation}
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
                  <h3 className="text-xl font-black text-slate-900">
                    Interactive Pollution Density Map
                  </h3>
                  <p className="text-xs text-slate-500">
                    Live Google Maps / Mappls engine with multi-shade AQI density heatmap and city landmark switcher
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('home')}
                  className="px-4 py-2 rounded-2xl bg-white border border-slate-200 text-slate-800 text-xs font-bold hover:bg-slate-50 shadow-xs transition-colors cursor-pointer"
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
              onSelectLocation={setCurrentLocation}
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

        </main>

      </div>

      {/* Micro-Zone Selector Modal */}
      <ZoneSelectorModal
        isOpen={isZoneModalOpen}
        onClose={() => setIsZoneModalOpen(false)}
        selectedZoneId={selectedZoneId}
        onSelectZone={(id) => setSelectedZoneId(id)}
      />

      {/* Toast */}
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Downscaling Modal */}
      <DownscalingModal
        isOpen={isModelModalOpen}
        onClose={() => setIsModelModalOpen(false)}
      />

    </div>
  );
}
