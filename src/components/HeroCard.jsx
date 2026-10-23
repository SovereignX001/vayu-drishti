import React from 'react';
import { 
  Crosshair, 
  Plus, 
  CloudSun, 
  MapPin, 
  Wind, 
  Compass
} from 'lucide-react';

export default function HeroCard({ 
  zone, 
  timeframe, 
  onToggleMap, 
  showMap, 
  allZones, 
  onSelectZone 
}) {
  const currentData = zone.dataByTime[timeframe] || zone.dataByTime.now;

  // Visual background depending on zone status
  const getZoneImage = () => {
    if (zone.id === 'green-park') {
      return 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1000&q=80';
    }
    if (zone.id === 'industrial-crossing') {
      return 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1000&q=80';
    }
    if (zone.id === 'tech-hub') {
      return 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1000&q=80';
    }
    return 'https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?auto=format&fit=crop&w=1000&q=80';
  };

  // 4 Colors ONLY: White, Green, Yellow, Red
  const getStatusColor = (aqi) => {
    if (aqi <= 70) return '#10B981'; // Green
    if (aqi <= 150) return '#F59E0B'; // Yellow
    return '#EF4444'; // Red
  };

  const aqiColor = getStatusColor(currentData.aqi);

  return (
    <div className="space-y-3">
      {/* Current Location Header Row */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
            Current Micro-Zone
          </span>
          <div className="flex items-center gap-2 mt-0.5">
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {zone.name}
            </h2>
            <span 
              className="text-xs px-2.5 py-0.5 rounded-full font-mono font-bold border"
              style={{ 
                color: aqiColor, 
                backgroundColor: `${aqiColor}20`, 
                borderColor: `${aqiColor}60` 
              }}
            >
              AQI {currentData.aqi} • {currentData.category}
            </span>
          </div>
        </div>

        {/* Action Buttons: White / Green accents */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleMap}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
              showMap
                ? 'bg-[#10B981] text-white border-[#10B981]'
                : 'bg-white/5 hover:bg-white/10 text-white border-white/20'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>{showMap ? 'Hide Vector Map' : 'View Vector Map'}</span>
          </button>

          <button 
            className="p-2 rounded-xl bg-white/5 border border-white/20 text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Recenter to active node"
          >
            <Crosshair className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid: Featured Visual Hero Card (Left) + Add/Compare Zone Card (Right) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        
        {/* Main Hero Card */}
        <div className="md:col-span-8 relative h-56 sm:h-64 rounded-2xl overflow-hidden border border-white/10 group shadow-lg">
          <img
            src={getZoneImage()}
            alt={zone.name}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          {/* High-contrast dark gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F19] via-[#0B0F19]/40 to-transparent" />

          {/* Top Left: Weather / AQI Icon & Large Metric */}
          <div className="absolute top-4 left-4 text-white flex items-center gap-3 drop-shadow-md">
            <div className="w-12 h-12 rounded-xl bg-black/50 backdrop-blur-md flex items-center justify-center border border-white/20">
              <CloudSun className="w-7 h-7 text-[#F59E0B]" />
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl sm:text-4xl font-extrabold tracking-tight font-sans text-white">
                  {currentData.temp.replace('°C', '')}
                </span>
                <span className="text-lg font-light text-slate-300">°C</span>
              </div>
              <p className="text-[11px] font-mono text-[#10B981] flex items-center gap-1 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                Live Sensor Telemetry
              </p>
            </div>
          </div>

          {/* Top Right: Date & Wind */}
          <div className="absolute top-4 right-4 text-right text-white drop-shadow-md">
            <p className="text-xs font-semibold">
              Monday, 07:43 AM
            </p>
            <p className="text-[11px] text-slate-300 flex items-center justify-end gap-1 font-mono">
              <Wind className="w-3 h-3 text-white" />
              <span>{currentData.windSpeed} • {currentData.windDir}</span>
            </p>
          </div>

          {/* Bottom Card Banner: Micro-Zone Status */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white backdrop-blur-md bg-black/60 px-4 py-2.5 rounded-xl border border-white/10">
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-[#10B981]" />
              <span className="text-xs font-medium font-sans">
                {zone.tag}
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono">
              <span>AOD: <strong className="text-white">{currentData.aod}</strong></span>
              <span className="text-white/40">•</span>
              <span>Confidence: <strong className="text-[#10B981]">{zone.confidence}</strong></span>
            </div>
          </div>
        </div>

        {/* Right "+ Add City" / "Zone Switcher" Card */}
        <div className="md:col-span-4 rounded-2xl border border-white/10 bg-[#111827] p-4 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Micro-Zones
            </span>
            <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-white">
              <Plus className="w-4 h-4" />
            </div>
          </div>

          {/* Quick list of other 3 zones */}
          <div className="space-y-2">
            {allZones.map((z) => {
              const isSelected = z.id === zone.id;
              const aqiVal = z.dataByTime[timeframe]?.aqi || z.dataByTime.now.aqi;
              const zColor = getStatusColor(aqiVal);

              return (
                <button
                  key={z.id}
                  onClick={() => onSelectZone(z.id)}
                  className={`w-full p-2.5 rounded-xl text-left border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-white/10 border-white text-white shadow-sm ring-1 ring-white/30'
                      : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-300'
                  }`}
                >
                  <div className="truncate pr-2">
                    <p className="text-xs font-semibold text-white truncate">
                      {z.name.split(' - ')[0]}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">
                      {z.tag}
                    </p>
                  </div>
                  <span 
                    className="text-xs font-bold font-mono px-2 py-0.5 rounded-md"
                    style={{ 
                      color: zColor,
                      backgroundColor: `${zColor}20`,
                      border: `1px solid ${zColor}50`
                    }}
                  >
                    {aqiVal}
                  </span>
                </button>
              );
            })}
          </div>

          <p className="text-[10px] text-center text-slate-400 mt-2 font-mono">
            + Compare 250m downscaled nodes
          </p>
        </div>

      </div>
    </div>
  );
}
