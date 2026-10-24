import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon } from 'lucide-react';

export default function SettingsView() {
  const [aqiThreshold, setAqiThreshold] = useState(() => {
    try {
      const saved = localStorage.getItem('vayu_settings_aqiThreshold');
      return saved ? Number(saved) : 250;
    } catch {
      return 250;
    }
  });

  const [whatsappEnabled, setWhatsappEnabled] = useState(() => {
    try {
      const saved = localStorage.getItem('vayu_settings_whatsapp');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const [smsEnabled, setSmsEnabled] = useState(() => {
    try {
      const saved = localStorage.getItem('vayu_settings_sms');
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('vayu_settings_aqiThreshold', String(aqiThreshold));
    } catch {
      // Ignore localStorage write errors
    }
  }, [aqiThreshold]);

  useEffect(() => {
    try {
      localStorage.setItem('vayu_settings_whatsapp', JSON.stringify(whatsappEnabled));
    } catch {
      // Ignore localStorage write errors
    }
  }, [whatsappEnabled]);

  useEffect(() => {
    try {
      localStorage.setItem('vayu_settings_sms', JSON.stringify(smsEnabled));
    } catch {
      // Ignore localStorage write errors
    }
  }, [smsEnabled]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200 max-w-4xl mx-auto">
      <div className="pb-3 border-b border-slate-200/80">
        <div className="flex flex-wrap items-center gap-2.5">
          <h3 className="text-xl font-black text-ink-900 flex items-center gap-2 font-sans">
            <SettingsIcon className="w-5 h-5 text-accent" />
            Vayu Drishti Alert Thresholds & Notification Gateways
          </h3>
          <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 border border-amber-300">
            Demo preview
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Configure simulated trigger sensitivities for travel advisories, park outings, and mask reminders
        </p>
      </div>

      <div className="p-6 sm:p-7 rounded-[32px] bg-white border border-slate-100 shadow-soft space-y-4">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">
          Automated Travel & Outing Alert Threshold
        </h4>
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-700 font-semibold">Preemptive Mask & Delay Advisory Threshold</span>
            <span className="text-sm font-bold font-mono text-[#DC2626]">{aqiThreshold} AQI</span>
          </div>
          <input
            type="range"
            min="100"
            max="400"
            step="10"
            value={aqiThreshold}
            onChange={(e) => setAqiThreshold(Number(e.target.value))}
            aria-label="Preemptive Mask and Delay Advisory AQI Threshold"
            className="w-full accent-[#DC2626] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
            <span>100 (Moderate Outings)</span>
            <span>250 (Travel Advisory / Mask Mandatory)</span>
            <span>400 (Hazardous Inversion)</span>
          </div>
        </div>
      </div>

      <div className="p-6 sm:p-7 rounded-[32px] bg-white border border-slate-100 shadow-soft space-y-4">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">
          Automated Emergency Broadcast Channels
        </h4>
        <div className="space-y-3">
          <label className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200/80 cursor-pointer hover:bg-slate-100/60 transition-colors">
            <div>
              <p className="text-xs font-bold text-ink-900">WhatsApp Alert Notifications</p>
              <p className="text-[10px] text-slate-500">Instant notification when your micro-zone crosses your threshold</p>
            </div>
            <input 
              type="checkbox" 
              checked={whatsappEnabled} 
              onChange={() => setWhatsappEnabled(!whatsappEnabled)}
              aria-label="Toggle WhatsApp alert notifications"
              className="w-4 h-4 accent-accent cursor-pointer focus-visible:ring-2 focus-visible:ring-accent" 
            />
          </label>

          <label className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200/80 cursor-pointer hover:bg-slate-100/60 transition-colors">
            <div>
              <p className="text-xs font-bold text-ink-900">SMS Outing Advisory Push</p>
              <p className="text-[10px] text-slate-500">Direct carrier text alert for morning travel warnings</p>
            </div>
            <input 
              type="checkbox" 
              checked={smsEnabled} 
              onChange={() => setSmsEnabled(!smsEnabled)}
              aria-label="Toggle SMS outing advisory push"
              className="w-4 h-4 accent-accent cursor-pointer focus-visible:ring-2 focus-visible:ring-accent" 
            />
          </label>
        </div>
      </div>
    </div>
  );
}
