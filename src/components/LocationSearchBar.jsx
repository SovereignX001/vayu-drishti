import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  MapPin, 
  ExternalLink, 
  Crosshair, 
  Navigation, 
  X, 
  Sparkles,
  Loader2,
  Check,
  AlertTriangle
} from 'lucide-react';
import { POPULAR_SEARCH_LOCATIONS } from '../data/airData';
import { getLiveAqiByCoords } from '../lib/api';

export default function LocationSearchBar({ 
  currentLocation, 
  onSelectLocation,
  onResetGps,
  placeholder = "Search any location in India...",
  variant = 'pill'
}) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);
  const [onlineResults, setOnlineResults] = useState([]);
  const [isFetchingTelemetry, setIsFetchingTelemetry] = useState(false);
  const [telemetryError, setTelemetryError] = useState(null);
  const [pendingLocation, setPendingLocation] = useState(null);

  const containerRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter curated popular locations
  const filteredPopular = POPULAR_SEARCH_LOCATIONS.filter((loc) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      loc.name.toLowerCase().includes(q) ||
      loc.city.toLowerCase().includes(q) ||
      loc.state.toLowerCase().includes(q)
    );
  }).slice(0, 6);

  // Debounced online geocoding search with AbortController cancellation
  useEffect(() => {
    if (!query.trim() || query.length < 3) {
      setOnlineResults([]);
      setIsSearchingOnline(false);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const timer = setTimeout(async () => {
      setIsSearchingOnline(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=in&limit=4`,
          {
            headers: { 'Accept-Language': 'en' },
            signal: controller.signal,
          }
        );
        if (res.ok) {
          const data = await res.json();
          const parsed = data.map((item) => {
            const lat = parseFloat(item.lat);
            const lng = parseFloat(item.lon);
            return {
              name: item.display_name.split(',')[0],
              city: item.display_name.split(',')[1]?.trim() || 'India',
              state: item.display_name.split(',')[2]?.trim() || '',
              lat: Number(lat.toFixed(4)),
              lng: Number(lng.toFixed(4)),
            };
          });
          setOnlineResults(parsed);
        }
      } catch (e) {
        if (e.name !== 'AbortError') {
          console.log('Online geocode fallback:', e);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsSearchingOnline(false);
        }
      }
    }, 400);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const handleSelect = async (loc) => {
    setPendingLocation(loc);
    setIsFetchingTelemetry(true);
    setTelemetryError(null);

    try {
      const live = await getLiveAqiByCoords(loc.lat, loc.lng);
      const fullLoc = {
        ...loc,
        lat: loc.lat,
        lng: loc.lng,
        aqi: live.aqi,
        pm25: live.pm25,
        pm10: live.pm10,
        no2: live.no2,
        o3: live.o3,
        so2: live.so2,
        temp: live.temp,
        humidity: live.humidity,
        windSpeed: live.windSpeed != null ? `${live.windSpeed} km/h` : 'N/A',
        windDir: live.windDir || 'N/A',
        station: `Ground Sensor Node [${loc.lat.toFixed(2)}°N, ${loc.lng.toFixed(2)}°E]`,
        syncTime: live.stale ? 'Offline Cache' : 'Live Telemetry Fix',
        stale: Boolean(live.stale),
        savedAt: live.savedAt,
      };
      onSelectLocation(fullLoc);
      setQuery('');
      setIsOpen(false);
      setPendingLocation(null);
    } catch (err) {
      console.error('Failed to fetch live telemetry for selected location:', err);
      setTelemetryError('Live data unavailable for this location.');
    } finally {
      setIsFetchingTelemetry(false);
    }
  };

  // Google Maps Search URL
  const gmapsUrl = currentLocation?.lat && currentLocation?.lng
    ? `https://www.google.com/maps/search/?api=1&query=${currentLocation.lat},${currentLocation.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query || currentLocation?.name || 'Meerut')}`;

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Search Bar Input Container */}
      <div className={`flex items-center gap-2 transition-all ${
        variant === 'pill'
          ? 'px-4 py-2 bg-slate-100/90 hover:bg-white rounded-full border border-slate-200/80 shadow-2xs focus-within:bg-white focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20'
          : 'p-2.5 bg-white rounded-3xl border border-slate-200/90 shadow-soft focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20'
      }`}>
        
        {/* Input */}
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={isFetchingTelemetry ? 'Fetching live telemetry for selected location...' : placeholder}
          disabled={isFetchingTelemetry}
          aria-label="Search city, neighborhood, or coordinates in India"
          className="flex-1 py-1 text-xs sm:text-sm text-ink-900 placeholder-ink-400 outline-none bg-transparent font-medium disabled:opacity-60"
        />

        {/* Clear Button */}
        {query && !isFetchingTelemetry && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setOnlineResults([]);
            }}
            aria-label="Clear search query"
            title="Clear search query"
            className="p-1 rounded-full text-ink-400 hover:text-ink-700 hover:bg-slate-200/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Search Icon / Loading indicator on right like reference image */}
        <div className="text-ink-400 flex items-center pr-1 flex-shrink-0">
          {isFetchingTelemetry ? (
            <Loader2 className="w-4 h-4 text-accent animate-spin" />
          ) : (
            <Search className="w-4 h-4 text-ink-400 hover:text-accent transition-colors" />
          )}
        </div>

        {/* View on Google Maps Link Button (if card variant or non-compact) */}
        {variant !== 'pill' && (
          <a
            href={gmapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open coordinates in Google Maps (opens in new tab)"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all shadow-2xs hover:text-slate-900 flex-shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            title="Open this location in Google Maps"
          >
            <Navigation className="w-3.5 h-3.5 text-accent" />
            <span className="hidden sm:inline">Google Maps</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>
        )}

        {/* Reset / GPS Locate Me Button */}
        {onResetGps && (
          <button
            type="button"
            onClick={onResetGps}
            disabled={isFetchingTelemetry}
            aria-label="Recalibrate and lock GPS position"
            className="flex items-center gap-1 p-1.5 sm:px-2.5 sm:py-1 rounded-full bg-slate-200/70 hover:bg-accent/15 text-ink-600 hover:text-accent text-xs font-bold transition-all flex-shrink-0 cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            title="Lock to Live GPS Location"
          >
            <Crosshair className="w-3.5 h-3.5 text-accent animate-pulse" />
            <span className="hidden lg:inline text-[11px]">GPS</span>
          </button>
        )}
      </div>

      {/* Inline Telemetry Error with Retry */}
      {telemetryError && (
        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-between text-xs text-red-700 animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>{telemetryError}</span>
          </div>
          <div className="flex items-center gap-2">
            {pendingLocation && (
              <button
                type="button"
                onClick={() => handleSelect(pendingLocation)}
                className="px-3 py-1 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors cursor-pointer text-[11px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
              >
                Retry
              </button>
            )}
            <button
              type="button"
              onClick={() => setTelemetryError(null)}
              aria-label="Dismiss error notice"
              className="p-1 hover:bg-red-100 rounded text-red-500 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Autocomplete Dropdown Results */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[380px] overflow-y-auto">
          
          {/* Quick Header */}
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-500">
            <span className="font-bold flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-[#00B37E]" />
              Search Results & Instant Locations
            </span>
            {isSearchingOnline && (
              <span className="flex items-center gap-1 text-[#00B37E]">
                <Loader2 className="w-3 h-3 animate-spin" />
                Searching live...
              </span>
            )}
          </div>

          {/* Curated / Filtered Results */}
          <div className="p-2 space-y-1">
            {filteredPopular.map((loc, i) => {
              const aqiColor = loc.aqi <= 70 ? '#00B37E' : loc.aqi <= 150 ? '#F59E0B' : '#DC2626';
              const isSelected = currentLocation?.name === loc.name;

              return (
                <button
                  key={`curated-${i}`}
                  onClick={() => handleSelect(loc)}
                  disabled={isFetchingTelemetry}
                  className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between gap-3 transition-colors cursor-pointer group disabled:opacity-50 ${
                    isSelected ? 'bg-[#00B37E]/10 border border-[#00B37E]/30' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 flex-shrink-0 group-hover:bg-[#00B37E] group-hover:text-white transition-colors">
                      <MapPin className="w-3.5 h-3.5" />
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-bold text-slate-800 group-hover:text-slate-900 truncate">
                        {loc.name}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate font-mono">
                        {loc.city}, {loc.state} • {loc.lat}°N, {loc.lng}°E
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span 
                      className="text-xs font-bold px-2 py-0.5 rounded font-mono"
                      style={{ color: aqiColor, backgroundColor: `${aqiColor}18` }}
                    >
                      AQI {loc.aqi}
                    </span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#00B37E]" />}
                  </div>
                </button>
              );
            })}

            {/* Dynamic Online Geocoder Results */}
            {onlineResults.map((loc, i) => {
              return (
                <button
                  key={`online-${i}`}
                  onClick={() => handleSelect(loc)}
                  disabled={isFetchingTelemetry}
                  className="w-full p-2.5 rounded-xl text-left flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors cursor-pointer group border-t border-slate-100 disabled:opacity-50"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <div className="w-7 h-7 rounded-lg bg-[#00B37E]/10 text-[#00B37E] flex items-center justify-center flex-shrink-0">
                      <Navigation className="w-3.5 h-3.5" />
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-bold text-slate-800 truncate">
                        {loc.name}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate font-mono">
                        {loc.city} • Lat: {loc.lat}, Lng: {loc.lng}
                      </p>
                    </div>
                  </div>

                  <span className="text-[11px] font-bold px-2 py-0.5 rounded font-mono flex-shrink-0 text-[#00B37E] bg-[#00B37E]/10">
                    Select for Live AQI
                  </span>
                </button>
              );
            })}

            {filteredPopular.length === 0 && onlineResults.length === 0 && !isSearchingOnline && (
              <div className="p-4 text-center text-xs text-slate-500">
                No matching locations found. Press enter or search directly on Google Maps below.
              </div>
            )}
          </div>

          {/* Direct Google Maps Action Footer */}
          <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">
              Want full Google Maps view?
            </span>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query || currentLocation?.name || 'Meerut')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-[#00B37E] hover:underline flex items-center gap-1"
            >
              <span>Search on Google Maps</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

        </div>
      )}
    </div>
  );
}
