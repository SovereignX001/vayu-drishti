import React from 'react';
import { 
  Home, 
  Sun, 
  MapPin, 
  BarChart2, 
  Calendar, 
  Bot, 
  Settings, 
  HelpCircle,
  Wind,
  Clock,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  isCollapsed = false, 
  onToggleCollapse 
}) {
  const menuItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'forecast', label: 'Forecast', icon: Sun },
    { id: 'locations', label: 'Locations', icon: MapPin },
    { id: 'planner', label: 'Air Planner', icon: Clock },
    { id: 'analytics', label: 'Analytics', icon: BarChart2 },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'ai', label: 'Ask Drishti AI', icon: Bot, isAi: true },
  ];

  return (
    <aside 
      className={`fixed top-0 left-0 bottom-0 bg-white border-r border-slate-200/80 flex flex-col justify-between py-6 select-none h-screen shadow-xs z-30 overflow-y-auto transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-20 px-2' : 'w-60 lg:w-64 px-4'
      }`}
    >
      
      {/* Top: Brand Logo + Retractable Collapse/Expand Toggle */}
      <div>
        <div className={`flex items-center pb-7 pt-1 transition-all ${
          isCollapsed ? 'flex-col gap-3 justify-center px-1' : 'justify-between px-2'
        }`}>
          
          {/* Logo & Title */}
          <div className={`flex items-center gap-3 overflow-hidden ${isCollapsed ? 'justify-center' : ''}`}>
            {/* Circular green logo badge matching BreatheEasy */}
            <div 
              className="w-10 h-10 rounded-full bg-[#00B37E] flex items-center justify-center text-white shadow-sm flex-shrink-0 cursor-pointer"
              onClick={onToggleCollapse}
              title={isCollapsed ? 'Click to expand sidebar' : 'Vayu Drishti Meerut'}
            >
              <Wind className="w-5 h-5" />
            </div>

            {!isCollapsed && (
              <div className="truncate">
                <h1 className="text-lg font-extrabold text-slate-900 tracking-tight font-sans leading-tight truncate">
                  Vayu Drishti
                </h1>
                <p className="text-[11px] text-slate-500 font-medium truncate">
                  Safe Air for Meerut
                </p>
              </div>
            )}
          </div>

          {/* Retract / Expand Button */}
          <button
            onClick={onToggleCollapse}
            className={`p-1.5 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer shadow-2xs ${
              isCollapsed ? 'w-8 h-8 flex items-center justify-center mt-1' : ''
            }`}
            title={isCollapsed ? 'Expand navigation panel' : 'Collapse navigation panel'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4 text-[#00B37E]" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Navigation items */}
        <nav className="space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                title={isCollapsed ? item.label : undefined}
                className={`w-full flex items-center rounded-2xl text-sm font-semibold transition-all duration-150 cursor-pointer ${
                  isCollapsed 
                    ? 'justify-center h-12 px-0' 
                    : 'gap-3.5 px-4 py-3 text-left'
                } ${
                  isActive
                    ? 'bg-[#00B37E] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                <div className="relative flex items-center justify-center flex-shrink-0">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  {item.isAi && !isActive && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#00B37E] animate-pulse" />
                  )}
                </div>

                {!isCollapsed && (
                  <span className="flex-1 truncate">{item.label}</span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Actions (Explore NCR Map button completely removed) */}
      <div className="space-y-2 pt-4 border-t border-slate-100">
        
        {/* Settings button */}
        <button
          onClick={() => setActiveTab('settings')}
          title={isCollapsed ? 'Settings' : undefined}
          className={`w-full flex items-center rounded-xl text-xs font-medium cursor-pointer transition-colors ${
            isCollapsed 
              ? 'justify-center h-10 px-0' 
              : 'gap-3 px-4 py-2.5 text-left'
          } ${
            activeTab === 'settings'
              ? 'bg-slate-100 text-slate-900 font-bold'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <Settings className="w-4 h-4 flex-shrink-0" />
          {!isCollapsed && <span className="truncate">Settings</span>}
        </button>

        {/* CPCB Reference link */}
        <a
          href="https://cpcb.nic.in"
          target="_blank"
          rel="noreferrer"
          title={isCollapsed ? 'UPPCB / CPCB Reference Data' : undefined}
          className={`w-full flex items-center rounded-xl text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors ${
            isCollapsed 
              ? 'justify-center h-10 px-0' 
              : 'gap-3 px-4 py-2.5 text-left'
          }`}
        >
          <HelpCircle className="w-4 h-4 flex-shrink-0" />
          {!isCollapsed && <span className="truncate">UPPCB Data</span>}
        </a>

      </div>

    </aside>
  );
}