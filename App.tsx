
import React, { useState, useEffect } from 'react';
import { Topic, NotificationSettings, PomodoroSession } from './types';
import { getTopics, saveTopics, getSettings, saveSettings, cleanupExpiredTrash, getPomodoroSessions, savePomodoroSessions } from './services/storageService';
import TopicForm from './components/TopicForm';
import TopicList from './components/TopicList';
import NotificationSystem from './components/NotificationSystem';
import SettingsPanel from './components/SettingsPanel';
import TrashPanel from './components/TrashPanel';
import PomodoroTimer from './components/PomodoroTimer';
import { Plus, BrainCircuit, Settings, Trash2, ListChecks, CheckCircle2, Timer, Coffee, Trash } from 'lucide-react';

// Schedule offsets in days
const SCHEDULE_OFFSETS = [1, 3, 7, 15, 30, 60, 180, 365];

// Helper for ID generation with fallback
const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

const App: React.FC = () => {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [pomodoroSessions, setPomodoroSessions] = useState<PomodoroSession[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTrashOpen, setIsTrashOpen] = useState(false);
  const [isPomodoroOpen, setIsPomodoroOpen] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings>(getSettings());

  useEffect(() => {
    // Load and clean up expired trash items
    const loadedTopics = getTopics();
    const cleanTopics = cleanupExpiredTrash(loadedTopics);
    setTopics(cleanTopics);
    
    // Load Pomodoro sessions
    setPomodoroSessions(getPomodoroSessions());
  }, []);

  const handleAddTopic = (title: string, description: string, startHour: number, startMinute: number, endHour: number, endMinute: number, frequencyHours: number) => {
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const firstReviewDate = now + oneDayMs;

    const newTopic: Topic = {
      id: generateId(),
      title,
      description,
      createdAt: now,
      nextReviewDate: firstReviewDate,
      completedReviews: [],
      scheduleOffsets: SCHEDULE_OFFSETS,
      startHour,
      startMinute,
      endHour,
      endMinute,
      frequencyHours,
      dailyLogs: []
    };

    const updatedTopics = [...topics, newTopic];
    setTopics(updatedTopics);
    saveTopics(updatedTopics);
  };

  const handleUpdateTopic = (updatedTopic: Topic) => {
    const updatedTopics = topics.map(t => t.id === updatedTopic.id ? updatedTopic : t);
    setTopics(updatedTopics);
    saveTopics(updatedTopics);
  };

  // Soft Delete (Move to Trash)
  const handleDeleteTopic = (topicId: string) => {
    setTopics(prevTopics => {
        const updatedTopics = prevTopics.map(t => {
            if (t.id === topicId) {
                return { ...t, deletedAt: Date.now() };
            }
            return t;
        });
        saveTopics(updatedTopics);
        return updatedTopics;
    });
  };

  // Restore from Trash
  const handleRestoreTopic = (topicId: string) => {
      setTopics(prevTopics => {
          const updatedTopics = prevTopics.map(t => {
            if (t.id === topicId) {
                const { deletedAt, ...rest } = t; // Remove deletedAt property
                return rest as Topic;
            }
            return t;
          });
          saveTopics(updatedTopics);
          return updatedTopics;
      });
  };

  // Permanent Delete
  const handleDeleteForever = (topicId: string) => {
      setTopics(prevTopics => {
        const updatedTopics = prevTopics.filter(t => t.id !== topicId);
        saveTopics(updatedTopics);
        return updatedTopics;
      });
  };

  const handleSaveSettings = (newSettings: NotificationSettings) => {
      setSettings(newSettings);
      saveSettings(newSettings);
  };
  
  // Pomodoro Callback - Fixed to prevent stale state issues
  const handlePomodoroSessionComplete = (session: PomodoroSession) => {
      setPomodoroSessions(prevSessions => {
          const updatedSessions = [...prevSessions, session];
          savePomodoroSessions(updatedSessions);
          return updatedSessions;
      });
  };

  // Clear History - Fixed confirmation and state update
  const clearPomodoroHistory = () => {
      if(window.confirm("Pomodoro geçmişini temizlemek istiyor musunuz?")) {
          setPomodoroSessions([]);
          savePomodoroSessions([]);
      }
  };

  // Helper to check completion status
  const isTopicCompleted = (t: Topic) => (t.completedReviews?.length || 0) >= (t.scheduleOffsets?.length || 0);

  // Filter topics for the main list (exclude deleted ones)
  const activeTopics = topics.filter(t => !t.deletedAt);
  // Filter for ONLY ongoing topics (not completed) for the stats count
  const ongoingTopics = activeTopics.filter(t => !isTopicCompleted(t));
  
  // Filter topics for the trash bin
  const deletedTopics = topics.filter(t => t.deletedAt);

  // Get list of repetitions performed today
  const getTodayPerformedRepetitions = () => {
    const todayStr = new Date().toDateString();
    let performed: { id: string, title: string, time: number }[] = [];

    activeTopics.forEach(t => {
        t.dailyLogs.forEach(log => {
            if (new Date(log).toDateString() === todayStr) {
                performed.push({ id: t.id + log, title: t.title, time: log });
            }
        });
    });
    // Sort by most recent
    return performed.sort((a, b) => b.time - a.time);
  };

  const todayRepetitions = getTodayPerformedRepetitions();

  // Get last 8 pomodoro sessions for display
  const displaySessions = [...pomodoroSessions].reverse().slice(0, 8); 

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <NotificationSystem topics={activeTopics} settings={settings} />
      
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
                <BrainCircuit className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              Hafıza Asistanı
            </h1>
          </div>
          
          <button
            onClick={() => setIsTrashOpen(true)}
            className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-red-600 transition-colors bg-gray-100 hover:bg-red-50 px-3 py-2 rounded-lg"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Çöp Kutusu ({deletedTopics.length})</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Action Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Öğrenme Paneli</h2>
                <p className="text-gray-500 mt-1">Aralıklı tekrar sistemi ve odaklanma araçları.</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <button
                    onClick={() => setIsPomodoroOpen(true)}
                    className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-orange-200 transition-all active:scale-95 justify-center"
                >
                    <Timer className="w-5 h-5" />
                    Pomodoro Başlat
                </button>

                <button
                    onClick={() => setIsFormOpen(true)}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg shadow-indigo-200 transition-all active:scale-95 justify-center"
                >
                    <Plus className="w-5 h-5" />
                    Yeni Konu Öğrendim
                </button>
            </div>
        </div>

        {/* Dashboard Stats & Pomodoro History Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* 1. Total Topics Card */}
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-center h-64">
                <div className="flex items-center gap-3 mb-2">
                    <div className="bg-indigo-100 p-2 rounded-lg">
                        <BrainCircuit className="w-5 h-5 text-indigo-600" />
                    </div>
                    <p className="text-gray-500 text-sm font-medium uppercase">Aktif Tekrar Süreci</p>
                </div>
                <div>
                    <span className="text-4xl font-bold text-gray-800">{ongoingTopics.length}</span>
                    <span className="text-gray-400 text-sm ml-2">konu devam ediyor</span>
                </div>
            </div>

            {/* 2. Today's Repetition Log */}
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm h-64 flex flex-col">
                 <div className="flex items-center justify-between mb-4 flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="bg-amber-100 p-2 rounded-lg">
                            <ListChecks className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                             <p className="text-gray-500 text-xs font-medium uppercase">Bugün Tekrar Edilenler</p>
                             <p className="font-bold text-gray-800">{todayRepetitions.length} Tekrar</p>
                        </div>
                    </div>
                 </div>
                 
                 <div className="flex-1 overflow-y-auto pr-2 space-y-2 scrollbar-thin scrollbar-thumb-gray-200">
                    {todayRepetitions.length > 0 ? (
                        todayRepetitions.map((item) => (
                            <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100 animate-in fade-in slide-in-from-right-4 duration-300">
                                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-800 truncate">{item.title}</p>
                                    <p className="text-[10px] text-gray-400">
                                        Saat: {new Date(item.time).toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'})}
                                    </p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
                            <ListChecks className="w-8 h-8 mb-2" />
                            <p className="text-sm">Bugün henüz tekrar yapılmadı.</p>
                        </div>
                    )}
                 </div>
            </div>

            {/* 3. Pomodoro History (New) */}
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm h-64 flex flex-col">
                 <div className="flex items-center justify-between mb-4 flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="bg-orange-100 p-2 rounded-lg">
                            <Timer className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                             <p className="text-gray-500 text-xs font-medium uppercase">Pomodoro Geçmişi</p>
                             <p className="font-bold text-gray-800">{pomodoroSessions.length} Oturum</p>
                        </div>
                    </div>
                    {pomodoroSessions.length > 0 && (
                        <button 
                            onClick={clearPomodoroHistory} 
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all" 
                            title="Tümünü Temizle"
                        >
                            <Trash className="w-4 h-4" />
                        </button>
                    )}
                 </div>
                 
                 <div className="flex-1 overflow-y-auto pr-2 space-y-2 scrollbar-thin scrollbar-thumb-gray-200">
                    {displaySessions.length > 0 ? (
                        displaySessions.map((session, index) => {
                            // Calculate display values
                            const totalSecs = session.totalSeconds ?? (session.totalMinutes * 60);
                            const displayMins = Math.floor(totalSecs / 60);
                            const displaySecs = totalSecs % 60;
                            
                            return (
                                <div key={session.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-100 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                            session.type === 'work' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'
                                        }`}>
                                            {pomodoroSessions.length - index}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-gray-700">
                                                {session.type === 'work' ? 'Çalışma' : 'Dinlenme'}
                                            </span>
                                            <span className="text-[10px] text-gray-400">
                                                {new Date(session.timestamp).toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'})}
                                            </span>
                                        </div>
                                    </div>
                                    <span className={`text-sm font-bold whitespace-nowrap ${session.type === 'work' ? 'text-orange-600' : 'text-green-600'}`}>
                                        {displayMins} dk {displaySecs > 0 ? `${displaySecs} sn` : ''}
                                    </span>
                                </div>
                            );
                        })
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
                            <Timer className="w-8 h-8 mb-2" />
                            <p className="text-sm">Oturum kaydı yok.</p>
                        </div>
                    )}
                 </div>
            </div>
        </div>

        {/* Topic List */}
        <TopicList 
            topics={activeTopics} 
            onUpdateTopic={handleUpdateTopic} 
            onDeleteTopic={handleDeleteTopic}
        />

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6 mt-auto">
        <div className="max-w-6xl mx-auto px-4 text-center text-gray-400 text-sm">
          &copy; {new Date().getFullYear()} Hafıza Asistanı. Gemini 3.0 Pro tarafından desteklenmektedir.
        </div>
      </footer>

      {/* Settings Button (Bottom Left) */}
      <button
        onClick={() => setIsSettingsOpen(true)}
        className="fixed bottom-6 left-6 p-4 rounded-full shadow-lg bg-gray-800 hover:bg-gray-900 text-white transition-all duration-300 z-50 hover:rotate-45"
        title="Ayarlar"
      >
        <Settings className="w-6 h-6" />
      </button>

      {/* Components */}
      {isFormOpen && (
        <TopicForm 
          onAdd={handleAddTopic} 
          onClose={() => setIsFormOpen(false)} 
        />
      )}

      {isPomodoroOpen && (
        <PomodoroTimer 
          durationMinutes={settings.pomodoroDuration || 25}
          breakMinutes={settings.breakDuration || 5}
          onClose={() => setIsPomodoroOpen(false)}
          customSound={settings.customSound}
          onSessionComplete={handlePomodoroSessionComplete}
        />
      )}
      
      <SettingsPanel 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={handleSaveSettings}
      />

      <TrashPanel 
        isOpen={isTrashOpen}
        onClose={() => setIsTrashOpen(false)}
        deletedTopics={deletedTopics}
        onRestore={handleRestoreTopic}
        onDeleteForever={handleDeleteForever}
      />
    </div>
  );
};

export default App;
