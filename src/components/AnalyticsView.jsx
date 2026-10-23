import React, { useState, useEffect } from 'react';
import { 
  BarChart2, 
  Sparkles, 
  CheckCircle2, 
  Database, 
  Cpu, 
  ShieldCheck, 
  TrendingUp, 
  MapPin, 
  AlertTriangle,
  Layers,
  Activity,
  ArrowRight
} from 'lucide-react';
import { getNationalAnalytics, classifyAqi } from '../lib/api';

export default function AnalyticsView({ currentLocation }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Interactive Random Forest Playground State
  const [testAqi, setTestAqi] = useState(currentLocation?.aqi || 165);
  const [testResult, setTestResult] = useState(null);
  const [isClassifying, setIsClassifying] = useState(false);

  useEffect(() => {
    async function loadAnalytics() {
      try {
        setLoading(true);
        const res = await getNationalAnalytics();
        setData(res);
      } catch (err) {
        console.error('Failed to load national analytics:', err);
        setError('Could not connect to national analytics service.');
      } finally {
        setLoading(false);
      }
    }
    loadAnalytics();
  }, []);

  // Classify whenever testAqi changes
  useEffect(() => {
    let cancel = false;
    async function runClassification() {
      if (!testAqi && testAqi !== 0) return;
      setIsClassifying(true);
      try {
        const res = await classifyAqi(Number(testAqi));
        if (!cancel) setTestResult(res);
      } catch (e) {
        console.error('Classification error:', e);
      } finally {
        if (!cancel) setIsClassifying(false);
      }
    }
    const timer = setTimeout(runClassification, 200);
    return () => {
      cancel = true;
      clearTimeout(timer);
    };
  }, [testAqi]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Good':
        return 'text-[#00B37E] bg-[#00B37E]/10 border-[#00B37E]/30';
      case 'Satisfactory':
        return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'Moderate':
        return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'Poor':
        return 'text-orange-700 bg-orange-50 border-orange-200';
      case 'Very Poor':
        return 'text-rose-700 bg-rose-50 border-rose-200';
      case 'Severe':
        return 'text-red-800 bg-red-100 border-red-300';
      default:
        return 'text-slate-700 bg-slate-50 border-slate-200';
    }
  };

  const getBarColor = (category) => {
    switch (category) {
      case 'Good':
        return 'bg-[#00B37E]';
      case 'Satisfactory':
        return 'bg-emerald-400';
      case 'Moderate':
        return 'bg-amber-400';
      case 'Poor':
        return 'bg-orange-500';
      case 'Very Poor':
        return 'bg-rose-500';
      case 'Severe':
        return 'bg-red-700';
      default:
        return 'bg-slate-400';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-3">
        <Sparkles className="w-6 h-6 text-[#00B37E] animate-spin" />
        <p className="text-xs text-slate-500 font-mono">Loading National AQI Intelligence from Kaggle Dataset...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center space-y-3 max-w-xl mx-auto">
        <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
        <h4 className="text-sm font-bold text-slate-800">Analytics Offline</h4>
        <p className="text-xs text-slate-500 font-sans">{error || 'Please run train_kaggle.py to initialize analytics.'}</p>
      </div>
    );
  }

  const { total_records, model_accuracy, status_distribution, pollutant_distribution, city_benchmarks } = data;

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-200 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 font-sans">
              National Air Quality Intelligence & EDA
            </h3>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#00B37E]/15 text-[#00B37E]">
              Kaggle Pipeline Live
            </span>
          </div>
          <p className="text-xs text-slate-500 font-sans mt-0.5">
            Synthesized from 235,785+ daily ground monitoring records across India (2023–2025) & Random Forest Classifier
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs">
          <Database className="w-3.5 h-3.5 text-[#00B37E]" />
          <span className="text-slate-600 font-semibold">{total_records.toLocaleString()} Records</span>
        </div>
      </div>

      {/* Top 4 Key Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase font-mono tracking-wider">Trained Model</span>
            <Cpu className="w-4 h-4 text-[#00B37E]" />
          </div>
          <p className="text-lg sm:text-xl font-black text-slate-900 font-mono">Random Forest</p>
          <p className="text-[11px] text-[#00B37E] font-medium mt-1">100 Trees • {model_accuracy}% Test Acc</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase font-mono tracking-wider">Top Dominant Pollutant</span>
            <Activity className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-lg sm:text-xl font-black text-slate-900 font-mono">PM10 (49.6%)</p>
          <p className="text-[11px] text-slate-500 mt-1">Followed by PM2.5 (26.7%)</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase font-mono tracking-wider">Dominant Status</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-lg sm:text-xl font-black text-slate-900 font-mono">Satisfactory</p>
          <p className="text-[11px] text-slate-500 mt-1">37.7% of all recorded days</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase font-mono tracking-wider">Severe Inversion Risk</span>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-lg sm:text-xl font-black text-red-600 font-mono">0.2% Severe Days</p>
          <p className="text-[11px] text-slate-500 mt-1">Winter season atmospheric traps</p>
        </div>

      </div>

      {/* Row 2: Interactive Model Classifier Playground */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-sm font-bold text-slate-900 font-sans flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#00B37E]" />
              Interactive Random Forest Status Classifier (Trained from Kaggle)
            </h4>
            <p className="text-xs text-slate-500">
              Test how the machine learning model classifies air quality category and calculates confidence scores
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-medium text-slate-500">Preset:</span>
            {[50, 95, 165, 240, 350, 440].map((v) => (
              <button
                key={v}
                onClick={() => setTestAqi(v)}
                className={`text-[11px] font-mono px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
                  testAqi === v
                    ? 'bg-[#00B37E] text-white border-[#00B37E]'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-[#00B37E]'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          
          {/* Slider & Input */}
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs">
              <label className="font-semibold text-slate-700">Input AQI Value:</label>
              <input
                type="number"
                min="0"
                max="500"
                value={testAqi}
                onChange={(e) => setTestAqi(Number(e.target.value))}
                className="w-20 px-2.5 py-1 text-center font-mono font-bold rounded-lg border border-slate-300 focus:outline-none focus:border-[#00B37E]"
              />
            </div>
            <input
              type="range"
              min="10"
              max="500"
              value={testAqi}
              onChange={(e) => setTestAqi(Number(e.target.value))}
              className="w-full accent-[#00B37E] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-400">
              <span>0 (Good)</span>
              <span>100 (Moderate)</span>
              <span>250 (Poor)</span>
              <span>500 (Severe)</span>
            </div>
          </div>

          {/* Model Decision Badge */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-center items-center text-center">
            <span className="text-[11px] font-bold uppercase font-mono text-slate-400 tracking-wider">
              Predicted Category
            </span>
            <div className="mt-1">
              {isClassifying ? (
                <span className="text-xs font-mono text-slate-400">Classifying...</span>
              ) : testResult ? (
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border mt-1 ${getStatusColor(testResult.status)}`}>
                  {testResult.status} ({testResult.confidence}%)
                </span>
              ) : null}
            </div>
          </div>

          {/* Probability Distribution */}
          <div className="space-y-1.5 text-xs font-mono">
            <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider block mb-1">
              Class Probabilities
            </span>
            {testResult?.probabilities &&
              Object.entries(testResult.probabilities).map(([cat, prob]) => (
                <div key={cat} className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-600 truncate w-24">{cat}:</span>
                  <div className="flex-1 mx-2 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className={`h-full ${getBarColor(cat)} transition-all duration-300`}
                      style={{ width: `${prob}%` }}
                    />
                  </div>
                  <span className="text-slate-800 font-bold w-10 text-right">{prob}%</span>
                </div>
              ))}
          </div>

        </div>
      </div>

      {/* Row 3: Two Column Breakdown (Status Distribution & Pollutant Distribution) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Status Breakdown from EDA */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-900 font-sans">National Status Distribution</h4>
              <p className="text-xs text-slate-500">2023–2025 ground sensor category proportions</p>
            </div>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>

          <div className="space-y-3 pt-2">
            {status_distribution.map((item) => (
              <div key={item.category} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-700">{item.category}</span>
                  <span className="font-mono text-slate-500">
                    {item.count.toLocaleString()} days ({item.percentage}%)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full ${getBarColor(item.category)} rounded-full`}
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Prominent Pollutants Breakdown from EDA */}
        <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-900 font-sans">Prominent Pollutants</h4>
              <p className="text-xs text-slate-500">Primary air quality drivers reported across India</p>
            </div>
            <Activity className="w-4 h-4 text-slate-400" />
          </div>

          <div className="space-y-3 pt-2">
            {pollutant_distribution.map((item) => (
              <div key={item.pollutant} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-mono font-bold text-slate-800">{item.pollutant}</span>
                  <span className="font-mono text-slate-500">
                    {item.count.toLocaleString()} stations ({item.percentage}%)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-slate-800 rounded-full"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Row 4: Multi-City 2-Year Benchmark Comparison Table */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-4 overflow-hidden">
        <div>
          <h4 className="text-sm font-bold text-slate-900 font-sans">
            Multi-City Historical Benchmarks (Kaggle Ground Sensor Dataset)
          </h4>
          <p className="text-xs text-slate-500">
            Official historical telemetry statistics for key Northern India & NCR airsheds
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-slate-50 text-slate-500 font-mono text-[11px] uppercase tracking-wider border-y border-slate-200">
              <tr>
                <th className="py-2.5 px-3">City / Airshed</th>
                <th className="py-2.5 px-3">Records Analyzed</th>
                <th className="py-2.5 px-3">2-Year Avg AQI</th>
                <th className="py-2.5 px-3">Historical Min - Max</th>
                <th className="py-2.5 px-3">Primary Pollutant</th>
                <th className="py-2.5 px-3">Status Breakdown</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {Object.entries(city_benchmarks).map(([city, bench]) => (
                <tr key={city} className={`hover:bg-slate-50/80 transition-colors ${city === 'Meerut' ? 'bg-[#00B37E]/5' : ''}`}>
                  <td className="py-3 px-3 font-bold text-slate-900 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#00B37E]" />
                    <span>{city}</span>
                    {city === 'Meerut' && (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#00B37E] text-white">
                        Home City
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-600">{bench.records.toLocaleString()}</td>
                  <td className="py-3 px-3 font-mono font-bold text-slate-900">
                    <span className={`px-2 py-0.5 rounded-lg border ${
                      bench.avg_aqi > 180 ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      AQI {bench.avg_aqi}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-600">{bench.min_aqi} – {bench.max_aqi}</td>
                  <td className="py-3 px-3 font-mono font-semibold text-slate-800">{bench.dominant_pollutant}</td>
                  <td className="py-3 px-3">
                    <div className="flex gap-1">
                      {Object.entries(bench.status_breakdown).slice(0, 3).map(([st, cnt]) => (
                        <span key={st} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                          {st}: {cnt}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
