import React from 'react';

/**
 * TomorrowCleanAirDecor - Clean atmospheric weather vector illustration.
 * Features weather protection and atmospheric clean-air wind currents (100% natural, zero human figures).
 */
export default function TomorrowCleanAirDecor({ className = 'w-36 h-28' }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 180 160" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ maxWidth: '160px', maxHeight: '130px' }}
    >
      <defs>
        <linearGradient id="umbrellaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF7A30" />
          <stop offset="100%" stopColor="#E24C00" />
        </linearGradient>
        <linearGradient id="leafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#84CC16" />
          <stop offset="100%" stopColor="#4D7C0F" />
        </linearGradient>
        <linearGradient id="sunGlow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FDE047" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
      </defs>

      {/* Atmospheric rain and wind vectors */}
      <g stroke="#65A30D" strokeWidth="2" strokeLinecap="round" opacity="0.65">
        <line x1="20" y1="12" x2="14" y2="34" />
        <line x1="48" y1="6" x2="42" y2="28" />
        <line x1="82" y1="14" x2="76" y2="38" />
        <line x1="120" y1="8" x2="114" y2="30" />
        <line x1="152" y1="18" x2="146" y2="40" />
      </g>

      {/* Gentle Sun behind umbrella */}
      <circle cx="142" cy="46" r="22" fill="url(#sunGlow)" opacity="0.9" />

      {/* Clean Air Breeze Flow Spirals */}
      <path 
        d="M10 110 C35 95 65 125 100 115 C135 105 160 120 175 110" 
        stroke="#475569" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        strokeDasharray="4 4"
        opacity="0.45" 
      />
      <path 
        d="M20 130 C50 118 80 142 120 132 C150 124 168 135 178 130" 
        stroke="#475569" 
        strokeWidth="2" 
        strokeLinecap="round" 
        opacity="0.35" 
      />

      {/* Large Weather Umbrella (Symbol of Atmospheric Advisory) */}
      <path 
        d="M32 82 C32 40 70 26 95 26 C120 26 158 40 158 82 Z" 
        fill="url(#umbrellaGrad)" 
      />
      {/* Umbrella segments */}
      <path d="M95 26 Q70 58 60 82" stroke="#BF360C" strokeWidth="1.8" fill="none" opacity="0.5" />
      <path d="M95 26 Q120 58 130 82" stroke="#BF360C" strokeWidth="1.8" fill="none" opacity="0.5" />
      <line x1="95" y1="20" x2="95" y2="26" stroke="#0F1E36" strokeWidth="2.5" strokeLinecap="round" />
      
      {/* Umbrella Shaft & Hook Handle */}
      <line x1="95" y1="82" x2="95" y2="135" stroke="#0F1E36" strokeWidth="3" strokeLinecap="round" />
      <path d="M95 135 C95 144 87 148 81 144 C76 140 78 132 83 133" stroke="#0F1E36" strokeWidth="3" fill="none" strokeLinecap="round" />

      {/* Fresh Green Foliage Leaf at base representing Clean Air Restoration */}
      <path 
        d="M108 138 C120 122 144 122 152 134 C140 146 118 148 108 138 Z" 
        fill="url(#leafGrad)" 
      />
      <path 
        d="M108 138 Q130 132 152 134" 
        stroke="#FFFFFF" 
        strokeWidth="1.2" 
        strokeLinecap="round" 
        opacity="0.7" 
      />
      <path 
        d="M125 146 C134 136 150 138 156 146 C148 154 132 154 125 146 Z" 
        fill="url(#leafGrad)" 
        opacity="0.85" 
      />
    </svg>
  );
}
