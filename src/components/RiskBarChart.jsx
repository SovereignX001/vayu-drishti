import React from 'react';
import { SlidersHorizontal } from 'lucide-react';

export default function RiskBarChart() {
  // Horizontal bars using ONLY White, Green, Yellow, Red
  const hourlyRisks = [
    { time: '09 am', width: '22%', color: '#10B981' }, // Green
    { time: '12 pm', width: '68%', color: '#F59E0B' }, // Yellow
    { time: '03 pm', width: '48%', color: '#F59E0B' }, // Yellow
    { time: '06 pm', width: '92%', color: '#EF4444' }, // Red Spike!
    { time: '09 pm', width: '52%', color: '#F59E0B' }, // Yellow
    { time: '12 am', width: '15%', color: '#10B981' }, // Green
    { time: '03 am', width: '8%',  color: '#10B981' }, // Green
  ];

  return (
    <div className="p-5 rounded-2xl bg-[#111827] border border-white/10 shadow-md select-none">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-bold text-white font-sans">
          Pollution Spike Probability
        </h4>
        <button className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer">
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Horizontal Bar rows */}
      <div className="space-y-2.5">
        {hourlyRisks.map((item, idx) => (
          <div key={idx} className="flex items-center gap-3">
            <span className="w-11 text-[11px] font-medium text-slate-400 font-sans">
              {item.time}
            </span>
            <div className="flex-1 bg-white/5 h-2.5 rounded-full overflow-hidden flex items-center">
              <div
                className="h-2 rounded-full transition-all duration-700"
                style={{ width: item.width, backgroundColor: item.color }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Bottom scale labels: Good (Green), Moderate (Yellow), Severe (Red) */}
      <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] font-medium px-1 font-sans">
        <span className="text-[#10B981] font-semibold">Good</span>
        <span className="text-[#F59E0B] font-semibold">Moderate</span>
        <span className="text-[#EF4444] font-bold">Severe Spike</span>
      </div>

    </div>
  );
}
