import React, { useState, useEffect } from 'react';
import { Activity, DayPlan, ChatMessage, SearchHistoryItem } from './types';
import InteractiveMap from './components/InteractiveMap';
import ActivityCard from './components/ActivityCard';
import ActivityDetail from './components/ActivityDetail';
import DayPlanner from './components/DayPlanner';
import AdvisoryChat from './components/AdvisoryChat';
import {
  Compass,
  Search,
  MapPin,
  Sparkles,
  AlertCircle,
  HelpCircle,
  History,
  X,
  Map,
  MessageSquare,
  Bookmark,
  Calendar,
  Layers,
  ChevronRight,
  Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  // --- Persistent Storage State ---
  const [cityName, setCityName] = useState<string>(() => {
    return localStorage.getItem('laf_city_name') || 'Paris, France';
  });

  const [activities, setActivities] = useState<Activity[]>(() => {
    const saved = localStorage.getItem('laf_activities');
    return saved ? JSON.parse(saved) : [];
  });

  const [plannedActivities, setPlannedActivities] = useState<{ activity: Activity; slot: 'Morning' | 'Afternoon' | 'Evening' }[]>(() => {
    const saved = localStorage.getItem('laf_planner');
    return saved ? JSON.parse(saved) : [];
  });

  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>(() => {
    const saved = localStorage.getItem('laf_history');
    return saved ? JSON.parse(saved) : [
      { id: '1', location: 'Paris, France', timestamp: Date.now() },
      { id: '2', location: 'Kyoto, Japan', timestamp: Date.now() - 100000 },
      { id: '3', location: 'Austin, Texas', timestamp: Date.now() - 200000 }
    ];
  });

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('laf_chat');
    return saved ? JSON.parse(saved) : [];
  });

  // --- UI & Interaction State ---
  const [locationInput, setLocationInput] = useState('');
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  
  // Filters
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [durationFilter, setDurationFilter] = useState<string>('all');
  const [costFilter, setCostFilter] = useState<string>('all');

  // Loading, Geolocation, and Error States
  const [isLoading, setIsLoading] = useState(false);
  const [isGeoLoading, setIsGeoLoading] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync state to LocalStorage
  useEffect(() => {
    localStorage.setItem('laf_city_name', cityName);
  }, [cityName]);

  useEffect(() => {
    localStorage.setItem('laf_activities', JSON.stringify(activities));
  }, [activities]);

  useEffect(() => {
    localStorage.setItem('laf_planner', JSON.stringify(plannedActivities));
  }, [plannedActivities]);

  useEffect(() => {
    localStorage.setItem('laf_history', JSON.stringify(searchHistory));
  }, [searchHistory]);

  useEffect(() => {
    localStorage.setItem('laf_chat', JSON.stringify(chatMessages));
  }, [chatMessages]);

  // Initial load recommendation list if empty
  useEffect(() => {
    if (activities.length === 0 && cityName) {
      triggerSearch(cityName);
    }
  }, []);

  // Update selected activity defaults
  useEffect(() => {
    if (activities.length > 0 && !selectedActivityId) {
      setSelectedActivityId(activities[0].id);
    }
  }, [activities]);

  // --- Search handler ---
  const triggerSearch = async (location: string, coords?: { latitude: number; longitude: number }) => {
    setIsLoading(true);
    setErrorMsg(null);
    setSelectedActivityId(null);

    try {
      const response = await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location,
          coords,
          category: categoryFilter !== 'all' ? categoryFilter : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch recommendations.');
      }

      const data = await response.json();
      
      if (data.activities && Array.isArray(data.activities)) {
        setActivities(data.activities);
        setCityName(data.location);
        
        // Add to search history if not already there
        setSearchHistory((prev) => {
          const filtered = prev.filter((item) => item.location.toLowerCase() !== data.location.toLowerCase());
          const newItem: SearchHistoryItem = {
            id: Date.now().toString(),
            location: data.location,
            timestamp: Date.now(),
          };
          return [newItem, ...filtered].slice(0, 6);
        });

        // Auto-suggest starting prompt for the chat advisor
        setChatMessages([
          {
            id: 'init',
            sender: 'assistant',
            text: `Welcome to **${data.location}**! 🌟 I am your local area guide and itinerary advisor. I can help you customize your day, suggest local transport tips, or find the perfect diner. What are you looking to do?`,
            timestamp: Date.now()
          }
        ]);
      } else {
        throw new Error('Received invalid data format from the local directory.');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'An error occurred during search. Please ensure your Gemini API key is configured correctly.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationInput.trim()) return;
    triggerSearch(locationInput);
    setLocationInput('');
  };

  // --- Geolocation automatic local finder ---
  const handleDetectBasedArea = () => {
    if (!navigator.geolocation) {
      setErrorMsg('Geolocation is not supported by your browser.');
      return;
    }

    setIsGeoLoading(true);
    setErrorMsg(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        triggerSearch('', { latitude, longitude }).finally(() => {
          setIsGeoLoading(false);
        });
      },
      (error) => {
        console.error('Geolocation error:', error);
        setIsGeoLoading(false);
        setErrorMsg('Could not detect your current coordinates. Please type your city manually.');
      },
      { timeout: 8000 }
    );
  };

  // --- Advisory Chat Handler ---
  const handleSendChatMessage = async (text: string) => {
    const newUserMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text,
      timestamp: Date.now()
    };

    const updatedMessages = [...chatMessages, newUserMsg];
    setChatMessages(updatedMessages);
    setIsChatLoading(true);

    try {
      const response = await fetch('/api/activities/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages,
          location: cityName,
          currentActivities: activities
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get advisor response.');
      }

      const data = await response.json();
      setChatMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: 'assistant',
          text: data.text,
          timestamp: Date.now()
        }
      ]);
    } catch (err: any) {
      setChatMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: 'assistant',
          text: 'Sorry, I had trouble communicating with the server. Please check your API keys or server status.',
          timestamp: Date.now()
        }
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // --- Planner scheduling modifiers ---
  const handleAddActivityToPlan = (activityId: string, slot: 'Morning' | 'Afternoon' | 'Evening') => {
    const targetActivity = activities.find(a => a.id === activityId);
    if (!targetActivity) return;

    setPlannedActivities((prev) => {
      // Avoid scheduling duplicates in the same day plan
      const filtered = prev.filter(p => p.activity.id !== activityId);
      return [...filtered, { activity: targetActivity, slot }];
    });
  };

  const handleRemoveActivityFromPlan = (activityId: string) => {
    setPlannedActivities((prev) => prev.filter(p => p.activity.id !== activityId));
  };

  const handleClearPlan = () => {
    setPlannedActivities([]);
  };

  // --- Filters Application ---
  const filteredActivities = activities.filter((activity) => {
    const matchesCategory = categoryFilter === 'all' || activity.category === categoryFilter;
    
    // Duration filter matching
    let matchesDuration = true;
    if (durationFilter !== 'all') {
      const dLower = activity.duration.toLowerCase();
      if (durationFilter === 'short') {
        matchesDuration = dLower.includes('min') || dLower.includes('1 hour') || dLower.includes('1-2');
      } else if (durationFilter === 'medium') {
        matchesDuration = dLower.includes('2-3') || dLower.includes('half-day') || dLower.includes('2 hours') || dLower.includes('3 hours');
      } else if (durationFilter === 'long') {
        matchesDuration = dLower.includes('full-day') || dLower.includes('4 hours') || dLower.includes('day');
      }
    }

    // Cost filter matching
    const matchesCost = costFilter === 'all' || activity.cost === costFilter;

    return matchesCategory && matchesDuration && matchesCost;
  });

  const selectedActivity = activities.find((a) => a.id === selectedActivityId);
  const selectedPlannedInfo = plannedActivities.find((p) => p.activity.id === selectedActivityId);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col selection:bg-brand-100 selection:text-brand-900">
      
      {/* Header Panel */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-50 shadow-sm/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-slate-100 flex items-center justify-center shadow-md">
              <Compass className="w-5.5 h-5.5 animate-spin-slow" />
            </div>
            <div>
              <h1 className="font-display font-bold text-lg text-slate-900 tracking-tight flex items-center gap-2">
                Local Activity Finder
                <span className="text-[10px] bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-full font-mono">
                  AI Grounded
                </span>
              </h1>
              <p className="text-xs text-slate-400">Discover and schedule area experiences</p>
            </div>
          </div>

          {/* Search Inputs Row */}
          <form onSubmit={handleManualSearch} className="flex-1 max-w-md hidden md:flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
              <input
                type="text"
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                placeholder="Enter city, town or state (e.g. Kyoto, Japan)..."
                className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-brand-500 focus:bg-white transition"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-slate-100 text-xs font-semibold px-4 py-2.5 rounded-xl transition shadow-md shrink-0 cursor-pointer"
            >
              Search
            </button>
            <button
              type="button"
              onClick={handleDetectBasedArea}
              disabled={isLoading || isGeoLoading}
              className="bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white p-2.5 rounded-xl transition shadow-md shrink-0 cursor-pointer"
              title="Detect my based area via Geolocation"
            >
              <MapPin className={`w-4.5 h-4.5 ${isGeoLoading ? 'animate-bounce' : ''}`} />
            </button>
          </form>

          {/* Mobile Geolocation Trigger */}
          <div className="md:hidden flex gap-2">
            <button
              type="button"
              onClick={handleDetectBasedArea}
              disabled={isLoading || isGeoLoading}
              className="bg-brand-500 text-white p-2.5 rounded-xl transition shadow-sm cursor-pointer"
            >
              <MapPin className={`w-4.5 h-4.5 ${isGeoLoading ? 'animate-bounce' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
        
        {/* Mobile Search Form */}
        <div className="md:hidden">
          <form onSubmit={handleManualSearch} className="flex flex-col gap-2 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
              <input
                type="text"
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                placeholder="Enter location (e.g. London, Tokyo)..."
                className="w-full bg-slate-50 border border-slate-100 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-brand-500 focus:bg-white transition"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-slate-900 text-slate-100 text-xs font-semibold py-2.5 rounded-xl transition text-center cursor-pointer"
              >
                Search Location
              </button>
              <button
                type="button"
                onClick={handleDetectBasedArea}
                disabled={isLoading || isGeoLoading}
                className="bg-brand-500 text-white px-4 py-2.5 rounded-xl transition shrink-0 cursor-pointer"
              >
                {isGeoLoading ? 'Locating...' : 'Detect'}
              </button>
            </div>
          </form>
        </div>

        {/* Global Error Display */}
        <AnimatePresence>
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex gap-3 text-rose-800 text-sm shadow-sm"
            >
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold">Search Exception</h4>
                <p className="mt-0.5 text-rose-600 leading-relaxed">{errorMsg}</p>
              </div>
              <button onClick={() => setErrorMsg(null)} className="text-rose-400 hover:text-rose-600 transition self-start p-1">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top Quick-Filters & Search History strip */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4.5 rounded-2xl border border-slate-100 shadow-sm shrink-0">
          {/* History */}
          <div className="flex items-center gap-2 overflow-x-auto py-1 custom-scrollbar shrink-0 max-w-full md:max-w-md">
            <History className="w-4.5 h-4.5 text-slate-400 shrink-0" />
            <span className="text-xs text-slate-400 font-mono shrink-0">HISTORY:</span>
            {searchHistory.map((item) => (
              <button
                key={item.id}
                onClick={() => triggerSearch(item.location)}
                disabled={isLoading}
                className={`text-[11px] font-medium px-2.5 py-1 rounded-lg transition shrink-0 cursor-pointer ${
                  cityName.toLowerCase() === item.location.toLowerCase()
                    ? 'bg-brand-100 text-brand-700 font-semibold'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-100'
                }`}
              >
                {item.location}
              </button>
            ))}
          </div>

          {/* Inline filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-400 font-mono uppercase">Filters:</span>
            </div>

            {/* Category selection */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-lg px-2.5 py-1 text-xs text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="all">All Categories</option>
              <option value="outdoor">Outdoors & Nature</option>
              <option value="culture">Culture & Sights</option>
              <option value="food">Food & Drink</option>
              <option value="family">Family Friendly</option>
              <option value="adventure">Adventure & Sports</option>
              <option value="relaxation">Relaxation</option>
            </select>

            {/* Duration filter */}
            <select
              value={durationFilter}
              onChange={(e) => setDurationFilter(e.target.value)}
              className="bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-lg px-2.5 py-1 text-xs text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="all">Any Duration</option>
              <option value="short">Short (&lt; 2 hrs)</option>
              <option value="medium">Medium (2-3 hrs)</option>
              <option value="long">Long (Full-day)</option>
            </select>

            {/* Cost filter */}
            <select
              value={costFilter}
              onChange={(e) => setCostFilter(e.target.value)}
              className="bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-lg px-2.5 py-1 text-xs text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="all">Any Cost</option>
              <option value="Free">Free Only</option>
              <option value="$">$ (Budget)</option>
              <option value="$$">$$ (Moderate)</option>
              <option value="$$$">$$$ (Premium)</option>
            </select>
          </div>
        </div>

        {/* Dynamic Area Context Hero Display */}
        <div className="relative rounded-2xl bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border border-slate-800 p-6 md:p-8 overflow-hidden shadow-lg shrink-0">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Compass className="w-56 h-56 text-white" />
          </div>
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 bg-slate-800 px-2.5 py-1 rounded-md border border-slate-700">
                DISCOVERING AREA
              </span>
              <h2 className="font-display font-medium text-2xl md:text-3.5xl text-slate-100 tracking-tight mt-2.5 leading-tight">
                {isLoading ? 'Scanning Local Quadrants...' : cityName}
              </h2>
              <p className="text-xs text-slate-400 mt-1.5 max-w-xl leading-relaxed">
                {isLoading
                  ? 'Compiling dynamic activity indexes, parsing coordinate grids, and analyzing local recommendations from the area...'
                  : `Browse ${activities.length} handpicked spots around ${cityName}. Interact with the coordinate grid radar to explore geographically, schedule your day itinerary, or consult the AI advisor companion.`}
              </p>
            </div>
            {activities.length > 0 && (
              <div className="shrink-0 flex gap-4 text-center text-slate-300 font-mono text-xs bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                <div>
                  <span className="block text-[10px] text-slate-500">EXPERIENCES</span>
                  <span className="text-lg font-display font-bold text-emerald-400 mt-0.5 block">{activities.length}</span>
                </div>
                <div className="w-px bg-slate-800"></div>
                <div>
                  <span className="block text-[10px] text-slate-500">PLANNING</span>
                  <span className="text-lg font-display font-bold text-brand-400 mt-0.5 block">{plannedActivities.length}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Bento-Grid Layout (Single screen structure) */}
        {isLoading ? (
          <div className="flex-1 bg-white border border-slate-100 rounded-2xl p-12 flex flex-col justify-center items-center shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-full border-4 border-slate-100 border-t-brand-500 animate-spin"></div>
            <div className="text-center">
              <h3 className="font-display font-medium text-slate-800 text-sm">Consulting Local Directory Guides...</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-[320px] leading-relaxed">
                Using Gemini AI to discover curated activities, addresses, ratings, and hidden secrets for your based area.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
            
            {/* COLUMN 1: Search results and activity card directory (Col Span 5) */}
            <div className="lg:col-span-5 flex flex-col gap-4 min-h-0">
              <div className="flex items-center justify-between shrink-0 px-1">
                <h3 className="font-display font-semibold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Layers className="w-4 h-4" /> Discovery Hub ({filteredActivities.length} found)
                </h3>
                {filteredActivities.length < activities.length && (
                  <span className="text-[10px] text-slate-400 italic">
                    (Filtered from {activities.length})
                  </span>
                )}
              </div>

              {filteredActivities.length === 0 ? (
                <div className="flex-1 bg-white border border-slate-100 rounded-2xl p-8 flex flex-col justify-center items-center text-center shadow-sm">
                  <AlertCircle className="w-8 h-8 text-slate-300" />
                  <h4 className="text-xs font-semibold text-slate-700 mt-2">No matching activities</h4>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-[220px] leading-relaxed">
                    Try adjusting your filters (category, cost, duration) to uncover more local recommendations.
                  </p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto pr-1 space-y-4 max-h-[700px] lg:max-h-[800px] custom-scrollbar">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {filteredActivities.map((activity) => (
                      <ActivityCard
                        key={activity.id}
                        activity={activity}
                        isSelected={selectedActivityId === activity.id}
                        isPlanned={plannedActivities.some((p) => p.activity.id === activity.id)}
                        onSelect={() => setSelectedActivityId(activity.id)}
                        onAddToPlan={(e) => {
                          e.stopPropagation();
                          const alreadyPlanned = plannedActivities.some((p) => p.activity.id === activity.id);
                          if (alreadyPlanned) {
                            handleRemoveActivityFromPlan(activity.id);
                          } else {
                            handleAddActivityToPlan(activity.id, 'Afternoon');
                          }
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* COLUMN 2: Map and Custom day planner (Col Span 4) */}
            <div className="lg:col-span-4 flex flex-col gap-6 min-h-0">
              {/* Radar Map Component */}
              <div className="shrink-0">
                <InteractiveMap
                  activities={activities}
                  selectedActivityId={selectedActivityId}
                  onSelectActivity={(id) => setSelectedActivityId(id)}
                  plannedActivities={plannedActivities}
                />
              </div>

              {/* Day Itinerary Planner Component */}
              <div className="flex-1 min-h-[300px]">
                <DayPlanner
                  cityName={cityName}
                  plannedActivities={plannedActivities}
                  onRemoveActivity={handleRemoveActivityFromPlan}
                  onClearPlan={handleClearPlan}
                />
              </div>
            </div>

            {/* COLUMN 3: Active details viewer and Chat advisor companion (Col Span 3) */}
            <div className="lg:col-span-3 flex flex-col gap-6 min-h-0">
              
              {/* Active Item Details */}
              <div className="flex-1 min-h-[320px]">
                {selectedActivity ? (
                  <ActivityDetail
                    activity={selectedActivity}
                    isPlanned={!!selectedPlannedInfo}
                    plannedSlot={selectedPlannedInfo?.slot}
                    onAddToPlan={(slot) => handleAddActivityToPlan(selectedActivity.id, slot)}
                    onRemoveFromPlan={() => handleRemoveActivityFromPlan(selectedActivity.id)}
                  />
                ) : (
                  <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col justify-center items-center text-center h-full">
                    <Compass className="w-8 h-8 text-slate-300 animate-spin-slow" />
                    <h4 className="text-xs font-semibold text-slate-700 mt-2">No activity selected</h4>
                    <p className="text-[11px] text-slate-400 mt-1 max-w-[200px]">
                      Click any activity card or radar node on the map to inspect full tips and secrets.
                    </p>
                  </div>
                )}
              </div>

              {/* AI advisor chat container */}
              <div className="h-[360px] shrink-0">
                <AdvisoryChat
                  messages={chatMessages}
                  onSendMessage={handleSendChatMessage}
                  isLoading={isChatLoading}
                  location={cityName}
                  currentActivities={activities}
                />
              </div>
            </div>

          </div>
        )}

      </main>

      {/* Footer copyright and credit rail */}
      <footer className="bg-white border-t border-slate-100 mt-12 py-6 shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© 2026 Local Activity Finder. Powered securely by Gemini 3.5 Flash.</p>
          <div className="flex gap-4">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Offline Persistent
            </span>
            <span className="flex items-center gap-1">
              <Map className="w-3.5 h-3.5" /> Geolocation Compatible
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
}
