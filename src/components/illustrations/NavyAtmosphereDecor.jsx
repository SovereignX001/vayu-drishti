import React from 'react';

export default function NavyAtmosphereDecor({ className = 'w-28 h-24' }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 140 120" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ maxWidth: '120px', maxHeight: '100px' }}
    >
      <defs>
        <radialGradient id="sunMoonGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFF785" />
          <stop offset="70%" stopColor="#FFAA00" />
          <stop offset="100%" stopColor="#FF7700" />
        </radialGradient>
        <linearGradient id="nightCloud" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#F0F6FC" />
          <stop offset="100%" stopColor="#94B3D4" />
        </linearGradient>
      </defs>

      {/* Sparkling Stars */}
      <circle cx="25" cy="20" r="1.5" fill="#FFFFFF" opacity="0.8" />
      <circle cx="50" cy="12" r="2" fill="#FFFFFF" opacity="0.9" />
      <circle cx="85" cy="24" r="1.5" fill="#FFFFFF" opacity="0.7" />
      <circle cx="35" cy="45" r="1" fill="#FFFFFF" opacity="0.6" />

      {/* Radiant Sun/Moon orb */}
      <circle cx="100" cy="45" r="26" fill="url(#sunMoonGrad)" />

      {/* Soft Night/Atmosphere Cloud */}
      <path 
        d="M40 85 C40 73 49 64 61 64 C66 64 71 66 75 69 C80 59 90 52 102 52 C118 52 131 65 131 81 C134 81 137 83 139 86 C141 89 143 93 143 97 C143 106 135 114 125 114 L50 114 C36 114 26 104 26 91 C26 79 34 70 45 68" 
        fill="url(#nightCloud)" 
      />

      {/* Blue condensation raindrops */}
      <g stroke="#60A5FA" strokeWidth="2.5" strokeLinecap="round" opacity="0.8">
        <line x1="58" y1="120" x2="55" y2="127" />
        <line x1="78" y1="120" x2="75" y2="127" />
        <line x1="98" y1="120" x2="95" y2="127" />
      </g>
    </svg>
  );
}
