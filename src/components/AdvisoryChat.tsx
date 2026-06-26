import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, Activity } from '../types';
import { MessageSquare, Send, Sparkles, User, Bot, RefreshCw, HelpCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface AdvisoryChatProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  location: string;
  currentActivities: Activity[];
}

export default function AdvisoryChat({
  messages,
  onSendMessage,
  isLoading,
  location,
  currentActivities,
}: AdvisoryChatProps) {
  const [inputText, setInputText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    onSendMessage(inputText);
    setInputText('');
  };

  const starters = [
    `雨の日用のインドアプランは？ (Rainy options?)`,
    `Suggest a food itinerary around the culture spots.`,
    `Which activities are best for families?`,
    `Draft an optimized half-day schedule.`,
  ];

  // A helper to render bullet points or bold text inside AI responses beautifully without package bloat
  const formatMessageText = (text: string) => {
    return text.split('\n').map((line, i) => {
      let content = line;
      // Handle bold tags **text**
      const boldRegex = /\*\*(.*?)\*\*/g;
      const parts = [];
      let lastIndex = 0;
      let match;
      
      while ((match = boldRegex.exec(content)) !== null) {
        if (match.index > lastIndex) {
          parts.push(content.substring(lastIndex, match.index));
        }
        parts.push(<strong key={match.index} className="font-bold text-slate-800">{match[1]}</strong>);
        lastIndex = boldRegex.lastIndex;
      }
      if (lastIndex < content.length) {
        parts.push(content.substring(lastIndex));
      }

      const formattedLine = parts.length > 0 ? parts : content;

      // Check if list item
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        return (
          <li key={i} className="list-disc ml-5 mb-1 text-xs text-slate-600 leading-relaxed">
            {formattedLine}
          </li>
        );
      }
      
      if (line.trim() === '') {
        return <div key={i} className="h-2" />;
      }

      return (
        <p key={i} className="text-xs text-slate-600 leading-relaxed mb-2 last:mb-0">
          {formattedLine}
        </p>
      );
    });
  };

  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-brand-100 text-brand-600">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-xs text-slate-800 tracking-wide uppercase">
              LOCAL ADVISOR COMPANION
            </h3>
            <p className="text-[10px] text-slate-400 font-mono">
              POWERED BY GEMINI 3.5 FLASH
            </p>
          </div>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-50/50">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col justify-center items-center text-center p-6 space-y-4">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-slate-700">
                Ask anything about {location || "your area"}!
              </h4>
              <p className="text-[11px] text-slate-400 mt-1 max-w-[240px] leading-relaxed">
                Consult with your AI guide to get rain contingencies, dinner pairs, or kid-friendly advice.
              </p>
            </div>

            {/* Starters */}
            <div className="w-full pt-2 flex flex-col gap-1.5">
              {starters.map((starter, idx) => (
                <button
                  key={idx}
                  onClick={() => onSendMessage(starter)}
                  disabled={isLoading || !location}
                  className="w-full text-left text-xs bg-white hover:bg-slate-50 border border-slate-100 px-3 py-2 rounded-xl transition duration-200 text-slate-600 hover:text-slate-900 shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Sparkles className="w-3 h-3 text-brand-500 shrink-0" />
                  <span className="truncate">{starter}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4.5">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {/* Assistant Avatar */}
                {msg.sender === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                {/* Bubble */}
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 border text-xs shadow-sm ${
                    msg.sender === 'user'
                      ? 'bg-brand-500 border-brand-600 text-white rounded-tr-none'
                      : 'bg-white border-slate-100 rounded-tl-none'
                  }`}
                >
                  {msg.sender === 'user' ? (
                    <p className="leading-relaxed">{msg.text}</p>
                  ) : (
                    <div>{formatMessageText(msg.text)}</div>
                  )}
                </div>

                {/* User Avatar */}
                {msg.sender === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {/* Typing Loader */}
            {isLoading && (
              <div className="flex gap-2.5 justify-start">
                <div className="w-7 h-7 rounded-lg bg-slate-900 text-slate-100 flex items-center justify-center shrink-0 animate-pulse">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-none px-4 py-3 text-xs shadow-sm flex items-center gap-2">
                  <span className="flex items-center gap-1.5 text-slate-400 font-mono text-[10px]">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Thinking...
                  </span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-3 bg-slate-50 border-t border-slate-100 flex gap-2 shrink-0">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={isLoading || !location}
          placeholder={location ? `Ask about ${location}...` : "Search an area first to chat"}
          className="flex-1 bg-white border border-slate-100 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-brand-500 transition shadow-inner disabled:bg-slate-100 disabled:cursor-not-allowed"
        />
        <button
          type="submit"
          disabled={isLoading || !inputText.trim() || !location}
          className="bg-brand-500 hover:bg-brand-600 disabled:opacity-40 disabled:hover:bg-brand-500 text-white rounded-xl p-2 transition cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
