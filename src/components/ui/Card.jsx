import React from 'react';

export default function Card({ 
  children, 
  className = '', 
  variant = 'white', 
  ...props 
}) {
  const base = 'rounded-[28px] transition-lift overflow-hidden';
  const variants = {
    white: 'bg-white border border-slate-200/70 shadow-soft',
    mist: 'bg-brand-mist border border-slate-200/60 shadow-soft',
    navy: 'bg-[#0F1E36] text-white border border-slate-800 shadow-lg',
    lime: 'bg-[#D2F54D] text-[#1C2C0B] shadow-md border border-[#C4EC38]',
    gradient: 'bg-gradient-to-br from-[#9EE3DB]/30 via-[#C6ECE6]/20 to-[#FBD9CB]/50 border border-teal-100/60 shadow-soft',
  };

  return (
    <div className={`${base} ${variants[variant] || variants.white} ${className}`} {...props}>
      {children}
    </div>
  );
}
