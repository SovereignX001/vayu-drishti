import React from 'react';
import { 
  Bell, 
  Calendar, 
  Bot, 
  Menu, 
  Thermometer
} from 'lucide-react';
import LocationSearchBar from './LocationSearchBar';
import IconButton from './ui/IconButton';

export default function TopNav({ 
  currentZone, 
  timeframe = 'now',
  onOpenMobileNav,
  isAlertsEnabled = true,
  onToggleAlerts,
  currentLocation,
  onSelectLocation,
  onResetGps,
  activeTab,
  setActiveTab
}) {
  const currentTemp = currentLocation?.temp != null
    ? `${currentLocation.temp}°C`
    : (currentZone?.dataByTime?.[timeframe]?.temp || currentZone?.dataByTime?.now?.temp || '24°C');

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning,' : hour < 17 ? 'Good afternoon,' : 'Good evening,';
  const locDisplayName = currentLocation?.city 
    ? `${currentLocation.city}${currentLocation.state ? `, ${currentLocation.state}` : ''}`
    : (currentLocation?.name || 'Meerut, Uttar Pradesh');

  return (
    <header className="flex items-center justify-between gap-3 py-4 px-4 sm:px-8 bg-white border-b border-slate-100 select-none sticky top-0 z-30">
      
      {/* Left: Mobile Hamburger + Time-of-day Greeting & Location */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileNav}
          aria-label="Open navigation menu"
          className="md:hidden p-2 rounded-2xl text-ink-600 hover:text-ink-900 hover:bg-slate-100 transition-colors cursor-pointer flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <Menu className="w-5 h-5" />
        </button>

        <img src="/logo.png" alt="Vayu Drishti" className="w-8 h-8 object-contain md:hidden flex-shrink-0" />

        {/* User Greeting with Active Location */}
        <div className="min-w-0">
          <span className="text-xs font-black text-slate-500 uppercase tracking-wider block font-sans">
            {greeting}
          </span>
          <div className="flex items-center gap-2 truncate mt-0.5">
            <span className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse flex-shrink-0" />
            <span className="text-base sm:text-lg font-black text-[#0F1E36] truncate">
              {locDisplayName}
            </span>
          </div>
        </div>
      </div>

      {/* Center: Wide Pill-Shaped Location Search Bar */}
      <div className="flex-1 max-w-sm lg:max-w-md mx-2 sm:mx-4 hidden sm:block">
        <LocationSearchBar
          currentLocation={currentLocation}
          onSelectLocation={onSelectLocation}
          onResetGps={onResetGps}
          variant="pill"
          placeholder="Search any location..."
        />
      </div>

      {/* Right Controls: Round Soft Icon Buttons + Temp Chip */}
      <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">
        
        {/* Calendar Shortcut */}
        {setActiveTab && (
          <IconButton
            onClick={() => setActiveTab('calendar')}
            active={activeTab === 'calendar'}
            title="Activity Calendar"
            ariaLabel="Activity Calendar"
            variant="soft"
            className="hidden sm:flex"
          >
            <Calendar className="w-4 h-4" />
          </IconButton>
        )}

        {/* Ask Drishti AI Shortcut */}
        {setActiveTab && (
          <IconButton
            onClick={() => setActiveTab('ai')}
            active={activeTab === 'ai'}
            title="Ask Drishti AI Assistant"
            ariaLabel="Ask Drishti AI Assistant"
            variant="soft"
            className="hidden sm:flex"
          >
            <Bot className="w-4 h-4" />
          </IconButton>
        )}

        {/* Air Alert Toggle Button (Preserves real behavior & aria-pressed) */}
        <button
          type="button"
          onClick={onToggleAlerts}
          aria-pressed={isAlertsEnabled}
          aria-label="Toggle local air quality alerts"
          title={isAlertsEnabled ? 'Local air alerts active (click to mute)' : 'Local air alerts muted (click to enable)'}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
            isAlertsEnabled 
              ? 'bg-accent text-white shadow-sm shadow-accent/25 hover:bg-accent-hover' 
              : 'bg-slate-100 text-ink-400 hover:text-ink-700 hover:bg-slate-200'
          }`}
        >
          <Bell className="w-4 h-4 stroke-[2.2]" />
        </button>

        {/* Temperature Chip */}
        <div className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-sm font-black text-[#0F1E36]">
          <Thermometer className="w-4 h-4 text-accent" />
          <span>{currentTemp}</span>
        </div>

      </div>

    </header>
  );
}
