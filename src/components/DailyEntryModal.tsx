import React, { useState, useEffect } from 'react';
import { User, StudyLog } from '../types';
import { getStudyCycleDate, formatCycleDateLabel, formatMinutesToHM } from '../lib/streak';
import { X, Clock, Send, AlertCircle, CheckCircle2, Lock, Flame } from 'lucide-react';
import confetti from 'canvas-confetti';

interface DailyEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onSubmitLog: (hours: number, minutes: number, privateMsg: string) => Promise<any>;
  todayLog?: StudyLog;
  previousLogMinutes?: number;
  currentStreak?: number;
}

export const DailyEntryModal: React.FC<DailyEntryModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSubmitLog,
  todayLog,
  previousLogMinutes = 0,
  currentStreak = 0,
}) => {
  const [hours, setHours] = useState<number>(8);
  const [minutes, setMinutes] = useState<number>(0);
  const [privateMessage, setPrivateMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  const currentCycleDate = getStudyCycleDate();
  const dateFormatted = formatCycleDateLabel(currentCycleDate);

  useEffect(() => {
    if (todayLog) {
      const h = Math.floor(todayLog.studyMinutes / 60);
      const m = todayLog.studyMinutes % 60;
      setHours(h);
      setMinutes(m);
      if (todayLog.privateMessage) {
        setPrivateMessage(todayLog.privateMessage);
      }
    }
  }, [todayLog, isOpen]);

  if (!isOpen) return null;

  const totalMinutes = hours * 60 + minutes;

  // Streak prediction logic check
  const is9Hours = totalMinutes >= 540;
  const is10MinsMore = previousLogMinutes > 0
    ? totalMinutes >= previousLogMinutes + 10
    : totalMinutes >= 10;
  const passesStreak = is9Hours || is10MinsMore;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totalMinutes <= 0) {
      setErrorMsg('Please enter study duration greater than 0 minutes.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await onSubmitLog(hours, minutes, privateMessage);
      setSuccessMsg('Study entry saved successfully!');

      if (passesStreak) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#f97316', '#ef4444', '#10b981'],
        });
      }

      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save study entry');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl border border-amber-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 px-5 py-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 backdrop-blur-md rounded-2xl">
              <Clock className="w-5 h-5 text-amber-100" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight leading-tight">Daily Study Entry</h2>
              <p className="text-[11px] text-amber-100 font-medium">Record your daily study time</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto">
          {/* Top Profile Card: Avatar + Name + Date on left; Streak & Yesterday on right */}
          <div className="bg-slate-50 border border-slate-200/90 p-3 rounded-2xl flex items-center justify-between gap-2">
            <div className="flex items-center space-x-2.5 min-w-0">
              <img
                src={currentUser?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser?.name}`}
                alt={currentUser?.name}
                className="w-10 h-10 rounded-full border border-slate-200 object-cover shrink-0"
              />
              <div className="min-w-0">
                <h3 className="text-xs sm:text-sm font-black text-slate-900 truncate">
                  {currentUser?.name || 'Student'}
                </h3>
                <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
                  {dateFormatted}
                </p>
              </div>
            </div>

            {/* Right side stats badges */}
            <div className="flex flex-col items-end shrink-0 space-y-1">
              <div className="inline-flex items-center space-x-1 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300/80 text-amber-900 font-black text-[11px] px-2.5 py-0.5 rounded-xl shadow-2xs">
                <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500 shrink-0" />
                <span>{currentStreak}d Streak</span>
              </div>
              <span className="text-[10px] font-bold text-slate-600 bg-slate-200/70 px-2 py-0.5 rounded-lg truncate">
                Yesterday: {formatMinutesToHM(previousLogMinutes)}
              </span>
            </div>
          </div>

          {/* Symmetrical Study Duration Selector */}
          <div className="space-y-2">
            <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
              Study Duration
            </label>

            <div className="grid grid-cols-2 gap-3">
              {/* Hours Selector - Symmetrical Grid */}
              <div className="bg-slate-50/80 border border-slate-200 p-3 rounded-2xl flex flex-col items-center justify-center space-y-1.5">
                <span className="text-[11px] font-bold text-slate-500">Hours</span>
                <div className="grid grid-cols-[36px_1fr_36px] items-center w-full max-w-[130px]">
                  <button
                    type="button"
                    onClick={() => setHours(h => Math.max(0, h - 1))}
                    className="w-9 h-9 rounded-xl bg-white border border-slate-200 font-black text-slate-700 hover:bg-slate-100 active:scale-95 transition-all text-base shadow-xs flex items-center justify-center cursor-pointer select-none"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="0"
                    max="24"
                    value={hours}
                    onChange={e => setHours(Math.min(24, Math.max(0, parseInt(e.target.value) || 0)))}
                    className="w-full text-center text-2xl font-black text-slate-900 bg-transparent focus:outline-none p-0 m-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    type="button"
                    onClick={() => setHours(h => Math.min(24, h + 1))}
                    className="w-9 h-9 rounded-xl bg-white border border-slate-200 font-black text-slate-700 hover:bg-slate-100 active:scale-95 transition-all text-base shadow-xs flex items-center justify-center cursor-pointer select-none"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Minutes Selector - Symmetrical Grid */}
              <div className="bg-slate-50/80 border border-slate-200 p-3 rounded-2xl flex flex-col items-center justify-center space-y-1.5">
                <span className="text-[11px] font-bold text-slate-500">Minutes</span>
                <div className="grid grid-cols-[36px_1fr_36px] items-center w-full max-w-[130px]">
                  <button
                    type="button"
                    onClick={() => setMinutes(m => (m >= 15 ? m - 15 : 0))}
                    className="w-9 h-9 rounded-xl bg-white border border-slate-200 font-bold text-slate-700 hover:bg-slate-100 active:scale-95 transition-all text-xs shadow-xs flex items-center justify-center cursor-pointer select-none"
                  >
                    -15
                  </button>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={minutes}
                    onChange={e => setMinutes(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                    className="w-full text-center text-2xl font-black text-slate-900 bg-transparent focus:outline-none p-0 m-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    type="button"
                    onClick={() => setMinutes(m => (m <= 44 ? m + 15 : 59))}
                    className="w-9 h-9 rounded-xl bg-white border border-slate-200 font-bold text-slate-700 hover:bg-slate-100 active:scale-95 transition-all text-xs shadow-xs flex items-center justify-center cursor-pointer select-none"
                  >
                    +15
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sleek, Minimal Streak Status Preview Badge */}
          <div className={`p-2.5 rounded-2xl border flex items-center justify-between text-xs font-bold transition-all ${
            passesStreak
              ? 'bg-emerald-50/90 border-emerald-200 text-emerald-950'
              : 'bg-amber-50/90 border-amber-200 text-amber-950'
          }`}>
            <div className="flex items-center space-x-2">
              {passesStreak ? (
                <div className="p-1 bg-emerald-500 text-white rounded-lg">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
              ) : (
                <div className="p-1 bg-amber-500 text-white rounded-lg">
                  <Flame className="w-3.5 h-3.5 fill-white" />
                </div>
              )}
              <span className="text-xs font-black">
                {passesStreak ? 'Streak Pass Target Reached' : 'Target: ≥ 9h or +10m vs yesterday'}
              </span>
            </div>

            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
              passesStreak ? 'bg-emerald-200/80 text-emerald-900' : 'bg-amber-200/80 text-amber-900'
            }`}>
              {passesStreak ? '🔥 +1 Streak' : 'Pending'}
            </span>
          </div>

          {/* Private Message to Mentor */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800 flex items-center space-x-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-600" />
              <span>Private Message to Mentor</span>
            </label>
            <textarea
              rows={3}
              value={privateMessage}
              onChange={e => setPrivateMessage(e.target.value)}
              placeholder="Only mentor will read this private note in the admin panel."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none"
            />
          </div>

          {/* Feedback Messages */}
          {errorMsg && (
            <div className="p-2.5 bg-rose-50 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-2.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white font-black text-xs sm:text-sm rounded-2xl shadow-md shadow-amber-500/25 flex items-center justify-center space-x-2 disabled:opacity-50 transition-all cursor-pointer active:scale-98"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>{todayLog ? 'Update Entry' : 'Save Entry'}</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
