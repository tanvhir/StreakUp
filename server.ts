import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { User, StudyLog, MentorFeedback, Notice, ThreadPost, ThreadComment, UserStreakInfo } from './src/types';
import { calculateUserStreakHistory, getStudyCycleDate, formatMinutesToHM, getDaysDifference } from './src/lib/streak';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

const DATA_DIR = path.join(__dirname, 'data');
const STORE_FILE = path.join(DATA_DIR, 'store.json');

// Initial State Interface
interface StoreData {
  configured: boolean;
  dbHost: string;
  dbName: string;
  dbUser: string;
  users: User[];
  logs: StudyLog[];
  mentorFeedbacks: MentorFeedback[];
  notice: Notice;
  threads: ThreadPost[];
}

// Ensure data folder and initial seed store
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const defaultAdmin: User = {
  id: 'usr_admin',
  name: 'Tanvir (Mentor)',
  email: 'admin@streakup.com',
  username: 'admin',
  role: 'admin',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
  bio: 'Lead Mentor & Coach',
  targetHoursPerDay: 10,
  createdAt: new Date().toISOString(),
};

const defaultStudents: User[] = [
  {
    id: 'usr_rahim',
    name: 'Rahim Ahmed',
    email: 'rahim@gmail.com',
    username: 'rahim',
    role: 'student',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200',
    bio: 'Medical Aspirant | Hard Worker',
    targetHoursPerDay: 9,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'usr_sumaiya',
    name: 'Sumaiya Islam',
    email: 'sumaiya@gmail.com',
    username: 'sumaiya',
    role: 'student',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
    bio: 'BUET Target | Daily Grinder',
    targetHoursPerDay: 8,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'usr_tanim',
    name: 'Tanim Chowdhury',
    email: 'tanim@gmail.com',
    username: 'tanim',
    role: 'student',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    bio: 'Dhaka University Science Target',
    targetHoursPerDay: 8,
    createdAt: new Date().toISOString(),
  }
];

const initialStore: StoreData = {
  configured: false,
  dbHost: 'sql305.infinityfree.com',
  dbName: 'if0_42480076_streakup',
  dbUser: '',
  users: [defaultAdmin, ...defaultStudents],
  logs: [
    {
      id: 'log_1',
      userId: 'usr_rahim',
      userName: 'Rahim Ahmed',
      cycleDate: getStudyCycleDate(new Date(Date.now() - 86400000 * 2)), // 2 days ago
      studyMinutes: 480, // 8h
      studyHoursFormatted: '8h 0m',
      privateMessage: 'Sir today physics vectors and chemistry organic completed.',
      loggedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      streakCountAtLog: 1,
      meetsStreakCriteria: true,
    },
    {
      id: 'log_2',
      userId: 'usr_rahim',
      userName: 'Rahim Ahmed',
      cycleDate: getStudyCycleDate(new Date(Date.now() - 86400000)), // yesterday
      studyMinutes: 540, // 9h (+60m -> streak +1)
      studyHoursFormatted: '9h 0m',
      privateMessage: 'Sir solve 200 math problems!',
      loggedAt: new Date(Date.now() - 86400000).toISOString(),
      streakCountAtLog: 2,
      meetsStreakCriteria: true,
    },
    {
      id: 'log_3',
      userId: 'usr_sumaiya',
      userName: 'Sumaiya Islam',
      cycleDate: getStudyCycleDate(new Date(Date.now() - 86400000)), // yesterday
      studyMinutes: 600, // 10h (>= 9h -> streak +1)
      studyHoursFormatted: '10h 0m',
      privateMessage: 'Sir revision completed for biology chapter 4.',
      loggedAt: new Date(Date.now() - 86400000).toISOString(),
      streakCountAtLog: 1,
      meetsStreakCriteria: true,
    }
  ],
  mentorFeedbacks: [
    {
      id: 'fb_1',
      userId: 'usr_rahim',
      adminId: 'usr_admin',
      adminName: 'Tanvir (Mentor)',
      content: 'Excellent progress Rahim! Keep target at 9+ hours daily for medical question bank.',
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'fb_2',
      userId: 'usr_sumaiya',
      adminId: 'usr_admin',
      adminName: 'Tanvir (Mentor)',
      content: 'Superb 10 hours session! Keep up the incredible consistency!',
      updatedAt: new Date().toISOString(),
    }
  ],
  notice: {
    id: 'notice_1',
    content: '📢 Welcome Students! 5:00 AM cycle update: Log study hours before 5 AM daily to keep your streak alive! Target 9+ hours for instant streak level-up!',
    active: true,
    updatedAt: new Date().toISOString(),
    updatedBy: 'Admin Mentor',
  },
  threads: [
    {
      id: 'th_1',
      userId: 'usr_rahim',
      userName: 'Rahim Ahmed',
      userAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200',
      userRole: 'student',
      title: 'How do you stay focused during night sessions?',
      content: 'Hello everyone! I study from 10 PM to 4 AM. Sometimes I feel sleepy around 2 AM. Any tips from fellow group members?',
      likesCount: 3,
      likedBy: ['usr_sumaiya', 'usr_admin', 'usr_tanim'],
      comments: [
        {
          id: 'cm_1',
          threadId: 'th_1',
          userId: 'usr_sumaiya',
          userName: 'Sumaiya Islam',
          userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
          userRole: 'student',
          content: 'Try 45-min Pomodoro + 5 min walking! Also drink cold water.',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'cm_2',
          threadId: 'th_1',
          userId: 'usr_admin',
          userName: 'Tanvir (Mentor)',
          userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
          userRole: 'admin',
          content: 'Good question Rahim. Ensure 6-7 hours sleep during daytime or early morning. Never sacrifice core sleep!',
          createdAt: new Date().toISOString(),
        }
      ],
      createdAt: new Date().toISOString(),
    }
  ]
};

