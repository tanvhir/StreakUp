export interface User {
  id: string;
  name: string;
  email: string;
  username?: string;
  role: 'student' | 'admin';
  avatar?: string;
  bio?: string;
  targetHoursPerDay?: number;
  createdAt: string;
}

export interface StudyLog {
  id: string;
  userId: string;
  userName: string;
  cycleDate: string; // YYYY-MM-DD (based on 5 AM to 5 AM cycle)
  studyMinutes: number; // Total study time in minutes
  studyHoursFormatted: string; // e.g. "8h 30m"
  privateMessage?: string; // Private message to admin/mentor
  loggedAt: string; // ISO timestamp
  streakCountAtLog: number;
  meetsStreakCriteria: boolean;
}

export interface MentorFeedback {
  id: string;
  userId: string; // Target student ID
  adminId: string;
  adminName: string;
  content: string; // Feedback text from mentor
  updatedAt: string;
}

export interface Notice {
  id: string;
  content: string;
  active: boolean;
  updatedAt: string;
  updatedBy: string;
}

export interface ThreadComment {
  id: string;
  threadId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  userRole: 'student' | 'admin';
  content: string;
  createdAt: string;
}

export interface ThreadPost {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  userRole: 'student' | 'admin';
  title?: string;
  content: string;
  likesCount: number;
  likedBy: string[]; // User IDs
  comments: ThreadComment[];
  createdAt: string;
}

export interface UserStreakInfo {
  userId: string;
  userName: string;
  userAvatar?: string;
  currentStreak: number;
  longestStreak: number;
  totalStudyMinutes: number;
  lastWeekStudyMinutes?: number;
  lastCycleDate?: string;
  lastStudyMinutes?: number;
  todayLog?: StudyLog;
  mentorFeedback?: string;
  privateMessages?: { date: string; message: string }[];
  rank?: number;
}

export interface DatabaseConfig {
  dbHost: string;
  dbName: string;
  dbUser: string;
  isConfigured: boolean;
}
