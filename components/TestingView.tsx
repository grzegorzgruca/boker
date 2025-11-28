import React, { useEffect, useState } from 'react';
import { Bell, BellOff, Send, Clock } from 'lucide-react';
import { requestNotificationPermission, sendNotification, getDailyStats } from '../utils';
import { Task } from '../types';

interface TestingViewProps {
  tasks: Task[];
}

export const TestingView: React.FC<TestingViewProps> = ({ tasks }) => {
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
    const stats = getDailyStats(tasks);
    const title = "Booker: Raport Dnia";
    const body = stats.hasTasks 
      ? `📅 Masz dziś ${stats.count} zadań do zrobienia.\n⏱️ Szacowany czas: ${stats.timeString}`
      : `🎉 Wszystko zrobione! Brak zadań na dziś.`;

    sendNotification(title, body);
    setLastCheck(new Date().toLocaleTimeString());
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-6">
      <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
        <Bell className="text-indigo-600" />
        Testowanie Powiadomień
      </h2>

      <div className="p-4 bg-indigo-50 text-indigo-900 rounded-lg text-sm border border-indigo-100 leading-relaxed">
        <p className="font-semibold mb-1">Jak to działa?</p>
        System sprawdzi codziennie po północy (lub przy pierwszym uruchomieniu aplikacji danego dnia), czy masz zadania do wykonania. Jeśli tak, otrzymasz powiadomienie z liczbą zadań i łącznym czasem.
      </div>

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
              Wyślij testowe powiadomienie z aktualnym stanem zadań.
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
      
      <div className="border-t border-gray-100 pt-4">
        <h4 className="text-sm font-bold text-gray-700 mb-2">Podgląd treści powiadomienia (dla dzisiaj):</h4>
        <div className="bg-gray-100 p-3 rounded-lg flex items-start gap-3 opacity-80">
           <div className="bg-white p-2 rounded shadow-sm">
             <img src="https://cdn-icons-png.flaticon.com/512/2996/2996918.png" className="w-8 h-8 opacity-80" alt="Icon" />
           </div>
           <div>
              <div className="font-bold text-sm text-gray-900">Booker: Raport Dnia</div>
              <div className="text-xs text-gray-600 mt-0.5 whitespace-pre-line">
                {(() => {
                    const stats = getDailyStats(tasks);
                    return stats.hasTasks 
                    ? `📅 Masz dziś ${stats.count} zadań do zrobienia.\n⏱️ Szacowany czas: ${stats.timeString}`
                    : `🎉 Wszystko zrobione! Brak zadań na dziś.`;
                })()}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};