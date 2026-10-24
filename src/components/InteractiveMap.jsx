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
  Building2,
  Check,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { CITIES_DATA, DEFAULT_CITY } from '../data/airData';
import { getLiveAqiByCoords } from '../lib/api';

export default function InteractiveMap({ 
  selectedCity = DEFAULT_CITY,
  onSelectCity,
  selectedZoneId, 
  onSelectZone, 
  timeframe,
  compact = false,
  height = 'h-[520px] sm:h-[580px]',
  currentLocation,
  onSelectLocation
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layersGroupRef = useRef(null);
  const tileLayerRef = useRef(null);

  const onSelectLocationRef = useRef(onSelectLocation);
  useEffect(() => {
    onSelectLocationRef.current = onSelectLocation;
  }, [onSelectLocation]);

  // Active City Data
  const currentCityKey = CITIES_DATA[selectedCity] ? selectedCity : DEFAULT_CITY;
  const activeCity = CITIES_DATA[currentCityKey];

  // City Search State
  const [citySearchQuery, setCitySearchQuery] = useState('');
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const [osmSearchResults, setOsmSearchResults] = useState([]);
  const [isSearchingOsm, setIsSearchingOsm] = useState(false);
  const searchContainerRef = useRef(null);
  const searchAbortRef = useRef(null);

  // Available tile maps (OpenStreetMap Standard, Esri Satellite)
  const [mapStyle, setMapStyle] = useState('osm');
  const [tilesOffline, setTilesOffline] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [activeLandmark, setActiveLandmark] = useState(null);

  const tileUrls = {
    osm: {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attr: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
      subdomains: ['a', 'b', 'c'],
      maxZoom: 19
    },
    satellite: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attr: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
      subdomains: ['a', 'b', 'c', 'd'],
      maxZoom: 18
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

  // Fetch OpenStreetMap Nominatim Search API for Indian locations
  useEffect(() => {
    if (!citySearchQuery.trim() || citySearchQuery.length < 3) {
      setOsmSearchResults([]);
      setIsSearchingOsm(false);
      return;
    }

    if (searchAbortRef.current) {
      searchAbortRef.current.abort();
    }
    const controller = new AbortController();
    searchAbortRef.current = controller;

    const timer = setTimeout(async () => {
      setIsSearchingOsm(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(citySearchQuery)}&countrycodes=in&limit=4`,
          {
            headers: { 'Accept-Language': 'en' },
            signal: controller.signal
          }
        );
        if (res.ok) {
          const list = await res.json();
          setOsmSearchResults(
            list.map((item) => ({
              name: item.display_name.split(',')[0],
              city: item.display_name.split(',')[1]?.trim() || 'India',
              state: item.display_name.split(',')[2]?.trim() || '',
              lat: parseFloat(item.lat),
              lng: parseFloat(item.lon)
            }))
          );
        }
      } catch (e) {
        if (e.name !== 'AbortError') {
          console.log('OSM search error:', e);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsSearchingOsm(false);
        }
      }
    }, 350);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [citySearchQuery]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: activeCity.center,
      zoom: activeCity.zoom,
      minZoom: 4,
      maxZoom: 18,
      zoomControl: !compact,
      wheelDebounceTime: 60,
      zoomAnimation: true,
      fadeAnimation: true
    });

    mapInstanceRef.current = map;

    // Base Tile Layer with OpenStreetMap Standard by default
    const currentTile = tileUrls[mapStyle] || tileUrls.osm;
    const tileLayer = L.tileLayer(currentTile.url, {
      attribution: currentTile.attr,
      maxZoom: currentTile.maxZoom || 19,
      subdomains: currentTile.subdomains || ['a', 'b', 'c'],
      keepBuffer: 3,
      updateWhenIdle: false,
      updateWhenZooming: false
    }).addTo(map);

    let errCount = 0;
    tileLayer.on('tileerror', () => {
      errCount++;
      if (errCount > 8) {
        setTilesOffline(true);
      }
    });

    tileLayer.on('load', () => {
      errCount = 0;
      setTilesOffline(false);
    });

    tileLayerRef.current = tileLayer;

    // Overlay layers group
    layersGroupRef.current = L.layerGroup().addTo(map);

    // Map Click Listener: Reverse Geocode via OpenStreetMap API + Fetch Live AQI
    const handleMapClick = async (e) => {
      const { lat, lng } = e.latlng;
      const popup = L.popup({ minWidth: 230 })
        .setLatLng([lat, lng])
        .setContent(`
          <div style="font-family: system-ui, -apple-system, sans-serif; padding: 4px;">
            <div style="display: flex; align-items: center; gap: 6px; color: #0284C7; font-size: 12px; font-weight: 700;">
              <span>Querying OpenStreetMap API...</span>
            </div>
            <p style="margin: 4px 0 0 0; font-size: 11px; color: #64748B; font-family: monospace;">
              [${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E]
            </p>
          </div>
        `)
        .openOn(map);

      try {
        const [osmRes, live] = await Promise.all([
          fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1`,
            { headers: { 'Accept-Language': 'en' } }
          ).then((r) => (r.ok ? r.json() : null)).catch(() => null),
          getLiveAqiByCoords(lat, lng).catch(() => null),
        ]);

        const placeName =
          osmRes?.name ||
          osmRes?.address?.suburb ||
          osmRes?.address?.neighbourhood ||
          osmRes?.address?.city ||
          osmRes?.address?.town ||
          osmRes?.address?.village ||
          'Selected Location';
        const placeCity =
          osmRes?.address?.city ||
          osmRes?.address?.town ||
          osmRes?.address?.county ||
          osmRes?.address?.state_district ||
          'India';
        const placeState = osmRes?.address?.state || '';
        const aqiVal = live?.aqi ?? 125;
        const aqiColor = getAqiColor(aqiVal);

        const container = document.createElement('div');
        container.style.fontFamily = 'system-ui, -apple-system, sans-serif';
        container.style.padding = '4px';
        container.style.minWidth = '230px';
        container.innerHTML = `
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px;">
            <div>
              <div style="font-weight: 800; font-size: 13px; color: #0F172A; line-height: 1.2;">${placeName}</div>
              <div style="font-size: 11px; color: #64748B; margin-top: 1px;">${placeCity}${placeState ? `, ${placeState}` : ''}</div>
            </div>
            <span style="background: ${aqiColor}20; color: ${aqiColor}; font-weight: 800; font-family: monospace; padding: 2px 7px; border-radius: 6px; font-size: 12px; flex-shrink: 0;">
              AQI ${aqiVal}
            </span>
          </div>
          <div style="margin: 6px 0; padding: 6px 8px; background: #F8FAFC; border-radius: 8px; border: 1px solid #E2E8F0; font-size: 11px; color: #334155; display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">
            <div>PM2.5: <strong style="color: ${aqiColor};">${live?.pm25 ?? 'N/A'} µg/m³</strong></div>
            <div>Temp: <strong>${live?.temp != null ? `${live.temp}°C` : 'N/A'}</strong></div>
            <div>Humidity: <strong>${live?.humidity != null ? `${live.humidity}%` : 'N/A'}</strong></div>
            <div>Wind: <strong>${live?.windSpeed != null ? `${live.windSpeed} km/h` : 'N/A'}</strong></div>
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px; margin-top: 8px;">
            <span style="font-size: 10px; color: #94A3B8; font-family: monospace;">OpenStreetMap Fix</span>
            <button id="osm-set-location-btn" style="background: #00B37E; color: white; border: none; border-radius: 6px; padding: 4px 10px; font-size: 11px; font-weight: 700; cursor: pointer; transition: background 0.15s;">
              Set as Active
            </button>
          </div>
        `;

        popup.setContent(container);

        const btn = container.querySelector('#osm-set-location-btn');
        if (btn) {
          btn.onclick = () => {
            if (onSelectLocationRef.current) {
              onSelectLocationRef.current({
                name: placeName,
                city: placeCity,
                state: placeState,
                lat: Number(lat.toFixed(4)),
                lng: Number(lng.toFixed(4)),
                aqi: aqiVal,
                pm25: live?.pm25 ?? 45,
                pm10: live?.pm10 ?? 75,
                temp: live?.temp ?? 24,
                humidity: live?.humidity ?? 55,
                windSpeed: live?.windSpeed != null ? `${live.windSpeed} km/h` : 'N/A',
                windDir: live?.windDir || 'N/A',
                station: `OpenStreetMap Node [${lat.toFixed(2)}°N, ${lng.toFixed(2)}°E]`,
                syncTime: live?.stale ? 'Offline Cache' : 'Live OSM GPS Fix',
                stale: Boolean(live?.stale)
              });
              map.closePopup();
            }
          };
        }
      } catch (err) {
        popup.setContent(`
          <div style="font-family: system-ui; padding: 4px; font-size: 11px; color: #DC2626;">
            Unable to reverse geocode coordinate [${lat.toFixed(4)}, ${lng.toFixed(4)}].
          </div>
        `);
      }
    };

    map.on('click', handleMapClick);

    // Immediate and staged invalidateSize calls so tiles render instantly without waiting for zoom
    const runInvalidate = () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize({ animate: false });
      }
    };

    if (typeof requestAnimationFrame !== 'undefined') {
      requestAnimationFrame(runInvalidate);
    }
    const t1 = setTimeout(runInvalidate, 50);
    const t2 = setTimeout(runInvalidate, 200);
    const t3 = setTimeout(runInvalidate, 600);

    // Auto-invalidate size whenever map container changes dimensions
    let resizeObserver = null;
    if (typeof ResizeObserver !== 'undefined' && mapContainerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        runInvalidate();
      });
      resizeObserver.observe(mapContainerRef.current);
    }

    const handleWindowResize = () => {
      runInvalidate();
    };
    window.addEventListener('resize', handleWindowResize);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        runInvalidate();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      window.removeEventListener('resize', handleWindowResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (resizeObserver) resizeObserver.disconnect();
      map.off('click', handleMapClick);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Invalidate size on compact/height/city prop change
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.invalidateSize();
    }
  }, [compact, height, selectedCity]);

  // Handle tile map style change cleanly by replacing tile layer
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const currentTile = tileUrls[mapStyle] || tileUrls.osm;
    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }
    const newLayer = L.tileLayer(currentTile.url, {
      attribution: currentTile.attr,
      maxZoom: currentTile.maxZoom || 19,
      subdomains: currentTile.subdomains || ['a', 'b', 'c'],
      keepBuffer: 3,
      updateWhenIdle: false,
      updateWhenZooming: false
    });
    newLayer.addTo(mapInstanceRef.current);
    tileLayerRef.current = newLayer;
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

  const handleOsmResultSelect = async (item) => {
    setIsCityDropdownOpen(false);
    setCitySearchQuery('');
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([item.lat, item.lng], 12, { duration: 1.2 });
    }
    try {
      const live = await getLiveAqiByCoords(item.lat, item.lng);
      if (onSelectLocationRef.current) {
        onSelectLocationRef.current({
          name: item.name,
          city: item.city,
          state: item.state,
          lat: Number(item.lat.toFixed(4)),
          lng: Number(item.lng.toFixed(4)),
          aqi: live?.aqi ?? 125,
          pm25: live?.pm25 ?? 45,
          pm10: live?.pm10 ?? 75,
          temp: live?.temp ?? 24,
          humidity: live?.humidity ?? 55,
          windSpeed: live?.windSpeed != null ? `${live.windSpeed} km/h` : 'N/A',
          windDir: live?.windDir || 'N/A',
          station: `OpenStreetMap Node [${item.lat.toFixed(2)}°N, ${item.lng.toFixed(2)}°E]`,
          syncTime: live?.stale ? 'Offline Cache' : 'Live OSM GPS Fix',
          stale: Boolean(live?.stale)
        });
      }
    } catch (e) {
      console.log('Error fetching AQI for OSM location:', e);
    }
  };

  // Compact Viewport (Embedded in BreatheEasyHero) - Fast, lag-free, edge-to-edge
  if (compact) {
    return (
      <div className="relative w-full h-full min-h-[360px] bg-[#F4F6F8] select-none rounded-[32px] overflow-hidden">
        {tilesOffline && (
          <div className="absolute top-3 left-3 right-3 sm:right-auto z-[1000] flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500/95 text-white text-xs font-medium backdrop-blur-md shadow-md animate-in fade-in">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>Map tiles unavailable offline; station markers and overlays remain active.</span>
          </div>
        )}

        {/* Floating Map Status Overlay */}
        <div className="absolute bottom-4 left-4 z-[1000] px-4 py-2.5 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200/80 shadow-md flex items-center gap-3 pointer-events-none">
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-black font-sans text-ink-900">{activeCity.landmarks?.[0]?.aqi || 120}</span>
            <span className="text-[10px] font-bold text-ink-400 font-mono">AQI</span>
          </div>
          <div className="h-6 w-px bg-slate-200" />
          <div>
            <span className="text-xs font-bold text-ink-900 block leading-tight">{activeCity.name}</span>
            <span className="text-[10px] font-semibold text-[#00875A] block leading-tight">OpenStreetMap Standard</span>
          </div>
        </div>

        <div ref={mapContainerRef} className="w-full h-full min-h-[360px]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      
      {/* 1. CITY SEARCH & SELECTION BAR */}
      {!compact && (
        <div className="p-4 sm:p-5 rounded-[28px] bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          
          {/* Left: City Search Input with Autocomplete Dropdown (Local + OpenStreetMap API) */}
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
                aria-label="Search supported Indian cities"
                placeholder="Search any Indian city via OpenStreetMap..."
                className="w-full text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 bg-transparent outline-none"
              />
              {isSearchingOsm && (
                <Loader2 className="w-3.5 h-3.5 text-accent animate-spin flex-shrink-0" />
              )}
              {citySearchQuery && (
                <button 
                  type="button"
                  onClick={() => setCitySearchQuery('')}
                  aria-label="Clear city query"
                  className="text-xs text-slate-400 hover:text-slate-600 px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00B37E] rounded"
                >
                  ✕
                </button>
              )}
            </div>

            {/* City Search Dropdown */}
            {isCityDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 max-h-72 overflow-y-auto">
                <div className="p-2 space-y-1">
                  
                  {/* Preset Supported Cities */}
                  {filteredCities.length > 0 && (
                    <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                      Key Airsheds
                    </div>
                  )}
                  {filteredCities.map((key) => {
                    const c = CITIES_DATA[key];
                    const isSelected = currentCityKey === key;

                    return (
                      <button
                        key={key}
                        onClick={() => handleCitySelect(key)}
                        style={{
                          backgroundColor: isSelected ? '#F0FDF4' : undefined,
                          borderColor: isSelected ? '#00B37E' : undefined,
                        }}
                        className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between text-xs font-bold transition-colors cursor-pointer ${
                          isSelected 
                            ? 'text-emerald-950 border-2 border-[#00B37E] font-black' 
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Building2 className={`w-4 h-4 ${isSelected ? 'text-[#00B37E]' : 'text-slate-400'}`} />
                          <span className={isSelected ? 'font-black text-emerald-950' : 'text-slate-800'}>{c.name}</span>
                          <span className={`text-[10px] font-mono ${isSelected ? 'text-emerald-700 font-bold' : 'text-slate-400 font-normal'}`}>({c.state})</span>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-[#00B37E] stroke-[2.5]" />}
                      </button>
                    );
                  })}

                  {/* OpenStreetMap Online Search Results */}
                  {osmSearchResults.length > 0 && (
                    <div className="pt-2 border-t border-slate-100">
                      <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-accent font-bold flex items-center gap-1.5">
                        <Globe className="w-3 h-3 text-accent" />
                        <span>OpenStreetMap Geocoded Places</span>
                      </div>
                      {osmSearchResults.map((item, idx) => (
                        <button
                          key={`osm-${idx}`}
                          onClick={() => handleOsmResultSelect(item)}
                          className="w-full p-2.5 rounded-xl text-left flex items-center justify-between text-xs font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <MapPin className="w-4 h-4 text-[#00B37E] flex-shrink-0" />
                            <div className="truncate">
                              <span className="block truncate">{item.name}</span>
                              <span className="text-[10px] text-slate-400 font-mono font-normal">
                                {item.city}{item.state ? `, ${item.state}` : ''}
                              </span>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex-shrink-0">
                            Fly & Fix
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {filteredCities.length === 0 && osmSearchResults.length === 0 && !isSearchingOsm && (
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
                  style={{
                    backgroundColor: isSelected ? '#0F1E36' : '#FFFFFF',
                    color: isSelected ? '#FFFFFF' : '#1E293B',
                    borderColor: isSelected ? '#0F1E36' : '#CBD5E1',
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-black transition-all whitespace-nowrap cursor-pointer border flex items-center gap-1.5 ${
                    isSelected
                      ? 'shadow-sm ring-2 ring-[#0F1E36]/30'
                      : 'hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <span className="text-sm leading-none flex-shrink-0">📍</span>
                  <span className={isSelected ? 'text-white font-black' : 'text-slate-800 font-bold'}>
                    {c.name}
                  </span>
                </button>
              );
            })}
          </div>

        </div>
      )}

      {/* 2. MAP MAIN CARD */}
      <div className="relative rounded-[32px] border border-slate-100 bg-white overflow-hidden shadow-soft">
        
        {/* Map Header / Light Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50/70 z-20">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-accent/10 text-accent">
              <Navigation className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-extrabold text-ink-900 block font-sans">
                {activeCity.name} Interactive Pollution Density Map ({activeCity.state})
              </span>
              <span className="text-[11px] font-mono text-accent font-bold">
                • 8 Live Landmarks • Downscaled Multi-Shade AQI Heatmap • Click Map to Query OpenStreetMap API
              </span>
            </div>
          </div>

          {/* Interactive Controls (Map Tiles + Pollution Heatmap Only) */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            
            {/* Map Tile Style Switcher: OpenStreetMap Standard and Esri Satellite */}
            <div className="flex items-center p-1 rounded-xl bg-slate-200/60 border border-slate-200" role="group" aria-label="Map style selector">
              <button
                type="button"
                onClick={() => setMapStyle('osm')}
                aria-label="Switch to OpenStreetMap Standard Map"
                aria-pressed={mapStyle === 'osm'}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  mapStyle === 'osm'
                    ? 'bg-white text-ink-900 shadow-xs'
                    : 'text-slate-600 hover:text-ink-900'
                }`}
                title="OpenStreetMap Standard"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>OpenStreetMap</span>
              </button>

              <button
                type="button"
                onClick={() => setMapStyle('satellite')}
                aria-label="Switch to Esri World Imagery Satellite Map"
                aria-pressed={mapStyle === 'satellite'}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  mapStyle === 'satellite'
                    ? 'bg-white text-ink-900 shadow-xs'
                    : 'text-slate-600 hover:text-ink-900'
                }`}
                title="Satellite (Esri World Imagery)"
              >
                <Satellite className="w-3.5 h-3.5" />
                <span>Satellite (Esri)</span>
              </button>
            </div>

            {/* Pollution Heatmap Toggle */}
            <button
              type="button"
              onClick={() => setShowHeatmap(!showHeatmap)}
              aria-label="Toggle pollution heatmap overlay"
              aria-pressed={showHeatmap}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border text-xs font-bold cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626] ${
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
        <div className={`relative w-full ${height} bg-[#F4F6F8] select-none`}>
          {tilesOffline && (
            <div className="absolute top-3 left-3 right-3 sm:right-auto z-[1000] flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500/95 text-white text-xs font-medium backdrop-blur-md shadow-md animate-in fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>Map tiles unavailable offline; station markers and overlays remain active.</span>
            </div>
          )}

          <div ref={mapContainerRef} className="w-full h-full" />

          {/* Bottom Right HUD: Heatmap Density Scale */}
          <div className="absolute bottom-4 right-4 px-4 py-3 rounded-2xl bg-white/95 border border-slate-200/90 text-[11px] font-sans z-[1000] shadow-lg backdrop-blur-md">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-1.5 font-mono">
              AQI DENSITY SHADES (WHO / CPCB SCALE)
            </span>
            <div className="flex items-center gap-3 font-semibold">
              <span className="flex items-center gap-1.5 text-[#00875A]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#00B37E]" /> Good (0-70)
              </span>
              <span className="flex items-center gap-1.5 text-[#B45309]">
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
      {!compact && (
        <div className="p-6 sm:p-7 rounded-[32px] bg-white border border-slate-100 shadow-soft">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
            <div>
              <h4 className="text-sm font-extrabold text-ink-900 uppercase tracking-wider font-sans flex items-center gap-2">
                <MapPin className="w-4 h-4 text-accent" />
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
                  className={`p-3.5 rounded-2xl border transition-all text-left flex items-start justify-between gap-2.5 cursor-pointer group ${
                    isSelected
                      ? 'bg-emerald-50/70 border-2 border-[#00B37E] shadow-md ring-2 ring-[#00B37E]/20'
                      : 'bg-slate-50/70 hover:bg-white border-slate-200/80 hover:border-slate-300 shadow-2xs hover:shadow-soft'
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
                      <p className="text-xs font-extrabold text-ink-900 group-hover:text-accent transition-colors truncate">
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
      )}

    </div>
  );
}
