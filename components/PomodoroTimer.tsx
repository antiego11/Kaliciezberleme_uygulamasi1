
import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Pause, Timer, Coffee, ArrowRight, CheckCircle2 } from 'lucide-react';
import { PomodoroSession } from '../types';

interface PomodoroTimerProps {
  durationMinutes: number; // Work duration setting
  breakMinutes: number;    // Break duration setting
  onClose: () => void;
  customSound: string | null;
  onSessionComplete: (session: PomodoroSession) => void;
}

const PomodoroTimer: React.FC<PomodoroTimerProps> = ({ durationMinutes, breakMinutes, onClose, customSound, onSessionComplete }) => {
  const [mode, setMode] = useState<'work' | 'break'>('work');
  const [initialDuration, setInitialDuration] = useState(durationMinutes * 60);
  const [timeLeft, setTimeLeft] = useState(durationMinutes * 60);
  const [isActive, setIsActive] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize and Reset logic
  useEffect(() => {
    if (!isActive) {
       const dur = mode === 'work' ? durationMinutes * 60 : breakMinutes * 60;
       setTimeLeft(dur);
       setInitialDuration(dur);
    }
  }, [durationMinutes, breakMinutes, mode]);

  // Timer Tick
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (isActive) {
      interval = setInterval(() => {
        setTimeLeft((prevTime) => {
            const nextTime = prevTime - 1;
            // Exact moment it hits 0, play alarm
            if (nextTime === 0) {
                playAlarm();
            }
            return nextTime;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
        stopAlarm();
    };
  }, []);

  const stopAlarm = () => {
    if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
    }
  };

  const playAlarm = () => {
    stopAlarm();
    if (customSound) {
        const audio = new Audio(customSound);
        audio.play().catch(console.error);
        audioRef.current = audio;
    } else {
        // Fallback beep sequence
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        const now = ctx.currentTime;
        // Alarm sound
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(440, now);
        oscillator.frequency.setValueAtTime(880, now + 0.2);
        oscillator.frequency.setValueAtTime(440, now + 0.4);
        oscillator.frequency.setValueAtTime(880, now + 0.6);

        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.linearRampToValueAtTime(0, now + 1.0);
        
        oscillator.start(now);
        oscillator.stop(now + 1.0);
    }
  };

  const handleNextPhase = () => {
      // Calculate duration to log
      let totalSecondsSpent = 0;
      
      if (timeLeft < 0) {
          // Overtime Logic: Planned Duration + Absolute value of negative time
          // Example: Planned 25m (1500s), Overtime -10s. Total = 1510s.
          totalSecondsSpent = initialDuration + Math.abs(timeLeft);
      } else {
          // Finished early: Count as full planned duration
          totalSecondsSpent = initialDuration; 
      }
      
      const totalMinutes = Math.max(1, Math.round(totalSecondsSpent / 60));

      // Notify Parent (Add to history)
      onSessionComplete({
          id: Date.now(),
          type: mode,
          totalMinutes: totalMinutes, // Keep for legacy
          totalSeconds: totalSecondsSpent, // Precise time
          timestamp: Date.now()
      });

      stopAlarm();
      setIsActive(false); 

      // Switch Mode
      if (mode === 'work') {
          setMode('break');
      } else {
          setMode('work');
      }
  };

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  // Format time (handle negatives)
  const formatTime = (seconds: number) => {
    const isNegative = seconds < 0;
    const absSeconds = Math.abs(seconds);
    const mins = Math.floor(absSeconds / 60);
    const secs = absSeconds % 60;
    return `${isNegative ? '-' : ''}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate progress
  const percentage = timeLeft < 0 ? 100 : (timeLeft / initialDuration) * 100;
  const isOvertime = timeLeft < 0;

  // Conditions for showing buttons
  const isPaused = !isActive;
  const showNextButton = isPaused || isOvertime;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col items-center p-8 relative animate-in zoom-in duration-200">
        
             {/* Close Button (Top Right) */}
             <button 
                onClick={onClose} 
                className="absolute top-4 right-4 p-2 text-gray-400 hover:bg-gray-200 rounded-full transition-colors"
            >
                <X className="w-6 h-6" />
            </button>

            {/* Header Badge */}
            <div className={`flex items-center gap-2 mb-8 px-6 py-2 rounded-full font-bold tracking-wide shadow-sm transition-colors ${
                mode === 'work' 
                ? 'bg-orange-100 text-orange-700' 
                : 'bg-green-100 text-green-700'
            }`}>
                {mode === 'work' ? <Timer className="w-5 h-5" /> : <Coffee className="w-5 h-5" />}
                {mode === 'work' ? 'POMODORO' : 'DİNLENME'}
            </div>

            {/* Big Timer Circle */}
            <div className="relative w-64 h-64 flex items-center justify-center mb-8">
                <svg className="w-full h-full transform -rotate-90 drop-shadow-xl">
                    <circle
                        cx="50%" cy="50%" r="45%"
                        stroke="currentColor" strokeWidth="12"
                        fill="white"
                        className="text-gray-200"
                    />
                    <circle
                        cx="50%" cy="50%" r="45%"
                        stroke="currentColor" strokeWidth="12"
                        fill="transparent"
                        strokeDasharray="283%" 
                        strokeDashoffset={`${283 * (1 - percentage / 100)}%`}
                        className={`transition-all duration-1000 ease-linear ${
                            isOvertime 
                            ? 'text-red-500 animate-pulse' 
                            : (mode === 'work' ? 'text-orange-500' : 'text-green-500')
                        }`}
                        strokeLinecap="round"
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-6xl font-black font-mono tracking-tighter ${
                        isOvertime ? 'text-red-600' : 'text-gray-800'
                    }`}>
                        {formatTime(timeLeft)}
                    </span>
                    {isOvertime && <span className="text-red-500 font-bold text-sm mt-2 animate-bounce">AŞIM SÜRESİ</span>}
                </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4 w-full">
                <button
                    onClick={toggleTimer}
                    className={`flex-1 py-4 rounded-2xl flex items-center justify-center gap-2 font-bold text-lg shadow-lg transition-transform active:scale-95 ${
                        isActive 
                        ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' 
                        : (mode === 'work' 
                            ? 'bg-orange-600 text-white hover:bg-orange-700 shadow-orange-200'
                            : 'bg-green-600 text-white hover:bg-green-700 shadow-green-200')
                    }`}
                >
                    {isActive ? (
                        <>
                            <Pause className="w-6 h-6 fill-current" />
                            Duraklat
                        </>
                    ) : (
                        <>
                            <Play className="w-6 h-6 fill-current" />
                            {timeLeft < 0 ? "Devam Et" : "Başlat"}
                        </>
                    )}
                </button>
            </div>

            {/* Phase Switch Button */}
            {showNextButton ? (
                <button
                    onClick={handleNextPhase}
                    className={`mt-6 w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold text-white shadow-lg animate-in slide-in-from-bottom-2 ${
                        mode === 'work' ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-600 hover:bg-orange-700'
                    }`}
                >
                    {mode === 'work' ? (
                        <>
                            <CheckCircle2 className="w-5 h-5" />
                            Tamamla ve Dinlenmeye Geç
                            <ArrowRight className="w-5 h-5" />
                        </>
                    ) : (
                        <>
                            <CheckCircle2 className="w-5 h-5" />
                            Dinlenmeyi Bitir ve Çalış
                            <ArrowRight className="w-5 h-5" />
                        </>
                    )}
                </button>
            ) : null}

      </div>
    </div>
  );
};

export default PomodoroTimer;
