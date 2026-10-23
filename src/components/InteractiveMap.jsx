import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  MapPin, 
  Flame, 
  Navigation, 
  Globe, 
  Satellite, 
  Search, 
  Sparkles,
  Building2,
  Check
} from 'lucide-react';
import { CITIES_DATA, DEFAULT_CITY } from '../data/airData';

export default function InteractiveMap({ 
  selectedCity = DEFAULT_CITY,
  onSelectCity,
  selectedZoneId, 
  onSelectZone, 
  timeframe 
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layersGroupRef = useRef(null);
  const tileLayerRef = useRef(null);

  // Active City Data
  const currentCityKey = CITIES_DATA[selectedCity] ? selectedCity : DEFAULT_CITY;
  const activeCity = CITIES_DATA[currentCityKey];

  // City Search State
  const [citySearchQuery, setCitySearchQuery] = useState('');
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const searchContainerRef = useRef(null);

  // Available tile maps (Google Maps Roadmap, Google Satellite, CartoDB Light)
  const [mapStyle, setMapStyle] = useState('gmaps');
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [activeLandmark, setActiveLandmark] = useState(null);

  const tileUrls = {
    gmaps: {
      url: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
      attr: '&copy; Google Maps'
    },
    satellite: {
      url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
      attr: '&copy; Google Maps Satellite'
    },
    light: {
      url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      attr: '&copy; OpenStreetMap contributors &copy; CARTO'
    }
  };

  const getAqiColor = (aqi) => {
    if (aqi <= 70) return '#00B37E';
    if (aqi <= 150) return '#F59E0B';
    return '#DC2626';
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsCityDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: activeCity.center,
      zoom: activeCity.zoom,
      minZoom: 9,
      maxZoom: 18,
      zoomControl: true
    });

    mapInstanceRef.current = map;

    // Base Tile Layer
    const currentTile = tileUrls[mapStyle];
    tileLayerRef.current = L.tileLayer(currentTile.url, {
      attribution: currentTile.attr,
      maxZoom: 20,
      subdomains: ['a', 'b', 'c', 'd']
    }).addTo(map);

    // Overlay layers group
    layersGroupRef.current = L.layerGroup().addTo(map);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Handle tile map style change
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    const currentTile = tileUrls[mapStyle];
    tileLayerRef.current.setUrl(currentTile.url);
  }, [mapStyle]);

  // Handle City Change: Fly to new city center smoothly
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo(activeCity.center, activeCity.zoom, {
      duration: 1.2,
      easeLinearity: 0.25
    });
  }, [selectedCity]);

  // Update Overlays (Heatmap Circles & Numbered Markers) in Real-Time based on selected City
  useEffect(() => {
    if (!mapInstanceRef.current || !layersGroupRef.current) return;

    const group = layersGroupRef.current;
    group.clearLayers();

    // 1. DRAW CITY POLLUTION HEATMAP CIRCLES
    if (showHeatmap && activeCity.heatmaps) {
      activeCity.heatmaps.forEach((hm) => {
        L.circle([hm.lat, hm.lng], {
          color: hm.color || '#DC2626',
          fillColor: hm.color || '#DC2626',
          fillOpacity: hm.fillOpacity || 0.4,
          radius: hm.radius || 2000,
          weight: 1.5
        }).addTo(group);
      });
    }

    // 2. DRAW 8 NUMBERED LANDMARKS FOR CURRENT CITY
    if (activeCity.landmarks) {
      activeCity.landmarks.forEach((lm) => {
        const aqiColor = getAqiColor(lm.aqi);
        const isSelected = activeLandmark === lm.num || (lm.zoneId && lm.zoneId === selectedZoneId);
        const shortTitle = lm.shortName || lm.name.split(' & ')[0].split(' / ')[0];

        const iconHtml = `
          <div style="
            display: inline-flex;
            align-items: center;
            gap: 5px;
            background: #FFFFFF;
            border: 2px solid ${isSelected ? '#0F172A' : aqiColor};
            padding: 3px 8px 3px 4px;
            border-radius: 9999px;
            box-shadow: 0 4px 14px rgba(15, 23, 42, 0.16);
            cursor: pointer;
            white-space: nowrap;
            box-sizing: border-box;
            transform: ${isSelected ? 'scale(1.12)' : 'scale(1)'};
            transition: transform 0.15s ease, box-shadow 0.15s ease;
          ">
            <span style="
              width: 20px;
              height: 20px;
              border-radius: 50%;
              background: ${aqiColor};
              color: #FFFFFF;
              font-size: 11px;
              font-weight: 800;
              display: flex;
              align-items: center;
              justify-content: center;
              font-family: monospace;
              flex-shrink: 0;
            ">${lm.num}</span>
            <span style="
              color: #0F172A;
              font-size: 11px;
              font-weight: 700;
              font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              max-width: 82px;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
              display: inline-block;
              line-height: 1.2;
            ">${shortTitle}</span>
            <span style="
              color: ${aqiColor};
              font-size: 10px;
              font-weight: 800;
              font-family: monospace;
              background: ${aqiColor}18;
              padding: 1.5px 5px;
              border-radius: 4px;
              flex-shrink: 0;
            ">${lm.aqi}</span>
          </div>
        `;

        const customIcon = L.divIcon({
          html: iconHtml,
          className: 'vayu-clean-marker',
          iconAnchor: [55, 15]
        });

        const marker = L.marker([lm.lat, lm.lng], { icon: customIcon });

        const popupContent = `
          <div style="padding: 2px; font-family: system-ui, sans-serif; min-width: 210px;">
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px;">
              <span style="font-weight: 800; font-size: 13px; color: #0F172A;">[#${lm.num}] ${lm.name}</span>
              <span style="background: ${aqiColor}20; color: ${aqiColor}; font-weight: 800; font-family: monospace; padding: 2px 7px; border-radius: 6px; font-size: 11px; flex-shrink: 0;">AQI ${lm.aqi}</span>
            </div>
            <p style="margin: 2px 0; font-size: 11px; color: #64748B; font-weight: 500;">${lm.zone} • ${lm.category}</p>
            <div style="margin: 6px 0; padding: 5px 8px; background: #F8FAFC; border-radius: 6px; border: 1px solid #E2E8F0; font-size: 11px; color: #1E293B;">
              PM2.5: <strong style="color: ${aqiColor};">${lm.pm25} µg/m³</strong>
            </div>
            <p style="margin: 4px 0 0 0; font-size: 11px; color: #334155; line-height: 1.35; font-style: italic;">
              "${lm.note}"
            </p>
          </div>
        `;

        marker.bindPopup(popupContent);

        marker.on('click', () => {
          setActiveLandmark(lm.num);
          if (lm.zoneId && onSelectZone) {
            onSelectZone(lm.zoneId);
          }
        });

        marker.addTo(group);
      });
    }

  }, [showHeatmap, selectedCity, selectedZoneId, activeLandmark]);

  // Handle clicking landmark from directory table below
  const handleTableClick = (lm) => {
    setActiveLandmark(lm.num);
    if (lm.zoneId && onSelectZone) {
      onSelectZone(lm.zoneId);
    }
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([lm.lat, lm.lng], 14, { duration: 1 });
    }
  };

  // Filter cities for search dropdown
  const cityKeys = Object.keys(CITIES_DATA);
  const filteredCities = cityKeys.filter((key) => {
    const c = CITIES_DATA[key];
    const q = citySearchQuery.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.state.toLowerCase().includes(q);
  });

  const handleCitySelect = (cityKey) => {
    if (onSelectCity) {
      onSelectCity(cityKey);
    }
    setCitySearchQuery('');
    setIsCityDropdownOpen(false);
  };

  return (
    <div className="flex flex-col gap-5">
      
      {/* 1. CITY SEARCH & SELECTION BAR */}
      <div className="p-4 sm:p-5 rounded-[28px] bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        
        {/* Left: City Search Input with Autocomplete Dropdown */}
        <div ref={searchContainerRef} className="relative flex-1 max-w-md">
          <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 focus-within:border-[#00B37E] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#00B37E]/20 transition-all">
            <Search className="w-4 h-4 text-[#00B37E] flex-shrink-0" />
            <input
              type="text"
              value={citySearchQuery}
              onChange={(e) => {
                setCitySearchQuery(e.target.value);
                setIsCityDropdownOpen(true);
              }}
              onFocus={() => setIsCityDropdownOpen(true)}
              placeholder="Search city (Meerut, Delhi, Noida, Gurugram, Lucknow...)"
              className="w-full text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 bg-transparent outline-none"
            />
            {citySearchQuery && (
              <button 
                onClick={() => setCitySearchQuery('')}
                className="text-xs text-slate-400 hover:text-slate-600 px-1"
              >
                ✕
              </button>
            )}
          </div>

          {/* City Search Dropdown */}
          {isCityDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="p-2 space-y-1 max-h-60 overflow-y-auto">
                {filteredCities.map((key) => {
                  const c = CITIES_DATA[key];
                  const isSelected = currentCityKey === key;

                  return (
                    <button
                      key={key}
                      onClick={() => handleCitySelect(key)}
                      className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between text-xs font-bold transition-colors cursor-pointer ${
                        isSelected 
                          ? 'bg-[#00B37E]/10 text-[#00B37E] border border-[#00B37E]/30' 
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-slate-400" />
                        <span>{c.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono font-normal">({c.state})</span>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-[#00B37E]" />}
                    </button>
                  );
                })}

                {filteredCities.length === 0 && (
                  <div className="p-3 text-center text-xs text-slate-400">
                    No matching city found
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right: Quick City Selection Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {cityKeys.map((key) => {
            const c = CITIES_DATA[key];
            const isSelected = currentCityKey === key;

            return (
              <button
                key={key}
                onClick={() => handleCitySelect(key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? 'bg-[#00B37E] text-white shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/80'
                }`}
              >
                📍 {c.name}
              </button>
            );
          })}
        </div>

      </div>

      {/* 2. MAP MAIN CARD */}
      <div className="relative rounded-[32px] border border-slate-200 bg-white overflow-hidden shadow-sm">
        
        {/* Map Header / Light Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-slate-200 bg-slate-50/70 z-20">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#00B37E]/10 text-[#00B37E]">
              <Navigation className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-extrabold text-slate-900 block font-sans">
                {activeCity.name} Interactive Pollution Density Map ({activeCity.state})
              </span>
              <span className="text-[11px] font-mono text-[#00B37E] font-bold">
                • 8 Live Landmarks • Downscaled Multi-Shade AQI Heatmap
              </span>
            </div>
          </div>

          {/* Interactive Controls (Map Tiles + Pollution Heatmap Only) */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            
            {/* Map Tile Style Switcher */}
            <div className="flex items-center p-1 rounded-xl bg-slate-200/60 border border-slate-200">
              <button
                onClick={() => setMapStyle('gmaps')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                  mapStyle === 'gmaps'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Google Maps Roadmap Standard"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Google Maps</span>
              </button>

              <button
                onClick={() => setMapStyle('satellite')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                  mapStyle === 'satellite'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Google Satellite Hybrid"
              >
                <Satellite className="w-3.5 h-3.5" />
                <span>Satellite</span>
              </button>

              <button
                onClick={() => setMapStyle('light')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                  mapStyle === 'light'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Clean High-Contrast Light Carto"
              >
                <span>Clean Light</span>
              </button>
            </div>

            {/* Pollution Heatmap Toggle */}
            <button
              onClick={() => setShowHeatmap(!showHeatmap)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                showHeatmap
                  ? 'bg-[#DC2626]/10 text-[#DC2626] border-[#DC2626]/30 shadow-2xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Pollution Heatmap</span>
            </button>

          </div>
        </div>

        {/* Working Leaflet Map Viewport */}
        <div className="relative w-full h-[520px] sm:h-[580px] bg-[#F4F6F8] select-none">
          <div ref={mapContainerRef} className="w-full h-full" />

          {/* Bottom Right HUD: Heatmap Density Scale */}
          <div className="absolute bottom-4 right-4 px-4 py-3 rounded-2xl bg-white/95 border border-slate-200/90 text-[11px] font-sans z-[1000] shadow-lg backdrop-blur-md">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1.5 font-mono">
              AQI DENSITY SHADES (WHO / CPCB SCALE)
            </span>
            <div className="flex items-center gap-3 font-semibold">
              <span className="flex items-center gap-1.5 text-[#00B37E]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#00B37E]" /> Good (0-70)
              </span>
              <span className="flex items-center gap-1.5 text-[#F59E0B]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" /> Moderate (71-150)
              </span>
              <span className="flex items-center gap-1.5 text-[#EA580C]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#EA580C]" /> Poor (151-220)
              </span>
              <span className="flex items-center gap-1.5 text-[#DC2626]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#DC2626] animate-pulse" /> Severe (300+)
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* 3. 8 NUMBERED LANDMARKS DIRECTORY TABLE FOR SELECTED CITY (UPDATES IN REAL TIME) */}
      <div className="p-6 rounded-[32px] bg-white border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
          <div>
            <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider font-sans flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#00B37E]" />
              {activeCity.name} 8 Landmark Stations (Click to Fly To & Inspect)
            </h4>
            <p className="text-xs text-slate-500 font-sans mt-0.5">
              Landmarks and particulate downscale telemetry updated in real time for {activeCity.name}, {activeCity.state}
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {activeCity.nearestStation}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {activeCity.landmarks.map((lm) => {
            const aqiColor = getAqiColor(lm.aqi);
            const isSelected = activeLandmark === lm.num || (lm.zoneId && lm.zoneId === selectedZoneId);

            return (
              <button
                key={lm.num}
                onClick={() => handleTableClick(lm)}
                className={`p-3 rounded-2xl border transition-all text-left flex items-start justify-between gap-2.5 cursor-pointer group ${
                  isSelected
                    ? 'bg-white border-2 border-[#00B37E] shadow-sm ring-4 ring-[#00B37E]/10'
                    : 'bg-slate-50/70 hover:bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs'
                }`}
              >
                <div className="flex items-start gap-2.5 truncate">
                  <span 
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold text-white flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: aqiColor }}
                  >
                    {lm.num}
                  </span>
                  <div className="truncate">
                    <p className="text-xs font-extrabold text-slate-900 group-hover:text-[#00B37E] transition-colors truncate">
                      {lm.name}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate font-mono">
                      {lm.zone}
                    </p>
                  </div>
                </div>

                <span 
                  className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg flex-shrink-0"
                  style={{ color: aqiColor, backgroundColor: `${aqiColor}18` }}
                >
                  AQI {lm.aqi}
                </span>
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
}