import React, { useState } from 'react';
import { TrendingUp, AlertTriangle, Clock, Info, ShieldAlert } from 'lucide-react';

export default function MicroTrendChart({ zone }) {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const data = zone.forecastTimeline || [];
  
  // Chart dimensions
  const width = 580;
  const height = 180;
  const padding = { top: 25, right: 30, bottom: 35, left: 45 };

  // Calculate scales
  const maxPm25 = Math.max(...data.map(d => d.pm25), 380) * 1.1;
  const minPm25 = 0;

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const getX = (index) => padding.left + (index / (data.length - 1)) * chartWidth;
  const getY = (val) => padding.top + chartHeight - ((val - minPm25) / (maxPm25 - minPm25)) * chartHeight;

  // Path string for area and line
  const points = data.map((d, i) => `${getX(i)},${getY(d.pm25)}`);
  const linePath = `M ${points.join(' L ')}`;
  const areaPath = `${linePath} L ${getX(data.length - 1)},${height - padding.bottom} L ${padding.left},${height - padding.bottom} Z`;

  // Find spike point
  const spikeIndex = data.findIndex(d => d.isSpike);
  const spikeData = spikeIndex !== -1 ? data[spikeIndex] : null;

  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/60 p-4 relative backdrop-blur-sm">
      
      {/* Title & Metadata */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
              Micro-Trend PM2.5 Forecast (Next 4-6 Hours)
            </h4>
            <p className="text-[11px] text-slate-400 font-mono">
              Temporal GAN • 15-Minute Downscaled Resolution
            </p>
          </div>
        </div>

        {/* Highlight callout badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/15 border border-red-500/30 text-red-300 text-[10px] font-mono">
          <AlertTriangle className="w-3 h-3 text-red-400 animate-pulse" />
          <span>Spike Model: 08:30 AM</span>
        </div>
      </div>

      {/* SVG Chart */}
      <div className="relative w-full overflow-hidden select-none">
        <svg 
          viewBox={`0 0 ${width} ${height}`} 
          className="w-full h-44 overflow-visible"
        >
          <defs>
            <linearGradient id={`gradient-${zone.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={zone.color} stopOpacity="0.45" />
              <stop offset="70%" stopColor={zone.color} stopOpacity="0.08" />
              <stop offset="100%" stopColor={zone.color} stopOpacity="0.0" />
            </linearGradient>

            <linearGradient id="spikeLineGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#EF4444" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#EF4444" stopOpacity="0.1" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid lines & Y-axis labels */}
          {[60, 150, 250, 350].map((level) => {
            if (level > maxPm25) return null;
            const yPos = getY(level);
            return (
              <g key={level}>
                <line 
                  x1={padding.left} 
                  y1={yPos} 
                  x2={width - padding.right} 
                  y2={yPos} 
                  stroke="rgba(255, 255, 255, 0.08)" 
                  strokeDasharray="3,3" 
                />
                <text 
                  x={padding.left - 8} 
                  y={yPos + 3} 
                  fill="#64748B" 
                  fontSize="9" 
                  textAnchor="end"
                  fontFamily="JetBrains Mono"
                >
                  {level}
                </text>
              </g>
            );
          })}

          {/* National CPCB Standard Benchmark line (60 ug/m3) */}
          <line
            x1={padding.left}
            y1={getY(60)}
            x2={width - padding.right}
            y2={getY(60)}
            stroke="#10B981"
            strokeWidth="1"
            strokeDasharray="4,4"
            opacity="0.6"
          />
          <text
            x={width - padding.right}
            y={getY(60) - 4}
            fill="#10B981"
            fontSize="8"
            fontFamily="JetBrains Mono"
            textAnchor="end"
            opacity="0.8"
          >
            CPCB Clean Air Limit (60 µg/m³)
          </text>

          {/* Area Fill */}
          <path d={areaPath} fill={`url(#gradient-${zone.id})`} />

          {/* Trend Line */}
          <path 
            d={linePath} 
            fill="none" 
            stroke={zone.color} 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />

          {/* Critical Spike Vertical Marker Line at 08:30 AM */}
          {spikeIndex !== -1 && (
            <g>
              <line
                x1={getX(spikeIndex)}
                y1={padding.top}
                x2={getX(spikeIndex)}
                y2={height - padding.bottom}
                stroke="#EF4444"
                strokeWidth="1.5"
                strokeDasharray="3,3"
                className="animate-pulse"
              />
              
              {/* Spike Flag Tag on Top */}
              <g transform={`translate(${getX(spikeIndex)}, ${padding.top - 10})`}>
                <rect
                  x="-65"
                  y="-14"
                  width="130"
                  height="20"
                  rx="4"
                  fill="#EF4444"
                  className="animate-pulse"
                />
                <text
                  x="0"
                  y="0"
                  fill="#FFFFFF"
                  fontSize="9"
                  fontWeight="bold"
                  textAnchor="middle"
                  fontFamily="Inter"
                >
                  ⚠ PEAK SPIKE: 08:30 AM
                </text>
              </g>
            </g>
          )}

          {/* Data Points */}
          {data.map((d, i) => {
            const cx = getX(i);
            const cy = getY(d.pm25);
            const isHovered = hoveredPoint === i;

            return (
              <g 
                key={i}
                className="cursor-pointer group"
                onMouseEnter={() => setHoveredPoint(i)}
                onMouseLeave={() => setHoveredPoint(null)}
              >
                {/* Glow ring for spike */}
                {d.isSpike && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r="8"
                    fill="#EF4444"
                    opacity="0.3"
                    className="animate-ping"
                  />
                )}

                {/* Point circle */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={d.isSpike ? 5.5 : isHovered ? 5 : 3.5}
                  fill={d.isSpike ? '#EF4444' : zone.color}
                  stroke="#0B0F19"
                  strokeWidth="2"
                />

                {/* X Axis Time Labels */}
                <text
                  x={cx}
                  y={height - padding.bottom + 16}
                  fill={d.isSpike ? '#F87171' : isHovered ? '#F8FAFC' : '#94A3B8'}
                  fontSize="9"
                  fontWeight={d.isSpike ? 'bold' : 'normal'}
                  textAnchor="middle"
                  fontFamily="JetBrains Mono"
                >
                  {d.time}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Dynamic Tooltip on Hover */}
        {hoveredPoint !== null && data[hoveredPoint] && (
          <div 
            className="absolute -top-1 left-1/2 transform -translate-x-1/2 px-3 py-1.5 rounded-lg bg-slate-950/95 border border-white/20 text-xs shadow-2xl backdrop-blur-md pointer-events-none flex items-center gap-2.5 z-20"
          >
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-mono text-slate-300">{data[hoveredPoint].time}:</span>
            <span className="font-bold text-white font-mono">{data[hoveredPoint].pm25} µg/m³</span>
            <span className="text-slate-400 font-mono text-[11px]">(AQI ~{data[hoveredPoint].aqi})</span>
            <span className="text-[10px] text-amber-300 italic">"{data[hoveredPoint].note}"</span>
          </div>
        )}
      </div>

      {/* Physics & Meteorology Explainer Footer */}
      <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center gap-1.5">
          <Info className="w-3 h-3 text-cyan-400" />
          <span>Drivers: Morning Traffic Inrush + 180m Nocturnal Thermal Inversion Stagnation</span>
        </span>
        <span className="font-mono text-emerald-400 hidden sm:inline">
          Confidence: {zone.confidence}
        </span>
      </div>

    </div>
  );
}
