import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Clock, 
  Calendar as CalendarIcon, 
  Plus, 
  Trash2, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle, 
  Trees, 
  Car, 
  Coffee, 
  Footprints, 
  Bike, 
  Smile, 
  HeartPulse, 
  Wind, 
  Activity, 
  X, 
  Sparkles,
  RefreshCw,
  Info
} from 'lucide-react';
import { fetchHourlyForecast5Day } from '../lib/api';

const ACTIVITY_TEMPLATES = [
  { id: 'running', label: 'Morning Jog & Running', type: 'Outdoor Fitness', icon: Footprints, defaultHours: [6, 8], sensitive: false },
  { id: 'cycling', label: 'Cycling & Road Transit', type: 'Cardio Transit', icon: Bike, defaultHours: [7, 8], sensitive: false },
  { id: 'kids_play', label: 'Kids Playground & Sports', type: 'Children Activity', icon: Smile, defaultHours: [16, 18], sensitive: true },
  { id: 'picnic', label: 'Park Picnic & Dining', type: 'Leisure Outing', icon: Trees, defaultHours: [12, 14], sensitive: false },
  { id: 'commute', label: 'Peak Commute & Transit', type: 'Road Commute', icon: Car, defaultHours: [8, 10], sensitive: false },
  { id: 'evening_walk', label: 'Evening Stroll & Markets', type: 'Light Walk', icon: Coffee, defaultHours: [17, 19], sensitive: false },
  { id: 'yoga', label: 'Outdoor Yoga & Pranayama', type: 'Breathing Exercise', icon: HeartPulse, defaultHours: [6, 7], sensitive: true },
  { id: 'windows', label: 'Home Window Ventilation', type: 'Indoor Air Exchange', icon: Wind, defaultHours: [13, 15], sensitive: false },
];

function getIconForActivity(actType) {
  switch (actType) {
    case 'running': return Footprints;
    case 'cycling': return Bike;
    case 'kids_play': return Smile;
    case 'picnic': return Trees;
    case 'commute': return Car;
    case 'yoga': return HeartPulse;
    case 'windows': return Wind;
    case 'evening_walk': return Coffee;
    default: return Activity;
  }
}

