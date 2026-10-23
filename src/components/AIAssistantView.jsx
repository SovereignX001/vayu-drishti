import React, { useState } from 'react';
import { Sparkles, Send, Bot, User, ArrowRight } from 'lucide-react';

export default function AIAssistantView({ onTriggerAlert }) {
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: "Namaste! I am Drishti AI, your personal air intelligence assistant for Meerut. Ask me about real-time pollution in your neighborhood, whether it's a good day for a picnic at Meerut Cantt, if you should wear a mask or delay your travel through Partapur, and when to open home windows.",
      time: 'Just now',
    }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const samplePrompts = [
    "Is today a good day for a picnic at Meerut Cantt or Pine Woodlands?",
    "Should I wear an N95 mask for my road commute to Begum Bridge?",
    "Should I delay my travel through Partapur Industrial Corridor?",
    "What is the best time to open my apartment windows in Shastri Nagar?",
    "Can I go for an evening walk around Nauchandi Grounds tonight?"
  ];

  const handleSend = (textToSend) => {
    const query = textToSend || inputVal;
    if (!query.trim()) return;

    const userMsg = {
      sender: 'user',
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputVal('');
    setIsTyping(true);

    setTimeout(() => {
      let reply = "";
      const lower = query.toLowerCase();

      if (lower.includes('picnic') || lower.includes('cantt') || lower.includes('park') || lower.includes('pine')) {
        reply = "✓ Great Day for a Picnic! Meerut Cantt & Mall Road (AQI 58) is currently protected by a dense military pine and neem botanical canopy. It is an exceptional day for a family picnic, morning walk, or outdoor sports. The urban forest actively sinks particulates, giving it the cleanest air in Meerut district.";
      } else if (lower.includes('mask') || lower.includes('commute') || lower.includes('begum bridge') || lower.includes('abu lane')) {
        reply = "⚠ Travel Tip: If you are commuting through Begum Bridge or Abu Lane during peak hours (08:30 AM - 10:30 AM or 06:00 PM - 08:00 PM), traveling with an N95 mask is strongly advised. Narrow market radials trap vehicle exhaust with PM2.5 reaching 120-140 µg/m³.";
      } else if (lower.includes('partapur') || lower.includes('delay') || lower.includes('expressway') || lower.includes('travel')) {
        reply = "⚠ Delay Your Travel if Possible: Partapur Industrial Area & Delhi-Meerut Expressway Link is currently at AQI 345 (Severe). Early boundary layer inversion traps industrial boiler soot and heavy freight exhaust under a 160m lid. We recommend delaying non-essential travel until after 11:30 AM when solar thermal lift improves dispersion.";
      } else if (lower.includes('shastri nagar') || lower.includes('window') || lower.includes('ventilate')) {
        reply = "Shastri Nagar Sector 3 is at AQI 125 (Moderate). The optimal window to open your apartment windows for fresh air exchange is between 01:00 PM and 04:00 PM. Keep windows sealed between 08:00 AM - 10:00 AM during morning vehicular commute.";
      } else if (lower.includes('jog') || lower.includes('walk') || lower.includes('nauchandi') || lower.includes('run')) {
        reply = "For Nauchandi Grounds (AQI 170), early morning before 07:30 AM or late afternoon around 03:30 PM is acceptable for light exercise. Avoid vigorous endurance running between 08:00 AM - 10:00 AM when cold surface air traps vehicular smoke.";
      } else {
        reply = `Drishti AI advice: Today in Meerut, the Cantt Forest Reserve (AQI 58) is ideal for picnics and unmasked outdoor plans, while the southern industrial corridor at Partapur (AQI 345) requires wearing an N95 mask or delaying non-essential road travel.`;
      }

      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: reply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setIsTyping(false);
    }, 700);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#00B37E]/10 text-[#00B37E] flex items-center justify-center shadow-xs">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 font-sans flex items-center gap-2">
              Drishti AI Assistant
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#00B37E]/15 text-[#00B37E]">
                Meerut Local Engine Active
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
              onClick={() => handleSend(p)}
              className="text-xs px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:border-[#00B37E] hover:text-[#00B37E] text-slate-700 transition-all font-medium shadow-2xs text-left cursor-pointer active:scale-95"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Log */}
      <div className="p-5 sm:p-6 rounded-[28px] bg-white border border-slate-200 shadow-xs space-y-4 min-h-[360px] max-h-[500px] overflow-y-auto">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-3 ${m.sender === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold ${
              m.sender === 'user' ? 'bg-slate-800' : 'bg-[#00B37E]'
            }`}>
              {m.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div className={`max-w-[85%] p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
              m.sender === 'user'
                ? 'bg-slate-900 text-white rounded-tr-none'
                : 'bg-slate-50 border border-slate-200/80 text-slate-800 rounded-tl-none font-medium'
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
            <Sparkles className="w-3.5 h-3.5 text-[#00B37E] animate-spin" />
            <span>Drishti AI is analyzing Meerut downscaled telemetry...</span>
          </div>
        )}
      </div>

      {/* Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex items-center gap-2 p-2 rounded-2xl bg-white border border-slate-200 shadow-sm"
      >
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder="Ask Drishti AI about air quality in Meerut, picnics, mask advice, or travel delays..."
          className="flex-1 px-4 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 bg-transparent outline-none font-sans"
        />
        <button
          type="submit"
          disabled={!inputVal.trim()}
          className="px-5 py-2.5 rounded-xl bg-[#00B37E] hover:bg-[#009B6D] text-white text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          <span>Ask</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>

    </div>
  );
}