import React, { useEffect, useState, useRef } from 'react';
import { Topic, NotificationSettings } from '../types';
import { Bell, X } from 'lucide-react';

interface NotificationSystemProps {
  topics: Topic[];
  settings: NotificationSettings;
}

const NotificationSystem: React.FC<NotificationSystemProps> = ({ topics, settings }) => {
  const [activeAlert, setActiveAlert] = useState<{ topic: Topic, message: string } | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const alarmAudioRef = useRef<HTMLAudioElement | null>(null);

  // Stop alarm
  const stopAlarm = () => {
    if (alarmAudioRef.current) {
        alarmAudioRef.current.pause();
        alarmAudioRef.current.currentTime = 0;
        alarmAudioRef.current = null;
    }
  };

  // Play alarm sound
  const playAlarm = () => {
    stopAlarm();

    if (settings.customSound) {
        const audio = new Audio(settings.customSound);
        audio.loop = true;
        
        audio.ontimeupdate = () => {
            if (audio.currentTime >= 30) {
                audio.currentTime = 0;
            }
        };

        audio.play().catch(err => console.error("Custom audio play failed:", err));
        alarmAudioRef.current = audio;
        return;
    }

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, ctx.currentTime);
      gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.5);
    } catch (e) {
      console.error("Audio play failed", e);
    }
  };

  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const today = new Date().toDateString();

      // Filter topics due today
      const dueTopics = topics.filter(t => 
        t.nextReviewDate && new Date(t.nextReviewDate).toDateString() === today
      );

      for (const topic of dueTopics) {
          const startTotal = topic.startHour * 60 + (topic.startMinute || 0);
          const endTotal = topic.endHour * 60 + (topic.endMinute || 0);

          // Check Topic Specific Time Window
          if (currentMinutes < startTotal || currentMinutes > endTotal) {
              continue;
          }

          // Check Topic Specific Frequency
          // Logic: Calculate minutes elapsed since start time
          // If divisible by frequency minutes
          const minutesElapsed = currentMinutes - startTotal;
          const frequencyMinutes = topic.frequencyHours * 60;

          // Check if exactly on the interval cycle
          if (minutesElapsed >= 0 && (minutesElapsed % frequencyMinutes === 0) && !activeAlert) {
             setActiveAlert({
                topic,
                message: `Tekrarlanması gereken konu: ${topic.title} konusunu tekrar et.`
             });
             playAlarm();
             break; // Only show one alert at a time
          }
      }
    };

    // Run check every minute (60000ms)
    // Synchronize to the start of the next minute for better accuracy
    const now = new Date();
    const msUntilNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
    
    let intervalId: ReturnType<typeof setInterval>;
    
    const timeoutId = setTimeout(() => {
        checkReminders();
        intervalId = setInterval(checkReminders, 60000);
    }, msUntilNextMinute);

    return () => {
        clearTimeout(timeoutId);
        if (intervalId) clearInterval(intervalId);
        stopAlarm();
    };
  }, [topics, settings, activeAlert]);

  const handleDismiss = () => {
      stopAlarm();
      setActiveAlert(null);
  };

  if (!activeAlert) return null;

  return (
    <div className="fixed top-0 left-0 w-full z-[100] flex items-start justify-center pt-10 px-4 pointer-events-none">
      <div className="bg-red-600 text-white rounded-lg shadow-2xl p-6 max-w-lg pointer-events-auto animate-in slide-in-from-top-10 duration-500 flex flex-col gap-4 border-l-8 border-red-800">
        <div className="flex justify-between items-start gap-4">
            <div className="flex gap-3">
                <div className="bg-white/20 p-2 rounded-full h-fit">
                    <Bell className="w-6 h-6 animate-bounce" />
                </div>
                <div>
                    <h3 className="text-lg font-bold">Hatırlatma Zamanı!</h3>
                    <p className="mt-1 font-medium text-red-100">{activeAlert.message}</p>
                    <p className="text-xs text-red-200 mt-2 opacity-80">{activeAlert.topic.description}</p>
                </div>
            </div>
            <button 
                onClick={handleDismiss}
                className="text-red-200 hover:text-white"
            >
                <X className="w-5 h-5" />
            </button>
        </div>
        
        <div className="bg-red-700/50 rounded p-2 text-xs text-center">
             Bu konu için 
             {activeAlert.topic.startHour.toString().padStart(2,'0')}:{activeAlert.topic.startMinute?.toString().padStart(2,'0') || '00'} - 
             {activeAlert.topic.endHour.toString().padStart(2,'0')}:{activeAlert.topic.endMinute?.toString().padStart(2,'0') || '00'} 
             arasında her {activeAlert.topic.frequencyHours} saatte bir bildirim gönderilir.
        </div>
      </div>
    </div>
  );
};

export default NotificationSystem;