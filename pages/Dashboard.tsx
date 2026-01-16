
import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { DbService } from '../services/dbService';
import { Practice, DealStatus, CreditStatus, OrderStatus, Reminder } from '../types';
import * as ReactRouterDOM from 'react-router-dom';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Clock, AlertCircle, ChevronLeft, ChevronRight, Calendar as CalendarIcon, CheckCircle, Filter as FilterIcon } from 'lucide-react';

const { useNavigate } = ReactRouterDOM;

const MESI_FULL = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
];

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [practices, setPractices] = useState<Practice[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State per il calendario visivo inferiore
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  // State per il filtro statistiche (In alto a destra)
  const today = new Date();
  const [filterYear, setFilterYear] = useState(today.getFullYear());
  const [filterMonth, setFilterMonth] = useState<number | 'all'>(today.getMonth());

  useEffect(() => {
    if (user) {
      const fetchData = async () => {
          const practicesData = await DbService.getPractices(user);
          setPractices(practicesData);
          
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

  // Filtra le pratiche in base al periodo selezionato per i contatori e la torta
  const filteredPractices = useMemo(() => {
    return practices.filter(p => {
      const pDate = new Date(p.data);
      const sameYear = pDate.getFullYear() === filterYear;
      if (filterMonth === 'all') return sameYear;
      return sameYear && pDate.getMonth() === filterMonth;
    });
  }, [practices, filterYear, filterMonth]);

  // Dati per il grafico a barre (Sempre l'intero anno selezionato per contesto)
  const monthlyChartData = useMemo(() => {
    const data = Array(12).fill(0).map((_, i) => ({
      name: new Date(0, i).toLocaleString('it-IT', { month: 'short' }).toUpperCase(),
      valore: 0,
      isCurrent: filterMonth !== 'all' && i === filterMonth
    }));
    
    practices.forEach(p => {
      const date = new Date(p.data);
      if (date.getFullYear() === filterYear) {
        const month = date.getMonth();
        if (!isNaN(month)) data[month].valore += (p.valoreTotale || 0);
      }
    });
    return data;
  }, [practices, filterYear, filterMonth]);

  const handleFilterClick = (type: string, value: string) => {
      navigate(`/practices?filterType=${type}&filterValue=${encodeURIComponent(value)}`);
  };

  // --- LOGICA CALENDARIO INFERIORE ---
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

  if (loading) return <div className="text-center py-10 text-gray-500">Caricamento dati...</div>;

  const statusData = [
    { name: 'In Corso', value: filteredPractices.filter(p => p.statoTrattativa === DealStatus.IN_CORSO).length, color: '#ef4444' }, 
    { name: 'Chiuse', value: filteredPractices.filter(p => p.statoTrattativa === DealStatus.CHIUSA).length, color: '#171717' },  
    { name: 'Fallite', value: filteredPractices.filter(p => p.statoTrattativa === DealStatus.FALLITA).length, color: '#d4d4d4' },
  ].filter(d => d.value > 0);

  const FilterBox = ({ title, items, type }: { title: string, items: {label: string, value: number, filterVal: string}[], type: string }) => (
    <div className="bg-white border border-gray-200 shadow-sm overflow-hidden flex flex-col h-full rounded-lg md:rounded-none">
        <div className="bg-black text-white px-4 py-3 text-sm font-bold uppercase tracking-wider">
            {title}
        </div>
        <div className="p-4 flex-1 flex flex-col justify-center gap-3">
            {items.map((item, idx) => (
                <div 
                    key={idx} 
                    onClick={() => handleFilterClick(type, item.filterVal)}
                    className="flex justify-between items-center cursor-pointer group hover:bg-gray-50 p-2 rounded transition-colors"
                >
                    <span className="text-gray-600 text-sm font-medium group-hover:text-red-600 transition-colors">{item.label}</span>
                    <span className="font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded text-xs group-hover:bg-red-100 group-hover:text-red-700">
                        {item.value}
                    </span>
                </div>
            ))}
        </div>
    </div>
  );

  const numDays = getDaysInMonth(calendarMonth.getFullYear(), calendarMonth.getMonth());
  const firstDay = getFirstDayOfMonth(calendarMonth.getFullYear(), calendarMonth.getMonth());
  const daysArray = Array.from({ length: numDays }, (_, i) => i + 1);
  const blanksArray = Array.from({ length: firstDay }, (_, i) => i);
  const calendarMonthName = calendarMonth.toLocaleString('it-IT', { month: 'long', year: 'numeric' }).toUpperCase();
  const weekDays = ['LUN', 'MAR', 'MER', 'GIO', 'VEN', 'SAB', 'DOM'];

  // Generazione anni per il filtro (dal 2024 al prossimo anno)
  const years = [2024, 2025, 2026];

  return (
    <div className="space-y-6 md:space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
        <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Dashboard</h2>
            <p className="text-sm text-gray-500">
                Statistiche: {filterMonth === 'all' ? `Intero Anno ${filterYear}` : `${MESI_FULL[filterMonth]} ${filterYear}`}
            </p>
        </div>
        
        {/* Filtro Periodo Statistiche - AGGIORNATO PER LEGGIBILITÀ */}
        <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto items-stretch md:items-center bg-gray-100 p-2 border border-gray-300 shadow-sm rounded-lg md:rounded-none">
            <div className="flex items-center gap-2 px-3 border-r border-gray-300 hidden md:flex">
                <FilterIcon size={16} className="text-gray-700" />
                <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest">Periodo</span>
            </div>
            <select 
                value={filterMonth} 
                onChange={(e) => setFilterMonth(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="bg-white border-2 border-gray-300 px-3 py-2 text-xs font-bold uppercase tracking-wide outline-none focus:ring-2 focus:ring-red-600 text-gray-900 hover:border-gray-400 transition-colors"
            >
                <option value="all">Tutto l'anno</option>
                {MESI_FULL.map((m, i) => (
                    <option key={i} value={i}>{m}</option>
                ))}
            </select>
            <select 
                value={filterYear} 
                onChange={(e) => setFilterYear(Number(e.target.value))}
                className="bg-white border-2 border-gray-300 px-3 py-2 text-xs font-bold uppercase tracking-wide outline-none focus:ring-2 focus:ring-red-600 text-gray-900 hover:border-gray-400 transition-colors"
            >
                {years.map(y => (
                    <option key={y} value={y}>{y}</option>
                ))}
            </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <FilterBox 
            title="PRATICHE" 
            type="statoTrattativa"
            items={[
                { label: 'In Corso', value: filteredPractices.filter(p => p.statoTrattativa === DealStatus.IN_CORSO).length, filterVal: DealStatus.IN_CORSO },
                { label: 'Fallite', value: filteredPractices.filter(p => p.statoTrattativa === DealStatus.FALLITA).length, filterVal: DealStatus.FALLITA },
                { label: 'Chiuse', value: filteredPractices.filter(p => p.statoTrattativa === DealStatus.CHIUSA).length, filterVal: DealStatus.CHIUSA },
            ]}
        />
        <FilterBox 
            title="AFFIDAMENTI" 
            type="statoAffidamento"
            items={[
                { label: 'In Attesa', value: filteredPractices.filter(p => p.statoAffidamento === CreditStatus.IN_ATTESA).length, filterVal: CreditStatus.IN_ATTESA },
                { label: 'Bocciati', value: filteredPractices.filter(p => p.statoAffidamento === CreditStatus.BOCCIATO).length, filterVal: CreditStatus.BOCCIATO },
                { label: 'Esitati', value: filteredPractices.filter(p => p.statoAffidamento === CreditStatus.ESITATO).length, filterVal: CreditStatus.ESITATO },
                { label: 'Esitati con Cond.', value: filteredPractices.filter(p => p.statoAffidamento === CreditStatus.ESITATO_CON_CONDIZIONI).length, filterVal: CreditStatus.ESITATO_CON_CONDIZIONI },
            ]}
        />
        <FilterBox 
            title="ORDINI" 
            type="statoOrdine"
            items={[
                { label: 'Non Inviati', value: filteredPractices.filter(p => p.statoOrdine === OrderStatus.NON_INVIATO).length, filterVal: OrderStatus.NON_INVIATO },
                { label: 'Inviati', value: filteredPractices.filter(p => p.statoOrdine === OrderStatus.INVIATO).length, filterVal: OrderStatus.INVIATO },
                { label: 'Falliti', value: filteredPractices.filter(p => p.statoOrdine === OrderStatus.FALLITO).length, filterVal: OrderStatus.FALLITO },
            ]}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div 
            onClick={() => handleFilterClick('reminder', 'future')}
            className="bg-white border border-gray-200 p-5 md:p-6 flex items-center justify-between cursor-pointer hover:border-red-600 transition-colors shadow-sm group rounded-lg md:rounded-none"
          >
              <div>
                  <h4 className="text-gray-500 font-bold uppercase text-xs tracking-wider mb-1 group-hover:text-red-600">Promemoria In Arrivo</h4>
                  <p className="text-gray-400 text-xs">Tutti i promemoria attivi</p>
              </div>
              <div className="flex items-center gap-4">
                  <span className="text-3xl font-bold text-gray-900">{reminders.filter(r => r.status === 'aperto' && new Date(r.expirationDate) >= today).length}</span>
                  <div className="bg-orange-50 p-3 rounded-full text-orange-600 group-hover:bg-red-600 group-hover:text-white transition-colors">
                      <Clock size={24} />
                  </div>
              </div>
          </div>

          <div 
            onClick={() => handleFilterClick('reminder', 'expired')}
            className="bg-white border border-gray-200 p-5 md:p-6 flex items-center justify-between cursor-pointer hover:border-red-600 transition-colors shadow-sm group rounded-lg md:rounded-none"
          >
              <div>
                  <h4 className="text-gray-500 font-bold uppercase text-xs tracking-wider mb-1 group-hover:text-red-600">Scaduti senza Feedback</h4>
                  <p className="text-gray-400 text-xs">Richiedono attenzione</p>
              </div>
              <div className="flex items-center gap-4">
                  <span className="text-3xl font-bold text-gray-900">{reminders.filter(r => r.status === 'aperto' && new Date(r.expirationDate) < today).length}</span>
                  <div className="bg-red-50 p-3 rounded-full text-red-600 group-hover:bg-red-600 group-hover:text-white transition-colors">
                      <AlertCircle size={24} />
                  </div>
              </div>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white p-4 md:p-6 shadow-sm border border-gray-200 lg:col-span-2 rounded-lg md:rounded-none">
          <h3 className="text-lg font-bold text-gray-800 mb-6 uppercase tracking-wide">
              Volume d'Affari {filterYear} (€)
          </h3>
          <div className="h-60 md:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 10, fontWeight: 'bold'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 10}} tickFormatter={(val) => `${val/1000}k`} />
                <Tooltip 
                  cursor={{fill: '#f3f4f6'}}
                  contentStyle={{backgroundColor: '#171717', color: '#fff', borderRadius: '0', border: 'none'}}
                  formatter={(value: number) => [`€ ${value.toLocaleString()}`, 'Valore']}
                />
                <Bar dataKey="valore">
                  {monthlyChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.isCurrent ? '#dc2626' : '#d4d4d4'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-4 md:p-6 shadow-sm border border-gray-200 rounded-lg md:rounded-none">
          <h3 className="text-lg font-bold text-gray-800 mb-6 uppercase tracking-wide">Stato Trattative</h3>
          <div className="h-64 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{backgroundColor: '#171717', color: '#fff', borderRadius: '0', border: 'none'}} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl md:text-4xl font-bold text-gray-900">{filteredPractices.length}</span>
                <span className="text-[10px] font-bold text-gray-400 uppercase">Selezionate</span>
            </div>
          </div>
          <div className="mt-4 space-y-3">
              {statusData.map((d) => (
                  <div key={d.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full md:rounded-none" style={{backgroundColor: d.color}}></div>
                          <span className="text-gray-600 font-medium">{d.name}</span>
                      </div>
                      <span className="font-bold text-gray-800">{d.value}</span>
                  </div>
              ))}
          </div>
        </div>
      </div>

      {/* --- SEZIONE CALENDARIO --- */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg md:rounded-none overflow-hidden">
        <div className="p-4 bg-black text-white flex justify-between items-center">
            <div className="flex items-center gap-2">
                <CalendarIcon size={20} className="text-red-600" />
                <h3 className="font-bold uppercase tracking-wide">Calendario Attività</h3>
            </div>
            <div className="flex items-center gap-4">
                <button onClick={handlePrevMonth} className="hover:text-red-500 transition-colors"><ChevronLeft size={24}/></button>
                <span className="font-bold text-lg min-w-[150px] text-center select-none">{calendarMonthName}</span>
                <button onClick={handleNextMonth} className="hover:text-red-500 transition-colors"><ChevronRight size={24}/></button>
            </div>
        </div>

        <div className="p-4 md:p-6 overflow-x-auto">
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
                        <div key={`blank-${i}`} className="bg-gray-50 h-32"></div>
                    ))}
                    
                    {daysArray.map(day => {
                        const dayReminders = getRemindersForDay(day);
                        const isCurrentDay = isToday(day);

                        return (
                            <div key={`day-${day}`} className={`bg-white h-32 p-2 relative hover:bg-gray-50 transition-colors flex flex-col gap-1 ${isCurrentDay ? 'ring-2 ring-inset ring-red-600 z-10' : ''}`}>
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
                                                className={`text-[10px] p-1 rounded cursor-pointer border truncate transition-all hover:opacity-80 flex items-center gap-1
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
            
            <div className="mt-4 flex gap-4 text-xs text-gray-500 font-medium">
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-red-600 rounded-sm"></div> Scaduto / Urgente</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-orange-50 border border-orange-200 rounded-sm"></div> In Programma</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-green-50 border border-green-200 rounded-sm"></div> Completato</div>
            </div>
        </div>
      </div>
    </div>
  );
};
