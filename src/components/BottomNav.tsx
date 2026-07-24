import React from 'react';
import { LayoutDashboard, Trophy, Plus, MessageSquare, ShieldCheck, User as UserIcon } from 'lucide-react';
import { User } from '../types';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenDailyEntry: () => void;
  currentUser: User | null;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenDailyEntry,
  currentUser,
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-2 shadow-lg lg:hidden">
      <div className="max-w-md mx-auto flex items-center justify-around relative">
        {/* Dashboard Tab */}
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center justify-center space-y-1 w-14 py-1 rounded-xl transition-all ${
            activeTab === 'dashboard'
              ? 'text-amber-600 font-bold scale-105'
              : 'text-slate-500 hover:text-slate-800 font-medium'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px]">Home</span>
        </button>

        {/* Leaderboard Tab */}
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`flex flex-col items-center justify-center space-y-1 w-14 py-1 rounded-xl transition-all ${
            activeTab === 'leaderboard'
              ? 'text-amber-600 font-bold scale-105'
              : 'text-slate-500 hover:text-slate-800 font-medium'
          }`}
        >
          <Trophy className="w-5 h-5" />
          <span className="text-[10px]">Rankings</span>
        </button>

        {/* Center Big Plus Icon Button */}
        <div className="relative -top-5">
          <button
            onClick={onOpenDailyEntry}
            className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-600 text-white flex items-center justify-center shadow-lg shadow-amber-500/40 hover:scale-110 active:scale-95 transition-all border-4 border-white"
            title="Log Today's Study Hours"
          >
            <Plus className="w-8 h-8 stroke-[2.5]" />
          </button>
        </div>

        {/* Community Threads Tab */}
        <button
          onClick={() => setActiveTab('threads')}
          className={`flex flex-col items-center justify-center space-y-1 w-14 py-1 rounded-xl transition-all ${
            activeTab === 'threads'
              ? 'text-amber-600 font-bold scale-105'
              : 'text-slate-500 hover:text-slate-800 font-medium'
          }`}
        >
          <MessageSquare className="w-5 h-5" />
          <span className="text-[10px]">Threads</span>
        </button>

        {/* Admin or Profile Tab */}
        <button
          onClick={() => setActiveTab(currentUser?.role === 'admin' ? 'admin' : 'profile')}
          className={`flex flex-col items-center justify-center space-y-1 w-14 py-1 rounded-xl transition-all ${
            activeTab === 'profile' || activeTab === 'admin'
              ? 'text-amber-600 font-bold scale-105'
              : 'text-slate-500 hover:text-slate-800 font-medium'
          }`}
        >
          {currentUser?.role === 'admin' ? (
            <ShieldCheck className="w-5 h-5 text-amber-600" />
          ) : (
            <UserIcon className="w-5 h-5" />
          )}
          <span className="text-[10px]">{currentUser?.role === 'admin' ? 'Admin' : 'Profile'}</span>
        </button>
      </div>
    </div>
  );
};
