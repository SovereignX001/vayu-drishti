import React from 'react';
import { X, MapPin, Check, ArrowRight } from 'lucide-react';
import { ZONES } from '../data/airData';

export default function ZoneSelectorModal({ isOpen, onClose, selectedZoneId, onSelectZone }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              Select Delhi NCR Micro-Zone
            </h3>
            <p className="text-xs text-slate-500">
              Downscaled 250m hyper-local monitoring stations
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Zones List */}
        <div className="space-y-2.5 my-4">
          {ZONES.map((z) => {
            const isSelected = z.id === selectedZoneId;
            const aqi = z.dataByTime.now.aqi;

            const isGood = aqi <= 70;
            const isModerate = aqi > 70 && aqi <= 150;
            const aqiColor = isGood ? '#00B37E' : isModerate ? '#F59E0B' : '#DC2626';

            return (
              <button
                key={z.id}
                onClick={() => {
                  onSelectZone(z.id);
                  onClose();
                }}
                className={`w-full p-3.5 rounded-2xl border transition-all text-left flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? 'border-[#00B37E] bg-[#EBF7F2] ring-2 ring-[#00B37E]/20'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-xs flex-shrink-0"
                    style={{ backgroundColor: aqiColor }}
                  >
                    {aqi}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 leading-snug">
                      {z.name}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {z.tag}
                    </p>
                  </div>
                </div>

                {isSelected ? (
                  <Check className="w-5 h-5 text-[#00B37E] flex-shrink-0" />
                ) : (
                  <ArrowRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>

      </div>
    </div>
  );
}
