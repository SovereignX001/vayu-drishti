import React, { useState } from 'react';
import { Settings as SettingsIcon, Bell, Shield, Sliders, CheckCircle2 } from 'lucide-react';

export default function SettingsView() {
  const [aqiThreshold, setAqiThreshold] = useState(250);
  const [whatsappEnabled, setWhatsappEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(true);

  return (
    <div className="space-y-6 animate-in fade-in duration-200 max-w-4xl mx-auto">
      <div className="pb-3 border-b border-slate-200">
        <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-[#00B37E]" />
          Vayu Drishti Alert Thresholds & Notification Gateways
        </h3>
        <p className="text-xs text-slate-500">
          Configure automated trigger sensitivities for travel advisories, park outings, and mask reminders
        </p>
      </div>

      <div className="p-6 rounded-[26px] bg-white border border-slate-200/90 shadow-xs space-y-4">
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
            onChange={(e) => setAqiThreshold(e.target.value)}
            className="w-full accent-[#DC2626] cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
            <span>100 (Moderate Outings)</span>
            <span>250 (Travel Advisory / Mask Mandatory)</span>
            <span>400 (Hazardous Inversion)</span>
          </div>
        </div>
      </div>

      <div className="p-6 rounded-[26px] bg-white border border-slate-200/90 shadow-xs space-y-4">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">
          Automated Emergency Broadcast Channels
        </h4>
        <div className="space-y-3">
          <label className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer">
            <div>
              <p className="text-xs font-bold text-slate-900">WhatsApp Alert Notifications</p>
              <p className="text-[10px] text-slate-500">Instant notification when your micro-zone crosses your threshold</p>
            </div>
            <input 
              type="checkbox" 
              checked={whatsappEnabled} 
              onChange={() => setWhatsappEnabled(!whatsappEnabled)}
              className="w-4 h-4 accent-[#00B37E]" 
            />
          </label>

          <label className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer">
            <div>
              <p className="text-xs font-bold text-slate-900">SMS Outing Advisory Push</p>
              <p className="text-[10px] text-slate-500">Direct carrier text alert for morning travel warnings</p>
            </div>
            <input 
              type="checkbox" 
              checked={smsEnabled} 
              onChange={() => setSmsEnabled(!smsEnabled)}
              className="w-4 h-4 accent-[#00B37E]" 
            />
          </label>
        </div>
      </div>
    </div>
  );
}
