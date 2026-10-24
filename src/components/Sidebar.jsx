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
  Clock,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  isCollapsed = false, 
  onToggleCollapse,
  isMobileOpen = false,
  onCloseMobile
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
    <>
      {/* Dimmed backdrop overlay on mobile */}
      {isMobileOpen && (
        <div 
          onClick={onCloseMobile}
          aria-label="Close navigation overlay"
          className="fixed inset-0 bg-ink-900/60 backdrop-blur-xs z-40 md:hidden transition-opacity duration-200"
        />
      )}

      <aside 
        className={`bg-white border-r border-slate-100 flex flex-col justify-between py-6 select-none shadow-xl md:shadow-none z-50 md:z-20 transition-all duration-300 ease-in-out ${
          isMobileOpen 
            ? 'fixed top-0 left-0 bottom-0 w-64 px-4 translate-x-0' 
            : 'fixed top-0 left-0 bottom-0 -translate-x-full md:relative md:translate-x-0'
        } ${
          isCollapsed ? 'md:w-20 md:px-2.5' : 'md:w-60 md:px-4'
        }`}
      >
        
        {/* Top: Brand Logo + Retractable Collapse/Expand Toggle */}
        <div>
          <div className={`flex items-center pb-8 pt-1 transition-all ${
            isCollapsed ? 'md:flex-col md:gap-3 md:justify-center md:px-1 justify-between px-2' : 'justify-between px-2'
          }`}>
            
            {/* Logo & Title */}
            <div className={`flex items-center gap-3 overflow-hidden ${isCollapsed ? 'md:justify-center' : ''}`}>
              {/* Brand Logo (Eye of Vayu Drishti) */}
              <button 
                type="button"
                className="w-12 h-12 rounded-2xl bg-white border border-slate-200/90 flex items-center justify-center shadow-sm overflow-hidden flex-shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent transition-transform hover:scale-105 p-1"
                onClick={onToggleCollapse}
                aria-label={isCollapsed ? 'Expand navigation panel' : 'Collapse navigation panel'}
                title={isCollapsed ? 'Click to expand sidebar' : 'Vayu Drishti'}
              >
                <img src="/logo.png" alt="Vayu Drishti Logo" className="w-full h-full object-contain" />
              </button>

              {(!isCollapsed || isMobileOpen) && (
                <div className={`truncate ${isCollapsed ? 'md:hidden' : ''}`}>
                  <h1 className="text-base font-black text-[#0F1E36] tracking-tight font-sans leading-tight truncate">
                    Vayu Drishti
                  </h1>
                  <p className="text-xs text-slate-500 font-bold truncate">
                    Air Intelligence
                  </p>
                </div>
              )}
            </div>

            {/* Mobile Close Button */}
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label="Close navigation menu"
              className="md:hidden p-1.5 rounded-xl border border-slate-200 text-ink-500 hover:text-ink-900 hover:bg-slate-100 transition-all cursor-pointer shadow-2xs"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Desktop Retract / Expand Button */}
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label={isCollapsed ? 'Expand navigation panel' : 'Collapse navigation panel'}
              className={`hidden md:flex p-1.5 rounded-xl border border-slate-200/70 text-ink-400 hover:text-ink-900 hover:bg-slate-100 transition-all cursor-pointer shadow-2xs ${
                isCollapsed ? 'w-8 h-8 items-center justify-center mt-1' : ''
              }`}
              title={isCollapsed ? 'Expand navigation panel' : 'Collapse navigation panel'}
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4 text-accent" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Navigation items */}
          <nav className="space-y-2 relative" aria-label="Main Navigation">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <div key={item.id} className="relative">
                  {/* Left edge orange active indicator tab */}
                  {isActive && (
                    <span 
                      aria-hidden="true"
                      className="absolute -left-2.5 sm:-left-4 top-1/2 -translate-y-1/2 w-1.5 h-7 bg-accent rounded-r-full shadow-sm"
                    />
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab(item.id);
                      if (onCloseMobile) onCloseMobile();
                    }}
                    aria-label={item.label}
                    aria-current={isActive ? 'page' : undefined}
                    title={item.label}
                    style={{
                      backgroundColor: isActive ? '#0F1E36' : undefined,
                      color: isActive ? '#FFFFFF' : undefined,
                    }}
                    className={`w-full flex items-center rounded-2xl text-sm transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                      isCollapsed 
                        ? 'md:justify-center md:h-12 md:px-0 gap-3.5 px-4 py-3 text-left' 
                        : 'gap-3.5 px-4 py-3 text-left'
                    } ${
                      isActive
                        ? 'shadow-md shadow-[#0F1E36]/20 font-black'
                        : 'text-slate-600 hover:text-[#0F1E36] hover:bg-slate-100/90 font-bold'
                    }`}
                  >
                    <div className="relative flex items-center justify-center flex-shrink-0">
                      <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-[#FF6B35] stroke-[2.5]' : 'text-slate-400 stroke-2'}`} />
                      {item.isAi && !isActive && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-accent animate-pulse" />
                      )}
                    </div>

                    {(!isCollapsed || isMobileOpen) && (
                      <span className={`flex-1 truncate ${isActive ? 'text-white font-black' : 'text-slate-700 font-bold'} ${isCollapsed ? 'md:hidden' : ''}`}>
                        {item.label}
                      </span>
                    )}
                  </button>
                </div>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="space-y-2 pt-4 border-t border-slate-100">
          
          {/* Settings button */}
          <div className="relative">
            {activeTab === 'settings' && (
              <span 
                aria-hidden="true"
                className="absolute -left-2.5 sm:-left-4 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-accent rounded-r-full shadow-sm"
              />
            )}
            <button
              type="button"
              onClick={() => {
                setActiveTab('settings');
                if (onCloseMobile) onCloseMobile();
              }}
              aria-label="Settings"
              title="Settings"
              style={{
                backgroundColor: activeTab === 'settings' ? '#0F1E36' : undefined,
                color: activeTab === 'settings' ? '#FFFFFF' : undefined,
              }}
              className={`w-full flex items-center rounded-2xl text-xs cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                isCollapsed 
                  ? 'md:justify-center md:h-11 md:px-0 gap-3 px-4 py-2.5 text-left' 
                  : 'gap-3 px-4 py-2.5 text-left'
              } ${
                activeTab === 'settings'
                  ? 'shadow-md shadow-[#0F1E36]/20 font-black'
                  : 'text-slate-600 hover:text-[#0F1E36] hover:bg-slate-100/80 font-bold'
              }`}
            >
              <Settings className={`w-4 h-4 flex-shrink-0 ${activeTab === 'settings' ? 'text-[#FF6B35] stroke-[2.5]' : 'text-slate-400'}`} />
              {(!isCollapsed || isMobileOpen) && <span className={`truncate ${activeTab === 'settings' ? 'text-white font-black' : 'text-slate-700 font-bold'} ${isCollapsed ? 'md:hidden' : ''}`}>Settings</span>}
            </button>
          </div>

          {/* CPCB Reference link */}
          <a
            href="https://cpcb.nic.in"
            target="_blank"
            rel="noreferrer"
            aria-label="CPCB Official Portal (opens in new tab)"
            title="CPCB Official Portal"
            className={`w-full flex items-center rounded-2xl text-xs font-semibold text-ink-400 hover:text-ink-800 hover:bg-slate-100/70 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
              isCollapsed 
                ? 'md:justify-center md:h-10 md:px-0 gap-3 px-4 py-2.5 text-left' 
                : 'gap-3 px-4 py-2.5 text-left'
            }`}
          >
            <HelpCircle className="w-4 h-4 flex-shrink-0 text-ink-400" />
            {(!isCollapsed || isMobileOpen) && <span className={`truncate ${isCollapsed ? 'md:hidden' : ''}`}>CPCB Portal</span>}
          </a>

        </div>

      </aside>
    </>
  );
}
