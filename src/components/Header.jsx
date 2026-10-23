import React from 'react';
import { Wind, ShieldCheck, Activity, Users, School, Layers, Radio, Sparkles } from 'lucide-react';

export default function Header({ 
  timeframe, 
  setTimeframe, 
  role, 
  setRole, 
  onOpenModelModal 
}) {
  const timeframes = [
    { id: 'now', label: 'Now (Live)', isLive: true },
    { id: 'plus1h', label: '+1 Hr', isLive: false },
    { id: 'plus3h', label: '+3 Hr (Predictive)', isLive: false, highlight: true },
    { id: 'plus6h', label: '+6 Hr', isLive: false },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#0B0F19]/90 backdrop-blur-xl">
      <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          
          {/* Brand Logo & Tagline */}
          <div className="flex items-center gap-3.5 w-full lg:w-auto justify-between lg:justify-start">
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500/20 via-cyan-500/10 to-transparent border border-emerald-500/40 shadow-lg shadow-emerald-500/10">
                <Wind className="w-6 h-6 text-emerald-400 animate-pulse" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-4 ring-[#0B0F19]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5 font-sans">
                    AeroGrid
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      v2.4 HyperAir
                    </span>
                  </h1>
                </div>
                <p className="text-xs text-slate-400 tracking-wide">
                  Hyper-Local Predictive Air Intelligence & Preemptive Action
                </p>
              </div>
            </div>

            {/* Live Feed Status Badge for Mobile */}
            <div className="flex lg:hidden items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-[11px] text-emerald-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>Live AI Engine</span>
            </div>
          </div>

          {/* Center: Live Engine Badge & Downscaling Pill */}
          <div className="hidden lg:flex items-center gap-3">
            <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-emerald-500/30 shadow-inner">
              <div className="relative flex h-2.5 w-2.5 items-center justify-center">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </div>
              <span className="text-xs font-medium text-slate-200">
                Live Sensor Feed
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                AI Forecasting Engine Active
              </span>
            </div>

            <button
              onClick={onOpenModelModal}
              className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 transition-all cursor-pointer hover:border-cyan-500/40"
              title="Click to view AI downscaling architecture"
            >
              <Radio className="w-3.5 h-3.5 text-cyan-400 group-hover:animate-spin" />
              <span className="font-mono text-[11px]">250m Micro-Mesh</span>
              <span className="text-[10px] text-cyan-400 font-mono underline decoration-dotted">Explain AI</span>
            </button>
          </div>

          {/* Right Controls: Timeframe Pills & Role Switcher */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
            
            {/* Timeframe Pill Selector */}
            <div className="flex items-center p-1 rounded-xl bg-slate-900/90 border border-white/10 shadow-lg">
              {timeframes.map((tf) => {
                const isActive = timeframe === tf.id;
                return (
                  <button
                    key={tf.id}
                    onClick={() => setTimeframe(tf.id)}
                    className={`relative px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-r from-emerald-500/90 to-cyan-500/90 text-white shadow-md font-semibold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                    }`}
                  >
                    {tf.label}
                    {tf.isLive && (
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-300 ml-1.5 animate-pulse" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Role Switcher Toggle */}
            <div className="flex items-center p-1 rounded-xl bg-slate-900/90 border border-white/10">
              <button
                onClick={() => setRole('resident')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                  role === 'resident'
                    ? 'bg-white/15 text-white shadow-sm border border-white/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                <span>Resident Mode</span>
              </button>
              <button
                onClick={() => setRole('admin')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                  role === 'admin'
                    ? 'bg-gradient-to-r from-orange-500/20 to-red-500/20 text-orange-200 border border-orange-500/40 shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <School className="w-3.5 h-3.5 text-orange-400" />
                <span>School & Admin</span>
              </button>
            </div>

          </div>

        </div>
      </div>
    </header>
  );
}
