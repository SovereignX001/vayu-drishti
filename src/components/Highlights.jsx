import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

export default function Highlights({ zone, timeframe }) {
  const currentData = zone.dataByTime[timeframe] || zone.dataByTime.now;

  const isSevere = currentData.pm25 > 200;
  const isModerate = currentData.pm25 > 80 && currentData.pm25 <= 200;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-white font-sans">
        Today's Highlights
      </h3>

      {/* 4 Clean Metric Cards using White, Green, Yellow, Red only */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        
        {/* Box 1: PM2.5 */}
        <div className="p-4 rounded-2xl bg-[#111827] border border-white/10 flex flex-col justify-between shadow-md">
          <span className="text-[11px] text-slate-400 font-medium font-mono uppercase">
            PM2.5 Particulate
          </span>
          <div className="my-1.5 flex items-baseline gap-1">
            <span className={`text-2xl sm:text-3xl font-extrabold font-sans ${
              isSevere ? 'text-[#EF4444]' : isModerate ? 'text-[#F59E0B]' : 'text-[#10B981]'
            }`}>
              {currentData.pm25}
            </span>
            <span className="text-xs text-slate-400 font-mono">µg/m³</span>
          </div>
          <span className={`text-[10px] font-mono font-semibold truncate ${
            isSevere ? 'text-[#EF4444]' : isModerate ? 'text-[#F59E0B]' : 'text-[#10B981]'
          }`}>
            {isSevere ? '⚠ Severe Inhalation Risk' : isModerate ? 'Moderate Caution' : '✓ Safe Clean Air'}
          </span>
        </div>

        {/* Box 2: Humidity */}
        <div className="p-4 rounded-2xl bg-[#111827] border border-white/10 flex flex-col justify-between shadow-md">
          <span className="text-[11px] text-slate-400 font-medium font-mono uppercase">
            Humidity
          </span>
          <div className="my-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-white font-sans">
              {currentData.humidity}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono truncate">
            Aerosol hygroscopic growth
          </span>
        </div>

        {/* Box 3: Wind Speed */}
        <div className="p-4 rounded-2xl bg-[#111827] border border-white/10 flex flex-col justify-between shadow-md">
          <span className="text-[11px] text-slate-400 font-medium font-mono uppercase">
            Wind Dispersion
          </span>
          <div className="my-1.5 flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#10B981] font-sans">
              {currentData.windSpeed}
            </span>
            <span className="text-xs text-slate-400 font-mono">{currentData.windDir.split(' ')[0]}</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono truncate">
            {currentData.windDir}
          </span>
        </div>

        {/* Box 4: Inversion & Traffic */}
        <div className="p-4 rounded-2xl bg-[#111827] border border-white/10 flex flex-col justify-between shadow-md">
          <span className="text-[11px] text-slate-400 font-medium font-mono uppercase">
            Inversion & Traffic
          </span>
          <div className="my-1.5 flex items-center gap-3">
            <div className="flex items-center gap-1 text-xs font-semibold text-[#F59E0B]">
              <span className="w-5 h-5 rounded-full bg-[#F59E0B]/20 flex items-center justify-center">
                <ArrowUp className="w-3 h-3 text-[#F59E0B]" />
              </span>
              <span>180m</span>
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold text-[#EF4444]">
              <span className="w-5 h-5 rounded-full bg-[#EF4444]/20 flex items-center justify-center">
                <ArrowDown className="w-3 h-3 text-[#EF4444]" />
              </span>
              <span>{currentData.trafficDensity}</span>
            </div>
          </div>
          <span className="text-[10px] text-slate-400 font-mono truncate">
            Low boundary trap + rush
          </span>
        </div>

      </div>
    </div>
  );
}
