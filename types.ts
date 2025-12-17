
export interface Topic {
  id: string;
  title: string;
  description: string;
  createdAt: number; // Timestamp
  nextReviewDate: number | null; // Timestamp of the next due date
  completedReviews: number[]; // Array of timestamps when reviews were completed
  scheduleOffsets: number[]; // The day offsets for this topic (1, 3, 7, etc.)
  
  // New fields moved from global settings to per-topic
  startHour: number;
  startMinute: number; // Added for precise start time
  endHour: number;
  endMinute: number;   // Added for precise end time
  frequencyHours: number;
  
  // Log of repetitions for the current day
  dailyLogs: number[]; // Array of timestamps for manual "Repeated" clicks

  // Trash functionality
  deletedAt?: number; // Timestamp when the topic was moved to trash
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface NotificationSettings {
  // Only sound remains global
  customSound: string | null; // Base64 encoded audio data
  pomodoroDuration: number; // Duration in minutes (20-50)
  breakDuration: number; // Duration in minutes (5, 10, 15)
}

export interface PomodoroSession {
  id: number;
  type: 'work' | 'break';
  totalMinutes: number; // Kept for backward compatibility
  totalSeconds: number; // Added for precision (Planned + Overtime)
  timestamp: number;
}
