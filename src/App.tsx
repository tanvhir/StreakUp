import React, { useState, useEffect } from 'react';
import { User, StudyLog, UserStreakInfo, Notice, ThreadPost } from './types';
import {
  checkStatus,
  configureDatabase,
  registerUser,
  loginUser,
  updateProfile,
  submitStudyLog,
  fetchUserLogs,
  fetchLeaderboard,
  postMentorFeedback,
  fetchAdminMessages,
  fetchNotice,
  updateNotice,
  fetchThreads,
  createThread,
  toggleThreadLike,
  addThreadComment,
} from './lib/api';

import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { DashboardView } from './components/DashboardView';
import { LeaderboardView } from './components/LeaderboardView';
import { CommunityThreadsView } from './components/CommunityThreadsView';
import { ProfileView } from './components/ProfileView';
import { AdminView } from './components/AdminView';
import { DailyEntryModal } from './components/DailyEntryModal';
import { AuthModal } from './components/AuthModal';
import { AutoSetupWizard } from './components/AutoSetupWizard';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('studystreak_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [notice, setNotice] = useState<Notice | null>(null);
  const [leaderboard, setLeaderboard] = useState<UserStreakInfo[]>([]);
  const [threads, setThreads] = useState<ThreadPost[]>([]);
  const [adminMessages, setAdminMessages] = useState<StudyLog[]>([]);
  const [userLogs, setUserLogs] = useState<StudyLog[]>([]);
  const [dbConfig, setDbConfig] = useState<{ dbHost: string; dbName: string; dbUser: string }>({
    dbHost: 'sqlxxx.epizy.com',
    dbName: 'studystreak_db',
    dbUser: 'epiz_user',
  });

  // Modal controls
  const [isDailyModalOpen, setIsDailyModalOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isSetupModalOpen, setIsSetupModalOpen] = useState<boolean>(false);
  const [adminFeedbackStudentId, setAdminFeedbackStudentId] = useState<string>('');

  // Initial Load
  const loadData = async () => {
    try {
      const statusRes = await checkStatus().catch(() => null);
      if (statusRes) {
        setDbConfig({
          dbHost: statusRes.dbHost || 'sqlxxx.epizy.com',
          dbName: statusRes.dbName || 'studystreak_db',
          dbUser: statusRes.dbUser || 'epiz_user',
        });
      }

      const noticeRes = await fetchNotice().catch(() => null);
      if (noticeRes?.notice) setNotice(noticeRes.notice);

      const lbRes = await fetchLeaderboard().catch(() => null);
      if (lbRes?.leaderboard) setLeaderboard(lbRes.leaderboard);

      const threadRes = await fetchThreads().catch(() => null);
      if (threadRes?.threads) setThreads(threadRes.threads);

      if (currentUser) {
        const userLogsRes = await fetchUserLogs(currentUser.id).catch(() => null);
        if (userLogsRes?.logs) setUserLogs(userLogsRes.logs);

        if (currentUser.role === 'admin') {
          const adminMsgsRes = await fetchAdminMessages().catch(() => null);
          if (adminMsgsRes?.messages) setAdminMessages(adminMsgsRes.messages);
        }
      }
    } catch (err) {
      console.error('Data load error:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser?.id]);

  // Handle Login & Save Persistence
  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('studystreak_user', JSON.stringify(user));
    } catch (e) {
      console.error('Storage error', e);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('studystreak_user');
    } catch (e) {
      console.error('Storage error', e);
    }
  };

  // Submit Study Log
  const handleSubmitStudyLog = async (hours: number, minutes: number, privateMsg: string) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }

    const res = await submitStudyLog({
      userId: currentUser.id,
      hours,
      minutes,
      privateMessage: privateMsg,
    });

    await loadData();
    return res;
  };

  // Profile Update
  const handleUpdateProfile = async (name: string, bio: string, targetHours: number, avatar: string) => {
    if (!currentUser) return;
    const res = await updateProfile({
      userId: currentUser.id,
      name,
      bio,
      targetHoursPerDay: targetHours,
      avatar,
    });

    if (res.user) {
      handleLoginSuccess(res.user);
      await loadData();
    }
  };

  // Mentor Feedback
  const handlePostMentorFeedback = async (studentId: string, content: string) => {
    if (!currentUser || currentUser.role !== 'admin') return;
    await postMentorFeedback({
      studentId,
      adminId: currentUser.id,
      content,
    });
    await loadData();
  };

  // Notice Update
  const handleUpdateNotice = async (content: string, active: boolean) => {
    if (!currentUser || currentUser.role !== 'admin') return;
    const res = await updateNotice({
      content,
      active,
      updatedBy: currentUser.name,
    });
    if (res.notice) setNotice(res.notice);
  };

  // Threads
  const handleCreateThread = async (title: string, content: string) => {
    if (!currentUser) return;
    await createThread({
      userId: currentUser.id,
      title,
      content,
    });
    await loadData();
  };

  const handleLikeThread = async (threadId: string) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    await toggleThreadLike(threadId, currentUser.id);
    await loadData();
  };

  const handleAddComment = async (threadId: string, content: string) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    await addThreadComment(threadId, {
      userId: currentUser.id,
      content,
    });
    await loadData();
  };

  // Auto Setup Save
  const handleSaveSetup = async (dbHost: string, dbName: string, dbUser: string) => {
    await configureDatabase({ dbHost, dbName, dbUser });
    setDbConfig({ dbHost, dbName, dbUser });
    await loadData();
  };

  const currentUserStreakInfo = leaderboard.find(item => item.userId === currentUser?.id);
  const todayLog = currentUserStreakInfo?.todayLog;
  const previousLogMinutes = currentUserStreakInfo?.lastStudyMinutes;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col selection:bg-amber-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        currentUser={currentUser}
        notice={notice}
        leaderboard={leaderboard}
        threads={threads}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main View Area */}
      <main className="flex-1">
        {activeTab === 'dashboard' && (
          <DashboardView
            currentUser={currentUser}
            userStreakInfo={currentUserStreakInfo}
            todayLog={todayLog}
            onOpenDailyEntry={() => {
              if (!currentUser) setIsAuthModalOpen(true);
              else setIsDailyModalOpen(true);
            }}
            onOpenAuth={() => setIsAuthModalOpen(true)}
          />
        )}

        {activeTab === 'leaderboard' && (
          <LeaderboardView
            leaderboard={leaderboard}
            currentUser={currentUser}
            todayCycle=""
            onPostFeedback={handlePostMentorFeedback}
            onOpenFeedbackModal={(studentId) => {
              setAdminFeedbackStudentId(studentId);
              setActiveTab('admin');
            }}
          />
        )}

        {activeTab === 'threads' && (
          <CommunityThreadsView
            threads={threads}
            currentUser={currentUser}
            onCreateThread={handleCreateThread}
            onLikeThread={handleLikeThread}
            onAddComment={handleAddComment}
            onOpenAuth={() => setIsAuthModalOpen(true)}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileView
            currentUser={currentUser}
            userLogs={userLogs}
            onUpdateProfile={handleUpdateProfile}
            onLogout={handleLogout}
          />
        )}

        {activeTab === 'admin' && (
          <AdminView
            currentUser={currentUser}
            notice={notice}
            userLogs={userLogs}
            onUpdateNotice={handleUpdateNotice}
            onUpdateProfile={handleUpdateProfile}
            onLogout={handleLogout}
          />
        )}
      </main>

      {/* Bottom Floating Navigation Bar (Mobile App Style) */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenDailyEntry={() => {
          if (!currentUser) setIsAuthModalOpen(true);
          else setIsDailyModalOpen(true);
        }}
        currentUser={currentUser}
      />

      {/* Daily Progress Entry Modal (Triggered by Big + Icon) */}
      <DailyEntryModal
        isOpen={isDailyModalOpen}
        onClose={() => setIsDailyModalOpen(false)}
        currentUser={currentUser}
        onSubmitLog={handleSubmitStudyLog}
        todayLog={todayLog}
        previousLogMinutes={previousLogMinutes}
        currentStreak={currentUserStreakInfo?.currentStreak || 0}
      />

      {/* Auth Modal (Login / Register) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        onRegister={async (name, email, password) => {
          const res = await registerUser({ name, email, password });
          return res.user;
        }}
        onLogin={async (email, password) => {
          const res = await loginUser({ email, password });
          return res.user;
        }}
      />

      {/* InfinityFree Auto Setup Wizard & PHP Exporter */}
      <AutoSetupWizard
        isOpen={isSetupModalOpen}
        onClose={() => setIsSetupModalOpen(false)}
        onSaveSetup={handleSaveSetup}
        currentConfig={dbConfig}
      />
    </div>
  );
}
