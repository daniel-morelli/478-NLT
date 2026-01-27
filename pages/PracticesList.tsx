
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { DbService } from '../services/dbService';
import { Practice, DealStatus, CreditStatus, OrderStatus, Reminder, Agent } from '../types';
// Changed from namespace import to named imports to fix type errors
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Search, Filter, ArrowRight, X, User, Calendar, Briefcase } from 'lucide-react';

// Utility per formattazione valuta IT
const formatIT = (val: number | undefined): string => {
  if (val === undefined || val === null) return '€ 0,00';
  return '€ ' + new Intl.NumberFormat('it-IT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);
};

export const PracticesList: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [practices, setPractices] = useState<Practice[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [filtered, setFiltered] = useState<Practice[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [localYearFilter, setLocalYearFilter] = useState('all');
  const [localAgentFilter, setLocalAgentFilter] = useState('all');

  useEffect(() => {
    const saved = sessionStorage.getItem('nlt_filters');
    if (saved && !searchParams.toString()) {
        const parsed = JSON.parse(saved);
        setSearch(parsed.search || '');
        setLocalYearFilter(parsed.year || 'all');
        setLocalAgentFilter(parsed.agent || 'all');
    }
  }, []);

  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        const data = await DbService.getPractices(user);
        setPractices(data);
        
        if (user.isAdmin || user.isTeamLeader) {
            const agentsData = await DbService.getAllAgents(true);
            setAgents(agentsData.filter(a => a.isAgent));
        }

        const filterType = searchParams.get('filterType');
        const filterValue = searchParams.get('filterValue');
        const agentIdParam = searchParams.get('agentId');

        if (agentIdParam) setLocalAgentFilter(agentIdParam);

        if (filterType === 'reminder') {
            const pIds = data.map(p => p.id);
            const reminders = await DbService.getRemindersForPractices(pIds);
            applyFilters(data, reminders);
        } else {
            applyFilters(data, []);
        }
        setLoading(false);
      };
      fetchData();
    }
  }, [user, searchParams]);

  useEffect(() => {
    if (!loading) {
       applyFilters(practices, []); 
       sessionStorage.setItem('nlt_filters', JSON.stringify({
           search,
           year: localYearFilter,
           agent: localAgentFilter
       }));
    }
  }, [search, localYearFilter, localAgentFilter]);

  const applyFilters = async (allPractices: Practice[], loadedReminders: Reminder[]) => {
    let res = allPractices;
    const filterType = searchParams.get('filterType');
    const filterValue = searchParams.get('filterValue');

    if (filterType && filterValue) {
        if (filterType === 'statoTrattativa') res = res.filter(p => p.statoTrattativa === filterValue);
        else if (filterType === 'statoAffidamento') res = res.filter(p => p.statoAffidamento === filterValue);
        else if (filterType === 'statoOrdine') res = res.filter(p => p.statoOrdine === filterValue);
        else if (filterType === 'reminder') {
            let currentReminders = loadedReminders;
            if (currentReminders.length === 0 && practices.length > 0) {
                 const pIds = allPractices.map(p => p.id);
                 currentReminders = await DbService.getRemindersForPractices(pIds);
            }
            const now = new Date();
            const filteredIds = new Set(
                currentReminders
                    .filter(r => r.status === 'aperto' && (filterValue === 'future' ? new Date(r.expirationDate) >= now : new Date(r.expirationDate) < now))
                    .map(r => r.practiceId)
            );
            res = res.filter(p => filteredIds.has(p.id));
        }
    } else {
        if (localYearFilter !== 'all') {
            res = res.filter(p => new Date(p.data).getFullYear().toString() === localYearFilter);
        }
        if (localAgentFilter !== 'all') res = res.filter(p => p.agentId === localAgentFilter);
    }

    if (search) {
      const s = search.toLowerCase();
      res = res.filter(p => p.cliente.toLowerCase().includes(s) || p.provider.toLowerCase().includes(s));
    }

    setFiltered(res);
  };

  const clearDashboardFilter = () => {
      setSearchParams({});
      setLocalYearFilter('all');
      setLocalAgentFilter('all');
      setSearch('');
      sessionStorage.removeItem('nlt_filters');
  };

  const getStatusStyles = (status: string) => {
    const base = "inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tight border transition-all duration-200 whitespace-nowrap max-w-fit";
    if (!status) return { className: `${base} bg-gray-50 text-gray-400 border-gray-100` };
    if (status === DealStatus.IN_CORSO) return { className: `${base} bg-orange-50 text-orange-700 border-orange-200` };
    if (status === DealStatus.CHIUSA) return { className: `${base} bg-emerald-50 text-emerald-700 border-emerald-200` };
    if (status === DealStatus.FALLITA) return { className: `${base} bg-slate-100 text-slate-600 border-slate-200` };
    if (status === CreditStatus.IN_ATTESA) return { className: `${base} bg-amber-50 text-amber-700 border-amber-200` };
    if (status === CreditStatus.BOCCIATO) return { className: `${base} bg-rose-50 text-rose-700 border-rose-200` };
    if (status === CreditStatus.APPROVATO) return { className: `${base} bg-emerald-50 text-emerald-700 border-emerald-200` };
    if (status === CreditStatus.APPROVATO_CON_CONDIZIONI) return { className: `${base} bg-sky-50 text-sky-700 border-sky-200` };
    if (status === OrderStatus.INVIATO) return { className: `${base} bg-emerald-50 text-emerald-700 border-emerald-200` };
    if (status === OrderStatus.NON_INVIATO) return { className: `${base} bg-slate-50 text-slate-500 border-slate-200` };
    if (status === OrderStatus.ANNULLATO) return { className: `${base} bg-rose-50 text-rose-700 border-rose-200` };
    return { className: `${base} bg-white text-gray-700 border-gray-200` };
  };

  const StatusBadge = ({ status, label }: { status: string, label?: string }) => {
    const styles = getStatusStyles(status);
    return (
      <div className="flex flex-col gap-1 items-start">
          {label && <span className="text-[9px] uppercase text-gray-400 font-bold ml-1">{label}</span>}
          <div className={styles.className}>{status || 'Da Definire'}</div>
      </div>
    );
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Caricamento elenco...</div>;
  if (!user) return null;

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Elenco Pratiche</h2>
            <p className="text-sm text-gray-500">Gestione operativa</p>
        </div>
        <Link 
          to="/practices/new" 
          className="w-full md:w-auto text-center flex items-center justify-center gap-2 bg-red-600 text-white px-5 py-3 hover:bg-red-700 shadow-lg shadow-red-900/20 transition-all transform active:scale-95 font-bold uppercase text-sm tracking-wide rounded md:rounded-none"
        >
          <Plus size={18} />
          Nuova Pratica
        </Link>
      </div>

      {(searchParams.get('filterType') || localYearFilter !== 'all' || localAgentFilter !== 'all' || search) && (
          <div className="bg-black text-white p-4 flex justify-between items-center shadow-md border-l-4 border-red-600 rounded md:rounded-none">
              <div className="flex items-center gap-2">
                  <Filter size={18} className="text-red-500 flex-shrink-0"/>
                  <div className="font-bold uppercase tracking-wide text-xs md:text-sm">
                      Filtri Attivi
                  </div>
              </div>
              <button onClick={clearDashboardFilter} className="text-gray-400 hover:text-white flex items-center gap-1 text-xs font-bold uppercase whitespace-nowrap ml-4">
                  <X size={14}/> Rimuovi Filtri
              </button>
          </div>
      )}

      <div className="bg-white p-4 shadow-sm border border-gray-200 flex flex-col lg:flex-row gap-4 rounded md:rounded-none">
        <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
                type="text" 
                placeholder="Cerca cliente o provider..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 focus:ring-2 focus:ring-red-600 focus:border-red-600 outline-none text-gray-800 rounded md:rounded-none text-sm"
            />
        </div>
        
        <div className="flex flex-col md:flex-row gap-2">
            <select 
                value={localYearFilter} 
                onChange={(e) => setLocalYearFilter(e.target.value)}
                className="w-full md:w-auto border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-red-600 bg-white text-gray-700 font-medium rounded md:rounded-none text-sm"
            >
                <option value="all">Filtra per Anno</option>
                <option value="2024">2024</option>
                <option value="2025">2025</option>
                <option value="2026">2026</option>
            </select>

            {(user.isAdmin || user.isTeamLeader) && (
                <select 
                    value={localAgentFilter} 
                    onChange={(e) => setLocalAgentFilter(e.target.value)}
                    className="w-full md:w-auto border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-red-600 bg-white text-gray-700 font-medium rounded md:rounded-none text-sm"
                >
                    <option value="all">Tutti gli Agenti</option>
                    {agents.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
                </select>
            )}
        </div>
      </div>

      <div className="md:hidden space-y-4">
        {filtered.map(practice => (
            <div key={practice.id} className="bg-white border border-gray-200 p-5 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                    <div>
                         {(user?.isAdmin || user?.isTeamLeader) && (
                            <div className="flex items-center gap-1 text-[10px] text-red-600 font-black uppercase mb-1">
                                <User size={10} /> {practice.agentName}
                            </div>
                         )}
                        <h3 className="font-bold text-lg text-gray-900 leading-tight">{practice.cliente}</h3>
                        <div className="flex flex-wrap items-center gap-3 mt-1">
                            <span className="text-xs text-gray-500 flex items-center gap-1"><Calendar size={12}/> {new Date(practice.data).toLocaleDateString()}</span>
                            <span className="text-xs text-gray-500 flex items-center gap-1"><Briefcase size={12}/> {practice.provider}</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-[10px] font-bold text-gray-400 uppercase">Val. Totale</div>
                        <div className="text-sm font-bold text-gray-900">{formatIT(practice.valoreTotale)}</div>
                    </div>
                </div>
                
                <div className="grid grid-cols-2 gap-y-4 gap-x-2 mb-4">
                    <StatusBadge label="Trattativa" status={practice.statoTrattativa} />
                    <StatusBadge label="Affidamento" status={practice.statoAffidamento} />
                    <StatusBadge label="Ordine" status={practice.statoOrdine} />
                </div>

                <Link 
                  to={`/practices/${practice.id}`}
                  className="flex items-center justify-center gap-2 w-full bg-gray-50 text-gray-700 py-3 border border-gray-200 rounded font-bold uppercase text-xs hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                >
                  Gestisci Pratica <ArrowRight size={14} />
                </Link>
            </div>
        ))}
      </div>

      <div className="hidden md:block bg-white shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-black text-white">
              <tr>
                {(user?.isAdmin || user?.isTeamLeader) && (
                    <th className="px-6 py-4 font-bold uppercase text-[11px] tracking-wider text-gray-300">Agente</th>
                )}
                <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider text-gray-300">Cliente</th>
                <th className="px-6 py-4 font-bold uppercase text-[11px] tracking-wider text-gray-300 text-right">Prov. Totale</th>
                <th className="px-6 py-4 font-bold uppercase text-[11px] tracking-wider text-gray-300 text-center">Trattativa</th>
                <th className="px-6 py-4 font-bold uppercase text-[11px] tracking-wider text-gray-300 text-center">Affidamento</th>
                <th className="px-6 py-4 font-bold uppercase text-[11px] tracking-wider text-gray-300 text-center">Ordine</th>
                <th className="px-6 py-4 font-bold uppercase text-[11px] tracking-wider text-gray-300 text-right">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((practice) => (
                <tr key={practice.id} className="hover:bg-gray-50 transition-colors">
                  {(user?.isAdmin || user?.isTeamLeader) && (
                      <td className="px-6 py-4 text-[11px] font-bold text-red-700">{practice.agentName?.toUpperCase()}</td>
                  )}
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-900">{practice.cliente}</div>
                    <div className="text-[10px] text-gray-400 font-medium">{new Date(practice.data).toLocaleDateString()} • {practice.provider}</div>
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-gray-800 text-xs">{formatIT(practice.valoreTotale)}</td>
                  <td className="px-6 py-4 text-center"><StatusBadge status={practice.statoTrattativa} /></td>
                  <td className="px-6 py-4 text-center"><StatusBadge status={practice.statoAffidamento} /></td>
                  <td className="px-6 py-4 text-center"><StatusBadge status={practice.statoOrdine} /></td>
                  <td className="px-6 py-4 text-right">
                    <Link to={`/practices/${practice.id}`} className="inline-flex items-center gap-1 text-gray-400 hover:text-red-600 font-bold uppercase text-[11px] transition-colors">
                      Gestisci <ArrowRight size={14} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {filtered.length === 0 && (
        <div className="p-12 text-center text-gray-400 bg-white border border-gray-200 rounded md:rounded-none">
            Nessuna pratica trovata con i filtri correnti.
        </div>
      )}
    </div>
  );
};
