import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { Task, Language, TagType } from '../types';
import { getStartOfDay, getProjectedDates, addDays } from '../utils';

interface CalendarViewProps {
  tasks: Task[];
}

const DAYS_OF_WEEK = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Ndz'];
const MONTHS = ['Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec', 'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'];

export const CalendarView: React.FC<CalendarViewProps> = ({ tasks }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filterLang, setFilterLang] = useState<Language | 'All'>('All');
  const [filterTag, setFilterTag] = useState<TagType | 'All'>('All');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Calendar Logic
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sun, 1 = Mon
  // Adjust so Monday is 0, Sunday is 6
  const startDayIndex = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const prevMonthDays = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonthDays = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Filter Tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      if (filterLang !== 'All' && t.language !== filterLang) return false;
      if (filterTag !== 'All' && t.tag !== filterTag) return false;
      return true;
    });
  }, [tasks, filterLang, filterTag]);

  // Map tasks to dates (including projections)
  const tasksByDate = useMemo(() => {
    const map: Record<number, { task: Task, stage: number, type: 'actual' | 'projected' }[]> = {};

    filteredTasks.forEach(task => {
      const projections = getProjectedDates(task);
      projections.forEach(proj => {
        if (!map[proj.date]) map[proj.date] = [];
        map[proj.date].push({
          task,
          stage: proj.stage,
          type: proj.type
        });
      });
    });

    return map;
  }, [filteredTasks]);

  // Generate Calendar Grid
  const renderCalendarCells = () => {
    const cells = [];
    const totalSlots = startDayIndex + daysInMonth;
    const rows = Math.ceil(totalSlots / 7);
    const totalCells = rows * 7;

    for (let i = 0; i < totalCells; i++) {
      if (i < startDayIndex || i >= startDayIndex + daysInMonth) {
        // Empty Cell
        cells.push(<div key={`empty-${i}`} className="bg-gray-50/50 border border-gray-100 min-h-[100px]"></div>);
      } else {
        // Day Cell
        const day = i - startDayIndex + 1;
        const dateTimestamp = new Date(year, month, day).getTime(); // Note: This might be local time 00:00
        // normalize to utils.getStartOfDay to match tasks
        const normalizedTs = getStartOfDay(new Date(year, month, day));
        
        const dayTasks = tasksByDate[normalizedTs] || [];
        const isToday = normalizedTs === getStartOfDay();

        cells.push(
          <div key={`day-${day}`} className={`border border-gray-100 min-h-[100px] p-1 flex flex-col bg-white ${isToday ? 'ring-2 ring-indigo-500 ring-inset' : ''}`}>
            <div className={`text-xs font-semibold mb-1 text-center ${isToday ? 'text-indigo-600' : 'text-gray-400'}`}>
              {day}
            </div>
            <div className="flex-1 flex flex-col gap-1 overflow-y-auto max-h-[120px]">
              {dayTasks.map((item, idx) => (
                <div 
                  key={`${item.task.id}-${item.stage}-${idx}`}
                  className={`text-[9px] p-1 rounded border truncate leading-tight
                    ${item.type === 'projected' ? 'opacity-50 border-dashed bg-gray-50 text-gray-500' : 
                      item.task.language === Language.English ? 'bg-sky-50 text-sky-700 border-sky-200' :
                      item.task.language === Language.Spanish ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                      'bg-indigo-50 text-indigo-700 border-indigo-200'
                    }
                  `}
                  title={`${item.task.topic} (${item.task.language}) - Powtórka ${item.stage}`}
                >
                  <span className="font-bold mr-1">{item.task.language === Language.English ? 'EN' : item.task.language === Language.Spanish ? 'ES' : item.task.language.substring(0,2)}</span>
                  {item.task.topic}
                </div>
              ))}
            </div>
          </div>
        );
      }
    }
    return cells;
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <div className="flex items-center gap-4">
          <button onClick={prevMonthDays} className="p-1 hover:bg-gray-100 rounded-full transition-colors"><ChevronLeft size={20} /></button>
          <h2 className="text-xl font-bold text-gray-800 w-32 text-center">{MONTHS[month]} {year}</h2>
          <button onClick={nextMonthDays} className="p-1 hover:bg-gray-100 rounded-full transition-colors"><ChevronRight size={20} /></button>
        </div>
        
        <div className="flex gap-2">
           <div className="relative">
             <select 
               value={filterLang} 
               onChange={(e) => setFilterLang(e.target.value as Language | 'All')}
               className="pl-8 pr-3 py-1.5 text-xs border rounded-lg bg-gray-50 appearance-none focus:ring-2 focus:ring-indigo-500 outline-none"
             >
               <option value="All">Wszystkie Języki</option>
               {Object.values(Language).map(l => <option key={l} value={l}>{l}</option>)}
             </select>
             <Filter size={12} className="absolute left-2.5 top-2 text-gray-400" />
           </div>
           <select 
             value={filterTag} 
             onChange={(e) => setFilterTag(e.target.value as TagType | 'All')}
             className="px-3 py-1.5 text-xs border rounded-lg bg-gray-50 focus:ring-2 focus:ring-indigo-500 outline-none"
           >
             <option value="All">Wszystkie Tagi</option>
             {Object.values(TagType).map(t => <option key={t} value={t}>{t}</option>)}
           </select>
        </div>
      </div>

      {/* Grid Header */}
      <div className="grid grid-cols-7 mb-2">
        {DAYS_OF_WEEK.map(d => (
          <div key={d} className="text-center text-xs font-bold text-gray-400 uppercase tracking-wider">{d}</div>
        ))}
      </div>

      {/* Grid Body */}
      <div className="grid grid-cols-7 border-t border-l border-gray-100 rounded-lg overflow-hidden">
        {renderCalendarCells()}
      </div>
      
      <div className="mt-4 flex gap-4 text-xs text-gray-500 justify-center">
         <div className="flex items-center gap-1"><div className="w-3 h-3 bg-indigo-50 border border-indigo-200 rounded"></div> Zadanie aktywne</div>
         <div className="flex items-center gap-1"><div className="w-3 h-3 bg-gray-50 border border-gray-200 border-dashed rounded"></div> Prognoza</div>
      </div>
    </div>
  );
};