
import React from 'react';
import { Topic } from '../types';
import { Trash2, RotateCcw, X, Clock, AlertTriangle } from 'lucide-react';

interface TrashPanelProps {
  isOpen: boolean;
  onClose: () => void;
  deletedTopics: Topic[];
  onRestore: (id: string) => void;
  onDeleteForever: (id: string) => void;
}

const TrashPanel: React.FC<TrashPanelProps> = ({ isOpen, onClose, deletedTopics, onRestore, onDeleteForever }) => {
  if (!isOpen) return null;

  const calculateDaysLeft = (deletedAt?: number) => {
    if (!deletedAt) return 30;
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    const expirationDate = deletedAt + thirtyDaysMs;
    const timeLeft = expirationDate - Date.now();
    return Math.ceil(timeLeft / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[85vh]">
        <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-red-50">
          <div className="flex items-center gap-2">
            <div className="bg-red-100 p-2 rounded-full">
                <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <div>
                <h2 className="text-xl font-bold text-gray-800">Çöp Kutusu</h2>
                <p className="text-xs text-red-500">Öğeler 30 gün sonra otomatik silinir.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto bg-gray-50">
          {deletedTopics.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <Trash2 className="w-16 h-16 mb-4 opacity-20" />
                <p>Çöp kutusu boş.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {deletedTopics.map((topic) => {
                const daysLeft = calculateDaysLeft(topic.deletedAt);
                return (
                    <div key={topic.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row justify-between gap-4">
                        <div className="flex-1">
                            <h3 className="font-bold text-gray-800">{topic.title}</h3>
                            <p className="text-sm text-gray-500 line-clamp-1">{topic.description}</p>
                            <div className="flex items-center gap-1 mt-2 text-xs text-orange-600 bg-orange-50 w-fit px-2 py-1 rounded">
                                <Clock className="w-3 h-3" />
                                {daysLeft} gün sonra silinecek
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => onRestore(topic.id)}
                                className="flex items-center gap-1 px-3 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors text-sm font-medium"
                            >
                                <RotateCcw className="w-4 h-4" />
                                Geri Yükle
                            </button>
                            <button
                                onClick={() => {
                                    if(window.confirm("Bu konuyu kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz.")) {
                                        onDeleteForever(topic.id);
                                    }
                                }}
                                className="flex items-center gap-1 px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                            >
                                <X className="w-4 h-4" />
                                Kalıcı Sil
                            </button>
                        </div>
                    </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrashPanel;
