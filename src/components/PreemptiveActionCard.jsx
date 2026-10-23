import React from 'react';
import { 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  Check,
  Car
} from 'lucide-react';

export default function PreemptiveActionCard({ 
  zone, 
  onTriggerAlert, 
  alertState 
}) {
  const isDispatched = alertState.dispatched && alertState.zoneId === zone.id;

  return (
    <div className="p-6 rounded-[28px] bg-white border border-slate-200/90 shadow-xs select-none">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#FDECEC] text-[#DC2626] flex items-center justify-center font-bold">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
              Travel & Outing Advisory
            </h4>
            <p className="text-[10px] text-slate-400">
              Citizen Protection • AI Prescriptive Mitigation
            </p>
          </div>
        </div>

        <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
          Peak Window: 08:00 - 10:30 AM
        </span>
      </div>

      {/* Advisory Content for Everyone */}
      <div className="space-y-3">
        <div className="p-3.5 rounded-2xl bg-[#FFF5F5] border border-[#FECACA]">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-[#DC2626] flex-shrink-0 mt-0.5 animate-pulse" />
            <p className="text-xs font-bold text-slate-900 leading-snug">
              {zone.advisory.resident.headline}
            </p>
          </div>
          <p className="text-[11px] text-slate-600 mt-1 pl-6">
            Predicted AQI exceeds 250 threshold. Not a good day for a picnic or outdoor exercise. Delay road travel during peak rush.
          </p>
        </div>

        {/* Universal Precautions Checklist */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center gap-2 text-[11px] text-slate-700 font-medium">
            <span className="w-4 h-4 rounded-full bg-[#EBF7F2] text-[#00B37E] flex items-center justify-center flex-shrink-0">
              <Check className="w-2.5 h-2.5" />
            </span>
            <span>Not a good day for a picnic; shift outdoor gatherings indoors</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-700 font-medium">
            <span className="w-4 h-4 rounded-full bg-[#EBF7F2] text-[#00B37E] flex items-center justify-center flex-shrink-0">
              <Check className="w-2.5 h-2.5" />
            </span>
            <span>Travel with an N95 mask or delay non-essential morning transit</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-700 font-medium">
            <span className="w-4 h-4 rounded-full bg-[#EBF7F2] text-[#00B37E] flex items-center justify-center flex-shrink-0">
              <Check className="w-2.5 h-2.5" />
            </span>
            <span>Keep home & car windows sealed with air purifiers on high mode</span>
          </div>
        </div>

        {/* Universal One-Click Action Trigger Button */}
        <button
          onClick={() => onTriggerAlert(zone)}
          disabled={isDispatched}
          className={`w-full py-3.5 px-4 rounded-2xl font-bold text-xs transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-sm mt-2 ${
            isDispatched
              ? 'bg-[#00B37E] text-white cursor-default'
              : 'bg-[#DC2626] hover:bg-[#B91C1C] text-white active:scale-[0.99]'
          }`}
        >
          {isDispatched ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-white animate-bounce" />
              <span>Advisory Dispatched to Family & Contacts</span>
            </>
          ) : (
            <>
              <Send className="w-3.5 h-3.5 text-white" />
              <span>One-Click Action: Dispatch Clean Air Travel Advisory</span>
            </>
          )}
        </button>

        {isDispatched && (
          <div className="flex items-center justify-between text-[10px] font-mono text-[#00B37E] px-1 font-bold">
            <span>✓ Broadcast ID: #VAYU-9941 delivered via WhatsApp & SMS</span>
            <button
              onClick={() => onTriggerAlert(null, true)}
              className="text-slate-500 hover:text-slate-800 underline cursor-pointer"
            >
              Reset
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
