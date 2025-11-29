import { TagType, Task } from './types';

// --- Date Helpers ---

export const getStartOfDay = (date: Date | number = new Date()): number => {
  const d = new Date(date);
  if (isNaN(d.getTime())) return new Date().setHours(0,0,0,0); // Safety fallback
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

export const addDays = (timestamp: number, days: number): number => {
  const d = new Date(timestamp);
  d.setDate(d.getDate() + days);
  return d.getTime();
};

export const formatDate = (timestamp: number, todayTimestamp?: number): string => {
  if (!timestamp || isNaN(timestamp)) return 'Błąd daty';
  
  const today = todayTimestamp || getStartOfDay();
  const tomorrow = addDays(today, 1);
  const dayAfter = addDays(today, 2);

  // Safety check for invalid dates
  const d = new Date(timestamp);
  if (isNaN(d.getTime())) return 'Nieznana data';

  if (timestamp === today) return 'Dzisiaj';
  if (timestamp === tomorrow) return 'Jutro';
  if (timestamp === dayAfter) return 'Pojutrze';

  return d.toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'short' });
};

// --- SRS Logic ---

export const calculateTimeSplit = (minutes: number, tag: TagType) => {
  if (tag === TagType.Grammar) {
    const fluency = Math.round(minutes * 0.3);
    const main = minutes - fluency;
    return { main, fluency, hasSplit: true };
  }
  return { main: minutes, fluency: 0, hasSplit: false };
};

// Returns the interval (in days) to add based on the COMPLETED stage
// Goal Pattern (cumulative from Day 0): 1, 2, 7, 14, 25
export const getIntervalForStage = (stage: number): number | null => {
  switch (stage) {
    case 0: return 1; 
    case 1: return 1;
    case 2: return 5;
    case 3: return 7;
    case 4: return 11;
    default: return null;
  }
};

export const getNextDueDate = (currentStage: number, lastCompletedDate: number): number | null => {
  const interval = getIntervalForStage(currentStage);
  if (interval === null) return null;
  
  // Ensure we work with start of day to avoid time drift
  const now = getStartOfDay(lastCompletedDate);
  return addDays(now, interval);
};

// Calculates future projected dates for the calendar
// Returns an array of objects: { date: number, stage: number, type: 'actual' | 'projected' }
export const getProjectedDates = (task: Task) => {
  const projections: { date: number; stage: number; type: 'actual' | 'projected' }[] = [];
  
  if (task.isArchived || !task.nextDueDate) return projections;

  // 1. Current actual due date
  let currentBaseDate = task.nextDueDate;
  let currentStage = task.stage;

  projections.push({
    date: currentBaseDate,
    stage: currentStage,
    type: 'actual'
  });

  // 2. Project future dates assuming perfect adherence
  // Added loop safety limit
  let safetyCounter = 0;
  while (currentStage < 5 && safetyCounter < 10) {
    safetyCounter++;
    const nextInterval = getIntervalForStage(currentStage);
    if (nextInterval === null) break;

    // Simulate completion on the due date
    currentBaseDate = addDays(currentBaseDate, nextInterval);
    currentStage++;

    projections.push({
      date: currentBaseDate,
      stage: currentStage,
      type: 'projected'
    });
  }

  return projections;
};

// --- Cookie Persistence ---

export const saveToCookie = (key: string, data: any) => {
  try {
    const json = JSON.stringify(data);
    const encoded = encodeURIComponent(json);
    document.cookie = `${key}=${encoded}; path=/; max-age=31536000; SameSite=Strict`;
  } catch (e) {
    console.error("Cookie save failed", e);
  }
};

export const loadFromCookie = (key: string): any | null => {
  try {
    const nameEQ = key + "=";
    const ca = document.cookie.split(';');
    for(let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) {
        return JSON.parse(decodeURIComponent(c.substring(nameEQ.length, c.length)));
      }
    }
  } catch (e) {
    console.error("Cookie load failed", e);
  }
  return null;
};

// --- Notifications ---

export const requestNotificationPermission = async () => {
  if (!("Notification" in window)) {
    alert("Twoja przeglądarka nie obsługuje powiadomień.");
    return false;
  }
  
  const permission = await Notification.requestPermission();
  return permission === 'granted';
};

export const sendNotification = (title: string, body: string) => {
  if (Notification.permission === 'granted') {
    new Notification(title, {
      body: body,
      icon: 'https://cdn-icons-png.flaticon.com/512/2996/2996918.png'
    });
  }
};

export const getDailyStats = (tasks: Task[], todayTimestamp: number) => {
  // Filter for tasks strictly today or overdue based on the provided reference date
  const todoTasks = tasks.filter(t => !t.isArchived && t.nextDueDate <= todayTimestamp);
  
  let totalMinutes = 0;
  todoTasks.forEach(t => totalMinutes += t.originalDuration);
  
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  
  const timeString = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  
  return {
    count: todoTasks.length,
    timeString: timeString,
    hasTasks: todoTasks.length > 0
  };
};