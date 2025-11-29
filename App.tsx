import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Download, Upload, Archive as ArchiveIcon, Calendar as CalendarIcon, Clock, BookOpen } from 'lucide-react';
import { Task, TagType, TimeOption, Language } from './types';
import { getStartOfDay, formatDate, getNextDueDate, saveToCookie, loadFromCookie, getDailyStats, sendNotification, addDays } from './utils';
import { TaskCard } from './components/TaskCard';
import { CalendarView } from './components/CalendarView';
import { TestingView } from './components/TestingView';

// Time Options Configuration
const TIME_OPTIONS: TimeOption[] = [
  { label: '10 min', minutes: 10 },
  { label: '15 min', minutes: 15 },
  { label: '20 min', minutes: 20 },
  { label: '30 min', minutes: 30 },
  { label: '1h', minutes: 60 },
  { label: '1.5h', minutes: 90 },
  { label: '2h', minutes: 120 },
];

function App() {
  // --- State ---
  const [tasks, setTasks] = useState<Task[]>([]);
  const [view, setView] = useState<'schedule' | 'calendar' | 'archive' | 'data' | 'test'>('schedule');
  
  // Simulation State
  const [simulatedOffset, setSimulatedOffset] = useState(0);

  // Form State
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTag, setSelectedTag] = useState<TagType>(TagType.Grammar);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(Language.Spanish);
  const [selectedTime, setSelectedTime] = useState<number>(30);
  
  // Data Import/Export State
  const [ioText, setIoText] = useState('');

  // --- Derived Global Time ---
  // This is the source of truth for "Today" throughout the app
  const globalToday = useMemo(() => {
    return addDays(getStartOfDay(), simulatedOffset);
  }, [simulatedOffset]);

  // --- Effects ---
  // Load from LocalStorage or Cookie on mount
  useEffect(() => {
    const localSaved = localStorage.getItem('booker-tasks');
    if (localSaved) {
      try {
        setTasks(JSON.parse(localSaved));
        return;
      } catch (e) { console.error(e); }
    }
    
    // Fallback to cookie
    const cookieSaved = loadFromCookie('booker_data');
    if (cookieSaved && Array.isArray(cookieSaved)) {
      setTasks(cookieSaved);
    }
  }, []);

  // Save to LocalStorage AND Cookie on change
  useEffect(() => {
    localStorage.setItem('booker-tasks', JSON.stringify(tasks));
    saveToCookie('booker_data', tasks);
  }, [tasks]);

  // --- Notification Check Logic ---
  useEffect(() => {
    // Only run if we have tasks loaded
    if (tasks.length === 0) return;

    const checkAndNotify = () => {
      if (Notification.permission !== 'granted') return;

      const dateStr = new Date(globalToday).toDateString(); 
      const lastNotified = localStorage.getItem('booker-last-notification');

      // Check if we already notified for this specific (virtual) date
      if (lastNotified === dateStr) return;

      const stats = getDailyStats(tasks, globalToday);
      if (stats.hasTasks) {
         sendNotification(
            "Booker: Plan na dziś",
            `📅 Masz dziś ${stats.count} zadań do zrobienia.\n⏱️ Szacowany czas: ${stats.timeString}`
         );
         // Mark as notified for today
         localStorage.setItem('booker-last-notification', dateStr);
      }
    };

    // Check immediately on load or when simulation changes
    checkAndNotify();

    // Set up an interval to check periodically
    const intervalId = setInterval(checkAndNotify, 1000 * 60 * 60);

    return () => clearInterval(intervalId);
  }, [tasks, globalToday]);


  // --- Handlers ---

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    // We use globalToday as the creation reference
    const nextDue = getNextDueDate(0, globalToday); // Get date for Stage 1

    const newTask: Task = {
      id: crypto.randomUUID(),
      topic: topic,
      description: description.trim() || undefined,
      tag: selectedTag,
      language: selectedLanguage,
      originalDuration: selectedTime,
      createdAt: globalToday,
      nextDueDate: nextDue || globalToday, // Fallback
      stage: 1, // Moving to stage 1 immediately as "input = done"
      isArchived: false,
    };

    setTasks(prev => [...prev, newTask]);
    setTopic(''); // Reset form
    setDescription('');
  };

  const handleCompleteTask = (id: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t;

      // We use globalToday as the "completion date"
      const nextDate = getNextDueDate(t.stage, globalToday);
      const isFinished = nextDate === null;

      return {
        ...t,
        stage: t.stage + 1,
        nextDueDate: isFinished ? t.nextDueDate : nextDate,
        isArchived: isFinished
      };
    }));
  };

  const handleImport = () => {
    try {
      const data = JSON.parse(ioText);
      if (Array.isArray(data)) {
        setTasks(data);
        alert('Dane wczytane pomyślnie!');
        setIoText('');
      } else {
        alert('Nieprawidłowy format danych');
      }
    } catch (e) {
      alert('Błąd parsowania JSON');
    }
  };

  // --- Derived State (Computations) ---

  // Active Tasks (Scheduled)
  const activeTasks = useMemo(() => {
    return tasks
      .filter(t => !t.isArchived)
      .sort((a, b) => a.nextDueDate - b.nextDueDate);
  }, [tasks]);

  // Tasks grouped by date
  const groupedTasks = useMemo(() => {
    const groups: Record<number, Task[]> = {};
    activeTasks.forEach(t => {
      // If overdue relative to simulation time, show in Today
      const key = t.nextDueDate < globalToday ? globalToday : t.nextDueDate;
      if (!groups[key]) groups[key] = [];
      groups[key].push(t);
    });
    return groups;
  }, [activeTasks, globalToday]);

  // Today's Stats
  const todayStats = useMemo(() => {
    return getDailyStats(tasks, globalToday);
  }, [tasks, globalToday]);

  // Archived Tasks
  const archivedTasks = useMemo(() => tasks.filter(t => t.isArchived).sort((a, b) => b.createdAt - a.createdAt), [tasks]);

  // --- Render ---

  return (
    <div className="min-h-screen pb-12 bg-[#F8FAFC]">
      {/* Simulation Banner */}
      {simulatedOffset > 0 && (
        <div className="bg-amber-100 text-amber-900 text-xs text-center py-1 font-bold border-b border-amber-200">
           ⚠️ Tryb symulacji: {new Date(globalToday).toLocaleDateString('pl-PL')} (+{simulatedOffset} dni)
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="flex items-center gap-2">
            <BookOpen className="text-indigo-600" size={28} />
            <h1 className="text-2xl font-bold text-gray-800 tracking-tight">Booker</h1>
          </div>
          <nav className="flex gap-1 bg-gray-100 p-1 rounded-lg w-full sm:w-auto overflow-x-auto">
            <button 
              onClick={() => setView('schedule')}
              className={`flex-1 sm:flex-none whitespace-nowrap px-4 py-2 rounded-md text-sm font-medium transition-all ${view === 'schedule' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Terminarz
            </button>
            <button 
              onClick={() => setView('calendar')}
              className={`flex-1 sm:flex-none whitespace-nowrap px-4 py-2 rounded-md text-sm font-medium transition-all ${view === 'calendar' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Kalendarz
            </button>
            <button 
              onClick={() => setView('archive')}
              className={`flex-1 sm:flex-none whitespace-nowrap px-4 py-2 rounded-md text-sm font-medium transition-all ${view === 'archive' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Archiwum
            </button>
            <button 
              onClick={() => setView('data')}
              className={`flex-1 sm:flex-none whitespace-nowrap px-4 py-2 rounded-md text-sm font-medium transition-all ${view === 'data' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Dane
            </button>
            <button 
              onClick={() => setView('test')}
              className={`flex-1 sm:flex-none whitespace-nowrap px-4 py-2 rounded-md text-sm font-medium transition-all ${view === 'test' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Testowanie
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 mt-8 space-y-8">
        
        {/* VIEW: SCHEDULE (Main) */}
        {view === 'schedule' && (
          <>
            {/* Input Card */}
            <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Plus size={20} className="text-indigo-500" />
                Dodaj przerobiony materiał
              </h2>
              <form onSubmit={handleAddTask} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Temat / Tekst</label>
                    <input
                      type="text"
                      required
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="Co dziś przerobiłeś?"
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
                    />
                  </div>

                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Opis (opcjonalny)</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Notatki, słówka, szczegóły..."
                      rows={2}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none resize-none"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Język</label>
                    <select 
                        value={selectedLanguage}
                        onChange={(e) => setSelectedLanguage(e.target.value as Language)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                       >
                         {Object.values(Language).map(l => (
                           <option key={l} value={l}>{l}</option>
                         ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Typ</label>
                    <select 
                      value={selectedTag}
                      onChange={(e) => setSelectedTag(e.target.value as TagType)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                      >
                        {Object.values(TagType).map(tag => (
                          <option key={tag} value={tag}>{tag}</option>
                        ))}
                    </select>
                  </div>

                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Czas trwania</label>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {TIME_OPTIONS.map(opt => (
                        <button
                          key={opt.minutes}
                          type="button"
                          onClick={() => setSelectedTime(opt.minutes)}
                          className={`flex-shrink-0 px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                            selectedTime === opt.minutes 
                              ? 'bg-indigo-50 border-indigo-500 text-indigo-700' 
                              : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                   <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg shadow-md hover:shadow-lg transition-all flex justify-center items-center gap-2">
                     <Clock size={18} />
                     Zapisz
                   </button>
                   {selectedTag === TagType.Grammar && (
                    <p className="text-xs text-amber-600 mt-2 text-center bg-amber-50 py-1 rounded">
                       ⚡ Wybrano gramatykę: 30% czasu zostanie oznaczone jako trening płynności.
                    </p>
                   )}
                </div>
              </form>
            </section>

            {/* Today's Stats */}
            <section className="bg-gradient-to-r from-gray-900 to-indigo-900 rounded-2xl p-6 text-white shadow-lg flex justify-between items-center">
              <div>
                <h3 className="text-indigo-200 font-medium text-sm uppercase tracking-wider mb-1">Dzisiejszy plan</h3>
                {todayStats.hasTasks ? (
                  <div className="text-3xl font-bold">{todayStats.timeString}</div>
                ) : (
                  <div className="text-3xl font-bold">Wolne</div>
                )}
              </div>
              <div className="text-right">
                <div className="text-indigo-200 text-sm">Do powtórzenia</div>
                <div className="text-2xl font-bold">{todayStats.count} <span className="text-sm font-normal opacity-80">zadań</span></div>
              </div>
            </section>

            {/* Tasks List */}
            <section className="space-y-6">
              {Object.keys(groupedTasks).map((dateKey) => {
                const ts = Number(dateKey);
                // We pass globalToday to formatDate to make sure "Dzisiaj" matches the simulation
                const dateLabel = formatDate(ts, globalToday);
                const isToday = dateLabel === 'Dzisiaj';
                
                return (
                  <div key={ts} className="space-y-3">
                    <h3 className={`font-bold text-lg sticky top-20 py-2 z-0 backdrop-blur-sm ${isToday ? 'text-indigo-600' : 'text-gray-500'}`}>
                      {dateLabel}
                    </h3>
                    <div className="grid gap-3">
                      {groupedTasks[ts].map(task => (
                        <TaskCard 
                          key={task.id} 
                          task={task} 
                          onComplete={isToday || ts < globalToday ? handleCompleteTask : undefined}
                          readonly={!isToday && ts > globalToday}
                        />
                      ))}
                    </div>
                  </div>
                )
              })}
              {activeTasks.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <div className="inline-block p-4 rounded-full bg-gray-100 mb-4">
                    <CalendarIcon size={32} />
                  </div>
                  <p>Brak zaplanowanych powtórek.</p>
                </div>
              )}
            </section>
          </>
        )}

        {/* VIEW: CALENDAR */}
        {view === 'calendar' && (
          <section>
            <CalendarView tasks={tasks} currentDate={globalToday} />
          </section>
        )}

        {/* VIEW: ARCHIVE */}
        {view === 'archive' && (
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-6">
              <ArchiveIcon className="text-gray-400" />
              Archiwum zadań
            </h2>
            {archivedTasks.length === 0 ? (
               <p className="text-gray-500 italic">Brak ukończonych cykli nauki.</p>
            ) : (
              archivedTasks.map(task => (
                <TaskCard key={task.id} task={task} readonly />
              ))
            )}
          </section>
        )}

        {/* VIEW: DATA */}
        {view === 'data' && (
          <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-6">
            <h2 className="text-lg font-bold text-gray-800">Zarządzanie Danymi</h2>
            <div className="p-4 bg-blue-50 text-blue-800 rounded-lg text-sm border border-blue-100">
              Twoje dane są automatycznie zapisywane w przeglądarce (LocalStorage oraz Cookies). Poniżej możesz je wyeksportować, aby przenieść na inne urządzenie.
            </div>
            
            <textarea
              value={ioText}
              onChange={(e) => setIoText(e.target.value)}
              placeholder="Wklej kod zapisu tutaj..."
              className="w-full h-48 font-mono text-xs p-4 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />

            <div className="flex gap-4">
              <button 
                onClick={() => setIoText(JSON.stringify(tasks, null, 2))}
                className="flex-1 flex justify-center items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 py-2 rounded-lg font-medium transition-colors"
              >
                <Download size={18} />
                Generuj kod
              </button>
              <button 
                onClick={handleImport}
                className="flex-1 flex justify-center items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg font-medium transition-colors"
              >
                <Upload size={18} />
                Wczytaj kod
              </button>
            </div>
          </section>
        )}
        
        {/* VIEW: TEST */}
        {view === 'test' && (
          <section>
            <TestingView 
              tasks={tasks} 
              currentDate={globalToday}
              onAdvanceDay={() => setSimulatedOffset(prev => prev + 1)}
              onResetDate={() => setSimulatedOffset(0)}
            />
          </section>
        )}

      </main>
    </div>
  );
}

export default App;