import React, { useState, useEffect, useMemo } from 'react';
import { Sparkles, Send, Bot, User, RotateCcw } from 'lucide-react';
import { askDrishti } from '../lib/api';
import { CITIES_DATA } from '../data/airData';

function getWelcomeMessage(loc) {
  const placeName = loc?.name || loc?.city || 'your selected location';
  const cityName = loc?.city ? `${loc.city}${loc.state ? `, ${loc.state}` : ''}` : loc?.state || 'your area';
  const aqiText = loc?.aqi != null ? ` (Current AQI: ${loc.aqi})` : '';

  return `Namaste! I am Drishti AI, your personal air intelligence assistant for ${placeName}${aqiText}. Ask me about real-time pollution across ${cityName}, whether it's a good time for outdoor activities or picnics, if you should wear a mask during your commute, and the optimal hours for opening home windows.`;
}

function getSamplePrompts(loc) {
  const placeName = loc?.name || loc?.city || 'this area';
  const cityName = loc?.city || loc?.state || 'the city';

  return [
    `Is now a good time for an outdoor walk or exercise around ${placeName}?`,
    `Should sensitive groups wear an N95 mask today in ${cityName}?`,
    `What is the best time to open apartment windows for fresh air in ${cityName}?`,
    `How does the current air quality in ${placeName} compare to typical levels?`,
    `Are there peak pollution hours to avoid for travel across ${cityName} today?`
  ];
}

function renderFormattedMessage(text) {
  if (!text) return null;

  const lines = text.split('\n');

  return lines.map((line, lineIdx) => {
    if (!line.trim()) {
      return <div key={lineIdx} className="h-2" />;
    }

    const parts = line.split(/(\*\*[^*]+?\*\*)/g);

    return (
      <p key={lineIdx} className="leading-relaxed mb-1.5 last:mb-0">
        {parts.map((part, partIdx) => {
          if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
            const boldText = part.slice(2, -2);
            return (
              <strong key={partIdx} className="font-bold">
                {boldText}
              </strong>
            );
          }
          return part;
        })}
      </p>
    );
  });
}

