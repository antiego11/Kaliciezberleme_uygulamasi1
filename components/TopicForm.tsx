import React, { useState } from 'react';
import { X, Plus, Calendar, Clock } from 'lucide-react';

interface TopicFormProps {
  onAdd: (title: string, description: string, startHour: number, startMinute: number, endHour: number, endMinute: number, frequencyHours: number) => void;
  onClose: () => void;
}

const TopicForm: React.FC<TopicFormProps> = ({ onAdd, onClose }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  
  // Time inputs as strings "HH:MM"
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('23:00');
  const [frequencyHours, setFrequencyHours] = useState(2);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      const [sHour, sMinute] = startTime.split(':').map(Number);
      const [eHour, eMinute] = endTime.split(':').map(Number);

      onAdd(title, description, sHour, sMinute, eHour, eMinute, frequencyHours);
      onClose();
    }
  };

  // Helper to calculate estimated repetitions
  const calculateRepetitions = () => {
    const [sHour, sMinute] = startTime.split(':').map(Number);
    const [eHour, eMinute] = endTime.split(':').map(Number);
    
    const startTotal = sHour * 60 + sMinute;
    const endTotal = eHour * 60 + eMinute;
    const freqMinutes = frequencyHours * 60;
    
    if (endTotal <= startTotal) return 0;
    
    return Math.floor((endTotal - startTotal) / freqMinutes);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-40 p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Plus className="w-6 h-6 text-indigo-600" />
            Yeni Konu Ekle
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Konu Başlığı</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Örn: Blender 3D Rigging"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama / Notlar</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Öğrendiğin konunun detayları..."
              rows={3}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none"
            />
          </div>

          {/* Schedule Settings */}
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4">
            <div className="flex items-center gap-2 text-indigo-700 mb-2">
                <Clock className="w-5 h-5" />
                <span className="font-bold text-sm">Günlük Hatırlatma Ayarları</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Başlangıç Saati</label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Bitiş Saati</label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-mono"
                  />
                </div>
            </div>

            <div>
                 <label className="block text-xs font-medium text-gray-600 mb-1">Hatırlatma Sıklığı</label>
                 <select
                    value={frequencyHours}
                    onChange={(e) => setFrequencyHours(parseInt(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  >
                      <option value={1}>Her 1 saatte bir</option>
                      <option value={2}>Her 2 saatte bir</option>
                      <option value={3}>Her 3 saatte bir</option>
                      <option value={4}>Her 4 saatte bir</option>
                      <option value={6}>Her 6 saatte bir</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Bu ayara göre günde yaklaşık <span className="font-bold">{calculateRepetitions()}</span> kez tekrar hatırlatması yapılacak.
                  </p>
            </div>
          </div>

          <div className="bg-indigo-50 p-4 rounded-lg flex gap-3 text-xs text-indigo-700">
            <Calendar className="w-4 h-4 flex-shrink-0" />
            <p>
              Uzun vadeli program: 1 gün, 3 gün, 7 gün, 15 gün, 1 ay, 2 ay, 6 ay ve 1 yıl.
            </p>
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95 mt-2 flex-shrink-0"
          >
            Hatırlatıcıyı Başlat
          </button>
        </form>
      </div>
    </div>
  );
};

export default TopicForm;