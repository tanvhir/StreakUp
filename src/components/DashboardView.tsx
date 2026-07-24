import React from 'react';
import { User, StudyLog, UserStreakInfo } from '../types';
import { getStudyCycleDate, formatMinutesToHM, formatCycleDateLabel } from '../lib/streak';
import { Flame, Clock, Zap, Plus, CheckCircle2 } from 'lucide-react';

interface DashboardViewProps {
  currentUser: User | null;
  userStreakInfo?: UserStreakInfo;
  todayLog?: StudyLog;
  onOpenDailyEntry: () => void;
  onOpenAuth: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  currentUser,
  userStreakInfo,
  todayLog,
  onOpenDailyEntry,
  onOpenAuth,
}) => {
  const currentCycleDate = getStudyCycleDate();
  const cycleDateFormatted = formatCycleDateLabel(currentCycleDate);

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto px-4 py-8 sm:py-12 space-y-5 animate-fade-in">
        {/* Minimal Bangla Rules Card */}
        <div className="bg-white border border-amber-200/80 rounded-3xl p-5 sm:p-6 shadow-xl shadow-amber-500/5 space-y-4 text-slate-800">
          <div className="flex items-center space-x-3 border-b border-amber-100 pb-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-md shadow-amber-500/20 shrink-0">
              <Flame className="w-6 h-6 fill-amber-100" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">StreakUp রুলস</h2>
              <p className="text-[11px] text-amber-700 font-bold">ডেইলি স্ট্রিক বজায় রাখার সহজ নিয়মাবলী</p>
            </div>
          </div>

          <div className="space-y-3 text-xs sm:text-sm font-medium leading-relaxed">
            <div className="flex items-start space-x-2.5 bg-amber-50/60 p-2.5 rounded-2xl border border-amber-100">
              <span className="text-amber-600 font-bold shrink-0">⏰</span>
              <div>
                <strong className="text-slate-900 font-bold">১ দিনের হিসাব:</strong> প্রতিদিন সকাল ৫:০০ টা থেকে পরদিন সকাল ৫:০০ টা পর্যন্ত ১টি স্ট্রিক সাইকেল।
              </div>
            </div>

            <div className="flex items-start space-x-2.5 bg-emerald-50/60 p-2.5 rounded-2xl border border-emerald-100">
              <span className="text-emerald-600 font-bold shrink-0">🔥</span>
              <div>
                <strong className="text-slate-900 font-bold">+১ স্ট্রিক পয়েন্ট:</strong> আগের দিনের চেয়ে অন্তত ১০ মিনিট বেশি পড়লে অথবা মোট ৯+ ঘণ্টা পড়লে +১ স্ট্রিক যোগ হবে।
              </div>
            </div>

            <div className="flex items-start space-x-2.5 bg-red-50/60 p-2.5 rounded-2xl border border-red-100">
              <span className="text-red-500 font-bold shrink-0">⚠️</span>
              <div>
                <strong className="text-slate-900 font-bold">স্ট্রিক রিসেট:</strong> সকাল ৫:০০ টার পূর্বে সময়মতো আপডেট না দিলে স্ট্রিক ০ হয়ে যাবে।
              </div>
            </div>
          </div>

          <button
            onClick={onOpenAuth}
            className="w-full py-3.5 mt-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-lg shadow-amber-500/25 transition-all cursor-pointer active:scale-98 flex items-center justify-center space-x-2"
          >
            <Zap className="w-4 h-4" />
            <span>Join / Login Now</span>
          </button>
        </div>
      </div>
    );
  }

  const streak = userStreakInfo?.currentStreak || 0;
  const longest = userStreakInfo?.longestStreak || 0;
  const lastWeekMins = userStreakInfo?.lastWeekStudyMinutes || 0;
  const targetMins = (currentUser.targetHoursPerDay || 8) * 60;
  const todayMins = todayLog?.studyMinutes || 0;
  const targetPercent = Math.min(100, Math.round((todayMins / targetMins) * 100));

  return (
    <div className="max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-5 pb-24 lg:pb-6 animate-fade-in">
      {/* Top Profile Welcome Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-4 sm:p-5 shadow-lg relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-40 h-40 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between gap-3 relative z-10">
          <div className="flex items-center space-x-3 min-w-0">
            <img
              src={currentUser.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.name}`}
              alt={currentUser.name}
              className="w-12 h-12 rounded-2xl border-2 border-amber-400 bg-slate-800 object-cover shadow-xs shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5">
                <h2 className="text-sm sm:text-base font-black truncate">{currentUser.name}</h2>
                <span className="bg-amber-500/20 text-amber-300 text-[9px] font-bold px-1.5 py-0.2 rounded-full border border-amber-500/30 uppercase shrink-0">
                  {currentUser.role === 'admin' ? 'Mentor' : 'Student'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium truncate">{currentUser.bio || 'Targeting academic excellence'}</p>
            </div>
          </div>

          <button
            onClick={onOpenDailyEntry}
            className="px-3.5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-xs rounded-2xl shadow-md shadow-amber-500/25 flex items-center space-x-1.5 shrink-0 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>{todayLog ? 'Update Log' : 'Log Today'}</span>
          </button>
        </div>
      </div>

      {/* 3 Mobile Side-By-Side Stats Cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {/* Active Streak Card */}
        <div className="bg-gradient-to-b from-amber-50 to-orange-50/80 border border-amber-200/80 rounded-2xl p-2.5 sm:p-3.5 text-center shadow-xs flex flex-col items-center justify-between min-h-[105px]">
          <div className="flex items-center justify-center space-x-1 text-amber-800 font-black text-[10px] sm:text-xs">
            <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500 shrink-0" />
            <span className="truncate">Streak</span>
          </div>
          <div className="my-1">
            <span className="text-2xl sm:text-3xl font-black text-amber-950">{streak}</span>
            <span className="text-[10px] font-bold text-amber-800 ml-0.5">d</span>
          </div>
          <span className="text-[9px] font-bold text-amber-700 bg-amber-100/80 px-1.5 py-0.5 rounded-lg w-full truncate">
            Current Active
          </span>
        </div>

        {/* Best Record Card */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-2.5 sm:p-3.5 text-center shadow-xs flex flex-col items-center justify-between min-h-[105px]">
          <div className="flex items-center justify-center space-x-1 text-slate-500 font-extrabold text-[10px] sm:text-xs">
            <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="truncate">Best</span>
          </div>
          <div className="my-1">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">{longest}</span>
            <span className="text-[10px] font-bold text-slate-500 ml-0.5">d</span>
          </div>
          <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-lg w-full truncate">
            Peak Record
          </span>
        </div>

        {/* Last Week Hours Card (Replaced Total Time!) */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-2.5 sm:p-3.5 text-center shadow-xs flex flex-col items-center justify-between min-h-[105px]">
          <div className="flex items-center justify-center space-x-1 text-slate-500 font-extrabold text-[10px] sm:text-xs">
            <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">Last Week</span>
          </div>
          <div className="my-1">
            <span className="text-lg sm:text-2xl font-black text-slate-900 truncate">
              {formatMinutesToHM(lastWeekMins)}
            </span>
          </div>
          <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-lg w-full truncate">
            Past 7 Days
          </span>
        </div>
      </div>

      {/* Today's Study Progress Card */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-4 sm:p-5 shadow-xs space-y-3.5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-xs sm:text-sm font-extrabold text-slate-900">Today's Progress</h3>
              {todayLog ? (
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span>Logged</span>
                </span>
              ) : (
                <span className="bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Pending
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">{cycleDateFormatted}</p>
          </div>

          <div className="text-right">
            <span className="text-lg sm:text-xl font-black text-slate-900">{formatMinutesToHM(todayMins)}</span>
            <span className="text-[10px] text-slate-500 block">/ {currentUser.targetHoursPerDay || 8}h Goal</span>
          </div>
        </div>

        {/* Goal Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[11px] font-bold text-slate-600">
            <span>Daily Goal</span>
            <span>{targetPercent}%</span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-500"
              style={{ width: `${targetPercent}%` }}
            />
          </div>
        </div>

        {/* 9 Hours Target Highlight */}
        <div className="bg-amber-50/80 rounded-2xl p-3 border border-amber-200/80 flex items-center space-x-2 text-xs text-amber-950">
          <Flame className="w-4 h-4 text-orange-500 fill-orange-500 shrink-0" />
          <span className="text-[11px] font-medium leading-tight">
            <strong>Target 9+ Hours:</strong> Guarantees instant <strong>+1 Streak</strong> today!
          </span>
        </div>
      </div>
    </div>
  );
};
