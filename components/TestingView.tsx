import React, { useEffect, useState } from 'react';
import { Bell, BellOff, Send, Clock, Play, RotateCcw, CalendarClock } from 'lucide-react';
import { requestNotificationPermission, sendNotification, getDailyStats, formatDate } from '../utils';
import { Task } from '../types';

interface TestingViewProps {
  tasks: Task[];
  currentDate: number;
  onAdvanceDay: () => void;
  onResetDate: () => void;
}

export const TestingView: React.FC<TestingViewProps> = ({ tasks, currentDate, onAdvanceDay, onResetDate }) => {
  const [permission, setPermission] = useState(Notification.permission);
  const [lastCheck, setLastCheck] = useState<string>('Nigdy');

  useEffect(() => {
    // Update permission status on mount
    setPermission(Notification.permission);
  }, []);

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    setPermission(granted ? 'granted' : 'denied');
  };

  const handleTestNotification = () => {
    // We use currentDate (simulation) for stats
    const stats = getDailyStats(tasks, currentDate);
    const title = "Booker: Raport Dnia (Symulacja)";
    const body = stats.hasTasks 
      ? `📅 Masz dziś ${stats.count} zadań do zrobienia.\n⏱️ Szacowany czas: ${stats.timeString}`
      : `🎉 Wszystko zrobione! Brak zadań na dziś.`;

    sendNotification(title, body);
    setLastCheck(new Date().toLocaleTimeString());
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-8">
      
      {/* Simulation Controls */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
           <CalendarClock className="text-amber-600" />
           Symulacja Czasu
        </h2>
        <div className="p-4 bg-amber-50 text-amber-900 rounded-lg text-sm border border-amber-100">
           Użyj tych opcji, aby sprawdzić jak system zachowuje się w kolejne dni, bez czekania na rzeczywisty upływ czasu.
           <div className="mt-2 font-bold flex items-center gap-2">
             Aktualna data symulacji: <span className="bg-white px-2 py-0.5 rounded border border-amber-200">{new Date(currentDate).toLocaleDateString('pl-PL')}</span>
           </div>
        </div>

        <div className="flex gap-4">
          <button 
             onClick={onAdvanceDay}
             className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-medium transition-all shadow-sm hover:shadow active:scale-95"
          >
             <Play size={18} fill="currentColor" />
             Następny Dzień (+1)
          </button>
          
          <button 
             onClick={onResetDate}
             className="flex items-center justify-center gap-2 px-6 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-colors"
             title="Wróć do dzisiaj"
          >
             <RotateCcw size={18} />
             Reset
          </button>
        </div>
      </section>

      <div className="border-t border-gray-100"></div>

      {/* Notifications Controls */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Bell className="text-indigo-600" />
          Testowanie Powiadomień
        </h2>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Permission Status */}
          <div className="border border-gray-200 rounded-xl p-5 flex flex-col items-center justify-center text-center">
             <div className="mb-3">
               {permission === 'granted' ? <Bell size={32} className="text-green-500"/> : <BellOff size={32} className="text-red-400"/>}
             </div>
             <h3 className="font-semibold text-gray-700">Status Uprawnień</h3>
             <p className={`text-sm mt-1 mb-4 ${permission === 'granted' ? 'text-green-600' : 'text-gray-500'}`}>
               {permission === 'granted' ? 'Aktywne' : permission === 'denied' ? 'Zablokowane' : 'Nieustalone'}
             </p>
             
             {permission !== 'granted' && (
               <button 
                 onClick={handleRequestPermission}
                 className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
               >
                 Włącz Powiadomienia
               </button>
             )}
          </div>

          {/* Manual Trigger */}
          <div className="border border-gray-200 rounded-xl p-5 flex flex-col items-center justify-center text-center">
              <div className="mb-3">
                <Send size={32} className="text-blue-500" />
              </div>
              <h3 className="font-semibold text-gray-700">Test Ręczny</h3>
              <p className="text-sm text-gray-500 mt-1 mb-4">
                Wyślij testowe powiadomienie bazując na dacie symulacji.
              </p>
              <button 
                onClick={handleTestNotification}
                disabled={permission !== 'granted'}
                className="disabled:opacity-50 disabled:cursor-not-allowed bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <Send size={16} />
                Wyślij teraz
              </button>
              <div className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                 <Clock size={10} /> Ostatni test: {lastCheck}
              </div>
          </div>
        </div>
        
        <div className="bg-gray-100 p-3 rounded-lg flex items-start gap-3 opacity-80 mt-4">
           <div className="bg-white p-2 rounded shadow-sm">
             <img src="https://cdn-icons-png.flaticon.com/512/2996/2996918.png" className="w-8 h-8 opacity-80" alt="Icon" />
           </div>
           <div>
              <div className="font-bold text-sm text-gray-900">Booker: Raport Dnia (dla {new Date(currentDate).toLocaleDateString('pl-PL')})</div>
              <div className="text-xs text-gray-600 mt-0.5 whitespace-pre-line">
                {(() => {
                    const stats = getDailyStats(tasks, currentDate);
                    return stats.hasTasks 
                    ? `📅 Masz dziś ${stats.count} zadań do zrobienia.\n⏱️ Szacowany czas: ${stats.timeString}`
                    : `🎉 Wszystko zrobione! Brak zadań na dziś.`;
                })()}
              </div>
           </div>
        </div>
      </section>
    </div>
  );
};