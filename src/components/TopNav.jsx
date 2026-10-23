import React from 'react';
import { ShieldCheck, AlertTriangle, Bell, Thermometer } from 'lucide-react';

export default function TopNav({ 
  currentZone, 
  timeframe = 'now'
}) {
  const isSevere = currentZone?.dataByTime?.[timeframe]?.aqi > 200 || currentZone?.dataByTime?.now?.aqi > 200;
  const currentTemp = currentZone?.dataByTime?.[timeframe]?.temp || currentZone?.dataByTime?.now?.temp || '28°C';

  return (
    <div className="flex items-center justify-between gap-3 py-3.5 px-6 border-b border-slate-200/80 bg-white select-none sticky top-0 z-20 shadow-2xs">
      
      {/* Left: General Outdoor Status Advisory Banner */}
      <div className="flex items-center gap-3">
        <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${
          isSevere
            ? 'bg-[#FDECEC] text-[#DC2626] border-[#FCA5A5]'
            : 'bg-[#EBF7F2] text-[#00B37E] border-[#A7F3D0]'
        }`}>
          {isSevere ? (
            <>
              <AlertTriangle className="w-3.5 h-3.5 text-[#DC2626]" />
              <span>Advisory: Travel with an N95 Mask • Delay Morning Outdoor Plans</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-3.5 h-3.5 text-[#00B37E]" />
              <span>Clean Atmospheric Conditions: Safe for Picnics & Outdoor Plans</span>
            </>
          )}
        </div>
      </div>

      {/* Right Controls: Air Alert On & Temperature Only (Time tabs & microzone removed) */}
      <div className="flex items-center gap-3">
        
        {/* Air Alert On Pill */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E6F8F3] text-[#00B37E] text-xs font-bold border border-[#A7F3D0]/60 shadow-2xs">
          <Bell className="w-3.5 h-3.5" />
          <span>Air Alert On</span>
        </div>

        {/* Temperature Pill */}
        <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200/80 text-slate-700 text-xs font-bold shadow-2xs">
          <Thermometer className="w-3.5 h-3.5 text-slate-500" />
          <span>{currentTemp}</span>
        </div>

      </div>

    </div>
  );
}