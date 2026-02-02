
import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { DbService } from '../services/dbService';
import { Practice, Reminder, Agent } from '../types';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  AlertCircle,
  User,
  RotateCcw,
  LayoutGrid,
  List,
  Columns,
  Clock,
  EyeOff,
  Eye
} from 'lucide-react';

type ViewMode = 'month' | 'week' | 'list';

export const CalendarPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [practices, setPractices] = useState<Practice[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentReferenceDate, setCurrentReferenceDate] = useState(new Date());
  
  // Impostato a true di default come richiesto
  const [hidePastReminders, setHidePastReminders] = useState(true);

  const isPowerUser = user?.isAdmin || user?.isTeamLeader;
  const defaultAgent = (isPowerUser && !user?.isAgent) ? 'all' : (user?.id || 'all');
  const [selectedAgentId, setSelectedAgentId] = useState(defaultAgent);

  const today = useMemo(() => new Date(), []);

  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        setLoading(true);
        try {
            const practicesData = await DbService.getPractices(user);
            setPractices(practicesData);
            
            if (practicesData.length > 0) {
              const pIds = practicesData.map(p => p.id);
              const remindersData = await DbService.getRemindersForPractices(pIds);
              setReminders(remindersData);
            }

            if (isPowerUser) {
                const agentsData = await DbService.getAllAgents(true);
                setAgents(agentsData.filter(a => a.isAgent));
            }
        } catch (e) {
            console.error("Errore caricamento calendario:", e);
        } finally {
            setLoading(false);
        }
      };
      fetchData();
    }
  }, [user]);

  // --- LOGICA DI NAVIGAZIONE ---
  const handlePrev = () => {
    const newDate = new Date(currentReferenceDate);
    if (viewMode === 'month') newDate.setMonth(newDate.getMonth() - 1);
    else if (viewMode === 'week') newDate.setDate(newDate.getDate() - 7);
    else newDate.setMonth(newDate.getMonth() - 1); // Per la lista usiamo comunque il mese come step
    setCurrentReferenceDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentReferenceDate);
    if (viewMode === 'month') newDate.setMonth(newDate.getMonth() + 1);
    else if (viewMode === 'week') newDate.setDate(newDate.getDate() + 7);
    else newDate.setMonth(newDate.getMonth() + 1);
    setCurrentReferenceDate(newDate);
  };

  const getRemindersForDate = (date: Date) => {
    return reminders.filter(r => {
      if (r.status === 'eliminato') return false;
      if (selectedAgentId !== 'all') {
          const practice = practices.find(p => p.id === r.practiceId);
          if (practice?.agentId !== selectedAgentId) return false;
      }
      const rDate = new Date(r.expirationDate);
      return rDate.getDate() === date.getDate() && 
             rDate.getMonth() === date.getMonth() && 
             rDate.getFullYear() === date.getFullYear();
    }).sort((a, b) => new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime());
  };

  // --- RENDERING COMPONENTI VISTA ---

  // 1. VISTA MESE
  const renderMonthView = () => {
    const year = currentReferenceDate.getFullYear();
    const month = currentReferenceDate.getMonth();
    const numDays = new Date(year, month + 1, 0).getDate();
    const firstDay = (new Date(year, month, 1).getDay() + 6) % 7; // Lunedì = 0
    
    const days = Array.from({ length: numDays }, (_, i) => i + 1);
    const blanks = Array.from({ length: firstDay }, (_, i) => i);
    const weekDays = ['LUN', 'MAR', 'MER', 'GIO', 'VEN', 'SAB', 'DOM'];

    return (
      <div className="p-2 md:p-6 overflow-x-auto">
        <div className="min-w-[800px]">
          <div className="grid grid-cols-7 mb-4">
            {weekDays.map(d => (
              <div key={d} className="text-center text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] py-2">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-px bg-gray-100 border border-gray-100 rounded-2xl overflow-hidden shadow-inner">
            {blanks.map(i => <div key={`blank-${i}`} className="bg-gray-50/50 h-32 md:h-40"></div>)}
            {days.map(day => {
              const date = new Date(year, month, day);
              const dayReminders = getRemindersForDate(date);
              const isToday = date.toDateString() === today.toDateString();
              return (
                <div key={`day-${day}`} className={`bg-white h-32 md:h-40 p-3 relative hover:bg-red-50/10 transition-colors flex flex-col gap-1.5 border-r border-b border-gray-50 last:border-r-0`}>
                  <div className="flex justify-between items-start">
                    <span className={`text-xs font-black block p-1.5 rounded-lg ${isToday ? 'bg-red-600 text-white shadow-lg' : 'text-gray-400'}`}>{day}</span>
                    {dayReminders.length > 0 && <div className="w-1.5 h-1.5 bg-red-600 rounded-full"></div>}
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
                    {dayReminders.map(r => renderReminderBadge(r))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // 2. VISTA SETTIMANA
  const renderWeekView = () => {
    // Calcoliamo il lunedì della settimana contenente currentReferenceDate
    const startOfWeek = new Date(currentReferenceDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);

    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return d;
    });

    const labels = ['LUNEDÌ', 'MARTEDÌ', 'MERCOLEDÌ', 'GIOVEDÌ', 'VENERDÌ', 'SABATO', 'DOMENICA'];

    return (
      <div className="p-2 md:p-6 overflow-x-auto">
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4 min-w-[1000px] md:min-w-0">
          {weekDays.map((date, i) => {
            const dayReminders = getRemindersForDate(date);
            const isToday = date.toDateString() === today.toDateString();
            return (
              <div key={i} className={`flex flex-col h-[500px] rounded-3xl border transition-all ${isToday ? 'border-red-600 bg-red-50/10' : 'border-gray-100 bg-white'}`}>
                <div className={`p-4 text-center border-b ${isToday ? 'bg-red-600 text-white rounded-t-[1.4rem]' : 'bg-gray-50 text-gray-900 rounded-t-3xl'}`}>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-70">{labels[i]}</p>
                  <h4 className="text-2xl font-black italic">{date.getDate()}</h4>
                </div>
                <div className="flex-1 p-3 overflow-y-auto space-y-2 custom-scrollbar">
                  {dayReminders.length > 0 ? (
                    dayReminders.map(r => renderReminderBadge(r, true))
                  ) : (
                    <div className="h-full flex items-center justify-center opacity-20">
                      <Clock size={32} className="text-gray-300" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // 3. VISTA ELENCO
  const renderListView = () => {
    // Filtriamo e ordiniamo tutti i promemoria validi per l'agente
    const listReminders = reminders.filter(r => {
      if (r.status === 'eliminato') return false;
      
      // Filtro per Agente
      if (selectedAgentId !== 'all') {
          const practice = practices.find(p => p.id === r.practiceId);
          if (practice?.agentId !== selectedAgentId) return false;
      }

      // Filtro Promemoria Passati
      if (hidePastReminders) {
          const rDate = new Date(r.expirationDate);
          if (rDate < today) return false;
      }

      return true;
    }).sort((a, b) => new Date(a.expirationDate).getTime() - new Date(b.expirationDate).getTime());

    return (
      <div className="p-6 space-y-8">
        {listReminders.length > 0 ? (
          listReminders.map(r => {
            const date = new Date(r.expirationDate);
            const isClosed = r.status === 'chiuso';
            const expired = !isClosed && date < today;
            return (
              <div 
                key={r.id} 
                onClick={() => navigate(`/practices/${r.practiceId}`)}
                className="group flex flex-col md:flex-row gap-6 bg-white border border-gray-100 p-6 rounded-3xl hover:shadow-xl transition-all cursor-pointer relative overflow-hidden"
              >
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${isClosed ? 'bg-emerald-500' : expired ? 'bg-red-600' : 'bg-orange-500'}`}></div>
                <div className="flex flex-col items-center justify-center bg-gray-50 px-6 py-2 rounded-2xl min-w-[100px]">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{date.toLocaleString('it-IT', { month: 'short' }).toUpperCase()}</span>
                  <span className="text-3xl font-black italic text-gray-900">{date.getDate()}</span>
                  <span className="text-[10px] font-bold text-red-600">{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex-1">
                   <div className="flex items-center gap-3 mb-2">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${isClosed ? 'bg-emerald-100 text-emerald-700' : expired ? 'bg-red-600 text-white' : 'bg-orange-100 text-orange-700'}`}>
                        {isClosed ? 'Gestito' : expired ? 'Scaduto' : 'In Attesa'}
                      </span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        Pratica ID: {r.practiceId.substring(0,8)}...
                      </span>
                   </div>
                   <h4 className="text-lg font-black text-gray-900 uppercase tracking-tight group-hover:text-red-600 transition-colors">{r.description}</h4>
                   {r.feedback && <p className="mt-2 text-xs text-gray-500 font-medium italic">Feedback: {r.feedback}</p>}
                </div>
                <div className="flex items-center justify-end">
                  <div className="p-3 bg-gray-50 rounded-2xl group-hover:bg-red-600 group-hover:text-white transition-all">
                    <ChevronRight size={20} />
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-20 text-center opacity-30 flex flex-col items-center gap-4">
            <LayoutGrid size={64} />
            <p className="font-black uppercase tracking-[0.2em]">Nessuna attività {hidePastReminders ? 'futura' : ''} programmata</p>
            {hidePastReminders && (
               <button 
                onClick={() => setHidePastReminders(false)}
                className="text-xs font-bold text-red-600 uppercase tracking-widest hover:underline"
               >
                 Mostra promemoria passati
               </button>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderReminderBadge = (r: Reminder, full: boolean = false) => {
    const isClosed = r.status === 'chiuso';
    const expired = !isClosed && new Date(r.expirationDate) < today;
    return (
      <div 
        key={r.id}
        onClick={(e) => {
            e.stopPropagation();
            navigate(`/practices/${r.practiceId}`);
        }}
        className={`text-[9px] p-2 rounded-xl cursor-pointer border transition-all hover:scale-[1.02] flex items-center gap-1.5 font-bold uppercase tracking-tight
            ${isClosed 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                : expired 
                    ? 'bg-red-600 text-white border-red-700' 
                    : 'bg-orange-50 text-orange-800 border-orange-100'
            }`}
      >
        {isClosed ? <CheckCircle size={10} /> : expired ? <AlertCircle size={10} /> : <div className="w-1.5 h-1.5 bg-orange-400 rounded-full"></div>}
        <span className="truncate">{full ? r.description : (r.description.length > 15 ? r.description.substring(0,12)+'...' : r.description)}</span>
      </div>
    );
  };

  if (loading) return <div className="p-20 text-center"><div className="w-10 h-10 border-4 border-red-600 border-t-transparent animate-spin rounded-full mx-auto"></div><p className="mt-4 text-[10px] font-black uppercase text-gray-400 tracking-widest">Sincronizzazione scadenziario...</p></div>;

  const currentPeriodTitle = () => {
    if (viewMode === 'month') return currentReferenceDate.toLocaleString('it-IT', { month: 'long', year: 'numeric' }).toUpperCase();
    if (viewMode === 'week') {
      const start = new Date(currentReferenceDate);
      const day = start.getDay();
      const diff = start.getDate() - day + (day === 0 ? -6 : 1);
      start.setDate(diff);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return `${start.getDate()} ${start.toLocaleString('it-IT', { month: 'short' }).toUpperCase()} - ${end.getDate()} ${end.toLocaleString('it-IT', { month: 'short' }).toUpperCase()}`;
    }
    return "TUTTE LE ATTIVITÀ";
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tighter uppercase leading-none">Scadenziario <span className="text-red-600">Attività</span></h2>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Gestione temporale appuntamenti e task</p>
        </div>
        
        {/* View Mode Switcher */}
        <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 self-stretch md:self-auto">
          <button 
            onClick={() => setViewMode('month')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${viewMode === 'month' ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <LayoutGrid size={14} /> Mese
          </button>
          <button 
            onClick={() => setViewMode('week')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${viewMode === 'week' ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Columns size={14} /> Settimana
          </button>
          <button 
            onClick={() => setViewMode('list')}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${viewMode === 'list' ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <List size={14} /> Elenco
          </button>
        </div>
      </div>

      {/* Control Bar con Filtro Agenti */}
      <div className="bg-white p-4 shadow-xl border border-gray-100 rounded-3xl">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              <div className="flex items-center gap-3">
                  <div className="bg-red-600 w-1 h-8 rounded-full"></div>
                  <div>
                      <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest leading-none mb-1">Pianificazione Operativa</h2>
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Visualizzazione filtrata scadenze</p>
                  </div>
              </div>

              <div className="flex flex-wrap gap-2 w-full lg:w-auto items-center">
                  {isPowerUser && (
                      <div className="w-full lg:w-72 relative group">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 text-red-600 w-4 h-4" />
                          <select 
                              value={selectedAgentId}
                              onChange={(e) => setSelectedAgentId(e.target.value)}
                              className="w-full pl-10 pr-4 py-4 bg-gray-900 text-white text-xs font-black uppercase tracking-widest border-none outline-none rounded-2xl cursor-pointer hover:bg-black transition-colors"
                          >
                              <option value="all">TUTTI GLI AGENTI</option>
                              {agents.map(a => <option key={a.id} value={a.id}>{a.nome.toUpperCase()}</option>)}
                          </select>
                      </div>
                  )}
                  
                  {selectedAgentId !== defaultAgent && (
                      <button 
                          onClick={() => setSelectedAgentId(defaultAgent)}
                          className="p-4 bg-gray-50 text-gray-400 hover:text-red-600 rounded-2xl transition-colors border border-gray-100"
                          title="Resetta Filtro"
                      >
                          <RotateCcw size={18} />
                      </button>
                  )}
              </div>
          </div>
      </div>

      <div className="bg-white shadow-xl border border-gray-100 rounded-[2.5rem] overflow-hidden">
        <div className="p-4 bg-black text-white flex justify-between items-center border-b border-gray-900">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-red-600 rounded-xl">
                    <CalendarIcon size={18} />
                </div>
                <h3 className="font-black uppercase tracking-[0.2em] text-xs hidden md:block">
                  {viewMode === 'month' ? 'Agenda Mensile' : viewMode === 'week' ? 'Focus Settimanale' : 'Lista Attività'}
                </h3>
            </div>
            
            <div className="flex items-center gap-4">
                <button onClick={handlePrev} className="hover:text-red-500 transition-colors p-1"><ChevronLeft size={24}/></button>
                <span className="font-black text-sm md:text-lg min-w-[150px] text-center select-none uppercase tracking-widest italic">{currentPeriodTitle()}</span>
                <button onClick={handleNext} className="hover:text-red-500 transition-colors p-1"><ChevronRight size={24}/></button>
            </div>

            <div className="flex items-center gap-2">
                {viewMode === 'list' && (
                    <button 
                        onClick={() => setHidePastReminders(!hidePastReminders)}
                        className={`flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border ${hidePastReminders ? 'bg-red-600 text-white border-red-600' : 'bg-transparent text-gray-400 border-gray-800 hover:text-white hover:border-white'}`}
                        title={hidePastReminders ? 'Mostra Passati' : 'Nascondi Passati'}
                    >
                        {hidePastReminders ? <Eye size={14} /> : <EyeOff size={14} />}
                        <span className="hidden lg:inline">{hidePastReminders ? 'Mostra Passati' : 'Nascondi Passati'}</span>
                    </button>
                )}
                <button 
                    onClick={() => setCurrentReferenceDate(new Date())}
                    className="text-[10px] font-black uppercase tracking-widest border border-gray-800 px-4 py-2 hover:bg-gray-900 transition-colors rounded-xl"
                >
                    Oggi
                </button>
            </div>
        </div>

        {viewMode === 'month' && renderMonthView()}
        {viewMode === 'week' && renderWeekView()}
        {viewMode === 'list' && renderListView()}
        
        {viewMode !== 'list' && (
          <div className="mt-8 mx-6 mb-6 flex flex-wrap gap-6 text-[9px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 p-6 rounded-3xl border border-gray-100">
              <div className="flex items-center gap-2"><div className="w-4 h-4 bg-red-600 rounded-lg shadow-sm"></div> SCADUTO / URGENTE</div>
              <div className="flex items-center gap-2"><div className="w-4 h-4 bg-orange-50 border border-orange-100 rounded-lg shadow-sm"></div> IN PROGRAMMA</div>
              <div className="flex items-center gap-2"><div className="w-4 h-4 bg-emerald-50 border border-emerald-100 rounded-lg shadow-sm"></div> COMPLETATO</div>
              <div className="flex items-center gap-2 ml-auto"><div className="w-4 h-4 bg-red-600 rounded-lg shadow-lg shadow-red-600/30"></div> OGGI</div>
          </div>
        )}
      </div>
    </div>
  );
};
