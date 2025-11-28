import React, { useState } from 'react';
import { Task, TagType, Language } from '../types';
import { calculateTimeSplit } from '../utils';
import { Check, Clock, GraduationCap, MessageCircle, Activity, Globe, ChevronDown, ChevronUp } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onComplete?: (id: string) => void;
  readonly?: boolean;
}

const TagIcon = ({ tag }: { tag: TagType }) => {
  switch (tag) {
    case TagType.Grammar: return <GraduationCap size={14} />;
    case TagType.Lexis: return <MessageCircle size={14} />;
    case TagType.NonVerbal: return <Activity size={14} />;
  }
};

const TagColor = ({ tag }: { tag: TagType }) => {
  switch (tag) {
    case TagType.Grammar: return 'bg-purple-100 text-purple-700 border-purple-200';
    case TagType.Lexis: return 'bg-blue-100 text-blue-700 border-blue-200';
    case TagType.NonVerbal: return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  }
};

const LanguageColor = ({ lang }: { lang: Language }) => {
  switch (lang) {
    case Language.Spanish: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case Language.English: return 'bg-sky-100 text-sky-800 border-sky-200';
    default: return 'bg-gray-100 text-gray-700 border-gray-200';
  }
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onComplete, readonly = false }) => {
  const { main, fluency, hasSplit } = calculateTimeSplit(task.originalDuration, task.tag);
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
      {/* Status Stripe */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${task.stage === 0 ? 'bg-blue-500' : 'bg-indigo-500'}`}></div>

      <div className="p-4 pl-5">
        <div className="flex justify-between items-start gap-3">
          <div className="flex-1">
            {/* Header / Topic */}
            <div className="flex items-start justify-between">
              <div>
                 <div className="flex gap-2 items-center mb-1">
                    <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border ${LanguageColor({ lang: task.language })}`}>
                      {task.language}
                    </span>
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                       {task.stage === 0 ? 'Nowe' : `Powtórka ${task.stage}`} {task.stage === 5 && '(Koniec)'}
                    </span>
                 </div>
                 <h3 className="font-bold text-gray-800 text-lg leading-tight">{task.topic}</h3>
              </div>
            </div>
          </div>

          {/* Action Button */}
          {!readonly && onComplete && (
            <button
              onClick={(e) => { e.stopPropagation(); onComplete(task.id); }}
              className="flex-shrink-0 group flex items-center gap-2 bg-gray-50 hover:bg-green-50 text-gray-600 hover:text-green-600 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-green-200 transition-all text-sm font-medium"
            >
              <span className="hidden sm:inline">Zalicz</span>
              <div className="bg-white border border-gray-300 rounded-full p-0.5 group-hover:border-green-400">
                <Check size={14} />
              </div>
            </button>
          )}
        </div>

        {/* Tags Row */}
        <div className="flex flex-wrap gap-2 items-center mt-3">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${TagColor({ tag: task.tag })}`}>
            <TagIcon tag={task.tag} />
            <span>{task.tag}</span>
            <span className="ml-1 opacity-75">| {main} min</span>
          </div>

          {hasSplit && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border bg-amber-100 text-amber-800 border-amber-200">
              <Activity size={14} />
              <span>Płynność</span>
              <span className="ml-1 opacity-75">| {fluency} min</span>
            </div>
          )}
          
          <div className="flex-1"></div>
          
          <div className="flex items-center gap-2 text-xs text-gray-400 font-medium whitespace-nowrap">
             <Clock size={12} />
             <span>{task.originalDuration} min</span>
          </div>
        </div>
        
        {/* Description Toggle */}
        {task.description && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <button 
              onClick={() => setExpanded(!expanded)} 
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-indigo-600 transition-colors"
            >
              {expanded ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
              {expanded ? 'Ukryj opis' : 'Pokaż opis'}
            </button>
            
            {expanded && (
               <p className="mt-2 text-sm text-gray-600 italic leading-relaxed">
                 {task.description}
               </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};