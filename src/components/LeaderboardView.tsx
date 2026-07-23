import React, { useState, useEffect } from 'react';
import { UserStreakInfo, User } from '../types';
import { formatMinutesToHM } from '../lib/streak';
import { Trophy, Flame, ShieldCheck, Search, Send, CheckCircle2, MessageSquare, Reply, Clock, Sparkles } from 'lucide-react';

interface LeaderboardViewProps {
  leaderboard: UserStreakInfo[];
  currentUser: User | null;
  onOpenFeedbackModal?: (studentId: string, studentName: string) => void;
  onPostFeedback?: (studentId: string, content: string) => Promise<void>;
  todayCycle: string;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  leaderboard,
  currentUser,
  onPostFeedback,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  // Local state for admin feedback drafts per student
  const [feedbackDrafts, setFeedbackDrafts] = useState<{ [studentId: string]: string }>({});
  // Track which student's reply input box is expanded (for admin or mentor)
  const [replyOpenStudentId, setReplyOpenStudentId] = useState<string | null>(null);
  const [savingStudentId, setSavingStudentId] = useState<string | null>(null);
  const [savedSuccessStudentId, setSavedSuccessStudentId] = useState<string | null>(null);

  // Initialize feedback drafts from leaderboard data
  useEffect(() => {
    const drafts: { [studentId: string]: string } = {};
    leaderboard.forEach(item => {
      drafts[item.userId] = item.mentorFeedback || '';
    });
    setFeedbackDrafts(prev => ({ ...drafts, ...prev }));
  }, [leaderboard]);

  const handleSaveFeedback = async (studentId: string) => {
    if (!onPostFeedback) return;
    const content = feedbackDrafts[studentId] || '';
    setSavingStudentId(studentId);
    try {
      await onPostFeedback(studentId, content);
      setSavedSuccessStudentId(studentId);
      setReplyOpenStudentId(null); // collapse reply box on save
      setTimeout(() => setSavedSuccessStudentId(null), 2500);
    } catch (err) {
      console.error('Failed to post feedback', err);
    } finally {
      setSavingStudentId(null);
    }
  };