function readStore(): StoreData {
  try {
    if (!fs.existsSync(STORE_FILE)) {
      fs.writeFileSync(STORE_FILE, JSON.stringify(initialStore, null, 2));
      return initialStore;
    }
    const data = fs.readFileSync(STORE_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading store file:', err);
    return initialStore;
  }
}

function writeStore(data: StoreData) {
  try {
    fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error writing store file:', err);
  }
}

// API Routes

// System status & auto setup
app.get('/api/status', (req: Request, res: Response) => {
  const store = readStore();
  res.json({
    configured: store.configured,
    dbHost: store.dbHost,
    dbName: store.dbName,
    dbUser: store.dbUser,
    totalUsers: store.users.length,
    totalLogs: store.logs.length,
  });
});

app.post('/api/setup', (req: Request, res: Response) => {
  const { dbHost, dbName, dbUser, adminName, adminEmail, adminPassword } = req.body;
  const store = readStore();
  store.configured = true;
  if (dbHost) store.dbHost = dbHost;
  if (dbName) store.dbName = dbName;
  if (dbUser) store.dbUser = dbUser;

  let createdAdminUser: User | null = null;

  if (adminEmail && adminName) {
    const cleanEmail = adminEmail.trim().toLowerCase();
    const existingAdminIdx = store.users.findIndex(u => u.email.toLowerCase() === cleanEmail || u.role === 'admin');

    if (existingAdminIdx !== -1) {
      store.users[existingAdminIdx].name = adminName.trim();
      store.users[existingAdminIdx].email = cleanEmail;
      store.users[existingAdminIdx].role = 'admin';
      createdAdminUser = store.users[existingAdminIdx];
    } else {
      createdAdminUser = {
        id: `usr_admin_${Date.now()}`,
        name: adminName.trim(),
        email: cleanEmail,
        role: 'admin',
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(adminName)}`,
        bio: 'Lead Mentor & Coach',
        targetHoursPerDay: 10,
        createdAt: new Date().toISOString(),
      };
      store.users.unshift(createdAdminUser);
    }
  }

  writeStore(store);
  res.json({
    success: true,
    message: 'Database & Admin account configured successfully!',
    user: createdAdminUser,
  });
});

// Authentication
app.post('/api/auth/register', (req: Request, res: Response) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const store = readStore();
  const existing = store.users.find(u => (u.email && u.email.toLowerCase() === cleanEmail) || (u.username && u.username.toLowerCase() === cleanEmail));
  if (existing) {
    return res.status(400).json({ error: 'An account with this email already exists. Please log in.' });
  }

  const isFirstAdmin = cleanEmail.includes('admin@streakup') || cleanEmail.includes('admin@');
  const newUser: User = {
    id: `usr_${Date.now()}`,
    name: name.trim(),
    email: cleanEmail,
    role: isFirstAdmin ? 'admin' : 'student',
    avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`,
    bio: 'Dedicated student aiming high!',
    targetHoursPerDay: 8,
    createdAt: new Date().toISOString(),
  };

  store.users.push(newUser);
  writeStore(store);

  res.json({ success: true, user: newUser });
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password, username } = req.body;
  const loginKey = (email || username || '').trim().toLowerCase();
  if (!loginKey) {
    return res.status(400).json({ error: 'Email required' });
  }

  const store = readStore();
  const user = store.users.find(u => 
    (u.email && u.email.toLowerCase() === loginKey) || 
    (u.username && u.username.toLowerCase() === loginKey)
  );

  if (!user) {
    return res.status(404).json({ error: 'Account not found. Please register first.' });
  }

  res.json({ success: true, user });
});

// Profile Update
app.put('/api/user/profile', (req: Request, res: Response) => {
  const { userId, name, bio, targetHoursPerDay, avatar } = req.body;
  if (!userId) {
    return res.status(400).json({ error: 'User ID required' });
  }

  const store = readStore();
  const user = store.users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (name) user.name = name.trim();
  if (bio !== undefined) user.bio = bio.trim();
  if (targetHoursPerDay) user.targetHoursPerDay = Number(targetHoursPerDay);
  if (avatar) user.avatar = avatar;

  // Also update name in existing study logs
  store.logs.forEach(l => {
    if (l.userId === userId) {
      l.userName = user.name;
    }
  });

  writeStore(store);
  res.json({ success: true, user });
});

// Daily Study Log Entry
app.post('/api/logs', (req: Request, res: Response) => {
  const { userId, hours, minutes, privateMessage } = req.body;
  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  const totalMinutes = Number(hours || 0) * 60 + Number(minutes || 0);
  if (totalMinutes <= 0) {
    return res.status(400).json({ error: 'Please enter a valid study time greater than 0 minutes.' });
  }

  const store = readStore();
  const user = store.users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const currentCycleDate = getStudyCycleDate();

  // Find user's existing logs
  const userLogs = store.logs.filter(l => l.userId === userId);
  const existingTodayLogIndex = userLogs.findIndex(l => l.cycleDate === currentCycleDate);

  let newLog: StudyLog;

  if (existingTodayLogIndex !== -1) {
    // Update today's existing log
    const existingLogId = userLogs[existingTodayLogIndex].id;
    const storeLogIndex = store.logs.findIndex(l => l.id === existingLogId);

    newLog = {
      ...store.logs[storeLogIndex],
      studyMinutes: totalMinutes,
      studyHoursFormatted: formatMinutesToHM(totalMinutes),
      privateMessage: privateMessage || store.logs[storeLogIndex].privateMessage,
      loggedAt: new Date().toISOString(),
    };

    store.logs[storeLogIndex] = newLog;
  } else {
    // Create new log entry
    newLog = {
      id: `log_${Date.now()}`,
      userId,
      userName: user.name,
      cycleDate: currentCycleDate,
      studyMinutes: totalMinutes,
      studyHoursFormatted: formatMinutesToHM(totalMinutes),
      privateMessage: privateMessage || '',
      loggedAt: new Date().toISOString(),
      streakCountAtLog: 0,
      meetsStreakCriteria: false,
    };

    store.logs.push(newLog);
  }

  // Recalculate streak after logging
  const updatedUserLogs = store.logs.filter(l => l.userId === userId);
  const streakResult = calculateUserStreakHistory(updatedUserLogs);

  writeStore(store);

  res.json({
    success: true,
    log: newLog,
    streakInfo: streakResult,
  });
});

// Fetch User Logs
app.get('/api/logs/:userId', (req: Request, res: Response) => {
  const { userId } = req.params;
  const store = readStore();
  const userLogs = store.logs.filter(l => l.userId === userId);
  const streakResult = calculateUserStreakHistory(userLogs);

  res.json({
    logs: userLogs.sort((a, b) => b.cycleDate.localeCompare(a.cycleDate)),
    streakInfo: streakResult,
  });
});

// Leaderboard with Admin Feedback
app.get('/api/leaderboard', (req: Request, res: Response) => {
  const store = readStore();
  const todayCycle = getStudyCycleDate();

  const students = store.users.filter(u => u.role === 'student');

  const leaderboard: UserStreakInfo[] = students.map(student => {
    const userLogs = store.logs.filter(l => l.userId === student.id);
    const { currentStreak, longestStreak, totalStudyMinutes } = calculateUserStreakHistory(userLogs);

    // Calculate last 7 days study minutes
    const last7DaysLogs = userLogs.filter(l => getDaysDifference(l.cycleDate, todayCycle) < 7);
    const lastWeekStudyMinutes = last7DaysLogs.reduce((acc, l) => acc + l.studyMinutes, 0);

    const todayLog = userLogs.find(l => l.cycleDate === todayCycle);
    const lastLog = [...userLogs].sort((a, b) => b.cycleDate.localeCompare(a.cycleDate))[0];

    const feedbackObj = store.mentorFeedbacks.find(f => f.userId === student.id);

    // Collect private messages sent by student
    const privateMessages = userLogs
      .filter(l => l.privateMessage && l.privateMessage.trim().length > 0)
      .sort((a, b) => b.cycleDate.localeCompare(a.cycleDate))
      .map(l => ({ date: l.cycleDate, message: l.privateMessage! }));

    return {
      userId: student.id,
      userName: student.name,
      userAvatar: student.avatar,
      currentStreak,
      longestStreak,
      totalStudyMinutes,
      lastWeekStudyMinutes,
      lastCycleDate: lastLog ? lastLog.cycleDate : undefined,
      lastStudyMinutes: lastLog ? lastLog.studyMinutes : undefined,
      todayLog,
      mentorFeedback: feedbackObj ? feedbackObj.content : undefined,
      privateMessages,
    };
  });

  // Sort by current active streak descending, then total study minutes descending
  leaderboard.sort((a, b) => {
    if (b.currentStreak !== a.currentStreak) {
      return b.currentStreak - a.currentStreak;
    }
    return b.totalStudyMinutes - a.totalStudyMinutes;
  });

  // Assign ranks
  leaderboard.forEach((item, index) => {
    item.rank = index + 1;
  });

  res.json({ leaderboard, todayCycle });
});

// Admin feedback update
app.post('/api/admin/feedback', (req: Request, res: Response) => {
  const { studentId, adminId, content } = req.body;
  if (!studentId || !content) {
    return res.status(400).json({ error: 'Student ID and content required' });
  }

  const store = readStore();
  const admin = store.users.find(u => u.id === adminId || u.role === 'admin');
  const adminName = admin ? admin.name : 'Mentor';

  const existingIdx = store.mentorFeedbacks.findIndex(f => f.userId === studentId);
  if (existingIdx !== -1) {
    store.mentorFeedbacks[existingIdx] = {
      ...store.mentorFeedbacks[existingIdx],
      content: content.trim(),
      updatedAt: new Date().toISOString(),
    };
  } else {
    store.mentorFeedbacks.push({
      id: `fb_${Date.now()}`,
      userId: studentId,
      adminId: admin ? admin.id : 'usr_admin',
      adminName,
      content: content.trim(),
      updatedAt: new Date().toISOString(),
    });
  }

  writeStore(store);
  res.json({ success: true, feedback: store.mentorFeedbacks.find(f => f.userId === studentId) });
});

// Admin View Student Private Messages
app.get('/api/admin/messages', (req: Request, res: Response) => {
  const store = readStore();
  const messagesWithLogs = store.logs
    .filter(l => l.privateMessage && l.privateMessage.trim().length > 0)
    .sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime());

  res.json({ messages: messagesWithLogs });
});

