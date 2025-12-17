
import { Topic, NotificationSettings, PomodoroSession } from '../types';

const TOPICS_KEY = 'hafiza_asistani_topics';
const SETTINGS_KEY = 'hafiza_asistani_settings';
const POMODORO_KEY = 'hafiza_asistani_pomodoro';

export const getTopics = (): Topic[] => {
  try {
    const stored = localStorage.getItem(TOPICS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error("Failed to load topics", e);
    return [];
  }
};

export const saveTopics = (topics: Topic[]) => {
  localStorage.setItem(TOPICS_KEY, JSON.stringify(topics));
};

// Cleanup trash items older than 30 days
export const cleanupExpiredTrash = (topics: Topic[]): Topic[] => {
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    
    const filteredTopics = topics.filter(topic => {
        if (topic.deletedAt) {
            const timeInTrash = now - topic.deletedAt;
            // If time in trash is greater than 30 days, filter it out (permanent delete)
            return timeInTrash < thirtyDaysMs;
        }
        return true;
    });

    if (filteredTopics.length !== topics.length) {
        saveTopics(filteredTopics);
    }

    return filteredTopics;
};

export const getSettings = (): NotificationSettings => {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    // Merge with defaults.
    const defaults: NotificationSettings = { 
      customSound: null,
      pomodoroDuration: 25, // Default 25 minutes
      breakDuration: 5 // Default 5 minutes
    };
    const parsed = stored ? JSON.parse(stored) : {};
    return { ...defaults, ...parsed };
  } catch (e) {
    return { customSound: null, pomodoroDuration: 25, breakDuration: 5 };
  }
};

export const saveSettings = (settings: NotificationSettings) => {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error("Failed to save settings (likely quota exceeded)", e);
    alert("Ayarlar kaydedilemedi. Ses dosyası çok büyük olabilir.");
  }
};

export const getPomodoroSessions = (): PomodoroSession[] => {
  try {
    const stored = localStorage.getItem(POMODORO_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    return [];
  }
};

export const savePomodoroSessions = (sessions: PomodoroSession[]) => {
  localStorage.setItem(POMODORO_KEY, JSON.stringify(sessions));
};
