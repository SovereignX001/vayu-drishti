import React from 'react';
import { 
  Flame, 
  MapPin, 
  Trees, 
  Building2, 
  ArrowUp, 
  ArrowDown 
} from 'lucide-react';

export default function ZoneCards({ zones, selectedZoneId, onSelectZone, timeframe }) {
  return (
    <div className="p-6 rounded-[28px] bg-white border border-slate-200/90 shadow-xs select-none">
      
      {/* Title */}
      <h4 className="text-sm font-extrabold text-slate-900 font-sans mb-3.5">
        Delhi NCR Micro-Zone Forecast
      </h4>

      {/* Rows */}
      <div className="space-y-3">
        
        {/* Item 1: Mathura Road Corridor */}
        <div 
          onClick={() => onSelectZone('school-zone')}
          className={`flex items-center justify-between p-2 rounded-2xl cursor-pointer transition-all ${
            selectedZoneId === 'school-zone' 
              ? 'ring-2 ring-[#DC2626] bg-slate-50 shadow-xs' 
              : 'hover:bg-slate-50 border border-transparent'
          }`}
        >
          {/* Left: Red Pill Button */}
          <div className="px-4 py-2 rounded-xl bg-[#DC2626] text-white flex items-center gap-2 text-xs font-bold font-mono shadow-xs">
            <ArrowUp className="w-3.5 h-3.5" />
            <span>225</span>
            <ArrowDown className="w-3.5 h-3.5" />
            <span>185</span>
          </div>

          {/* Right: Icon + Label */}
          <div className="flex items-center gap-2.5 pr-2">
            <div className="w-8 h-8 rounded-xl bg-[#FDECEC] flex items-center justify-center text-[#DC2626]">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-slate-900">Mathura Rd Corridor</p>
              <p className="text-[10px] text-[#DC2626] font-semibold">Wear N95 Mask</p>
            </div>
          </div>
        </div>

        {/* Item 2: Anand Vihar ISBT */}
        <div 
          onClick={() => onSelectZone('industrial-crossing')}
          className={`flex items-center justify-between p-2 rounded-2xl cursor-pointer transition-all ${
            selectedZoneId === 'industrial-crossing' 
              ? 'ring-2 ring-[#DC2626] bg-slate-50 shadow-xs' 
              : 'hover:bg-slate-50 border border-transparent'
          }`}
        >
          {/* Left: Icon + Label */}
          <div className="flex items-center gap-2.5 pl-2">
            <div className="w-8 h-8 rounded-xl bg-[#FDECEC] flex items-center justify-center text-[#DC2626]">
              <Flame className="w-4 h-4" />
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-slate-900">Anand Vihar ISBT</p>
              <p className="text-[10px] text-[#DC2626] font-semibold">Delay Travel</p>
            </div>
          </div>

          {/* Right: Red Pill Button */}
          <div className="px-4 py-2 rounded-xl bg-[#DC2626] text-white flex items-center gap-2 text-xs font-bold font-mono shadow-xs">
            <ArrowUp className="w-3.5 h-3.5" />
            <span>340</span>
            <ArrowDown className="w-3.5 h-3.5" />
            <span>310</span>
          </div>
        </div>

        {/* Item 3: Green Park Sanctuary */}
        <div 
          onClick={() => onSelectZone('green-park')}
          className={`flex items-center justify-between p-2 rounded-2xl cursor-pointer transition-all ${
            selectedZoneId === 'green-park' 
              ? 'ring-2 ring-[#00B37E] bg-slate-50 shadow-xs' 
              : 'hover:bg-slate-50 border border-transparent'
          }`}
        >
          {/* Left: Green Pill Button */}
          <div className="px-4 py-2 rounded-xl bg-[#00B37E] text-white flex items-center gap-2 text-xs font-bold font-mono shadow-xs">
            <ArrowUp className="w-3.5 h-3.5" />
            <span>65</span>
            <ArrowDown className="w-3.5 h-3.5" />
            <span>38</span>
          </div>

          {/* Right: Icon + Label */}
          <div className="flex items-center gap-2.5 pr-2">
            <div className="w-8 h-8 rounded-xl bg-[#E6F8F3] flex items-center justify-center text-[#00B37E]">
              <Trees className="w-4 h-4" />
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-slate-900">Lodhi & Green Park</p>
              <p className="text-[10px] text-[#00B37E] font-semibold">Picnic Approved</p>
            </div>
          </div>
        </div>

        {/* Item 4: Sector 62 Noida */}
        <div 
          onClick={() => onSelectZone('tech-hub')}
          className={`flex items-center justify-between p-2 rounded-2xl cursor-pointer transition-all ${
            selectedZoneId === 'tech-hub' 
              ? 'ring-2 ring-[#F59E0B] bg-slate-50 shadow-xs' 
              : 'hover:bg-slate-50 border border-transparent'
          }`}
        >
          {/* Left: Icon + Label */}
          <div className="flex items-center gap-2.5 pl-2">
            <div className="w-8 h-8 rounded-xl bg-[#FEF7EC] flex items-center justify-center text-[#F59E0B]">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-slate-900">Sector 62 Noida</p>
              <p className="text-[10px] text-[#F59E0B] font-semibold">Moderate</p>
            </div>
          </div>

          {/* Right: Yellow Pill */}
          <div className="px-4 py-2 rounded-xl bg-[#F59E0B] text-slate-900 flex items-center gap-2 text-xs font-extrabold font-mono shadow-xs">
            <ArrowUp className="w-3.5 h-3.5" />
            <span>110</span>
            <ArrowDown className="w-3.5 h-3.5" />
            <span>82</span>
          </div>
        </div>

      </div>

    </div>
  );
}
