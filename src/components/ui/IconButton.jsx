import React from 'react';

export default function IconButton({ 
  children, 
  onClick, 
  title, 
  ariaLabel, 
  className = '', 
  variant = 'default',
  active = false,
  ...props 
}) {
  const base = 'w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent';
  const variants = {
    default: active 
      ? 'bg-accent text-white shadow-sm' 
      : 'bg-white hover:bg-slate-100 text-ink-700 border border-slate-200/80 shadow-2xs hover:text-ink-900',
    soft: active 
      ? 'bg-accent/15 text-accent border border-accent/30' 
      : 'bg-slate-100/80 hover:bg-slate-200 text-ink-600 hover:text-ink-900',
    orange: 'bg-accent hover:bg-accent-hover text-white shadow-sm',
    lime: 'bg-lime hover:bg-lime-hover text-lime-dark shadow-sm',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={ariaLabel || title}
      className={`${base} ${variants[variant] || variants.default} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
