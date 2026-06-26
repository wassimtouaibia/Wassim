import { Activity } from '../types';
import { Clock, Calendar, DollarSign, Trash2, MapPin, ArrowDown, Footprints } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DayPlannerProps {
  cityName: string;
  plannedActivities: { activity: Activity; slot: 'Morning' | 'Afternoon' | 'Evening' }[];
  onRemoveActivity: (id: string) => void;
  onClearPlan: () => void;
}

export default function DayPlanner({
  cityName,
  plannedActivities,
  onRemoveActivity,
  onClearPlan,
}: DayPlannerProps) {
  // Sort into slots
  const morningList = plannedActivities.filter((p) => p.slot === 'Morning');
  const afternoonList = plannedActivities.filter((p) => p.slot === 'Afternoon');
  const eveningList = plannedActivities.filter((p) => p.slot === 'Evening');

  // Compute aggregated stats
  const totalCount = plannedActivities.length;

  const costMap: Record<string, number> = { 'Free': 0, '$': 1, '$$': 2, '$$$': 3 };
  const totalCostPoints = plannedActivities.reduce((acc, p) => acc + (costMap[p.activity.cost] || 0), 0);
  const avgCostPoints = totalCount > 0 ? totalCostPoints / totalCount : 0;
  let computedCostLabel = 'Free';
  if (avgCostPoints > 2.2) computedCostLabel = '$$$ (Premium)';
  else if (avgCostPoints > 1.2) computedCostLabel = '$$ (Moderate)';
  else if (avgCostPoints > 0.2) computedCostLabel = '$ (Budget-friendly)';

  // Calculate rough duration
  const parseHours = (durationStr: string) => {
    const num = parseFloat(durationStr);
    return isNaN(num) ? 1.5 : num; // default 1.5 if string parsing is complex
  };
  const totalHours = plannedActivities.reduce((acc, p) => acc + parseHours(p.activity.duration), 0);

  const renderSlotList = (list: typeof plannedActivities, slotTitle: string) => {
    return (
      <div className="mb-4">
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono mb-2 flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${
            slotTitle === 'Morning' ? 'bg-amber-400' : slotTitle === 'Afternoon' ? 'bg-orange-400' : 'bg-indigo-400'
          }`} />
          {slotTitle}
        </h4>

        {list.length === 0 ? (
          <div className="text-xs text-slate-400 italic bg-slate-50 border border-slate-100/50 p-3 rounded-xl border-dashed">
            No activities scheduled.
          </div>
        ) : (
          <div className="space-y-2">
            {list.map(({ activity }) => (
              <motion.div
                key={activity.id}
                layoutId={`planned-${activity.id}`}
                className="flex items-center justify-between gap-3 p-3 bg-white border border-slate-100 rounded-xl hover:shadow-sm transition-all"
              >
                <div className="min-w-0 flex-1">
                  <h5 className="font-display font-medium text-xs text-slate-800 truncate">
                    {activity.name}
                  </h5>
                  <div className="flex items-center gap-2 mt-0.5 text-[10px] font-mono text-slate-400">
                    <span className="text-emerald-600 font-bold">{activity.cost}</span>
                    <span>•</span>
                    <span>{activity.duration}</span>
                  </div>
                </div>
                <button
                  onClick={() => onRemoveActivity(activity.id)}
                  className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition"
                  title="Remove from planner"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl p-6 shadow-xl flex flex-col h-full justify-between overflow-y-auto custom-scrollbar">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-4 mb-5">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-brand-500" />
            <h3 className="font-display font-medium text-base text-slate-200">
              CUSTOM ADVENTURE PLAN
            </h3>
          </div>
          {totalCount > 0 && (
            <button
              onClick={onClearPlan}
              className="text-[10px] font-mono text-rose-400 hover:text-rose-300 border border-rose-950 px-2 py-0.5 rounded hover:bg-rose-950/20 transition cursor-pointer"
            >
              CLEAR PLAN
            </button>
          )}
        </div>

        {/* City details */}
        {cityName && (
          <div className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 mb-5 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-xs text-slate-300 font-medium">
              Target Location: <strong className="text-slate-100 font-display">{cityName}</strong>
            </span>
          </div>
        )}

        {/* Schedule Slots */}
        <div className="space-y-4">
          {renderSlotList(morningList, 'Morning')}
          
          {morningList.length > 0 && afternoonList.length > 0 && (
            <div className="flex justify-center -my-1 text-slate-600">
              <ArrowDown className="w-4 h-4 animate-bounce" />
            </div>
          )}
          
          {renderSlotList(afternoonList, 'Afternoon')}

          {afternoonList.length > 0 && eveningList.length > 0 && (
            <div className="flex justify-center -my-1 text-slate-600">
              <ArrowDown className="w-4 h-4 animate-bounce" />
            </div>
          )}

          {renderSlotList(eveningList, 'Evening')}
        </div>
      </div>

      {/* Aggregated Planner Statistics */}
      {totalCount > 0 ? (
        <div className="mt-6 pt-5 border-t border-slate-800 bg-slate-950 p-4 rounded-xl border border-dashed border-slate-800/80">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono mb-2.5 flex items-center gap-1.5">
            <Footprints className="w-3.5 h-3.5 text-brand-400" /> Estimated Journey Stats
          </h4>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <span className="block text-[10px] font-mono text-slate-400">Total Stops</span>
              <span className="text-lg font-display font-medium text-slate-200">{totalCount}</span>
            </div>
            <div>
              <span className="block text-[10px] font-mono text-slate-400">Total Duration</span>
              <span className="text-lg font-display font-medium text-slate-200">{totalHours.toFixed(1)} hrs</span>
            </div>
            <div>
              <span className="block text-[10px] font-mono text-slate-400">Cost Profile</span>
              <span className="text-xs font-display font-medium text-emerald-400 block mt-1 truncate">
                {computedCostLabel}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-6 text-center py-6 text-slate-400 text-xs border border-dashed border-slate-800 rounded-xl">
          Create a timeline by selecting local activities and choosing a time slot.
        </div>
      )}
    </div>
  );
}
