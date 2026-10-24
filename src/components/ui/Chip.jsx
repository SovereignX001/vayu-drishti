import React from 'react';

export default function Chip({ 
  children, 
  variant = 'white', 
  className = '', 
  ...props 
}) {
  const base = 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-bold transition-all';
  const variants = {
    white: 'bg-white/95 text-ink-900 border border-slate-200/80 shadow-chip',
    lime: 'bg-lime text-lime-dark font-extrabold shadow-chip',
    navy: 'bg-ink-900 text-white shadow-chip',
    accent: 'bg-accent text-white shadow-chip',
    muted: 'bg-slate-100 text-ink-600 border border-slate-200/60',
  };

  return (
    <span className={`${base} ${variants[variant] || variants.white} ${className}`} {...props}>
      {children}
    </span>
  );
}