export default function AIAssistantView({ 
  onTriggerAlert, 
  currentLocation, 
  selectedCity, 
  selectedLocation,
  lat: propLat,
  lon: propLon,
}) {
  const [messages, setMessages] = useState(() => [
    {
      sender: 'ai',
      text: getWelcomeMessage(currentLocation),
      time: 'Just now',
    }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Sync initial welcome message whenever currentLocation changes (if user hasn't chatted yet)
  useEffect(() => {
    setMessages((prev) => {
      const hasUserMessages = prev.some((m) => m.sender === 'user');
      if (!hasUserMessages) {
        return [
          {
            sender: 'ai',
            text: getWelcomeMessage(currentLocation),
            time: 'Just now',
          }
        ];
      }
      return prev;
    });
  }, [currentLocation?.name, currentLocation?.city, currentLocation?.state, currentLocation?.aqi]);

  // Derive lat and lon from current selected location/city in app state, or fallback to Meerut
  const lat =
    propLat ??
    currentLocation?.lat ??
    selectedLocation?.lat ??
    (selectedCity && CITIES_DATA[selectedCity]?.center?.[0]) ??
    28.9845;

  const lon =
    propLon ??
    currentLocation?.lon ??
    currentLocation?.lng ??
    selectedLocation?.lon ??
    selectedLocation?.lng ??
    (selectedCity && CITIES_DATA[selectedCity]?.center?.[1]) ??
    77.7064;

  const samplePrompts = useMemo(() => getSamplePrompts(currentLocation), [currentLocation]);

  const handleResetChat = () => {
    setMessages([
      {
        sender: 'ai',
        text: getWelcomeMessage(currentLocation),
        time: 'Just now',
      }
    ]);
    setInputVal('');
  };

  const handleSend = async (textToSend) => {
    const query = (typeof textToSend === 'string' ? textToSend : inputVal).trim();
    if (!query || isTyping) return;

    const userMsg = {
      sender: 'user',
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputVal('');
    setIsTyping(true);

    try {
      const chatHistory = messages.slice(-6).map((m) => ({
        sender: m.sender,
        text: m.text,
        time: m.time,
      }));
      const reply = await askDrishti(query, lat, lon, chatHistory);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: reply || "I couldn't retrieve specific advice right now. Please try again.",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err) {
      console.error('Failed to get answer from Drishti AI:', err);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: "Sorry, I couldn't reach Drishti's brain just now. Please try again in a moment.",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-accent/10 text-accent flex items-center justify-center shadow-2xs">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-ink-900 font-sans flex items-center gap-2">
              Drishti AI Assistant
              <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-lime/40 text-ink-900 border border-lime/60">
                {currentLocation?.city || currentLocation?.name || 'Local'} Active
              </span>
            </h3>
            <p className="text-xs text-slate-500 font-sans">
              Personalized air quality guidance for {currentLocation?.name || currentLocation?.city || 'your area'}, commute, outdoor plans, and home ventilation
            </p>
          </div>
        </div>

        {messages.length > 1 && (
          <button
            type="button"
            onClick={handleResetChat}
            className="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-500 hover:text-ink-900 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all cursor-pointer"
            title="Reset conversation for current location"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>New Chat</span>
          </button>
        )}
      </div>

      {/* Suggested Questions */}
      <div className="space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
          Popular Questions for {currentLocation?.city || currentLocation?.name || 'Your Location'}
        </span>
        <div className="flex flex-wrap gap-2">
          {samplePrompts.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSend(p)}
              disabled={isTyping}
              className="text-xs px-4 py-2 rounded-full bg-white border border-slate-200/80 hover:border-accent hover:text-accent text-slate-700 transition-all font-semibold shadow-2xs text-left cursor-pointer active:scale-95 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Log */}
      <div className="p-5 sm:p-7 rounded-[32px] bg-white border border-slate-100 shadow-soft space-y-4 min-h-[380px] max-h-[500px] overflow-y-auto">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-3 ${m.sender === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold ${
              m.sender === 'user' ? 'bg-ink-900' : 'bg-accent shadow-xs'
            }`}>
              {m.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div className={`max-w-[85%] p-4 text-xs sm:text-sm leading-relaxed ${
              m.sender === 'user'
                ? 'bg-ink-900 text-white rounded-[22px] rounded-tr-xs shadow-2xs'
                : 'bg-[#F4F8F7] border border-slate-200/60 text-ink-900 rounded-[22px] rounded-tl-xs font-medium shadow-2xs'
            }`}>
              {renderFormattedMessage(m.text)}
              <span className={`text-[10px] mt-1.5 block font-mono ${
                m.sender === 'user' ? 'text-slate-400 text-right' : 'text-slate-400'
              }`}>
                {m.time}
              </span>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono italic pl-11">
            <Sparkles className="w-3.5 h-3.5 text-accent animate-spin" />
            <span>Drishti is thinking...</span>
          </div>
        )}
      </div>

      {/* Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        aria-label="AI atmospheric question form"
        className="flex items-center gap-2 p-2 pl-5 rounded-full bg-white border border-slate-200/90 shadow-soft focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 transition-all"
      >
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          disabled={isTyping}
          aria-label="Ask Drishti AI about air quality"
          placeholder={`Ask Drishti AI about air quality in ${currentLocation?.name || currentLocation?.city || 'your area'}, outdoor plans, or mask advice...`}
          className="flex-1 py-2 text-xs sm:text-sm text-ink-900 placeholder-slate-400 bg-transparent outline-none font-sans"
        />
        <button
          type="submit"
          disabled={!inputVal.trim() || isTyping}
          aria-label="Send question to Drishti AI"
          title="Send question"
          className="w-11 h-11 rounded-full bg-accent hover:bg-[#e65a26] text-white flex items-center justify-center transition-all disabled:opacity-50 cursor-pointer shadow-chip focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent flex-shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

    </div>
  );
}
