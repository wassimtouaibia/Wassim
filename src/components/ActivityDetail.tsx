import { Activity } from '../types';
import { categoryMeta } from './ActivityCard';
import {
  MapPin, Clock, DollarSign, Star, Info,
  Lightbulb, ShieldAlert, Sparkles, Plus, Trash2, CheckCircle
} from 'lucide-react';
import { motion } from 'motion/react';

interface ActivityDetailProps {
  activity: Activity;
  isPlanned: boolean;
  plannedSlot?: 'Morning' | 'Afternoon' | 'Evening';
  onAddToPlan: (slot: 'Morning' | 'Afternoon' | 'Evening') => void;
  onRemoveFromPlan: () => void;
}

export default function ActivityDetail({
  activity,
  isPlanned,
  plannedSlot,
  onAddToPlan,
  onRemoveFromPlan,
}: ActivityDetailProps) {
  const meta = categoryMeta[activity.category];
  const CategoryIcon = meta?.icon || Info;

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col h-full overflow-y-auto custom-scrollbar">
      {/* Category and Quick Info */}
      <div className="flex items-center gap-2 mb-4">
        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full border ${meta?.color}`}>
          <CategoryIcon className="w-3.5 h-3.5 shrink-0" />
          {activity.category}
        </span>
        <span className="text-xs text-slate-400 font-mono">
          ID: {activity.id}
        </span>
      </div>

      {/* Main Title & Rating info */}
      <h2 className="font-display font-medium text-2xl text-slate-900 tracking-tight leading-tight mb-2.5">
        {activity.name}
      </h2>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-mono text-slate-500 mb-6 bg-slate-50 p-3 rounded-xl border border-slate-100">
        <div className="flex items-center gap-1.5">
          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
          <span className="text-slate-800 font-bold">{activity.rating}</span>
          <span>({activity.reviewsCount} reviews)</span>
        </div>
        <span className="text-slate-300">|</span>
        <div className="flex items-center gap-1">
          <Clock className="w-4 h-4 text-slate-400" />
          <span>{activity.duration}</span>
        </div>
        <span className="text-slate-300">|</span>
        <div className="flex items-center gap-1">
          <span className="text-emerald-600 font-bold">{activity.cost}</span>
          <span className="text-slate-400">budget</span>
        </div>
      </div>

      {/* Description */}
      <div className="mb-6">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-sans mb-2">
          Overview
        </h3>
        <p className="text-sm text-slate-600 leading-relaxed">
          {activity.description}
        </p>
      </div>

      {/* Address & Best Time Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="border border-slate-100 p-3.5 rounded-xl flex gap-2.5">
          <MapPin className="w-4.5 h-4.5 text-slate-400 shrink-0 mt-0.5" />
          <div>
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">Address</span>
            <span className="text-xs text-slate-700 leading-normal">{activity.address}</span>
          </div>
        </div>
        <div className="border border-slate-100 p-3.5 rounded-xl flex gap-2.5">
          <Clock className="w-4.5 h-4.5 text-slate-400 shrink-0 mt-0.5" />
          <div>
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">Best Time</span>
            <span className="text-xs text-slate-700 leading-normal font-medium">{activity.bestTime}</span>
          </div>
        </div>
      </div>

      {/* Tips Section */}
      <div className="mb-6">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-sans mb-3 flex items-center gap-1.5">
          <Lightbulb className="w-4 h-4 text-amber-500" /> Curated Visitor Tips
        </h3>
        <ul className="space-y-2.5">
          {activity.tips.map((tip, idx) => (
            <li key={idx} className="text-xs text-slate-600 flex items-start gap-2 bg-slate-50/60 p-2.5 rounded-lg border border-slate-100/50">
              <span className="font-bold text-amber-500 shrink-0 select-none">{idx + 1}.</span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Local Secret Section */}
      {activity.localSecret && (
        <div className="mb-6 bg-gradient-to-br from-brand-50 to-indigo-50 border border-brand-100 rounded-xl p-4.5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-2 opacity-5">
            <Sparkles className="w-16 h-16 text-brand-500" />
          </div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-brand-700 flex items-center gap-1.5 mb-1.5">
            <Sparkles className="w-4 h-4 text-brand-500" /> Neighborhood Secret
          </h4>
          <p className="text-xs text-brand-950/80 leading-relaxed italic">
            "{activity.localSecret}"
          </p>
        </div>
      )}

      {/* Planner Scheduling Options */}
      <div className="mt-auto pt-6 border-t border-slate-100">
        {isPlanned ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-blue-50 border border-blue-100 text-blue-800 text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4.5 h-4.5 text-blue-600" />
                <span>Planned for <strong>{plannedSlot}</strong></span>
              </div>
              <button
                onClick={onRemoveFromPlan}
                className="text-red-500 hover:text-red-700 transition font-medium flex items-center gap-1 text-[11px] uppercase tracking-wider font-mono bg-white px-2.5 py-1 rounded-md border border-slate-200"
              >
                <Trash2 className="w-3.5 h-3.5" /> Remove
              </button>
            </div>
          </div>
        ) : (
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono mb-2.5">
              SCHEDULE THIS ACTIVITY
            </h4>
            <div className="grid grid-cols-3 gap-2">
              {(['Morning', 'Afternoon', 'Evening'] as const).map((slot) => (
                <button
                  key={slot}
                  onClick={() => onAddToPlan(slot)}
                  className="flex flex-col items-center gap-1 py-2 px-1 text-center rounded-xl border border-slate-100 hover:border-brand-200 bg-slate-50/50 hover:bg-brand-50 hover:text-brand-700 text-slate-700 transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-[11px] font-medium font-display">{slot}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
