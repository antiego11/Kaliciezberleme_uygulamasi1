
import React, { useState, useRef, useEffect } from 'react';
import { X, Save, Upload, Play, Volume2, Trash2, Timer, Coffee } from 'lucide-react';
import { NotificationSettings } from '../types';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  settings: NotificationSettings;
  onSave: (newSettings: NotificationSettings) => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose, settings, onSave }) => {
  const [formData, setFormData] = useState<NotificationSettings>(settings);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Stop audio when panel closes
  useEffect(() => {
    if (!isOpen) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
      }
      setIsPlaying(false);
    } else {
        // Sync state when opening
        setFormData(settings);
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert("Dosya boyutu çok büyük! Lütfen 5MB'dan küçük bir dosya seçin.");
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setFormData(prev => ({ ...prev, customSound: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTestSound = () => {
    if (formData.customSound) {
      if (audioRef.current) {
        // Stop logic
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
        setIsPlaying(false);
      } else {
        // Play logic with 30s loop
        const audio = new Audio(formData.customSound);
        audio.loop = true; // Enable looping
        
        // Time update handler for 30s limit
        audio.ontimeupdate = () => {
            if (audio.currentTime >= 30) {
                audio.currentTime = 0;
                // It continues playing because loop is true
            }
        };

        audioRef.current = audio;
        audio.play().catch(e => alert("Ses çalınamadı."));
        setIsPlaying(true);
      }
    } else {
        // Default beep test
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
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
    }
  };

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  const handleClearSound = () => {
      setFormData(prev => ({ ...prev, customSound: null }));
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50 flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Volume2 className="w-6 h-6 text-indigo-600" />
            Ayarlar
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          
          {/* Pomodoro Settings */}
          <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 space-y-5">
             {/* Work Duration */}
             <div className="space-y-3">
                <div className="flex items-center gap-2 text-orange-800">
                    <Timer className="w-5 h-5" />
                    <h3 className="font-bold text-sm">Çalışma Süresi (Pomodoro)</h3>
                </div>
                <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-gray-700">Süre</label>
                    <span className="bg-white px-3 py-1 rounded border border-orange-200 font-mono font-bold text-orange-600">
                        {formData.pomodoroDuration || 25} dk
                    </span>
                </div>
                <input 
                    type="range" 
                    min="20" 
                    max="50" 
                    step="1"
                    value={formData.pomodoroDuration || 25}
                    onChange={(e) => setFormData(prev => ({ ...prev, pomodoroDuration: parseInt(e.target.value) }))}
                    className="w-full h-2 bg-orange-200 rounded-lg appearance-none cursor-pointer accent-orange-600"
                />
             </div>

             <div className="border-t border-orange-200/50"></div>

             {/* Break Duration */}
             <div className="space-y-3">
                <div className="flex items-center gap-2 text-orange-800">
                    <Coffee className="w-5 h-5" />
                    <h3 className="font-bold text-sm">Dinlenme Süresi</h3>
                </div>
                <div className="flex gap-2">
                    {[5, 10, 15].map(val => (
                        <button
                            key={val}
                            onClick={() => setFormData(prev => ({ ...prev, breakDuration: val }))}
                            className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-all ${
                                (formData.breakDuration || 5) === val
                                ? 'bg-orange-600 text-white border-orange-600 shadow-md'
                                : 'bg-white text-gray-600 border-gray-200 hover:bg-orange-50'
                            }`}
                        >
                            {val} dk
                        </button>
                    ))}
                </div>
             </div>
          </div>

          {/* Audio Upload Section */}
          <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
            <div className="flex items-center gap-2 mb-3 text-indigo-900">
                <Volume2 className="w-5 h-5" />
                <h3 className="font-bold text-sm">Alarm Sesi</h3>
            </div>
            <p className="text-xs text-indigo-600 mb-3">Kendi ses dosyanı yükle (Max 5MB)</p>
            
            <div className="flex items-center gap-2">
                <label className="flex-1 cursor-pointer bg-white border border-indigo-200 text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                    <Upload className="w-4 h-4" />
                    {formData.customSound ? "Sesi Değiştir" : "Dosya Seç"}
                    <input type="file" accept="audio/*" onChange={handleFileChange} className="hidden" />
                </label>
                {formData.customSound && (
                    <button 
                        onClick={handleClearSound}
                        className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                        title="Sesi Sil"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Test Button */}
            <div className="mt-4 pt-4 border-t border-indigo-200/60">
                <button
                    type="button"
                    onClick={handleTestSound}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                        isPlaying 
                        ? 'bg-amber-500 hover:bg-amber-600 text-white' 
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    }`}
                >
                    {isPlaying ? (
                        <>Durdur</>
                    ) : (
                        <>
                            <Play className="w-4 h-4 fill-current" />
                            {formData.customSound ? "Eklenen Sesi Test Et" : "Varsayılan Sesi Test Et"}
                        </>
                    )}
                </button>
            </div>
          </div>

          <button
            onClick={handleSave}
            className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            Kaydet ve Çık
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
