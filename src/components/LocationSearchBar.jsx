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
  Check
} from 'lucide-react';
import { POPULAR_SEARCH_LOCATIONS } from '../data/airData';

export default function LocationSearchBar({ 
  currentLocation, 
  onSelectLocation,
  onResetGps,
  placeholder = "Search any location, neighborhood or landmark (linked to Google Maps)..."
}) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);
  const [onlineResults, setOnlineResults] = useState([]);
  const containerRef = useRef(null);

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

  // Debounced online geocoding search using open geocoder
  useEffect(() => {
    if (!query.trim() || query.length < 3) {
      setOnlineResults([]);
      setIsSearchingOnline(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingOnline(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=in&limit=4`,
          { headers: { 'Accept-Language': 'en' } }
        );
        if (res.ok) {
          const data = await res.json();
          const parsed = data.map((item) => {
            const lat = parseFloat(item.lat);
            const lng = parseFloat(item.lon);
            // Simulate downscaled AQI calculation from coordinates
            const pseudoAqi = Math.round(90 + Math.abs(Math.sin(lat * 10) * 160));
            return {
              name: item.display_name.split(',')[0],
              city: item.display_name.split(',')[1]?.trim() || 'India',
              state: item.display_name.split(',')[2]?.trim() || '',
              lat: Number(lat.toFixed(4)),
              lng: Number(lng.toFixed(4)),
              aqi: pseudoAqi,
              pm25: Math.round(pseudoAqi * 0.8),
              pm10: Math.round(pseudoAqi * 1.3),
              station: `Ground Sensor Node [${lat.toFixed(2)}°N, ${lng.toFixed(2)}°E]`,
              windSpeed: '7 km/h',
              windDir: 'NW 315°',
              inversionRisk: pseudoAqi > 200 ? 'High' : 'Moderate',
              trafficDensity: '74%',
              trafficStatus: 'Urban Flow'
            };
          });
          setOnlineResults(parsed);
        }
      } catch (e) {
        console.log('Online geocode fallback:', e);
      } finally {
        setIsSearchingOnline(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (loc) => {
    onSelectLocation(loc);
    setQuery('');
    setIsOpen(false);
  };

  // Google Maps Search URL
  const gmapsUrl = currentLocation?.lat && currentLocation?.lng
    ? `https://www.google.com/maps/search/?api=1&query=${currentLocation.lat},${currentLocation.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query || currentLocation?.name || 'Meerut')}`;

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Search Bar Input Container */}
      <div className="flex items-center gap-2 p-2 bg-white rounded-2xl border border-slate-200 shadow-sm focus-within:border-[#00B37E] focus-within:ring-2 focus-within:ring-[#00B37E]/20 transition-all">
        
        {/* Search Icon */}
        <div className="pl-2 text-slate-400">
          <Search className="w-4 h-4 text-[#00B37E]" />
        </div>

        {/* Input */}
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="flex-1 py-1.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 outline-none bg-transparent font-medium"
        />

        {/* Clear Button */}
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setOnlineResults([]);
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        {/* View on Google Maps Link Button */}
        <a
          href={gmapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all shadow-2xs hover:text-slate-900 flex-shrink-0"
          title="Open this location in Google Maps"
        >
          <Navigation className="w-3.5 h-3.5 text-[#00B37E]" />
          <span className="hidden sm:inline">Google Maps</span>
          <ExternalLink className="w-3 h-3 text-slate-400" />
        </a>

        {/* Reset / GPS Locate Me Button */}
        {onResetGps && (
          <button
            onClick={onResetGps}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#00B37E]/10 hover:bg-[#00B37E]/20 text-[#00B37E] text-xs font-bold transition-all flex-shrink-0 cursor-pointer"
            title="Lock to Live GPS Location"
          >
            <Crosshair className="w-3.5 h-3.5 animate-pulse" />
            <span className="hidden md:inline">Live GPS</span>
          </button>
        )}
      </div>

      {/* Autocomplete Dropdown Results */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-[380px] overflow-y-auto">
          
          {/* Quick Header */}
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-500">
            <span className="font-bold flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-[#00B37E]" />
              Search Results & Instant Google Maps Locations
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
                  className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between gap-3 transition-colors cursor-pointer group ${
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
              const aqiColor = loc.aqi <= 70 ? '#00B37E' : loc.aqi <= 150 ? '#F59E0B' : '#DC2626';

              return (
                <button
                  key={`online-${i}`}
                  onClick={() => handleSelect(loc)}
                  className="w-full p-2.5 rounded-xl text-left flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors cursor-pointer group border-t border-slate-100"
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

                  <span 
                    className="text-xs font-bold px-2 py-0.5 rounded font-mono flex-shrink-0"
                    style={{ color: aqiColor, backgroundColor: `${aqiColor}18` }}
                  >
                    Est. AQI {loc.aqi}
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