function formatHourRange(startHour, endHour) {
  const fmt = (h) => {
    const ampm = h >= 12 && h < 24 ? 'PM' : 'AM';
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12 < 10 ? '0' : ''}${h12}:00 ${ampm}`;
  };
  return `${fmt(startHour)} - ${fmt(endHour)}`;
}

function formatRelativeDate(dateStr) {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const todayStr = `${yyyy}-${mm}-${dd}`;

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomY = tomorrow.getFullYear();
  const tomM = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const tomD = String(tomorrow.getDate()).padStart(2, '0');
  const tomorrowStr = `${tomY}-${tomM}-${tomD}`;

  if (dateStr === todayStr) return 'Today';
  if (dateStr === tomorrowStr) return 'Tomorrow';

  const [y, m, d] = dateStr.split('-').map(Number);
  const targetDate = new Date(y, m - 1, d);
  return targetDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

function getAvailableDates() {
  const list = [];
  const today = new Date();
  for (let i = 0; i < 5; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    list.push({
      dateStr,
      label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }),
      isToday: i === 0,
    });
  }
  return list;
}

function computeWindowPrediction(hourlyData, dateStr, startHour, endHour, actType, sensitive, cityName) {
  if (!hourlyData || !hourlyData.time || !hourlyData.us_aqi) {
    return {
      aqi: 120,
      severity: 'moderate',
      status: `Typical seasonal conditions in ${cityName} • Monitor live updates`,
      confidence: 'medium',
      pm25: 45,
    };
  }

  const times = hourlyData.time;
  const aqis = hourlyData.us_aqi;
  const pm25s = hourlyData.pm2_5 || [];

  const matchedAqis = [];
  const matchedPm25 = [];

  for (let i = 0; i < times.length; i++) {
    const t = times[i];
    if (t.startsWith(dateStr)) {
      const hourPart = parseInt(t.slice(11, 13), 10);
      if (hourPart >= startHour && hourPart <= endHour) {
        if (aqis[i] != null) matchedAqis.push(aqis[i]);
        if (pm25s[i] != null) matchedPm25.push(pm25s[i]);
      }
    }
  }

  let aqi = 120;
  let pm25 = 45;
  if (matchedAqis.length > 0) {
    aqi = Math.round(Math.max(...matchedAqis));
    pm25 = matchedPm25.length > 0 ? Math.round(Math.max(...matchedPm25)) : Math.round(aqi * 0.7);
  } else {
    // If not matched, take the latest available hour
    aqi = Math.round(aqis[0] || 120);
  }

  // Determine severity based on US AQI
  let severity = 'moderate';
  if (aqi <= 50) {
    severity = 'good';
  } else if (aqi <= 100) {
    severity = sensitive ? 'moderate' : 'good';
  } else if (aqi <= 150) {
    severity = sensitive ? 'severe' : 'moderate';
  } else {
    severity = 'severe';
  }

  // Tailored status message
  let status = '';
  switch (actType) {
    case 'running':
    case 'yoga':
      if (severity === 'good') {
        status = `Optimal air quality window in ${cityName} • Excellent for outdoor fitness`;
      } else if (severity === 'moderate') {
        status = `Acceptable air • Sensitive athletes should pace intensity in ${cityName}`;
      } else {
        status = `Unhealthy air for cardio • Move workout indoors to a HEPA filtered room`;
      }
      break;

    case 'cycling':
    case 'commute':
      if (severity === 'good') {
        status = `Clean transit corridors across ${cityName} • Safe for cycling`;
      } else if (severity === 'moderate') {
        status = `Moderate roadside particulates • Carry a light mask on major corridors`;
      } else {
        status = `High particulate rush • Wear an N95 respirator or keep car on recirculate`;
      }
      break;

    case 'kids_play':
      if (severity === 'good') {
        status = `Safe air for playground and outdoor sports in ${cityName}`;
      } else if (severity === 'moderate') {
        status = `Watch for fatigue; take scheduled indoor hydration breaks`;
      } else {
        status = `High respiratory burden for children • Keep playtime indoors`;
      }
      break;

    case 'picnic':
      if (severity === 'good') {
        status = `Optimal clear window for park picnics & outdoor dining in ${cityName}`;
      } else if (severity === 'moderate') {
        status = `Fair outing conditions • Choose shaded green corridors`;
      } else {
        status = `Unhealthy outdoor haze • Reschedule picnic or dine in filtered venue`;
      }
      break;

    case 'windows':
      if (severity === 'good') {
        status = `Safe to open home windows for natural air ventilation`;
      } else if (severity === 'moderate') {
        status = `Ventilate briefly for 15-20 mins during afternoon convective hours`;
      } else {
        status = `Keep windows closed tightly • Rely on indoor HEPA air purification`;
      }
      break;

    default:
      if (severity === 'good') {
        status = `Clean air window • Safe for citizen activities in ${cityName}`;
      } else if (severity === 'moderate') {
        status = `Moderate particulate levels in ${cityName} • General precautions advised`;
      } else {
        status = `Elevated pollution levels • Minimize prolonged outdoor exertion`;
      }
      break;
  }

  return { aqi, severity, status, pm25 };
}

export default function CalendarView({ currentLocation, selectedCity }) {
  const cityName = currentLocation?.name || selectedCity || 'Your Location';
  const lat = currentLocation?.lat ?? 28.6139;
  const lon = currentLocation?.lng ?? currentLocation?.lon ?? 77.2090;

  const [hourlyForecast, setHourlyForecast] = useState(null);
  const [isLoadingForecast, setIsLoadingForecast] = useState(true);
  const [selectedFilterDay, setSelectedFilterDay] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state for adding custom activity
  const availableDates = useMemo(() => getAvailableDates(), []);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState('running');
  const [newDate, setNewDate] = useState(availableDates[0].dateStr);
  const [newStartHour, setNewStartHour] = useState(6);
  const [newEndHour, setNewEndHour] = useState(8);
  const [newSensitive, setNewSensitive] = useState(false);

  // Default initial activities generated per current city
  const defaultInitialEvents = useMemo(() => {
    const todayStr = availableDates[0].dateStr;
    const tomorrowStr = availableDates[1]?.dateStr || todayStr;
    return [
      {
        id: 'def-1',
        title: 'Morning Jog, Cycling & Park Walks',
        activityType: 'running',
        categoryLabel: 'Outdoor Fitness & Parks',
        dateStr: todayStr,
        startHour: 6,
        endHour: 8,
        time: '06:00 AM - 08:00 AM',
        sensitive: false,
        isCustom: false,
      },
      {
        id: 'def-2',
        title: 'Peak Morning Commute & Highway Transit',
        activityType: 'commute',
        categoryLabel: 'Road Transit & Travel',
        dateStr: todayStr,
        startHour: 8,
        endHour: 10,
        time: '08:00 AM - 10:00 AM',
        sensitive: false,
        isCustom: false,
      },
      {
        id: 'def-3',
        title: 'Park Picnics & Outdoor Dining Window',
        activityType: 'picnic',
        categoryLabel: 'Picnics & Leisure Outings',
        dateStr: todayStr,
        startHour: 12,
        endHour: 14,
        time: '12:00 PM - 02:00 PM',
        sensitive: false,
        isCustom: false,
      },
      {
        id: 'def-4',
        title: 'Evening Commute & Market Visits',
        activityType: 'evening_walk',
        categoryLabel: 'Evening Transit & Shopping',
        dateStr: todayStr,
        startHour: 17,
        endHour: 19,
        time: '05:00 PM - 07:00 PM',
        sensitive: false,
        isCustom: false,
      },
      {
        id: 'def-5',
        title: 'Tomorrow Morning Cardio & Cycling',
        activityType: 'cycling',
        categoryLabel: 'Cardio Outing',
        dateStr: tomorrowStr,
        startHour: 7,
        endHour: 9,
        time: '07:00 AM - 09:00 AM',
        sensitive: false,
        isCustom: false,
      },
    ];
  }, [availableDates]);

  // Load user custom activities from localStorage
  const [activities, setActivities] = useState(() => {
    try {
      const saved = localStorage.getItem('vayu_calendar_custom_activities');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Fallback
    }
    return defaultInitialEvents;
  });

  // Fetch 5-day hourly predictive forecast when coordinates change
  const refreshForecast = useCallback(async () => {
    setIsLoadingForecast(true);
    try {
      const data = await fetchHourlyForecast5Day(lat, lon);
      if (data) {
        setHourlyForecast(data);
      }
    } catch (e) {
      console.warn('Failed to fetch 5-day air forecast for calendar:', e);
    } finally {
      setIsLoadingForecast(false);
    }
  }, [lat, lon]);

  useEffect(() => {
    refreshForecast();
  }, [refreshForecast]);

  // Persist activities
  const handleSaveActivities = (updated) => {
    setActivities(updated);
    try {
      localStorage.setItem('vayu_calendar_custom_activities', JSON.stringify(updated));
    } catch {
      // Quota ignore
    }
  };

  const handleAddActivity = (e) => {
    e.preventDefault();
    const template = ACTIVITY_TEMPLATES.find((t) => t.id === newType) || ACTIVITY_TEMPLATES[0];
    const itemTitle = newTitle.trim() || template.label;
    const timeFormatted = formatHourRange(newStartHour, newEndHour);

    const newActivity = {
      id: `act-${Date.now()}`,
      title: itemTitle,
      activityType: newType,
      categoryLabel: template.type,
      dateStr: newDate,
      startHour: Number(newStartHour),
      endHour: Number(newEndHour),
      time: timeFormatted,
      sensitive: Boolean(newSensitive),
      isCustom: true,
    };

    const updated = [newActivity, ...activities];
    handleSaveActivities(updated);
    setIsModalOpen(false);
    setNewTitle('');
  };

  const handleDeleteActivity = (id) => {
    const updated = activities.filter((a) => a.id !== id);
    handleSaveActivities(updated);
  };

  const handleResetDefaults = () => {
    handleSaveActivities(defaultInitialEvents);
  };

  // Preview prediction in the Add modal
  const modalPreview = useMemo(() => {
    return computeWindowPrediction(
      hourlyForecast,
      newDate,
      Number(newStartHour),
      Number(newEndHour),
      newType,
      newSensitive,
      cityName
    );
  }, [hourlyForecast, newDate, newStartHour, newEndHour, newType, newSensitive, cityName]);

  // Compute live prediction for all activities
  const enrichedActivities = useMemo(() => {
    return activities.map((act) => {
      const pred = computeWindowPrediction(
        hourlyForecast,
        act.dateStr,
        act.startHour,
        act.endHour,
        act.activityType,
        act.sensitive,
        cityName
      );
      return {
        ...act,
        aqiPredicted: pred.aqi,
        severity: pred.severity,
        status: pred.status,
        pm25: pred.pm25,
        relativeDay: formatRelativeDate(act.dateStr),
      };
    });
  }, [activities, hourlyForecast, cityName]);

  // Filter by selected day tab
  const filteredActivities = useMemo(() => {
    if (selectedFilterDay === 'all') return enrichedActivities;
    return enrichedActivities.filter((a) => a.dateStr === selectedFilterDay);
  }, [enrichedActivities, selectedFilterDay]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200 max-w-6xl mx-auto pb-12">
      {/* Header Bar with Live Dynamic Location */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h3 className="text-xl sm:text-2xl font-black text-ink-900 font-sans tracking-tight">
              {cityName} Daily Activity & Outing Air Planner
            </h3>
            <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#00B37E]/10 text-[#00875A] border border-[#00B37E]/30">
              <MapPin className="w-3 h-3 text-[#00875A]" />
              {lat.toFixed(2)}°N, {lon.toFixed(2)}°E
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time multi-day atmospheric forecast and intelligent pollution guidance for citizen sports, commute, and outings across {cityName}.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={refreshForecast}
            disabled={isLoadingForecast}
            title="Refresh air pollution predictions"
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors shadow-2xs cursor-pointer flex items-center justify-center"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingForecast ? 'animate-spin text-[#00B37E]' : ''}`} />
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#00B37E] hover:bg-[#009b6d] text-white font-bold text-xs sm:text-sm shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Activity
          </button>
        </div>
      </div>

      {/* Date Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setSelectedFilterDay('all')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
            selectedFilterDay === 'all'
              ? 'bg-ink-900 text-white shadow-2xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
          }`}
        >
          All Activities ({activities.length})
        </button>

        {availableDates.map((d) => {
          const count = activities.filter((a) => a.dateStr === d.dateStr).length;
          return (
            <button
              key={d.dateStr}
              onClick={() => setSelectedFilterDay(d.dateStr)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedFilterDay === d.dateStr
                  ? 'bg-ink-900 text-white shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              <span>{d.label}</span>
              {count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  selectedFilterDay === d.dateStr ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Activities Schedule Grid */}
      {filteredActivities.length === 0 ? (
        <div className="p-12 text-center bg-white border border-dashed border-slate-200 rounded-[28px] space-y-3">
          <CalendarIcon className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-700">No scheduled activities found for this day</p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Plan a run, walk, bike commute, or park visit to get real-time atmospheric pollution predictions.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#00B37E] text-white text-xs font-bold hover:bg-[#009b6d] cursor-pointer mt-2"
          >
            <Plus className="w-4 h-4" />
            Add Plan
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredActivities.map((ev) => {
            const Icon = getIconForActivity(ev.activityType);
            const isSevere = ev.severity === 'severe';
            const isGood = ev.severity === 'good';

            return (
              <div 
                key={ev.id}
                className={`p-5 sm:p-6 rounded-[28px] border transition-all shadow-soft hover:shadow-md ${
                  isSevere
                    ? 'bg-[#FFF5F5] border-[#FECACA]'
                    : isGood
                    ? 'bg-[#F0FAF6] border-[#A7F3D0]'
                    : 'bg-white border-slate-200/80'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      isSevere
                        ? 'bg-[#FDECEC] text-[#DC2626]'
                        : isGood
                        ? 'bg-[#D1F2E5] text-[#00875A]'
                        : 'bg-amber-50 text-amber-700'
                    }`}>
                      <Icon className="w-6 h-6" />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-mono font-bold text-slate-800 flex items-center gap-1.5 bg-white/90 px-2.5 py-0.5 rounded-full border border-slate-200/70 shadow-2xs">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {ev.time}
                        </span>

                        <span className="text-[11px] font-mono font-bold text-slate-700 bg-white/90 px-2.5 py-0.5 rounded-full border border-slate-200/70 shadow-2xs">
                          {ev.relativeDay}
                        </span>

                        <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold ${
                          isSevere 
                            ? 'bg-[#FEE2E2] text-[#DC2626]' 
                            : isGood
                            ? 'bg-[#D1F2E5] text-[#00875A]'
                            : 'bg-[#FEF0D0] text-[#B45309]'
                        }`}>
                          Predicted AQI {ev.aqiPredicted} (US scale)
                        </span>

                        {ev.sensitive && (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                            Sensitive Group
                          </span>
                        )}
                      </div>

                      <h4 className="text-base font-black text-ink-900">{ev.title}</h4>
                      <p className="text-xs text-slate-500">
                        {ev.categoryLabel || ev.activityType}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center sm:flex-col sm:items-end justify-between gap-3">
                    <span className={`inline-block text-xs font-bold px-4 py-2 rounded-full border shadow-2xs text-left sm:text-right ${
                      isSevere
                        ? 'bg-[#DC2626] text-white border-[#DC2626]'
                        : isGood
                        ? 'bg-[#00875A] text-white border-[#00875A]'
                        : 'bg-white text-slate-800 border-slate-200'
                    }`}>
                      {ev.status}
                    </span>

                    {ev.isCustom && (
                      <button
                        onClick={() => handleDeleteActivity(ev.id)}
                        className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                        title="Remove activity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer Info & Reset */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <span>Predictions combine local LightGBM airshed models with 5-day Copernicus CAMS atmospheric forecast.</span>
        </div>

        <button
          onClick={handleResetDefaults}
          className="text-slate-500 hover:text-slate-800 underline font-medium cursor-pointer"
        >
          Reset to default activities
        </button>
      </div>

      {/* ADD ACTIVITY MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h4 className="text-lg font-black text-ink-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#00B37E]" />
                  Schedule Future Activity
                </h4>
                <p className="text-xs text-slate-500">
                  Target location: <span className="font-bold text-slate-800">{cityName}</span>
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleAddActivity} className="p-6 space-y-4">
              {/* Activity Type Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Activity Type
                </label>
                <select
                  value={newType}
                  onChange={(e) => {
                    setNewType(e.target.value);
                    const template = ACTIVITY_TEMPLATES.find((t) => t.id === e.target.value);
                    if (template) {
                      setNewStartHour(template.defaultHours[0]);
                      setNewEndHour(template.defaultHours[1]);
                      if (!newTitle) setNewTitle(template.label);
                    }
                  }}
                  className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#00B37E]"
                >
                  {ACTIVITY_TEMPLATES.map((tmpl) => (
                    <option key={tmpl.id} value={tmpl.id}>
                      {tmpl.label} ({tmpl.type})
                    </option>
                  ))}
                </select>
              </div>

              {/* Title / Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Activity Title / Location Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. 5km Morning Run, Kids playground, Office bicycle ride"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#00B37E]"
                />
              </div>

              {/* Target Date Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Date (Forecast Horizon up to 5 Days)
                </label>
                <select
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#00B37E]"
                >
                  {availableDates.map((d) => (
                    <option key={d.dateStr} value={d.dateStr}>
                      {d.label} ({d.dateStr})
                    </option>
                  ))}
                </select>
              </div>

              {/* Time Window (Start & End Hour) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Start Hour
                  </label>
                  <select
                    value={newStartHour}
                    onChange={(e) => setNewStartHour(Number(e.target.value))}
                    className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#00B37E]"
                  >
                    {Array.from({ length: 18 }, (_, idx) => idx + 5).map((h) => (
                      <option key={h} value={h}>
                        {h < 12 ? `${h}:00 AM` : h === 12 ? '12:00 PM' : `${h - 12}:00 PM`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    End Hour
                  </label>
                  <select
                    value={newEndHour}
                    onChange={(e) => setNewEndHour(Math.max(newStartHour + 1, Number(e.target.value)))}
                    className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#00B37E]"
                  >
                    {Array.from({ length: 18 }, (_, idx) => idx + 5)
                      .filter((h) => h > newStartHour)
                      .map((h) => (
                        <option key={h} value={h}>
                          {h < 12 ? `${h}:00 AM` : h === 12 ? '12:00 PM' : `${h - 12}:00 PM`}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Sensitive Group Checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="sensitiveToggle"
                  checked={newSensitive}
                  onChange={(e) => setNewSensitive(e.target.checked)}
                  className="rounded text-[#00B37E] focus:ring-[#00B37E] cursor-pointer"
                />
                <label htmlFor="sensitiveToggle" className="text-xs text-slate-700 cursor-pointer select-none">
                  Strict guidance for sensitive groups (asthma, children, elderly, pregnancy)
                </label>
              </div>

              {/* Live Prediction Preview Card inside modal */}
              <div className={`p-4 rounded-2xl border text-xs space-y-1.5 ${
                modalPreview.severity === 'severe'
                  ? 'bg-red-50/80 border-red-200 text-red-900'
                  : modalPreview.severity === 'good'
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                  : 'bg-amber-50/80 border-amber-200 text-amber-900'
              }`}>
                <div className="flex items-center justify-between font-bold">
                  <span className="flex items-center gap-1.5">
                    {modalPreview.severity === 'good' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                    )}
                    Pollution Prediction Preview
                  </span>
                  <span className="font-mono text-sm">
                    AQI {modalPreview.aqi}
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed opacity-90">
                  {modalPreview.status}
                </p>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#00B37E] hover:bg-[#009b6d] text-white text-xs font-bold shadow-sm cursor-pointer"
                >
                  Save to Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
