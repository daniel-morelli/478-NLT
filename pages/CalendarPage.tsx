
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { DbService } from '../services/dbService';
import { Practice, Reminder } from '../types';
import * as ReactRouterDOM from 'react-router-dom';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  AlertCircle 
} from 'lucide-react';

const { useNavigate } = ReactRouterDOM;

export const CalendarPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  const today = new Date();

  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        const practicesData = await DbService.getPractices(user);
        if (practicesData.length > 0) {
          const pIds = practicesData.map(p => p.id);
          const remindersData = await DbService.getRemindersForPractices(pIds);
          setReminders(remindersData);
        }
        setLoading(false);
      };
      fetchData();
    }
  }, [user]);

  // --- LOGICA CALENDARIO ---
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; 
  };

  const handlePrevMonth = () => {
    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1));
  };

  const isToday = (day: number) => {
    const d = new Date();
    return day === d.getDate() && 
           calendarMonth.getMonth() === d.getMonth() && 
           calendarMonth.getFullYear() === d.getFullYear();
  };

  const getRemindersForDay = (day: number) => {
    const targetYear = calendarMonth.getFullYear();
    const targetMonth = calendarMonth.getMonth();
    
    return reminders.filter(r => {
      if (r.status === 'eliminato') return false;
      const rDate = new Date(r.expirationDate);
      return rDate.getDate() === day && 
             rDate.getMonth() === targetMonth && 
             rDate.getFullYear() === targetYear;
    }).sort((a, b) => new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime());
  };

  if (loading) return <div className="text-center py-10 text-gray-500">Caricamento calendario...</div>;

  const numDays = getDaysInMonth(calendarMonth.getFullYear(), calendarMonth.getMonth());
  const firstDay = getFirstDayOfMonth(calendarMonth.getFullYear(), calendarMonth.getMonth());
  const daysArray = Array.from({ length: numDays }, (_, i) => i + 1);
  const blanksArray = Array.from({ length: firstDay }, (_, i) => i);
  const calendarMonthName = calendarMonth.toLocaleString('it-IT', { month: 'long', year: 'numeric' }).toUpperCase();
  const weekDays = ['LUN', 'MAR', 'MER', 'GIO', 'VEN', 'SAB', 'DOM'];

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Calendario Attività</h2>
        <p className="text-sm text-gray-500">Gestione appuntamenti e scadenze pratiche</p>
      </div>

      <div className="bg-white shadow-sm border border-gray-200 rounded-lg md:rounded-none overflow-hidden">
        <div className="p-4 bg-black text-white flex justify-between items-center">
            <div className="flex items-center gap-2">
                <CalendarIcon size={20} className="text-red-600" />
                <h3 className="font-bold uppercase tracking-wide hidden md:block">Pianificazione Mensile</h3>
            </div>
            <div className="flex items-center gap-4">
                <button onClick={handlePrevMonth} className="hover:text-red-500 transition-colors p-1"><ChevronLeft size={24}/></button>
                <span className="font-bold text-lg min-w-[150px] text-center select-none">{calendarMonthName}</span>
                <button onClick={handleNextMonth} className="hover:text-red-500 transition-colors p-1"><ChevronRight size={24}/></button>
            </div>
            <button 
                onClick={() => setCalendarMonth(new Date())}
                className="text-xs font-bold uppercase tracking-widest border border-gray-700 px-3 py-1 hover:bg-gray-900 transition-colors"
            >
                Oggi
            </button>
        </div>

        <div className="p-2 md:p-6 overflow-x-auto">
            <div className="min-w-[800px]">
                <div className="grid grid-cols-7 mb-2">
                    {weekDays.map(d => (
                        <div key={d} className="text-center text-xs font-bold text-gray-400 uppercase tracking-wider py-2">
                            {d}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200">
                    {blanksArray.map(i => (
                        <div key={`blank-${i}`} className="bg-gray-50 h-32 md:h-40"></div>
                    ))}
                    
                    {daysArray.map(day => {
                        const dayReminders = getRemindersForDay(day);
                        const isCurrentDay = isToday(day);

                        return (
                            <div key={`day-${day}`} className={`bg-white h-32 md:h-40 p-2 relative hover:bg-gray-50 transition-colors flex flex-col gap-1 ${isCurrentDay ? 'ring-2 ring-inset ring-red-600 z-10' : ''}`}>
                                <span className={`text-sm font-bold block mb-1 ${isCurrentDay ? 'text-red-600' : 'text-gray-700'}`}>
                                    {day}
                                </span>
                                
                                <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar">
                                    {dayReminders.map(r => {
                                        const isClosed = r.status === 'chiuso';
                                        const isExpired = !isClosed && new Date(r.expirationDate) < today;
                                        
                                        return (
                                            <div 
                                                key={r.id}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/practices/${r.practiceId}`);
                                                }}
                                                title={`${r.description} - ${new Date(r.expirationDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`}
                                                className={`text-[10px] p-1.5 rounded cursor-pointer border truncate transition-all hover:opacity-80 flex items-center gap-1
                                                    ${isClosed 
                                                        ? 'bg-green-50 text-green-700 border-green-200' 
                                                        : isExpired 
                                                            ? 'bg-red-600 text-white border-red-700 font-bold shadow-sm' 
                                                            : 'bg-orange-50 text-orange-800 border-orange-200'
                                                    }`}
                                            >
                                                {isClosed && <CheckCircle size={8} />}
                                                {isExpired && <AlertCircle size={8} />}
                                                <span className="truncate">{r.description}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
            
            <div className="mt-6 flex flex-wrap gap-6 text-xs text-gray-500 font-medium bg-gray-50 p-4 border border-gray-100">
                <div className="flex items-center gap-2"><div className="w-4 h-4 bg-red-600 rounded-sm"></div> SCADUTO / URGENTE</div>
                <div className="flex items-center gap-2"><div className="w-4 h-4 bg-orange-50 border border-orange-200 rounded-sm"></div> IN PROGRAMMA</div>
                <div className="flex items-center gap-2"><div className="w-4 h-4 bg-green-50 border border-green-200 rounded-sm"></div> COMPLETATO</div>
                <div className="flex items-center gap-2 ml-auto"><div className="w-4 h-4 ring-2 ring-red-600 rounded-sm"></div> OGGI</div>
            </div>
        </div>
      </div>
    </div>
  );
};
