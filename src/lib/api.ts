import { User, StudyLog, UserStreakInfo, Notice, ThreadPost, ThreadComment } from '../types';
import { getStudyCycleDate } from './streak';

const isPHPBackend = !window.location.hostname.includes('localhost') && 
                     !window.location.hostname.includes('127.0.0.1') && 
                     !window.location.hostname.includes('run.app') &&
                     !window.location.hostname.includes('aistudio');

async function callApi(path: string, options: any = {}) {
  let url = '';
  
  if (!isPHPBackend) {
    url = `/api${path}`;
  } else {
    // Transform Express endpoints to PHP api.php REST endpoints
    url = `api.php${path}`;
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    }
  });
  
  const text = await response.text();
  try {
    const data = JSON.parse(text);
    if (!response.ok) {
      throw new Error(data.error || `Request failed with status ${response.status}`);
    }
    return data;
  } catch (err: any) {
    console.error(`API response parse failed for ${url}. Text:`, text);
    if (text.includes('<html') || text.includes('<!DOCTYPE') || text.includes('<br />')) {
      throw new Error('InfinityFree server returned an HTML/PHP error. Please run install.php first to configure the database.');
    }
    throw new Error(text || `API error (status ${response.status}): ${err.message}`);
  }
}

export async function checkStatus() {
  return callApi('/status');
}

export async function registerUser(payload: { name: string; email: string; password?: string; role?: string }) {
  return callApi('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function loginUser(payload: { email: string; password?: string }) {
  return callApi('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateProfile(payload: { userId: string; name: string; bio?: string; targetHoursPerDay?: number; avatar?: string }) {
  return callApi('/user/profile', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function submitStudyLog(payload: { userId: string; hours: number; minutes: number; privateMessage?: string }) {
  return callApi('/logs', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchUserLogs(userId: string) {
  return callApi(`/logs/${userId}`);
}

export async function fetchLeaderboard(): Promise<{ leaderboard: UserStreakInfo[]; todayCycle: string }> {
  try {
    const data = await callApi('/leaderboard');
    
    // In PHP backend, we return raw users, logs, and feedbacks, and compute leaderboard on the client.
    // In Express, it's pre-computed. Let's handle both gracefully!
    if (data.users && data.logs && data.feedbacks) {
      const students = data.users.filter((u: any) => u.role === 'student');
      const computedLeaderboard: UserStreakInfo[] = students.map((user: any) => {
        try {
          const userLogs = data.logs.filter((l: any) => l.userId === user.id);
          const targetMinutes = (user.targetHoursPerDay || 8) * 60; // Use user's target hours
          
          // Calculate streak info (mocking/simplifying logic if needed, or complete streak calculation)
          let currentStreak = 0;
          let longestStreak = 0;
          let totalStudyMinutes = 0;
          
          const sortedLogs = [...userLogs].sort((a: any, b: any) => new Date(a.cycleDate).getTime() - new Date(b.cycleDate).getTime());
          
          if (sortedLogs.length > 0) {
            totalStudyMinutes = sortedLogs.reduce((acc: number, log: any) => acc + (log.studyMinutes || 0), 0);
            
            // Simple streak builder
            let tempStreak = 0;
            let lastDate: Date | null = null;
            
            for (const log of sortedLogs) {
              try {
                const logDate = new Date(log.cycleDate);
                if (log.studyMinutes >= targetMinutes) { // Use user's target hours criteria
                  if (!lastDate) {
                    tempStreak = 1;
                  } else {
                    const diffTime = Math.abs(logDate.getTime() - lastDate.getTime());
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    if (diffDays <= 1) {
                      tempStreak += 1;
                    } else {
                      tempStreak = 1;
                    }
                  }
                  lastDate = logDate;
                  if (tempStreak > longestStreak) longestStreak = tempStreak;
                } else {
                  tempStreak = 0;
                }
              } catch (e) {
                console.error('Error processing log:', e);
              }
            }
            currentStreak = tempStreak;
          }
          
          const feedback = data.feedbacks.find((f: any) => f.userId === user.id)?.content || '';
          const todayCycleDate = getStudyCycleDate();
          const todayLog = userLogs.find((l: any) => l.cycleDate === todayCycleDate);
          
          return {
            userId: user.id,
            userName: user.name || 'Unknown',
            userAvatar: user.avatar || '',
            currentStreak,
            longestStreak,
            totalStudyMinutes,
            feedback,
            todayLog: todayLog ? {
              id: todayLog.id,
              userId: todayLog.userId,
              userName: user.name || 'Unknown',
              cycleDate: todayLog.cycleDate,
              studyMinutes: Number(todayLog.studyMinutes) || 0,
              studyHoursFormatted: todayLog.studyHoursFormatted || `${Math.floor((Number(todayLog.studyMinutes) || 0) / 60)}h ${(Number(todayLog.studyMinutes) || 0) % 60}m`,
              loggedAt: todayLog.loggedAt || new Date().toISOString(),
              streakCountAtLog: currentStreak,
              meetsStreakCriteria: (Number(todayLog.studyMinutes) || 0) >= targetMinutes,
            } : undefined,
          };
        } catch (e) {
          console.error('Error processing user:', user.id, e);
          return {
            userId: user.id,
            userName: user.name || 'Unknown',
            userAvatar: user.avatar || '',
            currentStreak: 0,
            longestStreak: 0,
            totalStudyMinutes: 0,
            feedback: '',
            todayLog: undefined,
          };
        }
      });
      
      return {
        leaderboard: computedLeaderboard,
        todayCycle: getStudyCycleDate(),
      };
    }
    
    return data;
  } catch (e) {
    console.error('Error fetching leaderboard:', e);
    return {
      leaderboard: [],
      todayCycle: getStudyCycleDate(),
    };
  }
}

export async function postMentorFeedback(payload: { studentId: string; adminId?: string; content: string }) {
  return callApi('/admin/feedback', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchAdminMessages() {
  const data = await callApi('/admin/messages');
  if (data.feedbacks) {
    // PHP mapper
    return {
      messages: data.feedbacks.map((f: any) => ({
        id: f.id,
        userId: f.userId,
        adminId: f.adminId,
        content: f.content,
        updatedAt: f.updatedAt,
      })),
    };
  }
  return data;
}

export async function fetchNotice(): Promise<{ notice: Notice }> {
  return callApi('/notice');
}

export async function updateNotice(payload: { content: string; active?: boolean; updatedBy?: string }) {
  return callApi('/admin/notice', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchThreads(userId?: string): Promise<{ threads: ThreadPost[] }> {
  const url = userId ? `/threads?user_id=${encodeURIComponent(userId)}` : '/threads';
  return callApi(url);
}

export async function createThread(payload: { userId: string; title?: string; content: string }) {
  return callApi('/threads', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function voteThread(threadId: string, payload: { userId: string; voteType: 'upvote' | 'downvote' }) {
  return callApi(`/threads/${threadId}/vote`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function addThreadComment(threadId: string, payload: { userId: string; content: string; parentCommentId?: string }) {
  return callApi(`/threads/${threadId}/comment`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function voteComment(commentId: string, payload: { userId: string; voteType: 'upvote' | 'downvote' }) {
  return callApi(`/threads/comment/${commentId}/vote`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
