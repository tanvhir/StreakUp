import React, { useState, useEffect } from 'react';
import { User, StudyLog, UserStreakInfo, Notice, ThreadPost } from './types';
import { getStudyCycleDate } from './lib/streak';
import {
  checkStatus,
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
  voteThread,
  addThreadComment,
  voteComment,
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

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('studystreak_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      localStorage.removeItem('studystreak_user');
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [notice, setNotice] = useState<Notice | null>(null);
  const [leaderboard, setLeaderboard] = useState<UserStreakInfo[]>([]);
  const [threads, setThreads] = useState<ThreadPost[]>([]);
  const [adminMessages, setAdminMessages] = useState<StudyLog[]>([]);
  const [userLogs, setUserLogs] = useState<StudyLog[]>([]);

  // Modal controls
  const [isDailyModalOpen, setIsDailyModalOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [adminFeedbackStudentId, setAdminFeedbackStudentId] = useState<string>('');

  // Initial Load
  const loadData = async () => {
    try {
      const noticeRes = await fetchNotice().catch(() => null);
      if (noticeRes?.notice) setNotice(noticeRes.notice);

      const lbRes = await fetchLeaderboard().catch(() => null);
      if (lbRes?.leaderboard) setLeaderboard(lbRes.leaderboard);

      const threadRes = await fetchThreads(currentUser?.id).catch(() => null);
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

  // Force refresh leaderboard data
  const refreshLeaderboard = async () => {
    try {
      const lbRes = await fetchLeaderboard().catch(() => null);
      if (lbRes?.leaderboard) setLeaderboard(lbRes.leaderboard);
    } catch (err) {
      console.error('Leaderboard refresh error:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser?.id, activeTab]);

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

    try {
      const res = await submitStudyLog({
        userId: currentUser.id,
        hours,
        minutes,
        privateMessage: privateMsg,
      });

      await loadData();
      await refreshLeaderboard(); // Force refresh leaderboard to update today's progress
      return res;
    } catch (err) {
      console.error('Study log submission error:', err);
      throw err;
    }
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
      // Update currentUser with the new data including targetHoursPerDay
      const updatedUser = {
        ...currentUser,
        ...res.user,
        targetHoursPerDay: targetHours, // Ensure this is set explicitly
      };
      handleLoginSuccess(updatedUser);
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
    console.log('handleCreateThread called with:', { title, content, userId: currentUser.id });
    try {
      await createThread({
        userId: currentUser.id,
        title,
        content,
      });
      console.log('Thread created successfully, reloading data');
      await loadData();
    } catch (err) {
      console.error('Error in handleCreateThread:', err);
      throw err;
    }
  };

  const handleVoteThread = async (threadId: string, voteType: 'upvote' | 'downvote') => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    await voteThread(threadId, { userId: currentUser.id, voteType });
    await loadData();
  };

  const handleAddComment = async (threadId: string, content: string, parentCommentId?: string) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    await addThreadComment(threadId, {
      userId: currentUser.id,
      content,
      parentCommentId,
    });
    await loadData();
  };

  const handleVoteComment = async (commentId: string, payload: { userId: string; voteType: 'upvote' | 'downvote' }) => {
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    await voteComment(commentId, payload);
    await loadData();
  };

  const currentUserStreakInfo = leaderboard.find(item => item.userId === currentUser?.id);
  const previousLogMinutes = currentUserStreakInfo?.lastStudyMinutes;
  
  // Compute todayLog from local userLogs for more reliable data
  const todayCycleDate = getStudyCycleDate();
  const todayLog = userLogs.find(log => log.cycleDate === todayCycleDate);

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
            onVoteThread={handleVoteThread}
            onAddComment={handleAddComment}
            onVoteComment={handleVoteComment}
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
    </div>
  );
}
