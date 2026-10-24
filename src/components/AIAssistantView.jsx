import React, { useState } from 'react';
import { Sparkles, Send, Bot, User } from 'lucide-react';
import { askDrishti } from '../lib/api';
import { CITIES_DATA } from '../data/airData';

export default function AIAssistantView({ 
  onTriggerAlert, 
  currentLocation, 
  selectedCity, 
  selectedLocation,
  lat: propLat,
  lon: propLon,
}) {
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: "Namaste! I am Drishti AI, your personal air intelligence assistant for Meerut. Ask me about real-time pollution in your neighborhood, whether it's a good day for a picnic at Meerut Cantt, if you should wear a mask or delay your travel through Partapur, and when to open home windows.",
      time: 'Just now',
    }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);

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

  const samplePrompts = [
    "Is today a good day for a picnic at Meerut Cantt or Pine Woodlands?",
    "Should I wear an N95 mask for my road commute to Begum Bridge?",
    "Should I delay my travel through Partapur Industrial Corridor?",
    "What is the best time to open my apartment windows in Shastri Nagar?",
    "Can I go for an evening walk around Nauchandi Grounds tonight?"
  ];

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
      const reply = await askDrishti(query, lat, lon);
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
                {currentLocation?.city || 'Meerut'} Local Engine Active
              </span>
            </h3>
            <p className="text-xs text-slate-500 font-sans">
              Personalized air quality guidance for your neighborhood, commute, picnic plans, and home ventilation
            </p>
          </div>
        </div>
      </div>

      {/* Suggested Questions */}
      <div className="space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
          Popular Questions for Meerut
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
              <p>{m.text}</p>
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
          placeholder="Ask Drishti AI about air quality in Meerut, picnics, mask advice, or travel delays..."
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