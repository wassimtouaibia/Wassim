import React, { useState, useRef, useEffect } from 'react';
import { Activity } from '../types';
import { Compass, Navigation, MapPin, Eye, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface InteractiveMapProps {
  activities: Activity[];
  selectedActivityId: string | null;
  onSelectActivity: (id: string) => void;
  plannedActivities: { activity: Activity; slot: string }[];
}

export default function InteractiveMap({
  activities,
  selectedActivityId,
  onSelectActivity,
  plannedActivities,
}: InteractiveMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredActivity, setHoveredActivity] = useState<Activity | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0, lat: 0, lng: 0 });
  const [isInside, setIsInside] = useState(false);

  // Helper to map lat/lng coordinates (offsets -0.15 to 0.15) to SVG coordinate space
  // SVG size is 500 x 360
  const getCoords = (lat: number, lng: number) => {
    // scale such that 0.15 offsets span 80% of width/height
    const centerX = 250;
    const centerY = 180;
    
    // Width range: 30 to 470
    const x = centerX + (lng / 0.15) * 200;
    // Height range: 30 to 330
    const y = centerY - (lat / 0.15) * 140;
    
    return { x, y };
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Convert SVG coordinates back to relative latitude/longitude
    const relativeLng = ((x - 250) / 200) * 0.15;
    const relativeLat = ((180 - y) / 140) * 0.15;

    setMousePos({
      x,
      y,
      lat: relativeLat,
      lng: relativeLng,
    });
  };

  const categoryColors: Record<Activity['category'], { dot: string; ring: string; text: string }> = {
    outdoor: { dot: '#10b981', ring: 'rgba(16, 185, 129, 0.2)', text: 'text-emerald-600' },
    culture: { dot: '#8b5cf6', ring: 'rgba(139, 92, 246, 0.2)', text: 'text-violet-600' },
    food: { dot: '#f59e0b', ring: 'rgba(245, 158, 11, 0.2)', text: 'text-amber-600' },
    family: { dot: '#ec4899', ring: 'rgba(236, 72, 153, 0.2)', text: 'text-pink-600' },
    adventure: { dot: '#ef4444', ring: 'rgba(239, 68, 68, 0.2)', text: 'text-red-600' },
    relaxation: { dot: '#06b6d4', ring: 'rgba(6, 182, 212, 0.2)', text: 'text-cyan-600' },
  };

  // Sort planned activities chronologically for the trail path
  const slotOrder = { Morning: 1, Afternoon: 2, Evening: 3 };
  const sortedPlanned = [...plannedActivities].sort((a, b) => {
    return (slotOrder[a.slot as keyof typeof slotOrder] || 0) - (slotOrder[b.slot as keyof typeof slotOrder] || 0);
  });

  return (
    <div className="relative w-full rounded-2xl bg-slate-900 border border-slate-800 text-slate-100 overflow-hidden shadow-2xl h-[420px] flex flex-col">
      {/* Top HUD Panel */}
      <div className="px-5 py-3.5 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <Compass className="w-5 h-5 text-brand-500 animate-spin-slow" />
          <span className="font-display font-medium text-sm tracking-wide text-slate-200">
            RADAR AREA VISUALIZER
          </span>
        </div>
        <div className="flex items-center gap-4 text-[11px] font-mono text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>GRID: LAT/LNG OFFSETS</span>
          </div>
          {isInside && (
            <div className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-brand-400">
              X: {mousePos.lng.toFixed(4)} Y: {mousePos.lat.toFixed(4)}
            </div>
          )}
        </div>
      </div>

      {/* Primary SVG Vector Canvas */}
      <div className="flex-1 relative bg-slate-950 flex items-center justify-center overflow-hidden">
        <svg
          ref={svgRef}
          className="w-full h-full select-none cursor-crosshair"
          viewBox="0 0 500 360"
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setIsInside(true)}
          onMouseLeave={() => {
            setIsInside(false);
            setHoveredActivity(null);
          }}
        >
          {/* Defs for gradients, patterns, and glow filters */}
          <defs>
            <radialGradient id="radar-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#2563eb" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#020617" stopOpacity="0" />
            </radialGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Radial radar background */}
          <rect width="100%" height="100%" fill="url(#radar-glow)" />

          {/* Coordinate Grid Lines */}
          <g stroke="#1e293b" strokeWidth="0.5" strokeDasharray="3,3">
            {/* Horizontal Grid */}
            <line x1="0" y1="60" x2="500" y2="60" />
            <line x1="0" y1="120" x2="500" y2="120" />
            <line x1="0" y1="180" x2="500" y2="180" stroke="#334155" strokeWidth="1" />
            <line x1="0" y1="240" x2="500" y2="240" />
            <line x1="0" y1="300" x2="500" y2="300" />

            {/* Vertical Grid */}
            <line x1="100" y1="0" x2="100" y2="360" />
            <line x1="200" y1="0" x2="200" y2="360" />
            <line x1="250" y1="0" x2="250" y2="360" stroke="#334155" strokeWidth="1" />
            <line x1="300" y1="0" x2="300" y2="360" />
            <line x1="400" y1="0" x2="400" y2="360" />
          </g>

          {/* Background Concentric Radar Rings */}
          <g stroke="#1e293b" fill="none" strokeWidth="0.5">
            <circle cx="250" cy="180" r="50" />
            <circle cx="250" cy="180" r="100" />
            <circle cx="250" cy="180" r="150" strokeDasharray="4,4" />
          </g>

          {/* Axis Labels */}
          <g fill="#475569" fontSize="9" fontFamily="monospace">
            <text x="255" y="15" textAnchor="start">N</text>
            <text x="255" y="352" textAnchor="start">S</text>
            <text x="485" y="176" textAnchor="end">E</text>
            <text x="5" y="176" textAnchor="start">W</text>
            <text x="255" y="176" textAnchor="start" fill="#64748b">CENTER</text>
          </g>

          {/* Mouse Crosshair coordinates guide lines */}
          {isInside && (
            <g stroke="#2563eb" strokeWidth="0.5" strokeOpacity="0.4" strokeDasharray="1,2">
              <line x1="0" y1={mousePos.y} x2="500" y2={mousePos.y} />
              <line x1={mousePos.x} y1="0" x2={mousePos.x} y2="360" />
            </g>
          )}

          {/* Adventure Trail Path (chronologically connects planned activities) */}
          {sortedPlanned.length > 1 && (
            <g>
              {/* Animated trail line */}
              <path
                d={sortedPlanned.reduce((acc, current, idx) => {
                  const { x, y } = getCoords(current.activity.latitude, current.activity.longitude);
                  return acc + (idx === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`);
                }, '')}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2.5"
                strokeDasharray="6,4"
                strokeLinecap="round"
                className="stroke-pulse"
                opacity="0.8"
                filter="url(#glow)"
              />
              {/* Simple arrowheads or node descriptors along the path */}
              {sortedPlanned.map((p, idx) => {
                if (idx === sortedPlanned.length - 1) return null;
                const p1 = getCoords(p.activity.latitude, p.activity.longitude);
                const p2 = getCoords(sortedPlanned[idx + 1].activity.latitude, sortedPlanned[idx + 1].activity.longitude);
                // Calculate midpoints to show directional navigation
                const midX = (p1.x + p2.x) / 2;
                const midY = (p1.y + p2.y) / 2;
                return (
                  <g key={`arrow-${idx}`} transform={`translate(${midX}, ${midY}) rotate(${Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI})`}>
                    <path d="M -5 -3 L 2 0 L -5 3" fill="none" stroke="#60a5fa" strokeWidth="1.5" />
                  </g>
                );
              })}
            </g>
          )}

          {/* Activity Marker Nodes */}
          {activities.map((activity) => {
            const { x, y } = getCoords(activity.latitude, activity.longitude);
            const isSelected = selectedActivityId === activity.id;
            const isHovered = hoveredActivity?.id === activity.id;
            const colors = categoryColors[activity.category] || { dot: '#94a3b8', ring: 'rgba(148, 163, 184, 0.2)' };
            
            // Check if this activity is in the planner
            const isPlanned = plannedActivities.some(p => p.activity.id === activity.id);
            const plannedSlot = plannedActivities.find(p => p.activity.id === activity.id)?.slot;

            return (
              <g
                key={activity.id}
                className="cursor-pointer"
                onClick={() => onSelectActivity(activity.id)}
                onMouseEnter={() => setHoveredActivity(activity)}
                onMouseLeave={() => setHoveredActivity(null)}
              >
                {/* Ping rings for active/hovered state */}
                {(isSelected || isHovered) && (
                  <circle
                    cx={x}
                    cy={y}
                    r={isSelected ? 18 : 14}
                    fill="none"
                    stroke={colors.dot}
                    strokeWidth="1.5"
                    opacity="0.4"
                    className="map-ping-ring"
                  />
                )}

                {/* Planned Itinerary Stop Halo */}
                {isPlanned && (
                  <circle
                    cx={x}
                    cy={y}
                    r={isSelected ? 14 : 11}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="2.5"
                    opacity="0.9"
                  />
                )}

                {/* Inner main dot */}
                <circle
                  cx={x}
                  cy={y}
                  r={isSelected ? 7.5 : 5.5}
                  fill={colors.dot}
                  className="transition-all duration-300"
                  stroke="#ffffff"
                  strokeWidth={isSelected ? 2 : 1}
                />

                {/* Small indicator card for planned activities */}
                {isPlanned && !isSelected && !isHovered && (
                  <g transform={`translate(${x + 8}, ${y - 8})`}>
                    <rect x="-3" y="-6" width="13" height="11" rx="2" fill="#3b82f6" />
                    <text x="3.5" y="2" fill="#ffffff" fontSize="7" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">
                      {plannedSlot?.[0]}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>

        {/* Hover Information Tooltip Overlay */}
        <AnimatePresence>
          {hoveredActivity && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute bottom-4 left-4 right-4 bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-xl px-4 py-3 shadow-xl z-20 flex items-center justify-between"
            >
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`text-[10px] uppercase font-mono tracking-wider px-1.5 py-0.5 rounded-md bg-slate-800 ${categoryColors[hoveredActivity.category].text}`}>
                    {hoveredActivity.category}
                  </span>
                  <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {hoveredActivity.bestTime}
                  </span>
                </div>
                <h4 className="font-display font-medium text-slate-200 text-sm truncate">
                  {hoveredActivity.name}
                </h4>
                <p className="text-xs text-slate-400 truncate mt-0.5">
                  {hoveredActivity.address}
                </p>
              </div>
              <div className="flex items-center gap-2 bg-slate-800/60 px-2.5 py-1.5 rounded-lg border border-slate-800 shrink-0 text-xs">
                <span className="text-emerald-400 font-medium">{hoveredActivity.cost}</span>
                <span className="text-slate-500">|</span>
                <span className="text-slate-300 font-mono">{hoveredActivity.duration}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Map Legend Footer */}
      <div className="px-5 py-3 bg-slate-950 border-t border-slate-800/80 flex flex-wrap gap-x-4 gap-y-2 items-center text-xs text-slate-400 shrink-0">
        <span className="text-slate-500 font-mono text-[10px] uppercase">Legend:</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span>Outdoors</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-violet-500"></span>
          <span>Culture</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          <span>Food</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-pink-500"></span>
          <span>Family</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
          <span>Adventure</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-500"></span>
          <span>Relaxation</span>
        </div>
      </div>
    </div>
  );
}
