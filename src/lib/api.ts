import { User, StudyLog, UserStreakInfo, Notice, ThreadPost, ThreadComment } from '../types';

const API_BASE = '/api';

export async function checkStatus() {
  const res = await fetch(`${API_BASE}/status`);
  return res.json();
}

export async function configureDatabase(data: { dbHost: string; dbName: string; dbUser: string }) {
  const res = await fetch(`${API_BASE}/setup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function registerUser(payload: { name: string; email: string; password?: string; role?: string }) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Registration failed');
  return data;
}

export async function loginUser(payload: { email: string; password?: string }) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Login failed');
  return data;
}

export async function updateProfile(payload: { userId: string; name: string; bio?: string; targetHoursPerDay?: number; avatar?: string }) {
  const res = await fetch(`${API_BASE}/user/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Profile update failed');
  return data;
}

export async function submitStudyLog(payload: { userId: string; hours: number; minutes: number; privateMessage?: string }) {
  const res = await fetch(`${API_BASE}/logs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Log submission failed');
  return data;
}

export async function fetchUserLogs(userId: string) {
  const res = await fetch(`${API_BASE}/logs/${userId}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch user logs');
  return data;
}

export async function fetchLeaderboard(): Promise<{ leaderboard: UserStreakInfo[]; todayCycle: string }> {
  const res = await fetch(`${API_BASE}/leaderboard`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch leaderboard');
  return data;
}

export async function postMentorFeedback(payload: { studentId: string; adminId?: string; content: string }) {
  const res = await fetch(`${API_BASE}/admin/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to submit mentor feedback');
  return data;
}

export async function fetchAdminMessages() {
  const res = await fetch(`${API_BASE}/admin/messages`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch admin messages');
  return data;
}

export async function fetchNotice(): Promise<{ notice: Notice }> {
  const res = await fetch(`${API_BASE}/notice`);
  const data = await res.json();
  return data;
}

export async function updateNotice(payload: { content: string; active?: boolean; updatedBy?: string }) {
  const res = await fetch(`${API_BASE}/notice`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update notice');
  return data;
}

export async function fetchThreads(): Promise<{ threads: ThreadPost[] }> {
  const res = await fetch(`${API_BASE}/threads`);
  const data = await res.json();
  return data;
}

export async function createThread(payload: { userId: string; title?: string; content: string }) {
  const res = await fetch(`${API_BASE}/threads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create thread');
  return data;
}

export async function toggleThreadLike(threadId: string, userId: string) {
  const res = await fetch(`${API_BASE}/threads/${threadId}/like`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
  const data = await res.json();
  return data;
}

export async function addThreadComment(threadId: string, payload: { userId: string; content: string }) {
  const res = await fetch(`${API_BASE}/threads/${threadId}/comment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to add comment');
  return data;
}