  const filtered = leaderboard.filter(item =>
    item.userName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const top3 = filtered.slice(0, 3);
  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-5 pb-24 animate-fade-in">
      {/* 1. Centered Header Title */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-1.5 rounded-full shadow-md shadow-amber-500/20">
          <Trophy className="w-4 h-4" />
          <h2 className="text-base sm:text-lg font-black tracking-tight">
            Group Leaderboard
          </h2>
        </div>

        {/* Centered Search Bar */}
        <div className="relative max-w-sm mx-auto">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search student..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200/90 rounded-2xl text-xs text-slate-800 placeholder-slate-400 shadow-xs focus:outline-none focus:ring-2 focus:ring-amber-500/40"
          />
        </div>
      </div>

      {/* 2. Top 3 Podium Cards - EXACT SAME UNIFORM SIZE */}
      {top3.length > 0 && !searchTerm && (
        <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-2">
          {/* Rank 2 - Silver */}
          {top3[1] ? (
            <div className="bg-white border-2 border-slate-300 rounded-3xl p-3 text-center shadow-xs flex flex-col items-center justify-between min-h-[160px] relative">
              <span className="absolute top-2 left-2 bg-slate-500 text-white font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center border border-white">
                2
              </span>
              <div className="pt-2">
                <img
                  src={top3[1].userAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${top3[1].userName}`}
                  alt={top3[1].userName}
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-slate-300 mx-auto object-cover shadow-xs"
                />
              </div>
              <div className="w-full px-0.5 my-1">
                <p className="text-xs font-bold text-slate-900 truncate">{top3[1].userName}</p>
                <div className="inline-flex items-center space-x-0.5 text-amber-600 font-black text-[11px] mt-0.5">
                  <Flame className="w-3 h-3 fill-amber-500 text-amber-500 shrink-0" />
                  <span>{top3[1].currentStreak}d Streak</span>
                </div>
              </div>
              <div className="w-full text-[10px] text-slate-600 font-extrabold bg-slate-100 py-1 px-1 rounded-xl">
                {formatMinutesToHM(top3[1].lastWeekStudyMinutes || 0)} / wk
              </div>
            </div>
          ) : <div />}

          {/* Rank 1 - Gold */}
          {top3[0] ? (
            <div className="bg-gradient-to-b from-amber-50/80 to-orange-50/90 border-2 border-amber-400 rounded-3xl p-3 text-center shadow-md flex flex-col items-center justify-between min-h-[160px] relative">
              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider shadow-xs whitespace-nowrap">
                🏆 Leader
              </span>
              <div className="pt-2">
                <img
                  src={top3[0].userAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${top3[0].userName}`}
                  alt={top3[0].userName}
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-amber-400 mx-auto object-cover shadow-sm ring-2 ring-amber-300/50"
                />
              </div>
              <div className="w-full px-0.5 my-1">
                <p className="text-xs font-black text-amber-950 truncate">{top3[0].userName}</p>
                <div className="inline-flex items-center space-x-0.5 text-amber-700 font-black text-[11px] mt-0.5">
                  <Flame className="w-3 h-3 fill-amber-500 text-amber-500 shrink-0" />
                  <span>{top3[0].currentStreak}d Streak</span>
                </div>
              </div>
              <div className="w-full text-[10px] text-amber-900 font-black bg-amber-200/80 py-1 px-1 rounded-xl">
                {formatMinutesToHM(top3[0].lastWeekStudyMinutes || 0)} / wk
              </div>
            </div>
          ) : <div />}

          {/* Rank 3 - Bronze */}
          {top3[2] ? (
            <div className="bg-white border-2 border-amber-600/40 rounded-3xl p-3 text-center shadow-xs flex flex-col items-center justify-between min-h-[160px] relative">
              <span className="absolute top-2 left-2 bg-amber-700 text-white font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center border border-white">
                3
              </span>
              <div className="pt-2">
                <img
                  src={top3[2].userAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${top3[2].userName}`}
                  alt={top3[2].userName}
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-amber-600/50 mx-auto object-cover shadow-xs"
                />
              </div>
              <div className="w-full px-0.5 my-1">
                <p className="text-xs font-bold text-slate-900 truncate">{top3[2].userName}</p>
                <div className="inline-flex items-center space-x-0.5 text-amber-600 font-black text-[11px] mt-0.5">
                  <Flame className="w-3 h-3 fill-amber-500 text-amber-500 shrink-0" />
                  <span>{top3[2].currentStreak}d Streak</span>
                </div>
              </div>
              <div className="w-full text-[10px] text-slate-600 font-extrabold bg-slate-100 py-1 px-1 rounded-xl">
                {formatMinutesToHM(top3[2].lastWeekStudyMinutes || 0)} / wk
              </div>
            </div>
          ) : <div />}
        </div>
      )}

      {/* 3. Complete Student Rankings List */}
      <div className="space-y-3">
        {filtered.map((item) => {
          const isCurrentUser = currentUser?.id === item.userId;
          const hasPrivateMessage = item.privateMessages && item.privateMessages.length > 0;
          const privateMsg = hasPrivateMessage ? item.privateMessages![0] : null;
          const isReplying = replyOpenStudentId === item.userId;

          return (
            <div
              key={item.userId}
              className={`bg-white border rounded-3xl p-3.5 sm:p-4 shadow-xs transition-all space-y-3 ${
                isCurrentUser ? 'border-2 border-amber-500 bg-amber-50/10' : 'border-slate-200/90'
              }`}
            >
              {/* Header Row: Rank + Avatar + Name & Streak Badge */}
              <div className="flex items-center justify-between gap-2">
                {/* Left Rank + Avatar + Name */}
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                    item.rank === 1 ? 'bg-amber-500 text-white shadow-xs' :
                    item.rank === 2 ? 'bg-slate-400 text-white' :
                    item.rank === 3 ? 'bg-amber-700 text-white' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    #{item.rank}
                  </div>

                  <img
                    src={item.userAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${item.userName}`}
                    alt={item.userName}
                    className="w-10 h-10 rounded-full border border-slate-200 object-cover shrink-0"
                  />

                  <div className="min-w-0">
                    <div className="flex items-center space-x-1.5">
                      <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 truncate">
                        {item.userName}
                      </h3>
                      {isCurrentUser && (
                        <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-1.5 py-0.2 rounded-full">
                          You
                        </span>
                      )}
                    </div>

                    {/* Stats Pills Row - CLEAN NO TEXT BREAKS */}
                    <div className="flex items-center flex-wrap gap-1.5 mt-1">
                      <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg whitespace-nowrap">
                        Last Wk: {formatMinutesToHM(item.lastWeekStudyMinutes || 0)}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg whitespace-nowrap ${
                        item.todayLog ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                      }`}>
                        Today: {item.todayLog ? formatMinutesToHM(item.todayLog.studyMinutes) : 'Pending'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Streak Badge */}
                <div className="shrink-0 text-right">
                  <div className="inline-flex items-center space-x-1 bg-gradient-to-r from-amber-50 to-orange-50 px-2.5 py-1 rounded-2xl border border-amber-200/80 text-amber-900 font-black text-xs shadow-2xs">
                    <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500 shrink-0" />
                    <span>{item.currentStreak}d</span>
                  </div>
                </div>
              </div>

              {/* 4. INSTAGRAM / THREAD STYLE COMMENT & FEEDBACK BLOCK */}
              <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-3 space-y-2.5 text-xs">
                {/* A. Student Comment Bubble */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="font-bold text-slate-900 text-[11px]">Student Private Note</span>
                      {privateMsg && (
                        <span className="text-[9px] text-slate-400 font-medium">
                          • {privateMsg.date}
                        </span>
                      )}
                    </div>

                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => setReplyOpenStudentId(isReplying ? null : item.userId)}
                        className="text-[10px] font-bold text-amber-600 hover:text-amber-700 flex items-center space-x-1 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded-lg transition-all"
                      >
                        <Reply className="w-3 h-3" />
                        <span>{isReplying ? 'Close' : 'Reply'}</span>
                      </button>
                    )}
                  </div>

                  {privateMsg ? (
                    <div className="bg-white border border-slate-200/90 rounded-xl p-2.5 text-slate-800 text-xs font-medium leading-relaxed">
                      "{privateMsg.message}"
                    </div>
                  ) : (
                    <p className="text-slate-400 italic text-[11px] pl-1">
                      No private note submitted by student for today's log.
                    </p>
                  )}
                </div>

                {/* B. Mentor Reply Bubble (Thread style with left border connector) */}
                {(item.mentorFeedback || isReplying) && (
                  <div className="ml-3 sm:ml-4 pl-3 border-l-2 border-amber-400 space-y-2 pt-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span className="font-bold text-amber-950 text-[11px]">Mentor Feedback</span>
                      </div>

                      {savedSuccessStudentId === item.userId && (
                        <span className="text-[10px] font-bold text-emerald-600 flex items-center space-x-1 animate-fade-in">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Saved!</span>
                        </span>
                      )}
                    </div>

                    {/* Published Mentor Feedback text */}
                    {item.mentorFeedback && !isReplying && (
                      <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-2.5 text-slate-800 text-xs font-medium leading-relaxed">
                        "{item.mentorFeedback}"
                      </div>
                    )}

                    {/* C. Admin Inline Reply Input Box */}
                    {isAdmin && (isReplying || !item.mentorFeedback) && (
                      <div className="space-y-2 pt-1">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={feedbackDrafts[item.userId] || ''}
                            onChange={e => setFeedbackDrafts({ ...feedbackDrafts, [item.userId]: e.target.value })}
                            placeholder="Type mentor feedback reply..."
                            className="flex-1 p-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                          />

                          <button
                            type="button"
                            onClick={() => handleSaveFeedback(item.userId)}
                            disabled={savingStudentId === item.userId}
                            className="px-3 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs rounded-xl shadow-xs shrink-0 flex items-center space-x-1 active:scale-95 transition-all"
                          >
                            <Send className="w-3 h-3" />
                            <span>{savingStudentId === item.userId ? 'Sending...' : 'Send'}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-10 bg-white border border-slate-200 rounded-3xl p-6 text-slate-500 text-xs">
            No students found matching "{searchTerm}".
          </div>
        )}
      </div>
    </div>
  );
};
