import React from 'react';
import { 
  X, 
  Cpu, 
  Wind, 
  CheckCircle2, 
  Activity,
  Sparkles,
  Database
} from 'lucide-react';

export default function DownscalingModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl rounded-[36px] border border-slate-100 bg-white p-6 sm:p-8 shadow-frame overflow-hidden max-h-[90vh] overflow-y-auto text-ink-900">
        
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-3 py-1 rounded-full text-[10px] font-mono bg-lime/40 text-ink-900 border border-lime/60 font-bold">
                System Architecture
              </span>
              <span className="text-xs text-slate-400 font-mono">
                LightGBM + Open-Meteo + Random Forest
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-ink-900 font-sans">
              How Vayu Drishti Works
            </h3>
            <p className="text-xs text-slate-500 mt-1 font-sans">
              Multi-source air intelligence: live weather and air-quality data (Open-Meteo / Copernicus CAMS) combined with LightGBM forecasting models trained on historical Indian AQI data.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close system architecture dialog"
            className="p-2 rounded-xl text-slate-400 hover:text-ink-900 hover:bg-slate-100 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comparison: The Problem vs Vayu Drishti */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-5 relative z-10">
          
          {/* Traditional AQI */}
          <div className="p-5 rounded-2xl border border-[#EF4444]/30 bg-[#FFF5F5]">
            <div className="flex items-center gap-2 text-[#DC2626] font-bold text-xs uppercase font-mono mb-2.5">
              <span className="w-2 h-2 rounded-full bg-[#DC2626]" />
              Traditional City-Wide Reporting
            </div>
            <ul className="space-y-2 text-xs text-slate-600">
              <li className="flex items-start gap-2">
                <span className="text-[#DC2626] font-bold">✕</span>
                Single generalized average for an entire city or district.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#DC2626] font-bold">✕</span>
                Few reference monitors spaced tens of kilometers apart.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#DC2626] font-bold">✕</span>
                Misses local variations between green canopy parks and transit corridors.
              </li>
            </ul>
          </div>

          {/* Vayu Drishti Solution */}
          <div className="p-5 rounded-2xl border border-teal-200 bg-[#F0FAF6]">
            <div className="flex items-center gap-2 text-teal-800 font-bold text-xs uppercase font-mono mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              Vayu Drishti Multi-Source Intelligence
            </div>
            <ul className="space-y-2 text-xs text-slate-700">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#00875A] flex-shrink-0 mt-0.5" />
                Location-specific recommendations: Differentiates parks from heavy transit corridors.
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#00875A] flex-shrink-0 mt-0.5" />
                24-hour predictive trajectory: LightGBM models forecast hourly spikes in advance.
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#00875A] flex-shrink-0 mt-0.5" />
                Actionable citizen guidance: Practical directives for picnics, travel, masks, and windows.
              </li>
            </ul>
          </div>

        </div>

        {/* Multi-Source Pipeline */}
        <div className="border border-slate-200/80 rounded-2xl bg-slate-50/80 p-5 relative z-10">
          <h4 className="text-xs font-mono uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2 font-bold">
            <Cpu className="w-4 h-4 text-ink-900" />
            Multi-Source Intelligence Pipeline
          </h4>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
              <Activity className="w-4 h-4 text-accent mb-1" />
              <p className="text-xs font-bold text-ink-900">Live Air Quality</p>
              <p className="text-[10px] text-slate-500">Open-Meteo CAMS PM2.5, PM10 & US AQI</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
              <Wind className="w-4 h-4 text-teal-600 mb-1" />
              <p className="text-xs font-bold text-ink-900">Live Weather</p>
              <p className="text-[10px] text-slate-500">Surface winds, temperature & humidity</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
              <Cpu className="w-4 h-4 text-[#B45309] mb-1" />
              <p className="text-xs font-bold text-ink-900">LightGBM Forecast</p>
              <p className="text-[10px] text-slate-500">24 hourly horizon regression models</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
              <Database className="w-4 h-4 text-purple-600 mb-1" />
              <p className="text-xs font-bold text-ink-900">Kaggle RF Model</p>
              <p className="text-[10px] text-slate-500">235k+ historical national records</p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600">
            <span className="font-mono text-ink-900 font-semibold">
              Output: Location-Specific Telemetry & 24-Hour Predictive Trajectory
            </span>
            <span className="px-3 py-1 rounded-full bg-lime/40 border border-lime/60 font-mono text-[11px] text-ink-900 font-bold self-start sm:self-auto">
              Temporal Out-of-Sample Validation
            </span>
          </div>
        </div>

        {/* Modal Close CTA */}
        <div className="mt-5 flex justify-end relative z-10">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-full bg-ink-900 hover:bg-ink-800 text-white font-bold text-xs transition-all cursor-pointer shadow-chip"
          >
            Back to Dashboard
          </button>
        </div>

      </div>
    </div>
  );
}