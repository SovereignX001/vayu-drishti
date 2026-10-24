import React from 'react';
import { Clock, AlertTriangle, CheckCircle2, Trees, Car, Coffee, Footprints } from 'lucide-react';

export default function CalendarView({ onTriggerAlert, alertState }) {
  const events = [
    {
      time: '06:30 AM - 08:00 AM',
      title: 'Morning Jog, Cycling & Park Walks',
      activityType: 'Outdoor Fitness & Parks',
      aqiPredicted: 180,
      status: 'Meerut Cantt Safe • Delay in Partapur Corridor',
      severity: 'moderate',
      icon: Footprints
    },
    {
      time: '08:15 AM - 10:00 AM',
      title: 'Peak Morning Commute & Highway Transit',
      activityType: 'Road Transit & Travel',
      aqiPredicted: 345,
      status: 'Travel with an N95 Mask • Delay Non-Essential Trips',
      severity: 'severe',
      icon: Car
    },
    {
      time: '12:30 PM - 02:30 PM',
      title: 'Park Picnics & Outdoor Dining Window',
      activityType: 'Picnics & Leisure Outings',
      aqiPredicted: 110,
      status: 'Optimal Window for Picnics at Meerut Cantt Woodlands',
      severity: 'good',
      icon: Trees
    },
    {
      time: '05:30 PM - 07:30 PM',
      title: 'Evening Commute & Market Visits',
      activityType: 'Evening Transit & Shopping',
      aqiPredicted: 245,
      status: 'Heavy Traffic Rush • Keep Car Cabin on Recirculate',
      severity: 'moderate',
      icon: Coffee
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200 max-w-6xl mx-auto">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h3 className="text-xl font-black text-ink-900 font-sans">
              Meerut Daily Activity & Outing Planner
            </h3>
            <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 border border-amber-300">
              Sample schedule
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Location-specific safe windows for citizen commute, picnics, and exercise across your region
          </p>
          <p className="text-xs text-slate-500">
            Smart air quality scheduling for picnics, morning runs, commutes, and outdoor plans
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {events.map((ev, i) => {
          const Icon = ev.icon;
          return (
            <div 
              key={i}
              className={`p-6 rounded-[28px] border transition-all shadow-soft hover:shadow-md ${
                ev.severity === 'severe'
                  ? 'bg-[#FFF5F5] border-[#FECACA]'
                  : ev.severity === 'good'
                  ? 'bg-[#F0FAF6] border-[#A7F3D0]'
                  : 'bg-white border-slate-100'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    ev.severity === 'severe'
                      ? 'bg-[#FDECEC] text-[#DC2626]'
                      : ev.severity === 'good'
                      ? 'bg-lime/30 text-ink-900'
                      : 'bg-slate-100 text-slate-700'
                  }`}>
                    <Icon className="w-6 h-6" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-700 flex items-center gap-1.5 bg-white/70 px-2.5 py-0.5 rounded-full border border-slate-200/50">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {ev.time}
                      </span>
                      <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold ${
                        ev.severity === 'severe' 
                          ? 'bg-[#FEE2E2] text-[#DC2626]' 
                          : ev.severity === 'good'
                          ? 'bg-[#D1F2E5] text-[#00875A]'
                          : 'bg-[#FEF0D0] text-[#B45309]'
                      }`}>
                        Predicted AQI {ev.aqiPredicted}
                      </span>
                    </div>

                    <h4 className="text-base font-black text-ink-900">{ev.title}</h4>
                    <p className="text-xs text-slate-500">
                      {ev.activityType}
                    </p>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <span className={`inline-block text-xs font-bold px-4 py-2 rounded-full border shadow-2xs ${
                    ev.severity === 'severe'
                      ? 'bg-[#DC2626] text-white border-[#DC2626]'
                      : ev.severity === 'good'
                      ? 'bg-[#00875A] text-white border-[#00875A]'
                      : 'bg-white text-slate-800 border-slate-200'
                  }`}>
                    {ev.status}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
