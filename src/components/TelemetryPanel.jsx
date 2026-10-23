import React, { useState } from 'react';
import { 
  Wind, 
  Car, 
  Thermometer, 
  Droplets, 
  AlertTriangle, 
  Send, 
  CheckCircle2, 
  Bell, 
  ShieldAlert, 
  Clock, 
  Home, 
  Check, 
  Flame, 
  ChevronRight, 
  Radio, 
  Users, 
  Layers, 
  RotateCcw,
  Sparkles
} from 'lucide-react';
import MicroTrendChart from './MicroTrendChart';

export default function TelemetryPanel({ 
  zone, 
  timeframe, 
  role, 
  onTriggerAlert, 
  alertState 
}) {
  const currentData = zone.dataByTime[timeframe] || zone.dataByTime.now;
  const isSchoolZone = zone.id === 'school-zone';

  // Toggle for Smart Purifier sync simulation in resident mode
  const [purifierActive, setPurifierActive] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      
      {/* Zone Title & Realtime Badges */}
      <div className="p-4 sm:p-5 rounded-2xl border border-white/10 bg-slate-900/80 backdrop-blur-md shadow-xl relative overflow-hidden">
        
        {/* Glow tint */}
        <div 
          className="absolute -right-20 -top-20 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ backgroundColor: zone.color }}
        />

        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold border ${zone.badgeClass}`}>
                {currentData.category.toUpperCase()}
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                {zone.coordinates.lat}, {zone.coordinates.lng}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              {zone.name}
            </h2>
            <p className="text-xs text-slate-400">
              {zone.tag} • <span className="text-cyan-400 font-mono">{zone.sensorsOnline} Ground Micro-Sensors Synced</span>
            </p>
          </div>

          {/* Big AQI Pill */}
          <div className="flex items-center gap-3 bg-slate-950/70 border border-white/10 px-4 py-2.5 rounded-xl">
            <div className="text-right">
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block">
                Air Quality Index
              </span>
              <span className="text-2xl sm:text-3xl font-extrabold font-mono" style={{ color: zone.color }}>
                {currentData.aqi}
              </span>
            </div>
            <div className="h-10 w-[2px] bg-white/10" />
            <div className="text-left">
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block">
                Status
              </span>
              <span className="text-xs font-semibold text-slate-200 block">
                {currentData.category}
              </span>
            </div>
          </div>
        </div>

        {/* 4 Primary Telemetry Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          
          {/* Metric 1: PM2.5 */}
          <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono uppercase text-slate-400">PM2.5 Conc.</span>
              <span className="text-[10px] text-amber-400 font-mono">Fine Dust</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold font-mono text-white">
                {currentData.pm25}
              </span>
              <span className="text-[11px] text-slate-400 font-mono">µg/m³</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-500"
                style={{ 
                  width: `${Math.min((currentData.pm25 / 350) * 100, 100)}%`,
                  backgroundColor: zone.color
                }}
              />
            </div>
          </div>

          {/* Metric 2: PM10 */}
          <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono uppercase text-slate-400">PM10 Conc.</span>
              <span className="text-[10px] text-slate-400 font-mono">Coarse</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold font-mono text-white">
                {currentData.pm10}
              </span>
              <span className="text-[11px] text-slate-400 font-mono">µg/m³</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div 
                className="h-full rounded-full bg-slate-400"
                style={{ width: `${Math.min((currentData.pm10 / 450) * 100, 100)}%` }}
              />
            </div>
          </div>

          {/* Metric 3: Wind Vector */}
          <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono uppercase text-slate-400">Wind Vector</span>
              <Wind className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold font-mono text-cyan-300">
                {currentData.windSpeed}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">{currentData.windDir}</span>
            </div>
            <span className="text-[9px] text-cyan-400/90 font-mono mt-2 truncate">
              {zone.id === 'industrial-crossing' ? 'Plume pushing SE' : 'Carries upstream plume'}
            </span>
          </div>

          {/* Metric 4: Traffic Density Index */}
          <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono uppercase text-slate-400">Traffic Index</span>
              <Car className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold font-mono text-amber-300">
                {currentData.trafficDensity}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Capacity</span>
            </div>
            <span className="text-[9px] text-amber-400/90 font-mono mt-2 truncate">
              {currentData.trafficStatus}
            </span>
          </div>

        </div>

        {/* Secondary Weather & Satellite Telemetry strip */}
        <div className="mt-3 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 font-mono">
              <Thermometer className="w-3.5 h-3.5 text-rose-400" />
              <span>Temp: <strong className="text-slate-200">{currentData.temp}</strong></span>
            </span>
            <span className="flex items-center gap-1.5 font-mono">
              <Droplets className="w-3.5 h-3.5 text-blue-400" />
              <span>Humidity: <strong className="text-slate-200">{currentData.humidity}</strong></span>
            </span>
            <span className="hidden sm:flex items-center gap-1.5 font-mono">
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              <span>Sat AOD: <strong className="text-slate-200">{currentData.aod}</strong></span>
            </span>
          </div>
          <div className="text-[11px] font-mono text-amber-300 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>Thermal Inversion: {currentData.inversionRisk}</span>
          </div>
        </div>

      </div>

      {/* Micro-Trend Forecast Chart */}
      <MicroTrendChart zone={zone} />

      {/* CORE PITCH VALUE: Dynamic Decision & Preemptive Action Card */}
      <div className={`p-5 rounded-2xl border backdrop-blur-md transition-all shadow-xl ${
        role === 'admin' 
          ? 'bg-gradient-to-br from-orange-950/70 via-slate-900/90 to-red-950/50 border-orange-500/40' 
          : 'bg-gradient-to-br from-slate-900/90 via-slate-900/90 to-emerald-950/40 border-white/15'
      }`}>

        {/* Card Header */}
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${
              role === 'admin' 
                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40' 
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
            }`}>
              {role === 'admin' ? (
                <ShieldAlert className="w-5 h-5" />
              ) : (
                <Bell className="w-5 h-5" />
              )}
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                {role === 'admin' ? 'Institutional Preemptive Decision Engine' : 'Personal Health Advisory & Action'}
              </span>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                {role === 'admin' ? 'Automated Risk Mitigation Trigger' : 'Smart Resident Advisory'}
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
                  AI Prescriptive
                </span>
              </h3>
            </div>
          </div>

          <span className="hidden sm:inline-block text-[11px] font-mono text-slate-400">
            Window: 08:00 AM - 10:00 AM
          </span>
        </div>

        {/* Dynamic Content based on Role */}
        {role === 'admin' ? (
          /* SCHOOL & INSTITUTION ADMIN MODE */
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-orange-950/40 border border-orange-500/30">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5 animate-pulse" />
                <div>
                  <h4 className="text-sm font-bold text-orange-200">
                    {zone.advisory.admin.headline}
                  </h4>
                  <p className="text-xs text-orange-300/80 mt-1 leading-relaxed">
                    {zone.advisory.admin.details}
                  </p>
                </div>
              </div>

              {/* Impact stats pill */}
              <div className="mt-3 pt-2.5 border-t border-orange-500/20 flex flex-wrap items-center justify-between text-xs text-orange-300/90 font-mono">
                <span>At-risk cohort: <strong>1,240 Students & Faculty</strong></span>
                <span>Peak PM2.5: <strong>285 µg/m³ (4.7x WHO safe ceiling)</strong></span>
              </div>
            </div>

            {/* ONE-CLICK ACTION TRIGGER BUTTON */}
            <div className="flex flex-col gap-2">
              <button
                onClick={() => onTriggerAlert(zone)}
                disabled={alertState.dispatched && alertState.zoneId === zone.id}
                className={`w-full py-3.5 px-5 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-3 cursor-pointer shadow-lg ${
                  alertState.dispatched && alertState.zoneId === zone.id
                    ? 'bg-emerald-600/90 text-white border border-emerald-400/50 cursor-default shadow-emerald-500/20'
                    : 'bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-white border border-orange-400/40 hover:shadow-orange-500/25 hover:scale-[1.01] active:scale-[0.99]'
                }`}
              >
                {alertState.dispatched && alertState.zoneId === zone.id ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-white animate-bounce" />
                    <span>Alert Dispatched • Assembly Postponed & Parents Notified</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-white" />
                    <span>
                      {zone.id === 'school-zone' 
                        ? 'One-Click Action: Send automated alert to postpone outdoor assembly / sports activities'
                        : zone.advisory.admin.buttonText}
                    </span>
                  </>
                )}
              </button>

              {/* Status / Log info */}
              {alertState.dispatched && alertState.zoneId === zone.id ? (
                <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-[11px] font-mono text-emerald-300">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Broadcast ID: #{alertState.alertId || 'AQI-8842'} delivered via SMS & WhatsApp Gateway</span>
                  </div>
                  <button 
                    onClick={() => onTriggerAlert(null, true)} 
                    className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
                  >
                    Reset Drill
                  </button>
                </div>
              ) : (
                <p className="text-[11px] text-center text-slate-400">
                  Target Broadcast: Instant push to school portals, parents app, and campus PA notification hubs.
                </p>
              )}
            </div>

          </div>
        ) : (
          /* RESIDENT MODE */
          <div className="space-y-3.5">
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-white/10">
              <h4 className="text-sm font-bold text-white mb-1">
                {zone.advisory.resident.headline}
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                {zone.advisory.resident.details}
              </p>
            </div>

            {/* Checklist of actionable precautions */}
            <div className="space-y-2">
              <span className="text-[11px] uppercase font-mono tracking-wider text-slate-400 block">
                Recommended Actions:
              </span>
              {zone.advisory.resident.actions.map((act, i) => (
                <div key={i} className="flex items-start gap-2.5 text-xs text-slate-200">
                  <span className="p-0.5 rounded bg-emerald-500/20 text-emerald-400 mt-0.5">
                    <Check className="w-3 h-3" />
                  </span>
                  <span>{act}</span>
                </div>
              ))}
            </div>

            {/* Smart Home Air Purifier Integration */}
            <div className="pt-2 border-t border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Home className="w-4 h-4 text-cyan-400" />
                <div>
                  <p className="text-xs font-semibold text-white">Smart Home HEPA Sync</p>
                  <p className="text-[10px] text-slate-400">Auto-ramps purifier 30m prior to peak spike</p>
                </div>
              </div>
              <button
                onClick={() => setPurifierActive(!purifierActive)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                  purifierActive
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                    : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                }`}
              >
                {purifierActive ? 'Purifier Boost Scheduled (08:00 AM)' : 'Enable Auto-Boost'}
              </button>
            </div>

          </div>
        )}

      </div>

    </div>
  );
}
