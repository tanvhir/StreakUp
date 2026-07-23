import React, { useState } from 'react';
import { User, Notice, UserStreakInfo, ThreadPost } from '../types';
import { Flame, Bell, CheckCircle2, MessageSquare, Megaphone, ShieldCheck, Sparkles, X } from 'lucide-react';

interface NavbarProps {
  currentUser: User | null;
  notice: Notice | null;
  leaderboard?: UserStreakInfo[];
  threads?: ThreadPost[];
  onOpenAuth: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  notice,
  leaderboard = [],
  threads = [],
  onOpenAuth,
  activeTab,
  setActiveTab,
}) => {
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(() => {
    // Check if user has unread notifications saved
    const lastRead = localStorage.getItem('studystreak_notif_read');
    return lastRead ? 0 : 1;
  });

  // Calculate notifications for currentUser
  const myLeaderboardInfo = currentUser ? leaderboard.find(u => u.userId === currentUser.id) : null;
  const myMentorFeedback = myLeaderboardInfo?.mentorFeedback;

  // Find comments on user's threads
  const myThreads = currentUser ? threads.filter(t => t.userId === currentUser.id) : [];
  const myThreadComments = myThreads.flatMap(t => 
    t.comments.filter(c => c.userId !== currentUser?.id).map(c => ({
      ...c,
      threadTitle: t.title || t.content.slice(0, 30) + '...'
    }))
  );

  const notificationsList: Array<{ id: string; title: string; body: string; type: 'feedback' | 'notice' | 'thread'; actionTab?: string }> = [];

  if (myMentorFeedback) {
    notificationsList.push({
      id: 'notif-feedback',
      title: 'Mentor Feedback Received',
      body: `"${myMentorFeedback}"`,
      type: 'feedback',
      actionTab: currentUser?.role === 'admin' ? 'admin' : 'leaderboard',
    });
  }

  if (notice && notice.active) {
    notificationsList.push({
      id: 'notif-notice',
      title: 'Site Announcement',
      body: notice.content,
      type: 'notice',
    });
  }

  myThreadComments.slice(0, 3).forEach(c => {
    notificationsList.push({
      id: `notif-comment-${c.id}`,
      title: `${c.userName} commented on your thread`,
      body: `"${c.content}"`,
      type: 'thread',
      actionTab: 'community',
    });
  });

  const handleOpenNotif = () => {
    setIsNotifOpen(!isNotifOpen);
    setUnreadCount(0);
    localStorage.setItem('studystreak_notif_read', Date.now().toString());
  };

  const handleNotifClick = (tab?: string) => {
    if (tab) {
      setActiveTab(tab);
    }
    setIsNotifOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-amber-100 shadow-xs relative">
      {/* Top Notice Marquee Banner */}
      {notice && notice.active && (
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white text-[11px] sm:text-xs py-1.5 px-3 font-semibold flex items-center justify-between overflow-hidden shadow-inner">
          <div className="flex items-center space-x-2 truncate max-w-4xl mx-auto">
            <Megaphone className="w-3.5 h-3.5 animate-bounce shrink-0 text-amber-200" />
            <span className="truncate">{notice.content}</span>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between">
        {/* Brand Logo & Title */}
        <div 
          className="flex items-center space-x-2.5 cursor-pointer group shrink-0"
          onClick={() => setActiveTab('dashboard')}
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
            <Flame className="w-5 h-5 sm:w-6 sm:h-6 fill-amber-100 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight leading-tight">
              StreakUp
            </h1>
            <p className="text-[10px] sm:text-xs text-slate-500 font-medium">Mentorship Tracker</p>
          </div>
        </div>

        {/* Right Header Navigation: Notification Bell & Profile Avatar */}
        <div className="flex items-center space-x-2">
          {currentUser ? (
            <>
              {/* Notification Bell Button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={handleOpenNotif}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 flex items-center justify-center transition-all cursor-pointer relative active:scale-95"
                  title="Notifications"
                >
                  <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700" />
                  {unreadCount > 0 && notificationsList.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                      {notificationsList.length}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown Drawer */}
                {isNotifOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-88 bg-white border border-slate-200 rounded-3xl shadow-2xl p-4 z-50 animate-fade-in space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <div className="flex items-center space-x-1.5">
                        <Bell className="w-4 h-4 text-amber-600" />
                        <h3 className="font-extrabold text-xs text-slate-900">Notifications</h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsNotifOpen(false)}
                        className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-2 max-h-72 overflow-y-auto pr-0.5">
                      {notificationsList.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => handleNotifClick(notif.actionTab)}
                          className="p-3 bg-slate-50 hover:bg-amber-50/70 border border-slate-200/80 rounded-2xl transition-all cursor-pointer space-y-1 text-xs"
                        >
                          <div className="flex items-center space-x-1.5 font-extrabold text-slate-900">
                            {notif.type === 'feedback' && <ShieldCheck className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                            {notif.type === 'notice' && <Megaphone className="w-3.5 h-3.5 text-orange-500 shrink-0" />}
                            {notif.type === 'thread' && <MessageSquare className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                            <span className="truncate">{notif.title}</span>
                          </div>
                          <p className="text-slate-600 text-[11px] leading-relaxed line-clamp-2">
                            {notif.body}
                          </p>
                        </div>
                      ))}

                      {notificationsList.length === 0 && (
                        <div className="text-center py-6 text-slate-400 text-xs italic">
                          No new notifications.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Profile Avatar Button */}
              <button
                type="button"
                onClick={() => setActiveTab(currentUser.role === 'admin' ? 'admin' : 'profile')}
                className={`flex items-center space-x-2 p-1 pr-2.5 sm:pr-3 rounded-2xl border transition-all cursor-pointer active:scale-95 ${
                  activeTab === 'profile' || activeTab === 'admin'
                    ? 'bg-amber-100/80 border-amber-400 ring-2 ring-amber-400/30'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                }`}
              >
                <img
                  src={currentUser.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.name}`}
                  alt={currentUser.name}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-amber-300 object-cover shrink-0"
                />
                <div className="text-left hidden xs:block">
                  <div className="text-xs font-bold text-slate-900 leading-tight flex items-center space-x-1">
                    <span className="truncate max-w-[90px]">{currentUser.name}</span>
                    {currentUser.role === 'admin' && (
                      <ShieldCheck className="w-3 h-3 text-amber-600 inline shrink-0" />
                    )}
                  </div>
                  <div className="text-[9px] text-slate-500 uppercase font-semibold">
                    {currentUser.role === 'admin' ? 'Mentor' : 'Student'}
                  </div>
                </div>
              </button>
            </>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center space-x-1 px-3.5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-xs rounded-2xl shadow-md shadow-amber-500/20 transition-all active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Login / Join</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