// Site Notice Banner
app.get('/api/notice', (req: Request, res: Response) => {
  const store = readStore();
  res.json({ notice: store.notice });
});

app.post('/api/notice', (req: Request, res: Response) => {
  const { content, active, updatedBy } = req.body;
  const store = readStore();

  store.notice = {
    id: `notice_${Date.now()}`,
    content: content || store.notice.content,
    active: active !== undefined ? Boolean(active) : true,
    updatedAt: new Date().toISOString(),
    updatedBy: updatedBy || 'Admin Mentor',
  };

  writeStore(store);
  res.json({ success: true, notice: store.notice });
});

// Peer Feedback Threads & Comments
app.get('/api/threads', (req: Request, res: Response) => {
  const store = readStore();
  res.json({ threads: store.threads.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) });
});

app.post('/api/threads', (req: Request, res: Response) => {
  const { userId, title, content } = req.body;
  if (!userId || !content) {
    return res.status(400).json({ error: 'User ID and content required' });
  }

  const store = readStore();
  const user = store.users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const newThread: ThreadPost = {
    id: `th_${Date.now()}`,
    userId: user.id,
    userName: user.name,
    userAvatar: user.avatar,
    userRole: user.role,
    title: title ? title.trim() : '',
    content: content.trim(),
    likesCount: 0,
    likedBy: [],
    comments: [],
    createdAt: new Date().toISOString(),
  };

  store.threads.push(newThread);
  writeStore(store);

  res.json({ success: true, thread: newThread });
});

