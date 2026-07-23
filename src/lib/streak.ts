import { StudyLog } from '../types';

/**
 * Returns the Study Cycle Date string (YYYY-MM-DD) based on the 5:00 AM to 4:59 AM rule.
 * 5:00 AM today to 4:59 AM tomorrow is considered 1 study day.
 */
export function getStudyCycleDate(dateInput: Date | string | number = new Date()): string {
  const date = new Date(dateInput);
  
  // If time is before 5:00 AM (00:00:00 to 04:59:59), it belongs to yesterday's 5 AM cycle
  if (date.getHours() < 5) {
    date.setDate(date.getDate() - 1);
  }
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Formats YYYY-MM-DD into a friendly Bengali/English label (e.g., "Jul 23, 2026 (5:00 AM - 4:59 AM)")
 */
export function formatCycleDateLabel(cycleDateStr: string): string {
  const [year, month, day] = cycleDateStr.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);
  
  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
  return dateObj.toLocaleDateString('en-US', options);
}

/**
 * Converts total minutes into "Xh Ym" string format
 */
export function formatMinutesToHM(minutes: number): string {
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs === 0) return `${mins}m`;
  if (mins === 0) return `${hrs}h`;
  return `${hrs}h ${mins}m`;
}

/**
 * Calculates day difference between two YYYY-MM-DD date strings
 */
export function getDaysDifference(dateStr1: string, dateStr2: string): number {
  const d1 = new Date(dateStr1 + 'T00:00:00Z');
  const d2 = new Date(dateStr2 + 'T00:00:00Z');
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Streak Criteria Evaluator:
 * - Return true if today's study minutes >= 9 hours (540 minutes)
 * - OR today's study minutes >= previous day's study minutes + 10 minutes
 */
export function evaluateStreakCriteria(todayMinutes: number, previousMinutes: number | undefined): boolean {
  // 9 hours or more = automatically passes (+1 streak)
  if (todayMinutes >= 540) {
    return true;
  }
  
  // If no previous day log or previous was 0, require at least 10 minutes
  if (previousMinutes === undefined || previousMinutes <= 0) {
    return todayMinutes >= 10;
  }
  
  // Must be at least 10 minutes MORE than previous day's study time
  return todayMinutes >= previousMinutes + 10;
}

/**
 * Re-calculates current streak & longest streak for a user from their full history of sorted logs.
 */
export function calculateUserStreakHistory(userLogs: StudyLog[]): {
  currentStreak: number;
  longestStreak: number;
  totalStudyMinutes: number;
} {
  if (!userLogs || userLogs.length === 0) {
    return { currentStreak: 0, longestStreak: 0, totalStudyMinutes: 0 };
  }

  // Sort logs by cycleDate ascending
  const sortedLogs = [...userLogs].sort((a, b) => a.cycleDate.localeCompare(b.cycleDate));
  
  let currentStreak = 0;
  let longestStreak = 0;
  let totalMinutes = 0;
  
  let prevCycleDate: string | null = null;
  let prevStudyMinutes: number | undefined = undefined;

  for (const log of sortedLogs) {
    totalMinutes += log.studyMinutes;

    if (!prevCycleDate) {
      // First ever log
      const meetsCriteria = evaluateStreakCriteria(log.studyMinutes, undefined);
      currentStreak = meetsCriteria ? 1 : 0;
    } else {
      const daysDiff = getDaysDifference(prevCycleDate, log.cycleDate);
      
      if (daysDiff === 1) {
        // Consecutive study cycle day
        const meetsCriteria = evaluateStreakCriteria(log.studyMinutes, prevStudyMinutes);
        if (meetsCriteria) {
          currentStreak += 1;
        } else {
          currentStreak = 0;
        }
      } else if (daysDiff > 1) {
        // Gap of 1 or more days -> Streak resets to 0!
        const meetsCriteria = evaluateStreakCriteria(log.studyMinutes, undefined);
        currentStreak = meetsCriteria ? 1 : 0;
      } else {
        // Same day edit/update: keep currentStreak evaluated with previous day
        const meetsCriteria = evaluateStreakCriteria(log.studyMinutes, prevStudyMinutes);
        if (!meetsCriteria) {
          currentStreak = 0;
        }
      }
    }

    if (currentStreak > longestStreak) {
      longestStreak = currentStreak;
    }

    prevCycleDate = log.cycleDate;
    prevStudyMinutes = log.studyMinutes;
  }

  // Check if today's cycle date or yesterday's cycle date was missed relative to now
  const todayCycle = getStudyCycleDate();
  if (prevCycleDate) {
    const gapFromToday = getDaysDifference(prevCycleDate, todayCycle);
    // If the user hasn't logged today AND missed yesterday, active streak becomes 0
    if (gapFromToday > 1) {
      currentStreak = 0;
    }
  }

  return {
    currentStreak,
    longestStreak,
    totalStudyMinutes: totalMinutes,
  };
}
