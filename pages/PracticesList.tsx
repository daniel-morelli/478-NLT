import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { DbService } from '../services/dbService';
import { Practice, DealStatus, Reminder } from '../types';
import * as ReactRouterDOM from 'react-router-dom';
import { Plus, Search, Filter, ArrowRight, X, User, Calendar, Briefcase } from 'lucide-react';

const { Link, useSearchParams } = ReactRouterDOM;

export const PracticesList: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [practices, setPractices] = useState<Practice[]>([]);
  const [filtered, setFiltered] = useState<Practice[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Filtri da URL
  const filterType = searchParams.get('filterType');
  const filterValue = searchParams.get('filterValue');

  // Filtro locale stato trattativa (dropdown)
  const [localStatusFilter, setLocalStatusFilter] = useState('all');

  useEffect(() => {
    if (user) {
      DbService.getPractices(user).then(async (data) => {
        setPractices(data);
        
        if (filterType === 'reminder') {
            const pIds = data.map(p => p.id);
            const reminders = await DbService.getRemindersForPractices(pIds);
            applyFilters(data, reminders);
        } else {
            applyFilters(data, []);
        }
        setLoading(false);
      });
    }
  }, [user, filterType, filterValue]);

  useEffect(() => {
    if (!loading) {
       applyFilters(practices, []); 
    }
  }, [search, localStatusFilter]);

  const applyFilters = async (allPractices: Practice[], loadedReminders: Reminder[]) => {
    let res = allPractices;

    if (filterType && filterValue) {
        if (filterType === 'statoTrattativa') {
            res = res.filter(p => p.statoTrattativa === filterValue);
        } else if (filterType === 'statoAffidamento') {
            res = res.filter(p => p.statoAffidamento === filterValue);
        } else if (filterType === 'statoOrdine') {
            res = res.filter(p => p.statoOrdine === filterValue);
        } else if (filterType === 'reminder') {
            let currentReminders = loadedReminders;
            if (currentReminders.length === 0 && practices.length > 0) {
                 const pIds = allPractices.map(p => p.id);
                 currentReminders = await DbService.getRemindersForPractices(pIds);
            }

            const now = new Date();
            if (filterValue === 'future') {
                const practiceIdsWithFuture = new Set(
                    currentReminders
                        .filter(r => r.status === 'aperto' && new Date(r.expirationDate) >= now)
                        .map(r => r.practiceId)
                );
                res = res.filter(p => practiceIdsWithFuture.has(p.id));
            } else if (filterValue === 'expired') {
                const practiceIdsWithExpired = new Set(
                    currentReminders
                        .filter(r => r.status === 'aperto' && new Date(r.expirationDate) < now)
                        .map(r => r.practiceId)
                );
                res = res.filter(p => practiceIdsWithExpired.has(p.id));
            }
        }
    } else {
        if (localStatusFilter !== 'all') {
            res = res.filter(p => p.statoTrattativa === localStatusFilter);
        }
    }

    if (search) {
      const s = search.toLowerCase();
      res = res.filter(p => p.cliente.toLowerCase().includes(s) || p.provider.toLowerCase().includes(s));
    }

    setFiltered(res);
  };

  const clearDashboardFilter = () => {
      setSearchParams({});
      setLocalStatusFilter('all');
  };

  const getStatusColor = (status: string) => {
    if (!status) return 'bg-gray-100 text-gray-400 border border-gray-200';
    if (status === DealStatus.IN_CORSO) return 'bg-red-50 text-red-700 border border-red-100'; 
    if (status === DealStatus.CHIUSA) return 'bg-black text-white border border-black'; 
    if (status === DealStatus.FALLITA) return 'bg-gray-200 text-gray-600 border border-gray-300'; 
    if (status.includes('Esitato')) return 'bg-green-50 text-green-700 border border-green-200';
    if (status.includes('Bocciato')) return 'bg-red-100 text-red-800 border border-red-200';
    return 'bg-white text-gray-700 border border-gray-200';
  };

  const StatusBadge = ({ status, label }: { status: string, label?: string }) => (
    <div className="flex flex-col gap-1">
        {label && <span className="text-[10px] uppercase text-gray-400 font-bold">{label}</span>}
        <span className={`w-fit px-2 py-1 text-[10px] md:text-xs font-bold uppercase tracking-wider rounded ${getStatusColor(status)}`}>
        {status || '-'}
        </span>
    </div>
  );

  if (loading) return <div className="p-8 text-center text-gray-500">Caricamento elenco...</div>;

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

      {filterType && (
          <div className="bg-black text-white p-4 flex justify-between items-center shadow-md border-l-4 border-red-600 rounded md:rounded-none">
              <div className="flex items-center gap-2">
                  <Filter size={18} className="text-red-500 flex-shrink-0"/>
                  <div className="font-bold uppercase tracking-wide text-xs md:text-sm">
                      Filtro: 
                      <span className="text-red-400 ml-1 block md:inline">
                          {filterType === 'reminder' 
                            ? (filterValue === 'future' ? 'Promemoria Futuri' : 'Promemoria Scaduti')
                            : filterValue}
                      </span>
                  </div>
              </div>
              <button onClick={clearDashboardFilter} className="text-gray-400 hover:text-white flex items-center gap-1 text-xs font-bold uppercase whitespace-nowrap ml-4">
                  <X size={14}/> <span className="hidden md:inline">Rimuovi</span>
              </button>
          </div>
      )}

      <div className="bg-white p-4 shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4 rounded md:rounded-none">
        <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
                type="text" 
                placeholder="Cerca cliente..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 focus:ring-2 focus:ring-red-600 focus:border-red-600 outline-none text-gray-800 rounded md:rounded-none text-sm md:text-base"
            />
        </div>
        
        {!filterType && (
            <div className="flex items-center gap-2">
                <select 
                    value={localStatusFilter} 
                    onChange={(e) => setLocalStatusFilter(e.target.value)}
                    className="w-full md:w-auto border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-red-600 bg-white text-gray-700 font-medium rounded md:rounded-none text-sm md:text-base"
                >
                    <option value="all">Tutti gli stati</option>
                    {Object.values(DealStatus).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>
        )}
      </div>

      {/* VIEW MOBILE: CARDS */}
      <div className="md:hidden space-y-4">
        {filtered.map(practice => (
            <div key={practice.id} className="bg-white border border-gray-200 p-5 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                    <div>
                         {(user?.isAdmin || !user?.isAgent) && (
                            <div className="flex items-center gap-1 text-xs text-gray-500 font-bold uppercase mb-1">
                                <User size={12} /> {practice.agentName}
                            </div>
                         )}
                        <h3 className="font-bold text-lg text-gray-900 leading-tight">{practice.cliente}</h3>
                        <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-gray-500 flex items-center gap-1"><Calendar size={12}/> {new Date(practice.data).toLocaleDateString()}</span>
                            <span className="text-xs text-gray-500 flex items-center gap-1"><Briefcase size={12}/> {practice.provider}</span>
                        </div>
                    </div>
                </div>
                
                <div className="grid grid-cols-2 gap-y-3 gap-x-2 mb-4">
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

      {/* VIEW DESKTOP/TABLET: TABLE */}
      <div className="hidden md:block bg-white shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-black text-white">
              <tr>
                {(user?.isAdmin || !user?.isAgent) && (
                    <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider text-gray-300">Agente</th>
                )}
                <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider text-gray-300">Cliente</th>
                <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider text-gray-300">Data</th>
                <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider text-gray-300">Provider</th>
                <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider text-gray-300">Trattativa</th>
                <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider text-gray-300">Affidamento</th>
                <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider text-gray-300">Ordine</th>
                <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider text-gray-300 text-right">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((practice) => (
                <tr key={practice.id} className="hover:bg-red-50 transition-colors group">
                  {(user?.isAdmin || !user?.isAgent) && (
                      <td className="px-6 py-4 text-sm font-bold text-gray-500">{practice.agentName}</td>
                  )}
                  <td className="px-6 py-4 font-bold text-gray-900">{practice.cliente}</td>
                  <td className="px-6 py-4 text-gray-600 text-sm font-medium">{new Date(practice.data).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-gray-700">{practice.provider}</td>
                  
                  <td className="px-6 py-4"><StatusBadge status={practice.statoTrattativa} /></td>
                  <td className="px-6 py-4"><StatusBadge status={practice.statoAffidamento} /></td>
                  <td className="px-6 py-4"><StatusBadge status={practice.statoOrdine} /></td>

                  <td className="px-6 py-4 text-right">
                    <Link 
                      to={`/practices/${practice.id}`}
                      className="inline-flex items-center gap-1 text-gray-400 hover:text-red-600 font-bold uppercase text-xs transition-colors"
                    >
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
            Nessuna pratica trovata.
        </div>
      )}
    </div>
  );
};