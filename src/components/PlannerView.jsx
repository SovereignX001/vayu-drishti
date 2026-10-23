import React, { useState } from 'react';
import { 
  Clock, 
  Bell, 
  AlertTriangle, 
  CheckCircle2, 
  Trash2, 
  Car,
  Trees
} from 'lucide-react';
import { DELHI_LANDMARKS } from '../data/airData';

export default function PlannerView({ onTriggerAlert, toast, setToast }) {
  const [hoursAhead, setHoursAhead] = useState(3);
  const [selectedLocation, setSelectedLocation] = useState('Partapur Industrial Area & DME Link');
  const [selectedActivity, setSelectedActivity] = useState('Family Picnic & Park Outing');
  const [alertThreshold, setAlertThreshold] = useState(250);
  
  const [scheduledReminders, setScheduledReminders] = useState([
    {
      id: 1,
      targetTime: '08:30 AM Tomorrow',
      hoursLabel: '+3 Hours',
      location: 'Partapur Industrial Area - South Meerut Corridor',
      activity: 'Morning Highway Commute',
      predictedAqi: 345,
      threshold: 250,
      status: 'Active Alert Armed',
      severity: 'severe'
    }
  ]);

  const getFutureSituation = (hours, locationName) => {
    const isPartapur = locationName.includes('Partapur');
    const isCantt = locationName.includes('Cantt');
    const isShastri = locationName.includes('Shastri');

    let baseAqi = isPartapur ? 345 : isCantt ? 58 : isShastri ? 125 : 220;

    let futureAqi = baseAqi;
    let note = '';
    let inversion = '180m Boundary Trapped';

    if (hours <= 2) {
      futureAqi = Math.round(baseAqi * 1.08);
      note = 'Morning commuter build-up begins; nocturnal cooling traps particulate matter';
    } else if (hours <= 4) {
      futureAqi = isLodhi ? 85 : Math.round(baseAqi * 1.15);
      note = 'Critical spike window: not a good time for a picnic or outdoor runs. Travel with an N95 mask.';
      inversion = 'Severe 160m Ceiling';
    } else if (hours <= 7) {
      futureAqi = isLodhi ? 70 : Math.round(baseAqi * 0.85);
      note = 'Solar heating activates thermal lifting; afternoon is great for a picnic or park outing';
      inversion = 'Lifted to 450m';
    } else {
      futureAqi = isLodhi ? 60 : Math.round(baseAqi * 0.90);
      note = 'Stable afternoon mixing layer; lowest daily particulate ceiling';
      inversion = 'Optimal 600m Ceiling';
    }

    return {
      aqi: futureAqi,
      pm25: Math.round(futureAqi * 0.82),
      inversion,
      note,
      isHazardous: futureAqi > 200,
      isModerate: futureAqi > 70 && futureAqi <= 200,
      isGood: futureAqi <= 70
    };
  };

  const situation = getFutureSituation(hoursAhead, selectedLocation);

  const handleSetReminder = () => {
    const targetHour = new Date();
    targetHour.setHours(targetHour.getHours() + hoursAhead);
    const timeString = targetHour.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newReminder = {
      id: Date.now(),
      targetTime: `${timeString} (+${hoursAhead}h)`,
      hoursLabel: `+${hoursAhead} Hrs`,
      location: selectedLocation,
      activity: selectedActivity,
      predictedAqi: situation.aqi,
      threshold: alertThreshold,
      status: 'Active Alert Armed',
      severity: situation.isHazardous ? 'severe' : situation.isModerate ? 'moderate' : 'good'
    };

    setScheduledReminders((prev) => [newReminder, ...prev]);

    if (setToast) {
      setToast({
        title: 'Vayu Drishti Reminder Set',
        message: `Alert scheduled for ${selectedActivity} at ${selectedLocation} (${timeString}). We will alert you if AQI exceeds ${alertThreshold}.`,
      });
    }
  };

  const handleDeleteReminder = (id) => {
    setScheduledReminders((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Clock className="w-6 h-6 text-[#00B37E]" />
            10-Hour Air Planner & Outing Reminder
          </h3>
          <p className="text-xs text-slate-500">
            Check forward air trajectories up to 10 hours ahead and arm automatic alerts for picnics, travel, and outings
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#EBF7F2] text-[#00B37E] text-xs font-bold font-mono">
          <span className="w-2 h-2 rounded-full bg-[#00B37E] animate-ping" />
          <span>Automated Push Dispatch Active</span>
        </div>
      </div>

      {/* Main Two-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left: Hour Selector & Situation */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Hour Selector */}
          <div className="p-6 rounded-[28px] bg-white border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
                Select Forecast Horizon
              </span>
              <span className="text-sm font-extrabold font-mono text-[#00B37E] bg-[#EBF7F2] px-3.5 py-1 rounded-full">
                +{hoursAhead} {hoursAhead === 1 ? 'Hour' : 'Hours'} Ahead
              </span>
            </div>

            {/* Quick 1h to 10h Pills */}
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((h) => (
                <button
                  key={h}
                  onClick={() => setHoursAhead(h)}
                  className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer font-mono ${
                    hoursAhead === h
                      ? 'bg-[#00B37E] text-white border-[#00B37E] shadow-sm'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200/60'
                  }`}
                >
                  +{h}h
                </button>
              ))}
            </div>

            <input
              type="range"
              min="1"
              max="10"
              value={hoursAhead}
              onChange={(e) => setHoursAhead(parseInt(e.target.value))}
              className="w-full accent-[#00B37E] cursor-pointer"
            />
          </div>

          {/* Forecasted Situation */}
          <div className={`p-6 rounded-[28px] border shadow-xs transition-all ${
            situation.isHazardous
              ? 'bg-[#FFF5F5] border-[#FECACA]'
              : situation.isModerate
              ? 'bg-[#FEF9EE] border-[#FDE68A]'
              : 'bg-[#F0FAF6] border-[#A7F3D0]'
          }`}>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono block">
                  Projected Situation (+{hoursAhead}h)
                </span>
                <h4 className="text-xl font-black text-slate-900 mt-0.5">
                  {selectedLocation}
                </h4>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-mono text-slate-400 block font-bold">Predicted AQI</span>
                <span className={`text-4xl font-black font-sans ${
                  situation.isHazardous ? 'text-[#DC2626]' : situation.isModerate ? 'text-[#D97706]' : 'text-[#00B37E]'
                }`}>
                  {situation.aqi}
                </span>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 my-3 pt-3 border-t border-slate-200/60 text-xs font-mono">
              <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
                <span className="text-[10px] text-slate-400 block font-bold">PREDICTED PM2.5</span>
                <span className="font-extrabold text-slate-900 text-base">{situation.pm25} µg/m³</span>
              </div>
              <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
                <span className="text-[10px] text-slate-400 block font-bold">INVERSION CEILING</span>
                <span className="font-extrabold text-slate-900 text-base">{situation.inversion}</span>
              </div>
              <div className="p-3 rounded-2xl bg-white border border-slate-200/80 shadow-xs col-span-2 sm:col-span-1">
                <span className="text-[10px] text-slate-400 block font-bold">OUTING STATUS</span>
                <span className={`font-extrabold text-base ${
                  situation.isHazardous ? 'text-[#DC2626]' : situation.isModerate ? 'text-[#D97706]' : 'text-[#00B37E]'
                }`}>
                  {situation.isHazardous ? 'Delay Travel' : situation.isModerate ? 'Moderate' : 'Picnic Approved'}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed pt-1">
              <strong>Tip for Citizens:</strong> {situation.note}
            </p>
          </div>

        </div>

        {/* Right: Arm Reminder Form */}
        <div className="lg:col-span-5 space-y-5">
          
          <div className="p-6 rounded-[28px] bg-white border border-slate-200/90 shadow-xs space-y-4">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#00B37E]" />
              Arm Automated Outing Alert
            </h4>

            <div>
              <label className="text-[11px] font-mono font-bold text-slate-500 block mb-1">
                TARGET LOCATION
              </label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#00B37E]"
              >
                {DELHI_LANDMARKS.map((lm) => (
                  <option key={lm.num} value={lm.name}>
                    [{lm.num}] {lm.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-mono font-bold text-slate-500 block mb-1">
                PLANNED OUTING OR ACTIVITY
              </label>
              <select
                value={selectedActivity}
                onChange={(e) => setSelectedActivity(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:border-[#00B37E]"
              >
                <option value="Family Picnic & Park Outing">Family Picnic & Park Outing</option>
                <option value="Morning Jog, Cycling & Workout">Morning Jog, Cycling & Workout</option>
                <option value="Daily Office & Road Transit">Daily Office & Road Transit</option>
                <option value="Highway Transit & Inter-City Travel">Highway Transit & Inter-City Travel</option>
                <option value="Evening Walk & Outdoor Dining">Evening Walk & Outdoor Dining</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1 font-mono font-bold">
                <span className="text-slate-500">ALERT THRESHOLD</span>
                <span className="text-[#DC2626]">{alertThreshold} AQI</span>
              </div>
              <input
                type="range"
                min="100"
                max="400"
                step="10"
                value={alertThreshold}
                onChange={(e) => setAlertThreshold(parseInt(e.target.value))}
                className="w-full accent-[#DC2626] cursor-pointer"
              />
            </div>

            <button
              onClick={handleSetReminder}
              className="w-full py-3.5 px-4 rounded-2xl bg-[#00B37E] hover:bg-[#059669] text-white font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <Bell className="w-4 h-4" />
              <span>Set Automated Alert & Reminder</span>
            </button>
          </div>

          {/* Active Alerts List */}
          <div className="p-6 rounded-[28px] bg-white border border-slate-200/90 shadow-xs space-y-3">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono flex items-center justify-between">
              <span>Active Scheduled Alerts ({scheduledReminders.length})</span>
              <span className="text-[#00B37E] text-[10px]">Auto-Monitor Active</span>
            </h4>

            <div className="space-y-2">
              {scheduledReminders.map((rem) => (
                <div
                  key={rem.id}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-2"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-800">
                        {rem.targetTime}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-[#DC2626]">
                        Pred: {rem.predictedAqi} AQI
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-900">{rem.activity}</p>
                    <p className="text-[10px] text-slate-500 font-mono truncate">{rem.location}</p>
                  </div>

                  <button
                    onClick={() => handleDeleteReminder(rem.id)}
                    className="p-1 text-slate-400 hover:text-[#DC2626] transition-colors cursor-pointer"
                    title="Delete reminder"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
