
import React, { useState } from 'react';
import { Topic } from '../types';
import { Clock, AlertCircle, CheckCircle, List, Trash2, X, Check } from 'lucide-react';

interface TopicListProps {
  topics: Topic[];
  onUpdateTopic: (updatedTopic: Topic) => void;
  onDeleteTopic: (id: string) => void;
}

const TopicList: React.FC<TopicListProps> = ({ topics, onUpdateTopic, onDeleteTopic }) => {
  const [topicToDelete, setTopicToDelete] = useState<Topic | null>(null);

  const handleDeleteClick = (topic: Topic) => {
    setTopicToDelete(topic);
  };

  const confirmDelete = () => {
    if (topicToDelete) {
        onDeleteTopic(topicToDelete.id);
        setTopicToDelete(null);
    }
  };

  const isTopicCompleted = (topic: Topic) => {
      const completedCount = topic.completedReviews?.length || 0;
      const totalCount = topic.scheduleOffsets?.length || 0;
      return completedCount >= totalCount;
  };

  if (topics.length === 0) {
    return (
      <div className="text-center py-20 px-4">
        <div className="bg-gray-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
          <Clock className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-xl font-bold text-gray-700 mb-2">Henüz konu eklenmedi</h3>
        <p className="text-gray-500 max-w-md mx-auto">
          "Yeni Konu Öğrendim" butonuna basarak ilk konunu ekle ve aralıklı tekrar sistemini başlat.
        </p>
      </div>
    );
  }

  // Sort by next review date (soonest first)
  const sortedTopics = [...topics].sort((a, b) => {
    if (!a.nextReviewDate) return 1;
    if (!b.nextReviewDate) return -1;
    return a.nextReviewDate - b.nextReviewDate;
  });

  const activeTopics = sortedTopics.filter(t => !isTopicCompleted(t));
  const completedTopics = sortedTopics.filter(t => isTopicCompleted(t));

  const renderTopicCard = (topic: Topic, isCompleted: boolean) => {
    const nextReview = topic.nextReviewDate ? new Date(topic.nextReviewDate) : null;
    const isToday = nextReview && new Date().toDateString() === new Date().toDateString();
    const completedCount = topic.completedReviews?.length || 0;
    const totalCount = topic.scheduleOffsets?.length || 0;

    // Calculate slots based on minutes
    const startTotal = topic.startHour * 60 + (topic.startMinute || 0);
    const endTotal = topic.endHour * 60 + (topic.endMinute || 0);
    const durationMinutes = Math.max(0, endTotal - startTotal);
    const freqMinutes = topic.frequencyHours * 60;
    
    const maxSlots = freqMinutes > 0 ? Math.floor(durationMinutes / freqMinutes) : 0;
    
    // Get today's logs
    const todayLogs = (topic.dailyLogs || []).filter(timestamp => {
        return new Date(timestamp).toDateString() === new Date().toDateString();
    }).sort();

    const startStr = `${topic.startHour.toString().padStart(2, '0')}:${(topic.startMinute || 0).toString().padStart(2, '0')}`;
    const endStr = `${topic.endHour.toString().padStart(2, '0')}:${(topic.endMinute || 0).toString().padStart(2, '0')}`;

    return (
        <div 
            key={topic.id} 
            className={`relative bg-white rounded-xl shadow-sm border p-5 transition-all hover:shadow-md flex flex-col overflow-hidden ${
            isToday && !isCompleted ? 'border-amber-400 ring-1 ring-amber-400' : 'border-gray-200'
            } ${isCompleted ? 'bg-gray-50' : ''}`}
        >
            {/* Watermark for Completed Topics */}
            {isCompleted && (
                <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none select-none p-6">
                    <Check className="w-full h-full text-green-500 opacity-50" strokeWidth={1} />
                </div>
            )}

            <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-lg text-gray-800 line-clamp-2">{topic.title}</h3>
                    {isToday && !isCompleted && <AlertCircle className="text-amber-500 w-5 h-5 flex-shrink-0 animate-pulse" />}
                    {isCompleted && <CheckCircle className="text-green-600 w-6 h-6 flex-shrink-0" />}
                </div>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-3 h-10 flex-1">
                {topic.description || "Açıklama yok."}
                </p>

                <div className="space-y-3 text-sm flex-1">
                    {/* Overall Progress */}
                    <div className="flex items-center gap-1.5">
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-green-500 rounded-full" 
                            style={{ width: `${(completedCount / (totalCount || 1)) * 100}%` }}
                        />
                        </div>
                        <span className="text-xs text-gray-400 whitespace-nowrap">
                        {completedCount} / {totalCount} Gün
                        </span>
                    </div>

                    <div className="flex justify-between items-center bg-gray-50 p-2 rounded-lg mt-2">
                        <span className="text-indigo-600 font-medium">Sonraki:</span>
                        <span className={`font-bold ${isToday ? 'text-amber-600' : 'text-gray-800'}`}>
                        {nextReview ? nextReview.toLocaleDateString('tr-TR') : 'Tamamlandı'}
                        </span>
                    </div>

                    {/* Daily Repetition Slots - Only show if not completed */}
                    {!isCompleted && (
                        <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3">
                            <div className="flex justify-between items-center mb-2">
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-indigo-800 flex items-center gap-1">
                                        <List className="w-3 h-3" /> Bugün Tekrar
                                    </span>
                                    <span className="text-[10px] text-indigo-400 mt-0.5">
                                        {startStr} - {endStr}
                                    </span>
                                </div>
                                <span className="text-xs text-indigo-600 font-bold">
                                    {todayLogs.length} / {maxSlots}
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {todayLogs.map((logTime, idx) => (
                                    <div key={idx} className="bg-white px-2 py-1 rounded text-xs font-medium text-green-700 border border-green-200 flex items-center gap-1 shadow-sm">
                                        <CheckCircle className="w-3 h-3" />
                                        {new Date(logTime).toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'})}
                                    </div>
                                ))}
                                {todayLogs.length === 0 && (
                                    <span className="text-xs text-gray-400 italic">Henüz tekrar yapılmadı.</span>
                                )}
                            </div>
                        </div>
                    )}
                    
                    {/* Delete Button */}
                    <div className="pt-2 border-t border-gray-100 mt-2">
                        <button
                            type="button"
                            onClick={() => handleDeleteClick(topic)}
                            className="w-full py-2 rounded-lg text-xs font-medium text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors flex items-center justify-center gap-1.5"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            {isCompleted ? "Tamamlanmış Konuyu Sil" : "Konuyu Sil"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
  };

  return (
    <>
        <div className="pb-24 space-y-12">
            {/* Active Topics Section */}
            <div>
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4 border-b border-gray-200 pb-2">
                    <Clock className="w-5 h-5 text-indigo-600" />
                    Tekrar Süreci Devam Edenler
                    <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs ml-auto">
                        {activeTopics.length}
                    </span>
                </h2>
                {activeTopics.length === 0 && completedTopics.length > 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200 border-dashed">
                        <p className="text-gray-500">Şu anda aktif tekrar sürecinde olan bir konunuz yok.</p>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {activeTopics.map(topic => renderTopicCard(topic, false))}
                    </div>
                )}
            </div>

            {/* Completed Topics Section */}
            {completedTopics.length > 0 && (
                <div className="opacity-90">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4 border-b border-gray-200 pb-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        Süreci Tamamlanmış Konular
                        <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs ml-auto">
                            {completedTopics.length}
                        </span>
                    </h2>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {completedTopics.map(topic => renderTopicCard(topic, true))}
                    </div>
                </div>
            )}
        </div>

        {/* Delete Confirmation Modal */}
        {topicToDelete && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full animate-in fade-in zoom-in duration-200">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3 text-red-600">
                            <AlertCircle className="w-8 h-8" />
                            <h3 className="text-xl font-bold">Konuyu Sil</h3>
                        </div>
                        <button onClick={() => setTopicToDelete(null)} className="text-gray-400 hover:text-gray-600">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    
                    <p className="text-gray-600 mb-6 font-medium">
                        {(topicToDelete.completedReviews?.length || 0) < (topicToDelete.scheduleOffsets?.length || 0)
                            ? "Dikkat bu konuyu siliyorsun tekrar edilen gün sayısı Tamamlanmadı. Çöp kutusuna taşınacak."
                            : "Bu konuyu çöp kutusuna taşımak istediğinize emin misiniz?"
                        }
                    </p>
                    
                    <div className="flex justify-end gap-3">
                        <button 
                            onClick={() => setTopicToDelete(null)}
                            className="px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 font-medium transition-colors"
                        >
                            İptal
                        </button>
                        <button 
                            onClick={confirmDelete}
                            className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold shadow-lg shadow-red-200 transition-colors"
                        >
                            Sil (Çöp Kutusuna)
                        </button>
                    </div>
                </div>
            </div>
        )}
    </>
  );
};

export default TopicList;
