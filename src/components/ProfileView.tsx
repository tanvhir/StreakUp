import React, { useState, useEffect } from 'react';
import { User, StudyLog } from '../types';
import { formatCycleDateLabel } from '../lib/streak';
import {
  Edit2,
  Clock,
  Calendar,
  LogOut,
  Lock,
  Camera,
  CheckCircle2,
  Flame,
  ShieldCheck,
  User as UserIcon,
  Sparkles,
  Link as LinkIcon
} from 'lucide-react';

interface ProfileViewProps {
  currentUser: User | null;
  userLogs: StudyLog[];
  onUpdateProfile: (name: string, bio: string, targetHours: number, avatar: string) => Promise<void>;
  onLogout: () => void;
}

const PRESET_AVATARS = [
  'https://api.dicebear.com/7.x/bottts/svg?seed=Scholar',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Doctor',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Engineer',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Student',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
];

export const ProfileView: React.FC<ProfileViewProps> = ({
  currentUser,
  userLogs,
  onUpdateProfile,
  onLogout,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [targetHours, setTargetHours] = useState(8);
  const [selectedAvatar, setSelectedAvatar] = useState(PRESET_AVATARS[0]);
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [showCustomUrlInput, setShowCustomUrlInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [showAllLogs, setShowAllLogs] = useState(false);

  // Initialize state when currentUser is available
  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setBio(currentUser.bio || '');
      setTargetHours(currentUser.targetHoursPerDay || 8);
      setSelectedAvatar(currentUser.avatar || PRESET_AVATARS[0]);
    }
  }, [currentUser]);

  if (!currentUser) {
    return (
      <div className="max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6 pb-24 lg:pb-6 animate-fade-in">
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 text-center">
          <p className="text-slate-600">Please log in to view your profile.</p>
        </div>
      </div>
    );
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const finalAvatar = customAvatarUrl.trim() || selectedAvatar;
      await onUpdateProfile(name, bio, targetHours, finalAvatar);
      setMsg('Profile updated successfully!');
      setIsEditing(false);
      setTimeout(() => setMsg(''), 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6 pb-24 lg:pb-6 animate-fade-in">
      {/* 1. Profile Top Overview Card */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-4 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-col xs:flex-row items-center xs:items-start justify-between gap-4">
          <div className="flex flex-col xs:flex-row items-center xs:items-start space-y-3 xs:space-y-0 xs:space-x-4 text-center xs:text-left min-w-0 w-full">
            {/* Avatar with Edit Camera Overlay */}
            <div className="relative shrink-0 group cursor-pointer" onClick={() => setIsEditing(true)}>
              <img
                src={selectedAvatar}
                alt={currentUser.name}
                className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl border-2 border-amber-400 bg-amber-50 object-cover shadow-sm group-hover:brightness-95 transition-all"
              />
              <button
                type="button"
                className="absolute -bottom-1 -right-1 bg-amber-500 hover:bg-amber-600 text-white p-1.5 rounded-xl shadow-md transition-transform group-hover:scale-110"
                title="Change Photo"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="min-w-0 w-full">
              <div className="flex items-center justify-center xs:justify-start space-x-2 flex-wrap gap-y-1">
                <h2 className="text-base sm:text-lg font-black text-slate-900 truncate">{currentUser.name}</h2>
                <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200">
                  {currentUser.role === 'admin' ? 'Mentor' : 'Student'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1 truncate">{currentUser.email}</p>
              <p className="text-xs text-slate-700 font-medium mt-0.5 line-clamp-2">
                {currentUser.bio || 'Dedicated student aiming high!'}
              </p>

              <div className="mt-2.5 flex items-center justify-center xs:justify-start space-x-2">
                <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200/80 inline-flex items-center space-x-1">
                  <Clock className="w-3 h-3 text-amber-600" />
                  <span>Target Goal: {currentUser.targetHoursPerDay || 8}h / day</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons: Edit Profile & Logout */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-2xl flex items-center justify-center space-x-1.5 transition-all active:scale-98 cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5 text-slate-600" />
            <span>{isEditing ? 'Cancel Edit' : 'Edit Profile Photo & Info'}</span>
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="py-2.5 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-2xl flex items-center justify-center space-x-1.5 transition-all active:scale-98 cursor-pointer shrink-0 border border-rose-200/60"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-600" />
            <span>Logout</span>
          </button>
        </div>

        {/* Edit Profile Form Panel */}
        {isEditing && (
          <form onSubmit={handleSave} className="bg-amber-50/60 border border-amber-200/80 p-4 sm:p-5 rounded-2xl space-y-4 animate-fade-in">
            <div className="flex items-center space-x-2 border-b border-amber-200/60 pb-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <h3 className="font-extrabold text-xs text-amber-950 uppercase tracking-wider">Update Profile Photo & Details</h3>
            </div>

            {/* Avatar Photo Selection */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                Choose Profile Photo / Avatar
              </label>

              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {PRESET_AVATARS.map((av, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setSelectedAvatar(av);
                      setCustomAvatarUrl('');
                    }}
                    className={`relative rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                      selectedAvatar === av && !customAvatarUrl
                        ? 'border-amber-500 ring-2 ring-amber-400/50 scale-105'
                        : 'border-slate-200 hover:border-amber-300'
                    }`}
                  >
                    <img src={av} alt="Avatar" className="w-12 h-12 object-cover" />
                    {selectedAvatar === av && !customAvatarUrl && (
                      <div className="absolute inset-0 bg-amber-500/20 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-amber-700 bg-white rounded-full" />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Custom Image URL Toggle */}
              <div className="pt-1">
                {!showCustomUrlInput ? (
                  <button
                    type="button"
                    onClick={() => setShowCustomUrlInput(true)}
                    className="text-[11px] font-bold text-amber-700 hover:text-amber-800 flex items-center space-x-1"
                  >
                    <LinkIcon className="w-3 h-3" />
                    <span>Or paste custom profile image URL</span>
                  </button>
                ) : (
                  <div className="space-y-1">
                    <input
                      type="url"
                      value={customAvatarUrl}
                      onChange={e => {
                        setCustomAvatarUrl(e.target.value);
                        if (e.target.value) setSelectedAvatar(e.target.value);
                      }}
                      placeholder="https://example.com/my-photo.jpg"
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Form Fields Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Display Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Target Daily Study Hours</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={targetHours}
                  onChange={e => setTargetHours(Number(e.target.value))}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Bio / Academic Target</label>
              <input
                type="text"
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="e.g. Medical Admission Aspirant 2026"
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-xs rounded-xl shadow-md active:scale-98 transition-all cursor-pointer"
            >
              {loading ? 'Saving Changes...' : 'Save Profile Changes'}
            </button>
          </form>
        )}

        {msg && (
          <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{msg}</span>
          </div>
        )}
      </div>

      {/* 2. Study Log History (Clean Card List - NO BROKEN COLUMN HEADERS!) */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-amber-600" />
            <h3 className="text-xs sm:text-sm font-extrabold text-slate-900">Your Study History Log</h3>
          </div>
          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg">
            {userLogs.length} Entries
          </span>
        </div>

        {/* Card List of Logs */}
        <div className="space-y-2.5">
          {(showAllLogs ? userLogs : userLogs.slice(0, 7)).map((log) => (
            <div
              key={log.id}
              className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-3 space-y-2 text-xs transition-all hover:bg-slate-50"
            >
              {/* Row 1: Cycle Date & Logged Duration */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-slate-900 text-xs sm:text-sm">
                    {log.cycleDate ? formatCycleDateLabel(log.cycleDate) : 'Unknown Date'}
                  </span>
                </div>

                <div className="inline-flex items-center space-x-1 bg-amber-100/90 border border-amber-200 text-amber-950 font-black text-xs px-2.5 py-0.5 rounded-xl">
                  <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                  <span>{log.studyHoursFormatted}</span>
                </div>
              </div>

              {/* Row 2: Private Mentor Note if present */}
              {log.privateMessage && (
                <div className="bg-white border border-slate-200/90 rounded-xl p-2.5 text-slate-700 text-[11px] font-medium leading-relaxed flex items-start space-x-2">
                  <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span className="italic">"{log.privateMessage}"</span>
                </div>
              )}

              {/* Row 3: Timestamp */}
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium pt-1 border-t border-slate-200/50">
                <span>
                  Logged at {log.loggedAt ? new Date(log.loggedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Unknown time'}
                </span>
                <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.2 rounded-md">
                  Logged
                </span>
              </div>
            </div>
          ))}

          {userLogs.length === 0 && (
            <div className="text-center py-8 bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-6 text-slate-400 text-xs italic space-y-1">
              <p>No study entries logged yet.</p>
              <p className="text-[10px]">Click the <strong>+</strong> button at the bottom to log today's progress!</p>
            </div>
          )}

          {/* Load More Button */}
          {userLogs.length > 7 && !showAllLogs && (
            <button
              type="button"
              onClick={() => setShowAllLogs(true)}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              Load More ({userLogs.length - 7} more entries)
            </button>
          )}

          {showAllLogs && userLogs.length > 7 && (
            <button
              type="button"
              onClick={() => setShowAllLogs(false)}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              Show Less (Last 7 days)
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
