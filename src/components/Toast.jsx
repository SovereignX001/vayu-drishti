import React, { useEffect } from 'react';
import { CheckCircle2, X } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, 6000);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full sm:w-[420px] transition-all transform animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="rounded-[28px] border border-ink-800 bg-ink-900 p-5 shadow-frame backdrop-blur-xl ring-1 ring-white/10">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-2xl bg-accent/20 text-accent border border-accent/30 mt-0.5">
            <CheckCircle2 className="w-5 h-5 animate-pulse" />
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-accent font-bold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-ping" />
                Demo Alert
              </span>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-white p-1 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <h4 className="text-sm font-bold text-white mt-1">
              {toast.title || 'Demo Alert Triggered'}
            </h4>
            
            <p className="text-xs text-slate-300 font-medium mt-1 leading-relaxed">
              {toast.message}
            </p>

            {/* Delivery telemetry */}
            <div className="mt-3 pt-2.5 border-t border-white/10 grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-300">
              <div>
                <span className="text-slate-400 block text-[10px]">NOTIFICATION</span>
                <span className="font-semibold text-white">Local Device Audio</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">STATUS</span>
                <span className="font-semibold text-accent">Simulated Demo</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