app.post('/api/threads/:id/like', (req: Request, res: Response) => {
  const { id } = req.params;
  const { userId } = req.body;

  const store = readStore();
  const thread = store.threads.find(t => t.id === id);
  if (!thread) {
    return res.status(404).json({ error: 'Thread not found' });
  }

  const likedIdx = thread.likedBy.indexOf(userId);
  if (likedIdx !== -1) {
    thread.likedBy.splice(likedIdx, 1);
    thread.likesCount = Math.max(0, thread.likesCount - 1);
  } else {
    thread.likedBy.push(userId);
    thread.likesCount += 1;
  }

  writeStore(store);
  res.json({ success: true, likesCount: thread.likesCount, likedBy: thread.likedBy });
});

app.post('/api/threads/:id/comment', (req: Request, res: Response) => {
  const { id } = req.params;
  const { userId, content } = req.body;

  if (!userId || !content) {
    return res.status(400).json({ error: 'User ID and comment content required' });
  }

  const store = readStore();
  const thread = store.threads.find(t => t.id === id);
  const user = store.users.find(u => u.id === userId);

  if (!thread || !user) {
    return res.status(404).json({ error: 'Thread or User not found' });
  }

  const newComment: ThreadComment = {
    id: `cm_${Date.now()}`,
    threadId: id,
    userId: user.id,
    userName: user.name,
    userAvatar: user.avatar,
    userRole: user.role,
    content: content.trim(),
    createdAt: new Date().toISOString(),
  };

  thread.comments.push(newComment);
  writeStore(store);

  res.json({ success: true, comment: newComment });
});

// Production static file serving
const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, 'dist');
  app.use(express.static(distPath));
  app.get('*', (req: Request, res: Response) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

export { app };

if (process.env.SERVE === 'true' || (process.argv[1] && process.argv[1].endsWith('server.ts'))) {
  app.listen(PORT, () => {
    console.log(`StudyStreak Mentorship Server listening on port ${PORT}`);
  });
}
