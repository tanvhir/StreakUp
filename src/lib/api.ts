import { User, StudyLog, UserStreakInfo, Notice, ThreadPost, ThreadComment } from '../types';

const isPHPBackend = !window.location.hostname.includes('localhost') && 
                     !window.location.hostname.includes('127.0.0.1') && 
                     !window.location.hostname.includes('run.app') &&
                     !window.location.hostname.includes('aistudio');

async function callApi(path: string, options: any = {}) {
  let url = '';
  
  if (!isPHPBackend) {
    url = `/api${path}`;
  } else {
    // Transform Express endpoints to PHP api.php query actions
    if (path === '/status') {
      url = 'api.php?action=status';
    } else if (path === '/auth/register') {
      url = 'api.php?action=register';
    } else if (path === '/auth/login') {
      url = 'api.php?action=login';
    } else if (path === '/user/profile') {
      url = 'api.php?action=update_profile';
    } else if (path.startsWith('/logs/')) {
      const userId = path.split('/').pop();
      url = `api.php?action=get_user_logs&userId=${userId}`;
    } else if (path === '/logs') {
      url = 'api.php?action=add_log';
    } else if (path === '/leaderboard') {
      url = 'api.php?action=get_leaderboard';
    } else if (path === '/admin/feedback') {
      url = 'api.php?action=add_feedback';
    } else if (path === '/admin/messages') {
      // In PHP, admin feedback is fetched via leaderboard logs/feedbacks
      url = 'api.php?action=get_leaderboard';
    } else if (path === '/notice') {
      url = 'api.php?action=get_notices';
    } else if (path === '/notices') {
      url = 'api.php?action=get_notices';
    } else if (path === '/admin/notice') {
      url = 'api.php?action=update_notice';
    } else if (path === '/threads') {
      url = 'api.php?action=get_threads';
    } else if (path.startsWith('/threads/') && path.endsWith('/like')) {
      const parts = path.split('/');
      const threadId = parts[2];
      url = `api.php?action=like_thread&threadId=${threadId}`;
    } else if (path.startsWith('/threads/') && path.endsWith('/comment')) {
      const parts = path.split('/');
      const threadId = parts[2];
      url = `api.php?action=add_comment&threadId=${threadId}`;
    } else if (path === '/setup') {
      url = 'api.php?action=status'; // setup is locked by install.php on InfinityFree anyway
    } else {
      url = `/api${path}`;
    }
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

export async function configureDatabase(data: {
  dbHost: string;
  dbName: string;
  dbUser: string;
  dbPass?: string;
  adminName?: string;
  adminEmail?: string;
  adminPassword?: string;
}) {
  return callApi('/setup', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function registerUser(payload: { name: string; email: string; password?: string; role?: string }) {
  return callApi('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function loginUser(payload: { email: string; password?: string; username?: string }) {
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
  const data = await callApi('/leaderboard');
  
  // In PHP backend, we return raw users, logs, and feedbacks, and compute leaderboard on the client.
  // In Express, it's pre-computed. Let's handle both gracefully!
  if (data.users && data.logs && data.feedbacks) {
    const students = data.users.filter((u: any) => u.role === 'student');
    const computedLeaderboard: UserStreakInfo[] = students.map((user: any) => {
      const userLogs = data.logs.filter((l: any) => l.userId === user.id);
      
      // Calculate streak info (mocking/simplifying logic if needed, or complete streak calculation)
      let currentStreak = 0;
      let longestStreak = 0;
      let totalStudyMinutes = 0;
      
      const sortedLogs = [...userLogs].sort((a: any, b: any) => new Date(a.cycleDate).getTime() - new Date(b.cycleDate).getTime());
      
      if (sortedLogs.length > 0) {
        totalStudyMinutes = sortedLogs.reduce((acc: number, log: any) => acc + log.studyMinutes, 0);
        
        // Simple streak builder
        let tempStreak = 0;
        let lastDate: Date | null = null;
        
        for (const log of sortedLogs) {
          const logDate = new Date(log.cycleDate);
          if (log.studyMinutes >= 480) { // 8 hours criteria
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
        }
        currentStreak = tempStreak;
      }
      
      const feedback = data.feedbacks.find((f: any) => f.userId === user.id)?.content || '';
      const todayDate = new Date().toISOString().split('T')[0];
      const todayLog = userLogs.find((l: any) => l.cycleDate === todayDate);
      
      return {
        userId: user.id,
        userName: user.name,
        userAvatar: user.avatar,
        currentStreak,
        longestStreak,
        totalStudyMinutes,
        feedback,
        todayLog: todayLog ? {
          id: todayLog.id,
          userId: todayLog.userId,
          userName: user.name,
          cycleDate: todayLog.cycleDate,
          studyMinutes: todayLog.studyMinutes,
          studyHoursFormatted: `${Math.floor(todayLog.studyMinutes / 60)}h ${todayLog.studyMinutes % 60}m`,
          loggedAt: todayLog.loggedAt || new Date().toISOString(),
          streakCountAtLog: currentStreak,
          meetsStreakCriteria: todayLog.studyMinutes >= 480,
        } : undefined,
      };
    });
    
    return {
      leaderboard: computedLeaderboard,
      todayCycle: new Date().toISOString().split('T')[0],
    };
  }
  
  return data;
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

export async function fetchThreads(): Promise<{ threads: ThreadPost[] }> {
  return callApi('/threads');
}

export async function createThread(payload: { userId: string; title?: string; content: string }) {
  return callApi('/threads', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function toggleThreadLike(threadId: string, userId: string) {
  return callApi(`/threads/${threadId}/like`, {
    method: 'POST',
    body: JSON.stringify({ userId }),
  });
}

export async function addThreadComment(threadId: string, payload: { userId: string; content: string }) {
  return callApi(`/threads/${threadId}/comment`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function deployToFtp(payload: {
  ftpHost: string;
  ftpUser: string;
  ftpPass: string;
  dbHost: string;
  dbName: string;
  dbUser: string;
  dbPass: string;
  adminName: string;
  adminEmail: string;
  adminPassword?: string;
  liveUrl?: string;
}) {
  return callApi('/deploy', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
