import React, { useState, useEffect } from 'react';
import { User, StudyLog, Notice } from '../types';
import { ShieldCheck, Megaphone, CheckCircle2, Database, Sparkles } from 'lucide-react';
import { ProfileView } from './ProfileView';

interface AdminViewProps {
  currentUser: User | null;
  notice: Notice | null;
  userLogs?: StudyLog[];
  onUpdateNotice: (content: string, active: boolean) => Promise<void>;
  onUpdateProfile?: (name: string, bio: string, targetHours: number, avatar: string) => Promise<void>;
  onLogout?: () => void;
  onOpenSetup?: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({
  currentUser,
  notice,
  userLogs = [],
  onUpdateNotice,
  onUpdateProfile = async () => {},
  onLogout = () => {},
  onOpenSetup,
}) => {
  const [noticeContent, setNoticeContent] = useState<string>(notice?.content || '');
  const [noticeActive, setNoticeActive] = useState<boolean>(notice?.active ?? true);
  const [noticeLoading, setNoticeLoading] = useState<boolean>(false);
  const [noticeSuccess, setNoticeSuccess] = useState<string>('');

  useEffect(() => {
    if (notice) {
      setNoticeContent(notice.content);
      setNoticeActive(notice.active);
    }
  }, [notice]);

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="max-w-md mx-auto px-4 py-12 text-center space-y-4">
        <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-3xl mx-auto flex items-center justify-center">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Admin Mentor Access Required</h2>
        <p className="text-xs text-slate-500">
          Only mentor accounts have access to this control panel. Log in as an admin to issue site announcements.
        </p>
      </div>
    );
  }

  const handleNoticeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeContent.trim()) return;

    setNoticeLoading(true);
    try {
      await onUpdateNotice(noticeContent, noticeActive);
      setNoticeSuccess('Site announcement updated live!');
      setTimeout(() => setNoticeSuccess(''), 2500);
    } catch (err: any) {
      console.error(err);
    } finally {
      setNoticeLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-5 pb-24 animate-fade-in">
      {/* Mentor Header Banner */}
      <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-3xl p-5 shadow-lg flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md shrink-0">
            <ShieldCheck className="w-6 h-6 text-amber-100" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black">Mentor Control Center</h2>
            <p className="text-xs text-amber-100">Broadcast top notices & manage mentor profile</p>
          </div>
        </div>
      </div>

      {/* Database Auto Setup Shortcut Banner */}
      {onOpenSetup && (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/90 rounded-3xl p-4 sm:p-5 shadow-xs flex items-center justify-between gap-3">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="p-2.5 bg-emerald-500 text-white rounded-2xl shrink-0 shadow-sm">
              <Database className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                InfinityFree DB & PHP Auto Setup
              </h3>
              <p className="text-[11px] font-medium text-slate-600 truncate">
                Configure database connection & export PHP scripts
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenSetup}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-xs transition-all cursor-pointer active:scale-95 shrink-0 flex items-center space-x-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Open Setup</span>
          </button>
        </div>
      )}

      {/* Top Site Announcement Banner Form */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
          <Megaphone className="w-5 h-5 text-amber-600" />
          <h3 className="font-extrabold text-xs sm:text-sm text-slate-900">Top Notice / Announcement Banner</h3>
        </div>

        <form onSubmit={handleNoticeSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Notice Banner Text</label>
            <textarea
              rows={3}
              required
              value={noticeContent}
              onChange={e => setNoticeContent(e.target.value)}
              placeholder="e.g. 📢 Medical Model Test starts Sunday! Everyone must log at least 9 hours daily."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="activeNotice"
              checked={noticeActive}
              onChange={e => setNoticeActive(e.target.checked)}
              className="w-4 h-4 text-amber-600 rounded-xs border-slate-300 focus:ring-amber-500 cursor-pointer"
            />
            <label htmlFor="activeNotice" className="text-xs font-bold text-slate-700 cursor-pointer">
              Display Notice Banner on top of app
            </label>
          </div>

          {noticeSuccess && (
            <div className="p-2.5 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{noticeSuccess}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={noticeLoading}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-2xl shadow-md flex items-center justify-center space-x-2 active:scale-98 transition-all cursor-pointer"
          >
            <Megaphone className="w-4 h-4" />
            <span>{noticeLoading ? 'Updating...' : 'Update Announcement Banner'}</span>
          </button>
        </form>
      </div>

      {/* Admin Profile & Study History View */}
      <div className="pt-2">
        <ProfileView
          currentUser={currentUser}
          userLogs={userLogs}
          onUpdateProfile={onUpdateProfile}
          onLogout={onLogout}
        />
      </div>
    </div>
  );
};
