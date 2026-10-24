import React from 'react';

export default function HeroWeatherDecor({ className = 'w-44 h-40' }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 200 180" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        {/* Sun Gradient */}
        <radialGradient id="sunGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFF066" />
          <stop offset="70%" stopColor="#FF9E00" />
          <stop offset="100%" stopColor="#FF6B00" />
        </radialGradient>
        {/* Cloud Gradient 1 */}
        <linearGradient id="cloudGrad1" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#CBE2F4" />
        </linearGradient>
        {/* Cloud Gradient 2 */}
        <linearGradient id="cloudGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#F5FAFF" />
          <stop offset="100%" stopColor="#A8CDED" />
        </linearGradient>
        {/* Cloud Drop Shadow */}
        <filter id="softShadow" x="-10%" y="-10%" width="130%" height="130%">
          <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#0F1E36" floodOpacity="0.12" />
        </filter>
      </defs>

      {/* Radiant Sun behind clouds */}
      <circle cx="140" cy="55" r="34" fill="url(#sunGrad)" filter="url(#softShadow)" />
      
      {/* Sun Rays */}
      <g stroke="#FFA500" strokeWidth="3" strokeLinecap="round" opacity="0.6">
        <line x1="140" y1="12" x2="140" y2="4" />
        <line x1="172" y1="24" x2="178" y2="18" />
        <line x1="184" y1="55" x2="192" y2="55" />
        <line x1="172" y1="86" x2="178" y2="92" />
      </g>

      {/* Back Cloud */}
      <g filter="url(#softShadow)">
        <path 
          d="M60 100 C60 85 72 74 86 74 C92 74 98 76 103 80 C110 68 123 60 138 60 C158 60 174 76 174 96 C178 96 182 98 185 102 C189 106 191 112 191 118 C191 130 181 140 169 140 L70 140 C53 140 40 127 40 110 C40 96 50 84 64 82" 
          fill="url(#cloudGrad1)" 
        />
      </g>

      {/* Front Cloud */}
      <g filter="url(#softShadow)">
        <path 
          d="M45 130 C45 116 56 105 70 105 C75 105 80 107 84 110 C90 98 102 90 116 90 C135 90 150 105 150 124 C154 124 158 126 160 130 C163 134 165 139 165 144 C165 155 156 164 145 164 L55 164 C40 164 28 152 28 137 C28 124 37 113 49 111" 
          fill="url(#cloudGrad2)" 
        />
      </g>

      {/* Gentle Atmospheric Rain / Wind Telemetry Drops */}
      <g stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" opacity="0.75">
        <line x1="68" y1="168" x2="64" y2="176" />
        <line x1="94" y1="168" x2="90" y2="176" />
        <line x1="120" y1="168" x2="116" y2="176" />
      </g>
    </svg>
  );
}
