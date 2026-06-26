import React from 'react';
import { Activity } from '../types';
import { Star, Clock, DollarSign, Plus, Check, Compass, Trees, Theater, UtensilsCrossed, Sparkles, Flame, MoonStar } from 'lucide-react';
import { motion } from 'motion/react';

interface ActivityCardProps {
  activity: Activity;
  isSelected: boolean;
  isPlanned: boolean;
  onSelect: () => void;
  onAddToPlan: (e: React.MouseEvent) => void;
  key?: string;
}

export const categoryMeta: Record<Activity['category'], {
  label: string;
  color: string;
  bgColor: string;
  icon: React.ComponentType<any>;
}> = {
  outdoor: { label: 'Outdoors & Nature', color: 'text-emerald-600 bg-emerald-50 border-emerald-100', bgColor: 'bg-emerald-500', icon: Trees },
  culture: { label: 'Culture & Sights', color: 'text-violet-600 bg-violet-50 border-violet-100', bgColor: 'bg-violet-500', icon: Theater },
  food: { label: 'Food & Drink', color: 'text-amber-600 bg-amber-50 border-amber-100', bgColor: 'bg-amber-500', icon: UtensilsCrossed },
  family: { label: 'Family Friendly', color: 'text-pink-600 bg-pink-50 border-pink-100', bgColor: 'bg-pink-500', icon: Sparkles },
  adventure: { label: 'Adventure & Sports', color: 'text-red-600 bg-red-50 border-red-100', bgColor: 'bg-red-500', icon: Flame },
  relaxation: { label: 'Relaxation', color: 'text-cyan-600 bg-cyan-50 border-cyan-100', bgColor: 'bg-cyan-500', icon: MoonStar },
};

export default function ActivityCard({
  activity,
  isSelected,
  isPlanned,
  onSelect,
  onAddToPlan,
}: ActivityCardProps) {
  const meta = categoryMeta[activity.category] || { label: 'Other', color: 'text-slate-600 bg-slate-50 border-slate-100', bgColor: 'bg-slate-400', icon: Compass };
  const CategoryIcon = meta.icon;

  return (
    <motion.div
      onClick={onSelect}
      className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border transition-all duration-300 cursor-pointer h-[190px] ${
        isSelected
          ? 'bg-slate-50 border-brand-500 ring-2 ring-brand-100 shadow-lg'
          : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-md'
      }`}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
    >
      <div className="p-4.5 flex-1 flex flex-col justify-between min-w-0">
        <div>
          {/* Header row: Category Badge & Rating */}
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <span className={`inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider px-2.5 py-1 rounded-full border ${meta.color}`}>
              <CategoryIcon className="w-3.5 h-3.5 shrink-0" />
              {activity.category}
            </span>
            <div className="flex items-center gap-1 text-xs text-slate-500 font-mono shrink-0">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
              <span className="text-slate-800 font-medium">{activity.rating.toFixed(1)}</span>
              <span className="text-slate-400">({activity.reviewsCount})</span>
            </div>
          </div>

          {/* Title & Teaser Description */}
          <h3 className="font-display font-medium text-[15px] leading-tight text-slate-900 group-hover:text-brand-600 transition-colors line-clamp-1">
            {activity.name}
          </h3>
          <p className="text-xs text-slate-500 line-clamp-2 mt-1.5 leading-relaxed">
            {activity.description}
          </p>
        </div>

        {/* Footer info: Address teaser, cost, duration */}
        <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-slate-100/80 mt-auto shrink-0">
          <div className="flex items-center gap-3 text-xs text-slate-500 font-mono">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              {activity.duration}
            </span>
            <span className="flex items-center gap-0.5 text-emerald-600 font-semibold">
              {activity.cost}
            </span>
          </div>

          <button
            onClick={onAddToPlan}
            className={`inline-flex items-center justify-center p-1.5 rounded-lg border transition-all ${
              isPlanned
                ? 'bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-100 hover:border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
            title={isPlanned ? "Plan scheduled" : "Add to Day Itinerary"}
          >
            {isPlanned ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
