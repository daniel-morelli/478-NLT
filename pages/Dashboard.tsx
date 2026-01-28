
import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { DbService } from '../services/dbService';
import { Practice, DealStatus, CreditStatus, OrderStatus, Reminder, Agent } from '../types';
import { useNavigate } from 'react-router-dom';
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
  Cell,
  Legend
} from 'recharts';
import { Clock, AlertCircle, User, Car, AlertTriangle, ChevronRight, Database } from 'lucide-react';

const MESI_FULL = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
];

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [practices, setPractices] = useState<Practice[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  
  const today = new Date();
  const [filterYear, setFilterYear] = useState(today.getFullYear());
  const [filterMonth, setFilterMonth] = useState<number | 'all'>(today.getMonth());
  const [filterAgent, setFilterAgent] = useState<string>('all');

  useEffect(() => {
    if (user) {
      const fetchData = async () => {
          try {
              const practicesData = await DbService.getPractices(user);
              setPractices(practicesData);
              
              if (user.isAdmin || user.isTeamLeader) {
                  const agentsData = await DbService.getAllAgents(true);
                  setAgents(agentsData.filter(a => a.isAgent));
              }

              if (practicesData.length > 0) {
                  const pIds = practicesData.map(p => p.id);
                  const remindersData = await DbService.getRemindersForPractices(pIds);
                  setReminders(remindersData);
              }
          } catch (e) {
              console.error("Errore caricamento dashboard:", e);
          } finally {
              setLoading(false);
          }
      };
      fetchData();
    }
  }, [user]);

  const filteredPractices = useMemo(() => {
    return practices.filter(p => {
      const pDate = new Date(p.data);
      const sameYear = pDate.getFullYear() === filterYear;
      const sameAgent = filterAgent === 'all' || p.agentId === filterAgent;
      
      let sameMonth = true;
      if (filterMonth !== 'all') {
          sameMonth = pDate.getMonth() === filterMonth;
      }

      return sameYear && sameMonth && sameAgent;
    });
  }, [practices, filterYear, filterMonth, filterAgent]);

  const totalPotenzialiVeicoli = useMemo(() => {
    return filteredPractices.reduce((acc, curr) => acc + (curr.numeroVeicoli || 0), 0);
  }, [filteredPractices]);

  const expiredRemindersCount = useMemo(() => {
    return reminders.filter(r => {
        const isScaduto = r.status === 'aperto' && new Date(r.expirationDate) < today;
        if (filterAgent === 'all') return isScaduto;
        const p = practices.find(prac => prac.id === r.practiceId);
        return isScaduto && p?.agentId === filterAgent;
    }).length;
  }, [reminders, practices, filterAgent, today]);

  const futureRemindersCount = useMemo(() => {
    return reminders.filter(r => {
        const isAperto = r.status === 'aperto' && new Date(r.expirationDate) >= today;
        if (filterAgent === 'all') return isAperto;
        const p = practices.find(prac => prac.id === r.practiceId);
        return isAperto && p?.agentId === filterAgent;
    }).length;
  }, [reminders, practices, filterAgent, today]);

  const handleFilterClick = (type: string, value: string) => {
      let query = `?filterType=${type}&filterValue=${encodeURIComponent(value)}`;
      if (filterAgent !== 'all') query += `&agentId=${filterAgent}`;
      navigate(`/practices${query}`);
  };

  const monthlyChartData = useMemo(() => {
    const data = Array(12).fill(0).map((_, i) => ({
      name: new Date(0, i).toLocaleString('it-IT', { month: 'short' }).toUpperCase(),
      trattativa: 0,
      affidamento: 0,
      ordine: 0,
      listinoTrattativa: 0,
      listinoAffidamento: 0,
      listinoOrdine: 0,
      isCurrent: filterMonth !== 'all' && i === filterMonth
    }));
    
    practices.forEach(p => {
      const date = new Date(p.data);
      const sameAgent = filterAgent === 'all' || p.agentId === filterAgent;
      if (date.getFullYear() === filterYear && sameAgent) {
        const month = date.getMonth();
        if (!isNaN(month)) {
            data[month].trattativa += (p.valoreTotale || 0);
            data[month].affidamento += (p.valoreProvvigioneAffidamento || 0);
            data[month].ordine += (p.valoreProvvigioneTotale || 0);
            data[month].listinoTrattativa += (p.valoreListinoTrattativa || 0);
            data[month].listinoAffidamento += (p.valoreListinoAffidamento || 0);
            data[month].listinoOrdine += (p.valoreListinoOrdinato || 0);
        }
      }
    });
    return data;
  }, [practices, filterYear, filterMonth, filterAgent]);

  const practiceStatusData = useMemo(() => [
    { name: 'In Corso', value: filteredPractices.filter(p => p.statoTrattativa === DealStatus.IN_CORSO).length, color: '#dc2626' }, 
    { name: 'Chiuse Positivamente', value: filteredPractices.filter(p => p.statoTrattativa === DealStatus.CHIUSA).length, color: '#171717' },  
    { name: 'Perse / Fallite', value: filteredPractices.filter(p => p.statoTrattativa === DealStatus.FALLITA).length, color: '#94a3b8' },
  ].filter(d => d.value > 0), [filteredPractices]);

  const creditStatusData = useMemo(() => [
    { name: 'In Attesa', value: filteredPractices.filter(p => p.statoAffidamento === CreditStatus.IN_ATTESA).length, color: '#f59e0b' },
    { name: 'Bocciati', value: filteredPractices.filter(p => p.statoAffidamento === CreditStatus.BOCCIATO).length, color: '#be123c' },
    { name: 'Approvati', value: filteredPractices.filter(p => p.statoAffidamento === CreditStatus.APPROVATO || p.statoAffidamento === CreditStatus.APPROVATO_CON_CONDIZIONI).length, color: '#10b981' },
  ].filter(d => d.value > 0), [filteredPractices]);

  const orderStatusData = useMemo(() => [
    { name: 'Inviati', value: filteredPractices.filter(p => p.statoOrdine === OrderStatus.INVIATO).length, color: '#059669' },
    { name: 'Non Inviati', value: filteredPractices.filter(p => p.statoOrdine === OrderStatus.NON_INVIATO).length, color: '#64748b' },
    { name: 'Annullati', value: filteredPractices.filter(p => p.statoOrdine === OrderStatus.ANNULLATO).length, color: '#e11d48' },
  ].filter(d => d.value > 0), [filteredPractices]);

  if (loading) return <div className="text-center py-10 text-gray-500">Caricamento dati...</div>;
  if (!user) return null;

  const DetailBox = ({ title, items, type, chartData }: { title: string, items: {label: string, value: number, filterVal: string}[], type: string, chartData: any[] }) => (
    <div className="bg-white border border-gray-200 shadow-sm overflow-hidden flex flex-col h-full rounded-2xl transition-all hover:shadow-md">
        <div className="bg-black text-white px-4 py-3 text-[10px] font-black uppercase tracking-[0.2em] flex justify-between items-center">
            {title}
            <ChevronRight size={14} className="text-red-600" />
        </div>
        <div className="p-5 flex-1 flex flex-col">
            <div className="space-y-3 mb-6">
                {items.map((item, idx) => (
                    <div 
                        key={idx} 
                        onClick={() => handleFilterClick(type, item.filterVal)}
                        className="flex justify-between items-center cursor-pointer group hover:bg-red-50 p-2 -mx-2 transition-colors border-b border-gray-50 last:border-0 rounded-lg"
                    >
                        <span className="text-gray-500 text-[11px] font-bold uppercase tracking-wider group-hover:text-red-700 transition-colors">{item.label}</span>
                        <span className="font-black text-gray-900 text-sm group-hover:scale-110 transition-transform">
                            {item.value}
                        </span>
                    </div>
                ))}
            </div>
            
            <div className="h-44 w-full relative mt-auto border-t border-gray-100 pt-4">
                {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={45}
                                outerRadius={65}
                                paddingAngle={4}
                                dataKey="value"
                                stroke="none"
                            >
                                {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                            </Pie>
                            <Tooltip 
                                contentStyle={{backgroundColor: '#171717', color: '#fff', borderRadius: '12px', border: 'none', fontSize: '10px', fontWeight: 'bold'}} 
                                itemStyle={{color: '#fff'}}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex items-center justify-center h-full text-[10px] text-gray-300 uppercase font-black tracking-widest italic text-center px-4">Nessun dato corrispondente ai filtri</div>
                )}
            </div>
        </div>
    </div>
  );

  return (
    <div className="space-y-6 md:space-y-8 pb-20">
      {practices.length === 0 && (
          <div className="bg-amber-50 border-l-4 border-amber-500 p-6 flex items-start gap-4 rounded-xl">
              <Database className="text-amber-500 flex-shrink-0" size={24} />
              <div>
                  <h3 className="font-bold text-amber-900 uppercase text-xs tracking-widest mb-1">
                    {(user.isAdmin || user.isTeamLeader) ? "Database Globale Vuoto" : "Nessuna pratica trovata"}
                  </h3>
                  <p className="text-amber-800 text-sm">
                      {(user.isAdmin || user.isTeamLeader) 
                        ? "Non risultano pratiche caricate nel sistema da nessun agente. Se ritieni sia un errore, verifica i permessi su Supabase."
                        : "Il tuo archivio personale risulta vuoto. Inizia inserendo la tua prima pratica di noleggio."}
                  </p>
                  <button onClick={() => navigate('/practices/new')} className="mt-4 bg-amber-600 text-white px-4 py-2 text-xs font-bold uppercase tracking-widest hover:bg-amber-700 rounded-lg">
                      Inserisci Nuova Pratica
                  </button>
              </div>
          </div>
      )}

      {/* 1. FILTERS SECTION */}
      <div className="bg-white p-4 border border-gray-200 shadow-sm flex flex-col lg:flex-row justify-between items-center gap-4 rounded-2xl">
        <div className="flex items-center gap-3">
            <div className="bg-red-600 w-1 h-8 rounded-full"></div>
            <div>
                <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest leading-none mb-1">
                    {(user.isAdmin || user.isTeamLeader) ? "Monitoraggio Rete" : "Le Mie Performance"}
                </h2>
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Filtri globali dashboard</p>
            </div>
        </div>
        
        <div className="flex flex-wrap gap-2 w-full lg:w-auto">
            {(user.isAdmin || user.isTeamLeader) && (
                <div className="relative flex-1 lg:flex-none">
                    <select 
                        value={filterAgent}
                        onChange={(e) => setFilterAgent(e.target.value)}
                        className="w-full lg:w-48 bg-white border border-gray-300 px-3 py-2 text-[10px] font-bold uppercase tracking-widest outline-none focus:ring-1 focus:ring-red-600 text-gray-900 appearance-none rounded-xl"
                    >
                        <option value="all">TUTTI GLI AGENTI</option>
                        {agents.map(a => <option key={a.id} value={a.id}>{a.nome.toUpperCase()}</option>)}
                    </select>
                </div>
            )}

            <select 
                value={filterMonth} 
                onChange={(e) => setFilterMonth(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="flex-1 lg:w-32 bg-white border border-gray-300 px-3 py-2 text-[10px] font-bold uppercase tracking-widest outline-none focus:ring-1 focus:ring-red-600 text-gray-900 rounded-xl"
            >
                <option value="all">TUTTI I MESI</option>
                {MESI_FULL.map((m, i) => <option key={i} value={i}>{m.toUpperCase()}</option>)}
            </select>
            
            <select 
                value={filterYear} 
                onChange={(e) => setFilterYear(Number(e.target.value))}
                className="flex-1 lg:w-24 bg-white border border-gray-300 px-3 py-2 text-[10px] font-bold uppercase tracking-widest outline-none focus:ring-1 focus:ring-red-600 text-gray-900 rounded-xl"
            >
                {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
        </div>
      </div>

      {/* 2. TOP KPI ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <div 
            onClick={() => handleFilterClick('reminder', 'future')}
            className="bg-white border border-gray-200 border-l-4 border-l-red-600 p-6 shadow-sm flex flex-col justify-center min-h-[110px] cursor-pointer group hover:bg-gray-50 transition-all rounded-2xl"
          >
              <div className="flex flex-col">
                  <span className="text-red-600 font-black uppercase text-[9px] tracking-widest mb-1">In Programma</span>
                  <h4 className="text-gray-900 font-black text-2xl tracking-tight uppercase leading-none">Scadenze: {futureRemindersCount}</h4>
              </div>
          </div>

          <div 
            onClick={() => handleFilterClick('reminder', 'expired')}
            className="bg-white border border-gray-200 p-6 shadow-sm flex items-center justify-between min-h-[110px] cursor-pointer group hover:bg-gray-50 transition-all rounded-2xl"
          >
              <div className="flex items-center gap-4">
                  <div className="bg-red-600 text-white p-3.5 shadow-lg group-hover:scale-105 transition-transform rounded-xl">
                      <Car size={24} />
                  </div>
                  <div className="flex flex-col">
                      <span className="text-gray-400 font-black uppercase text-[9px] tracking-widest mb-1">Azioni Critiche</span>
                      <h4 className="text-gray-900 font-black text-2xl tracking-tight leading-none uppercase">Scaduti: {expiredRemindersCount}</h4>
                  </div>
              </div>
          </div>

          <div className="bg-white border border-gray-200 p-6 shadow-sm flex items-center justify-between min-h-[110px] group hover:bg-gray-50 transition-all rounded-2xl">
              <div className="flex flex-col">
                  <span className="text-red-600 font-black uppercase text-[9px] tracking-widest mb-1">Opportunità</span>
                  <h4 className="text-gray-900 font-black text-2xl tracking-tight leading-none uppercase">Veicoli: {totalPotenzialiVeicoli}</h4>
              </div>
              <div className="bg-black text-white p-3.5 shadow-lg group-hover:bg-red-600 transition-all rounded-xl">
                  <AlertCircle size={24} />
              </div>
          </div>
      </div>

      {/* 3. DETAIL BOXES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <DetailBox 
            title="SITUAZIONE TRATTATIVE" 
            type="statoTrattativa"
            chartData={practiceStatusData}
            items={[
                { label: 'In Corso', value: filteredPractices.filter(p => p.statoTrattativa === DealStatus.IN_CORSO).length, filterVal: DealStatus.IN_CORSO },
                { label: 'Chiuse Positivamente', value: filteredPractices.filter(p => p.statoTrattativa === DealStatus.CHIUSA).length, filterVal: DealStatus.CHIUSA },
                { label: 'Perse / Fallite', value: filteredPractices.filter(p => p.statoTrattativa === DealStatus.FALLITA).length, filterVal: DealStatus.FALLITA },
            ]}
        />
        <DetailBox 
            title="SITUAZIONE AFFIDAMENTI" 
            type="statoAffidamento"
            chartData={creditStatusData}
            items={[
                { label: 'In Attesa Esito', value: filteredPractices.filter(p => p.statoAffidamento === CreditStatus.IN_ATTESA).length, filterVal: CreditStatus.IN_ATTESA },
                { label: 'Approvati (Totali)', value: filteredPractices.filter(p => p.statoAffidamento === CreditStatus.APPROVATO || p.statoAffidamento === CreditStatus.APPROVATO_CON_CONDIZIONI).length, filterVal: CreditStatus.APPROVATO },
                { label: 'Bocciati / Negati', value: filteredPractices.filter(p => p.statoAffidamento === CreditStatus.BOCCIATO).length, filterVal: DealStatus.FALLITA },
            ]}
        />
        <DetailBox 
            title="SITUAZIONE ORDINI" 
            type="statoOrdine"
            chartData={orderStatusData}
            items={[
                { label: 'Ordini Inviati', value: filteredPractices.filter(p => p.statoOrdine === OrderStatus.INVIATO).length, filterVal: OrderStatus.INVIATO },
                { label: 'In Attesa Invio', value: filteredPractices.filter(p => p.statoOrdine === OrderStatus.NON_INVIATO).length, filterVal: OrderStatus.NON_INVIATO },
                { label: 'Ordini Annullati', value: filteredPractices.filter(p => p.statoOrdine === OrderStatus.ANNULLATO).length, filterVal: OrderStatus.ANNULLATO },
            ]}
        />
      </div>

      {/* 4. CHARTS SECTION */}
      <div className="space-y-8">
        <div className="bg-white p-6 shadow-sm border border-gray-200 rounded-2xl">
          <div className="flex justify-between items-center mb-8 border-b border-gray-100 pb-4">
              <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">Andamento Provvigionale {filterYear}</h3>
              <div className="text-[9px] font-bold text-gray-400 italic uppercase">Dati espressi in Euro (€)</div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyChartData}>
                <CartesianGrid strokeDasharray="2 2" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 9, fontWeight: 'bold'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 9}} tickFormatter={(val) => `€${val/1000}k`} />
                <Tooltip 
                  cursor={{fill: '#fef2f2', radius: 8}}
                  contentStyle={{backgroundColor: '#000', color: '#fff', borderRadius: '12px', border: 'none', fontWeight: 'bold', fontSize: '10px'}}
                  formatter={(value: number, name: string) => [`€ ${value.toLocaleString('it-IT')}`, name.toUpperCase()]}
                />
                <Legend verticalAlign="top" align="right" wrapperStyle={{fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', paddingBottom: '20px'}} />
                <Bar dataKey="trattativa" name="Trattativa" fill="#dc2626" radius={[4, 4, 0, 0]} />
                <Bar dataKey="affidamento" name="Affidamento" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="ordine" name="Ordine" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
