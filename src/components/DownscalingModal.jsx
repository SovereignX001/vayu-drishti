import React from 'react';
import { 
  X, 
  Cpu, 
  Satellite, 
  Wind, 
  Car, 
  CheckCircle2, 
  Activity,
  Sparkles
} from 'lucide-react';

export default function DownscalingModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl rounded-[32px] border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto text-slate-800">
        
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-[#00B37E]/15 text-[#00B37E] font-bold">
                Core Innovation Architecture
              </span>
              <span className="text-xs text-slate-400 font-mono">
                PINN-AeroFlow GAN v4.2
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 font-sans">
              Why Vayu Drishti Beats Coarse City-Wide AQI
            </h3>
            <p className="text-xs text-slate-500 mt-1 font-sans">
              Addressing coarse 10km regional reporting by fusing multi-modal telemetry into a 250m hyper-local grid.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comparison: The Problem vs Vayu Drishti */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-5 relative z-10">
          
          {/* Traditional AQI */}
          <div className="p-5 rounded-2xl border border-[#EF4444]/30 bg-[#FFF5F5]">
            <div className="flex items-center gap-2 text-[#DC2626] font-bold text-xs uppercase font-mono mb-2.5">
              <span className="w-2 h-2 rounded-full bg-[#DC2626]" />
              Traditional City-Wide AQI (10km Coarse)
            </div>
            <ul className="space-y-2 text-xs text-slate-600">
              <li className="flex items-start gap-2">
                <span className="text-[#DC2626] font-bold">✕</span>
                Single generalized number for an entire 400 sq km metro city (e.g. "AQI 190").
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#DC2626] font-bold">✕</span>
                Only 1-2 government reference monitors spaced 15 km apart.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#DC2626] font-bold">✕</span>
                Blind to hyper-local traps: Residential sectors next to freight bypasses report safe when actually toxic.
              </li>
            </ul>
          </div>

          {/* Vayu Drishti Solution */}
          <div className="p-5 rounded-2xl border border-[#00B37E]/30 bg-[#F0FAF6]">
            <div className="flex items-center gap-2 text-[#00B37E] font-bold text-xs uppercase font-mono mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-[#00B37E]" />
              Vayu Drishti Hyper-Local Engine (250m Resolution)
            </div>
            <ul className="space-y-2 text-xs text-slate-700">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#00B37E] flex-shrink-0 mt-0.5" />
                Differentiates neighboring sectors: Anand Vihar (340) vs Lodhi Gardens (65).
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#00B37E] flex-shrink-0 mt-0.5" />
                Temporal GAN predicts toxic spikes 1-3 hours in advance before morning traffic.
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#00B37E] flex-shrink-0 mt-0.5" />
                Actionable citizen guidance: Know when it's safe for a picnic vs when to travel with an N95 mask.
              </li>
            </ul>
          </div>

        </div>

        {/* Multi-Modal Fusion Pipeline */}
        <div className="border border-slate-200 rounded-2xl bg-slate-50 p-5 relative z-10">
          <h4 className="text-xs font-mono uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2 font-bold">
            <Cpu className="w-4 h-4 text-slate-700" />
            4-Stream Multi-Modal Downscaling Pipeline
          </h4>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
              <Satellite className="w-4 h-4 text-slate-700 mb-1" />
              <p className="text-xs font-bold text-slate-900">Satellite TROPOMI</p>
              <p className="text-[10px] text-slate-500">Sentinel-5P AOD & NO2 columnar density</p>
            </div>
            <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
              <Wind className="w-4 h-4 text-[#00B37E] mb-1" />
              <p className="text-xs font-bold text-slate-900">Micro-Meteorology</p>
              <p className="text-[10px] text-slate-500">Boundary layer height & thermal inversion</p>
            </div>
            <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
              <Car className="w-4 h-4 text-[#F59E0B] mb-1" />
              <p className="text-xs font-bold text-slate-900">Traffic Congestion</p>
              <p className="text-[10px] text-slate-500">Real-time diesel corridor idling index</p>
            </div>
            <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
              <Activity className="w-4 h-4 text-[#DC2626] mb-1" />
              <p className="text-xs font-bold text-slate-900">Ground IoT Mesh</p>
              <p className="text-[10px] text-slate-500">142 calibrated low-cost particle sensors</p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600">
            <span className="font-mono text-slate-800 font-semibold">
              AI Output: Physics-Informed Neural Network (PINN) Super-Resolution Mesh
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-[#00B37E]/10 font-mono text-[11px] text-[#00B37E] font-bold self-start sm:self-auto">
              Accuracy: 97.6% (Validated vs CPCB reference)
            </span>
          </div>
        </div>

        {/* Modal Close CTA */}
        <div className="mt-5 flex justify-end relative z-10">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-2xl bg-[#00B37E] hover:bg-[#009B6D] text-white font-bold text-xs transition-all cursor-pointer shadow-xs"
          >
            Back to Dashboard
          </button>
        </div>

      </div>
    </div>
  );
}