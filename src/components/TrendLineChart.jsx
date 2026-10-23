import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';

export default function TrendLineChart({ zone }) {
  const [activeTab, setActiveTab] = useState('today');

  const chartPoints = [
    { time: '6 am', val: 12, label: '140 µg', note: 'Early freight baseline' },
    { time: '9 am', val: 24, isPeak: true, label: '285 µg', note: 'Peak traffic + inversion spike' },
    { time: '12 pm', val: 18, label: '195 µg', note: 'Midday thermal dispersion' },
    { time: '03 pm', val: 15, label: '160 µg', note: 'Moderate solar lift' },
    { time: '06 pm', val: 20, label: '210 µg', note: 'Evening rush hour surge' },
    { time: '09 pm', val: 17, label: '185 µg', note: 'Commercial freight window' },
    { time: '12 am', val: 14, label: '150 µg', note: 'Nocturnal stagnation' },
    { time: '03 am', val: 11, label: '120 µg', note: 'Pre-dawn calm' },
  ];

  const width = 640;
  const height = 150;
  const padX = 40;
  const padTop = 35;
  const padBottom = 30;

  const chartW = width - padX * 2;
  const chartH = height - padTop - padBottom;

  const maxVal = 28;
  const minVal = 8;

  const getX = (i) => padX + (i / (chartPoints.length - 1)) * chartW;
  const getY = (val) => padTop + chartH - ((val - minVal) / (maxVal - minVal)) * chartH;

  // Build smooth bezier SVG path
  let pathD = `M ${getX(0)},${getY(chartPoints[0].val)}`;
  for (let i = 0; i < chartPoints.length - 1; i++) {
    const x0 = getX(i);
    const y0 = getY(chartPoints[i].val);
    const x1 = getX(i + 1);
    const y1 = getY(chartPoints[i + 1].val);
    const mx = (x0 + x1) / 2;
    pathD += ` C ${mx},${y0} ${mx},${y1} ${x1},${y1}`;
  }

  const areaD = `${pathD} L ${getX(chartPoints.length - 1)},${height - padBottom} L ${padX},${height - padBottom} Z`;

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-[#111827] border border-white/10 shadow-md select-none">
      
      {/* Header: Today / Week Toggle */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-4 text-xs font-bold font-sans">
          <button
            onClick={() => setActiveTab('today')}
            className={`transition-colors cursor-pointer ${
              activeTab === 'today' ? 'text-white font-extrabold border-b-2 border-[#10B981] pb-0.5' : 'text-slate-400 hover:text-white'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setActiveTab('week')}
            className={`transition-colors cursor-pointer ${
              activeTab === 'week' ? 'text-white font-extrabold border-b-2 border-[#10B981] pb-0.5' : 'text-slate-400 hover:text-white'
            }`}
          >
            4h Forecast
          </button>
        </div>

        {/* Spike Callout in Red */}
        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/40 text-[10px] font-mono">
          <AlertTriangle className="w-3 h-3 text-[#EF4444] animate-pulse" />
          <span>08:30 AM Forecast Spike</span>
        </div>
      </div>

      {/* SVG Curve Chart */}
      <div className="relative w-full overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-36 overflow-visible">
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.20" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Area fill */}
          <path d={areaD} fill="url(#chartGradient)" />

          {/* Smooth Line */}
          <path
            d={pathD}
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="2.2"
            strokeLinecap="round"
          />

          {/* Points & Numbers above points */}
          {chartPoints.map((pt, i) => {
            const cx = getX(i);
            const cy = getY(pt.val);

            return (
              <g key={i}>
                {/* Number above dot */}
                <text
                  x={cx}
                  y={cy - 10}
                  fill={pt.isPeak ? '#EF4444' : '#FFFFFF'}
                  fontSize="11"
                  fontWeight={pt.isPeak ? 'bold' : '600'}
                  fontFamily="Inter"
                  textAnchor="middle"
                >
                  {pt.val}
                </text>

                {/* Point circle */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={pt.isPeak ? 5 : 4}
                  fill={pt.isPeak ? '#EF4444' : '#FFFFFF'}
                  stroke="#111827"
                  strokeWidth="2"
                />

                {/* X-axis time label */}
                <text
                  x={cx}
                  y={height - padBottom + 18}
                  fill="#94A3B8"
                  fontSize="10"
                  fontFamily="Inter"
                  textAnchor="middle"
                >
                  {pt.time}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

    </div>
  );
}
