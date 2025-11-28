import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { DbService } from '../services/dbService';
import { Practice, DealStatus, Reminder } from '../types';
import * as ReactRouterDOM from 'react-router-dom';
import { Plus, Search, Edit2, Filter, ArrowRight, X } from 'lucide-react';

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

  // Filtro locale stato trattativa (dropdown) - se non c'è filtro URL
  const [localStatusFilter, setLocalStatusFilter] = useState('all');

  useEffect(() => {
    if (user) {
      DbService.getPractices(user).then(async (data) => {
        setPractices(data);
        
        // Se il filtro è sui promemoria, dobbiamo caricare anche quelli
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
  }, [user, filterType, filterValue]); // Ricarica/Rifiltra se cambiano params

  useEffect(() => {
    // Filtro locale search/dropdown (client side rapido)
    if (!loading) {
       applyFilters(practices, []); // Passiamo array vuoto reminder, verranno ricaricati solo se filterType lo richiede
    }
  }, [search, localStatusFilter]);

  const applyFilters = async (allPractices: Practice[], loadedReminders: Reminder[]) => {
    let res = allPractices;

    // 1. Filtri da Dashboard (Priorità)
    if (filterType && filterValue) {
        if (filterType === 'statoTrattativa') {
            res = res.filter(p => p.statoTrattativa === filterValue);
        } else if (filterType === 'statoAffidamento') {
            res = res.filter(p => p.statoAffidamento === filterValue);
        } else if (filterType === 'statoOrdine') {
            res = res.filter(p => p.statoOrdine === filterValue);
        } else if (filterType === 'reminder') {
            // Logica filtro promemoria
            const now = new Date();
            
            // Per filtrare correttamente i promemoria, se non li abbiamo passati (es. useEffect search), dobbiamo averli
            // Ma per semplicità, nel useEffect principale li carichiamo. Qui usiamo quelli passati o assumiamo che la logica sia gestita.
            // Se called da useEffect search, loadedReminders è vuoto. 
            // FIX: Se c'è un filtro reminder attivo, dobbiamo sempre avere i reminders.
            
            let currentReminders = loadedReminders;
            if (currentReminders.length === 0 && practices.length > 0) {
                 // Fallback: se stiamo solo cercando nel box search ma c'è un filtro attivo reminder
                 const pIds = allPractices.map(p => p.id);
                 currentReminders = await DbService.getRemindersForPractices(pIds);
            }

            if (filterValue === 'future') {
                // Pratiche che hanno almeno un promemoria aperto e futuro
                const practiceIdsWithFuture = new Set(
                    currentReminders
                        .filter(r => r.status === 'aperto' && new Date(r.expirationDate) >= now)
                        .map(r => r.practiceId)
                );
                res = res.filter(p => practiceIdsWithFuture.has(p.id));
            } else if (filterValue === 'expired') {
                // Pratiche che hanno almeno un promemoria aperto e scaduto
                const practiceIdsWithExpired = new Set(
                    currentReminders
                        .filter(r => r.status === 'aperto' && new Date(r.expirationDate) < now)
                        .map(r => r.practiceId)
                );
                res = res.filter(p => practiceIdsWithExpired.has(p.id));
            }
        }
    } else {
        // Filtro Dropdown Locale (solo se non c'è filtro Dashboard)
        if (localStatusFilter !== 'all') {
            res = res.filter(p => p.statoTrattativa === localStatusFilter);
        }
    }

    // 2. Filtro Ricerca Testuale (Sempre attivo)
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

    // Trattativa
    if (status === DealStatus.IN_CORSO) return 'bg-red-50 text-red-700 border border-red-100'; 
    if (status === DealStatus.CHIUSA) return 'bg-black text-white border border-black'; 
    if (status === DealStatus.FALLITA) return 'bg-gray-200 text-gray-600 border border-gray-300'; 
    
    // Altri stati
    if (status.includes('Esitato')) return 'bg-green-50 text-green-700 border border-green-200';
    if (status.includes('Bocciato')) return 'bg-red-100 text-red-800 border border-red-200';
    
    return 'bg-white text-gray-700 border border-gray-200';
  };

  const StatusBadge = ({ status }: { status: string }) => (
    <span className={`px-2 py-1 text-xs font-bold uppercase tracking-wider ${getStatusColor(status)}`}>
      {status || '-'}
    </span>
  );

  if (loading) return <div className="p-8 text-center text-gray-500">Caricamento elenco...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Elenco Pratiche</h2>
            <p className="text-sm text-gray-500">Gestione operativa</p>
        </div>
        <Link 
          to="/practices/new" 
          className="flex items-center gap-2 bg-red-600 text-white px-5 py-2.5 hover:bg-red-700 shadow-lg shadow-red-900/20 transition-all transform active:scale-95 font-bold uppercase text-sm tracking-wide"
        >
          <Plus size={18} />
          Nuova Pratica
        </Link>
      </div>

      {/* BANNER FILTRO ATTIVO */}
      {filterType && (
          <div className="bg-black text-white p-4 flex justify-between items-center shadow-md border-l-4 border-red-600">
              <div className="flex items-center gap-2">
                  <Filter size={18} className="text-red-500"/>
                  <span className="font-bold uppercase tracking-wide text-sm">
                      Filtro Attivo: 
                      <span className="text-red-400 ml-1">
                          {filterType === 'reminder' 
                            ? (filterValue === 'future' ? 'Promemoria Futuri' : 'Promemoria Scaduti')
                            : filterValue}
                      </span>
                  </span>
              </div>
              <button onClick={clearDashboardFilter} className="text-gray-400 hover:text-white flex items-center gap-1 text-xs font-bold uppercase">
                  <X size={14}/> Rimuovi Filtri
              </button>
          </div>
      )}

      <div className="bg-white p-5 shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
                type="text" 
                placeholder="Cerca per cliente o provider..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 focus:ring-2 focus:ring-red-600 focus:border-red-600 outline-none text-gray-800"
            />
        </div>
        
        {/* Mostra dropdown stato solo se NON c'è un filtro dashboard attivo */}
        {!filterType && (
            <div className="flex items-center gap-2">
                <Filter className="text-gray-400 w-5 h-5" />
                <select 
                    value={localStatusFilter} 
                    onChange={(e) => setLocalStatusFilter(e.target.value)}
                    className="border border-gray-300 px-4 py-2.5 outline-none focus:ring-2 focus:ring-red-600 bg-white text-gray-700 font-medium"
                >
                    <option value="all">Tutti gli stati</option>
                    {Object.values(DealStatus).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>
        )}
      </div>

      <div className="bg-white shadow-sm border border-gray-200 overflow-hidden">
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
                  <td className="px-6 py-4 text-gray-600 text-sm font-medium">{practice.data}</td>
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
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                    Nessuna pratica trovata con i filtri attuali.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};