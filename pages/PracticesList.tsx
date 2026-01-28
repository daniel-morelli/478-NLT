
import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { DbService } from '../services/dbService';
import { Practice, DealStatus, CreditStatus, OrderStatus, Reminder, Agent, Provider, PracticeType } from '../types';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, ArrowRight, X, User, Calendar, Briefcase, ChevronDown, ChevronUp, RotateCcw, ShieldCheck, ShoppingCart, Layers, RefreshCw } from 'lucide-react';

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
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [practices, setPractices] = useState<Practice[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [filtered, setFiltered] = useState<Practice[]>([]);
  const [loading, setLoading] = useState(true);

  // Stati Filtri
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState('');
  const [localYearFilter, setLocalYearFilter] = useState('all');
  const [localAgentFilter, setLocalAgentFilter] = useState('all');
  const [localProviderFilter, setLocalProviderFilter] = useState('all');
  const [localDealFilter, setLocalDealFilter] = useState('all');
  const [localCreditFilter, setLocalCreditFilter] = useState('all');
  const [localOrderFilter, setLocalOrderFilter] = useState('all');

  // Caricamento iniziale e ripristino filtri salvati
  useEffect(() => {
    const saved = sessionStorage.getItem('nlt_filters_v2');
    if (saved && !searchParams.toString()) {
        const parsed = JSON.parse(saved);
        setSearch(parsed.search || '');
        setLocalYearFilter(parsed.year || 'all');
        setLocalAgentFilter(parsed.agent || 'all');
        setLocalProviderFilter(parsed.provider || 'all');
        setLocalDealFilter(parsed.deal || 'all');
        setLocalCreditFilter(parsed.credit || 'all');
        setLocalOrderFilter(parsed.order || 'all');
    }
  }, []);

  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        setLoading(true);
        try {
            const [practicesData, providersData] = await Promise.all([
                DbService.getPractices(user),
                DbService.getAllProviders(false)
            ]);
            
            setPractices(practicesData);
            setProviders(providersData);
            
            if (user.isAdmin || user.isTeamLeader) {
                const agentsData = await DbService.getAllAgents(true);
                setAgents(agentsData.filter(a => a.isAgent));
            }

            // Parametri dalla Dashboard
            const filterType = searchParams.get('filterType');
            const filterValue = searchParams.get('filterValue');
            const agentIdParam = searchParams.get('agentId');

            if (agentIdParam) setLocalAgentFilter(agentIdParam);
            if (filterType === 'statoTrattativa') setLocalDealFilter(filterValue || 'all');
            if (filterType === 'statoAffidamento') setLocalCreditFilter(filterValue || 'all');
            if (filterType === 'statoOrdine') setLocalOrderFilter(filterValue || 'all');
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
      };
      fetchData();
    }
  }, [user]);

  // Trigger filtraggio e salvataggio
  useEffect(() => {
    if (!loading) {
       applyFilters(); 
       sessionStorage.setItem('nlt_filters_v2', JSON.stringify({
           search,
           year: localYearFilter,
           agent: localAgentFilter,
           provider: localProviderFilter,
           deal: localDealFilter,
           credit: localCreditFilter,
           order: localOrderFilter
       }));
    }
  }, [search, localYearFilter, localAgentFilter, localProviderFilter, localDealFilter, localCreditFilter, localOrderFilter, practices, loading]);

  const applyFilters = () => {
    let res = [...practices];

    // Ricerca Testuale
    if (search) {
      const s = search.toLowerCase();
      res = res.filter(p => (
          p.customerData?.nome?.toLowerCase().includes(s) || 
          p.provider.toLowerCase().includes(s)
      ));
    }

    // Filtri a tendina
    if (localYearFilter !== 'all') {
        res = res.filter(p => new Date(p.data).getFullYear().toString() === localYearFilter);
    }
    if (localAgentFilter !== 'all') {
        res = res.filter(p => p.agentId === localAgentFilter);
    }
    if (localProviderFilter !== 'all') {
        res = res.filter(p => p.provider === localProviderFilter);
    }
    if (localDealFilter !== 'all') {
        res = res.filter(p => p.statoTrattativa === localDealFilter);
    }
    if (localCreditFilter !== 'all') {
        res = res.filter(p => p.statoAffidamento === localCreditFilter);
    }
    if (localOrderFilter !== 'all') {
        res = res.filter(p => p.statoOrdine === localOrderFilter);
    }

    setFiltered(res);
  };

  const resetFilters = () => {
    setSearch('');
    setLocalYearFilter('all');
    setLocalAgentFilter('all');
    setLocalProviderFilter('all');
    setLocalDealFilter('all');
    setLocalCreditFilter('all');
    setLocalOrderFilter('all');
    setSearchParams({});
  };

  const countActiveFilters = () => {
      let count = 0;
      if (localYearFilter !== 'all') count++;
      if (localAgentFilter !== 'all') count++;
      if (localProviderFilter !== 'all') count++;
      if (localDealFilter !== 'all') count++;
      if (localCreditFilter !== 'all') count++;
      if (localOrderFilter !== 'all') count++;
      return count;
  };

  const getStatusStyles = (status: string) => {
    const base = "inline-flex items-center justify-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-tight border transition-all duration-200 whitespace-nowrap max-w-fit";
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

  const TypeIcon = ({ type }: { type: PracticeType }) => {
    if (type === PracticeType.PROROGA) {
        return (
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg border border-blue-100" title="PROROGA">
                <RefreshCw size={14} />
            </div>
        );
    }
    return (
        <div className="p-2 bg-gray-900 text-white rounded-lg border border-black" title="ORDINE">
            <ShoppingCart size={14} />
        </div>
    );
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

  const FilterSelect = ({ label, value, onChange, options, icon: Icon }: { label: string, value: string, onChange: (v: string) => void, options: {val: string, label: string}[], icon?: any }) => (
    <div className="space-y-1.5 flex-1 min-w-[180px]">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
            {Icon && <Icon size={12} />} {label}
        </label>
        <select 
            value={value} 
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-white border border-gray-200 px-3 py-2.5 text-xs font-bold uppercase tracking-tight outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 transition-all rounded-xl shadow-sm text-gray-900"
        >
            <option value="all">TUTTI</option>
            {options.map(opt => <option key={opt.val} value={opt.val}>{opt.label.toUpperCase()}</option>)}
        </select>
    </div>
  );

  if (loading) return <div className="p-8 text-center text-gray-500">Caricamento elenco...</div>;
  if (!user) return null;

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tighter uppercase leading-none">Elenco <span className="text-red-600">Pratiche</span></h2>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Gestione operativa centralizzata</p>
        </div>
        <Link 
          to="/practices/new" 
          className="w-full md:w-auto text-center flex items-center justify-center gap-3 bg-black text-white px-8 py-4 hover:bg-gray-800 shadow-xl shadow-black/10 transition-all transform active:scale-95 font-black uppercase text-xs tracking-widest rounded-2xl"
        >
          <Plus size={18} />
          Nuova Pratica
        </Link>
      </div>

      {/* Control Bar */}
      <div className="bg-white p-4 shadow-xl border border-gray-100 rounded-3xl space-y-4">
        <div className="flex flex-col lg:flex-row gap-4 items-center">
            <div className="flex-1 w-full relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-red-600 transition-colors w-5 h-5" />
                <input 
                    type="text" 
                    placeholder="Cerca cliente, partita iva o provider..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 border border-gray-200 bg-gray-50/30 focus:bg-white focus:ring-2 focus:ring-red-600 focus:border-red-600 outline-none text-gray-800 rounded-2xl text-sm font-semibold transition-all shadow-inner"
                />
            </div>

            {(user?.isAdmin || user?.isTeamLeader) && (
                <div className="w-full lg:w-72 relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-red-600 w-4 h-4" />
                    <select 
                        value={localAgentFilter}
                        onChange={(e) => setLocalAgentFilter(e.target.value)}
                        className="w-full pl-10 pr-4 py-4 bg-gray-900 text-white text-xs font-black uppercase tracking-widest border-none outline-none rounded-2xl cursor-pointer hover:bg-black transition-colors"
                    >
                        <option value="all">TUTTI GLI AGENTI</option>
                        {agents.map(a => <option key={a.id} value={a.id}>{a.nome.toUpperCase()}</option>)}
                    </select>
                </div>
            )}

            <div className="flex gap-2 w-full lg:w-auto">
                <button 
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${showFilters || countActiveFilters() > 0 ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                >
                    <Filter size={16} />
                    {showFilters ? 'Chiudi Filtri' : 'Filtri Avanzati'}
                    {countActiveFilters() > 0 && <span className="bg-red-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-[8px]">{countActiveFilters()}</span>}
                </button>
                {countActiveFilters() > 0 && (
                    <button 
                        onClick={resetFilters}
                        className="p-4 bg-gray-50 text-gray-400 hover:text-red-600 rounded-2xl transition-colors border border-gray-100"
                        title="Resetta Filtri"
                    >
                        <RotateCcw size={18} />
                    </button>
                )}
            </div>
        </div>

        {/* Collapsible Filters */}
        {showFilters && (
            <div className="pt-6 border-t border-gray-50 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 animate-in slide-in-from-top-4 duration-300">
                <FilterSelect 
                    label="Stato Trattativa" 
                    icon={Briefcase}
                    value={localDealFilter} 
                    onChange={setLocalDealFilter}
                    options={Object.values(DealStatus).map(v => ({val: v, label: v}))}
                />
                <FilterSelect 
                    label="Stato Affidamento" 
                    icon={ShieldCheck}
                    value={localCreditFilter} 
                    onChange={setLocalCreditFilter}
                    options={Object.values(CreditStatus).map(v => ({val: v, label: v}))}
                />
                <FilterSelect 
                    label="Stato Ordine" 
                    icon={ShoppingCart}
                    value={localOrderFilter} 
                    onChange={setLocalOrderFilter}
                    options={Object.values(OrderStatus).map(v => ({val: v, label: v}))}
                />
                <FilterSelect 
                    label="Fornitore Provider" 
                    icon={Briefcase}
                    value={localProviderFilter} 
                    onChange={setLocalProviderFilter}
                    options={providers.map(p => ({val: p.name, label: p.name}))}
                />
                <FilterSelect 
                    label="Anno Pratica" 
                    icon={Calendar}
                    value={localYearFilter} 
                    onChange={setLocalYearFilter}
                    options={[2024, 2025, 2026].map(y => ({val: y.toString(), label: y.toString()}))}
                />
            </div>
        )}
      </div>

      {/* Mobile ListView */}
      <div className="md:hidden space-y-4">
        {filtered.map(practice => (
            <div 
              key={practice.id} 
              onClick={() => navigate(`/practices/${practice.id}`)}
              className="bg-white border border-gray-100 p-6 rounded-[2rem] shadow-sm hover:shadow-xl transition-all cursor-pointer group active:scale-[0.98] relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50 rounded-full -mr-16 -mt-16 group-hover:bg-red-50 transition-colors z-0"></div>
                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                             <div className="flex items-center gap-2 mb-2">
                                <TypeIcon type={practice.tipoTrattativa} />
                                {(user?.isAdmin || user?.isTeamLeader) && (
                                    <div className="flex items-center gap-1.5 text-[10px] text-red-600 font-black uppercase tracking-widest">
                                        <User size={10} /> {practice.agentName}
                                    </div>
                                )}
                             </div>
                            <h3 className="font-black text-lg text-gray-900 leading-tight group-hover:text-red-600 transition-colors uppercase tracking-tight">{practice.customerData?.nome}</h3>
                            <div className="flex flex-wrap items-center gap-3 mt-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                <span className="flex items-center gap-1"><Calendar size={12}/> {new Date(practice.data).toLocaleDateString()}</span>
                                <span className="flex items-center gap-1"><Briefcase size={12}/> {practice.provider}</span>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-sm font-black text-gray-900 block">{formatIT(practice.valoreTotale)}</span>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-y-4 gap-x-2 pt-4 border-t border-gray-50 mt-4">
                        <StatusBadge label="Trattativa" status={practice.statoTrattativa} />
                        <StatusBadge label="Affidamento" status={practice.statoAffidamento} />
                        <StatusBadge label="Ordine" status={practice.statoOrdine} />
                    </div>
                </div>
            </div>
        ))}
      </div>

      {/* Desktop ListView */}
      <div className="hidden md:block bg-white shadow-xl border border-gray-100 overflow-hidden rounded-[2.5rem]">
        <div className="overflow-x-auto">
          <table className="w-full text-left table-fixed">
            <thead className="bg-black text-white">
              <tr>
                <th className="w-16 px-6 py-5 font-black uppercase text-[10px] tracking-[0.2em] text-gray-500 text-center">Tipo</th>
                {(user?.isAdmin || user?.isTeamLeader) && (
                    <th className="w-48 px-6 py-5 font-black uppercase text-[10px] tracking-[0.2em] text-gray-500">Agente</th>
                )}
                <th className="px-6 py-5 font-black uppercase text-[10px] tracking-[0.2em] text-gray-500">Dati Cliente</th>
                <th className="w-40 px-6 py-5 font-black uppercase text-[10px] tracking-[0.2em] text-gray-500 text-right">Prov. Attesa</th>
                <th className="w-32 px-6 py-5 font-black uppercase text-[10px] tracking-[0.2em] text-gray-500 text-center">Trattativa</th>
                <th className="w-32 px-6 py-5 font-black uppercase text-[10px] tracking-[0.2em] text-gray-500 text-center">Affidamento</th>
                <th className="w-32 px-6 py-5 font-black uppercase text-[10px] tracking-[0.2em] text-gray-500 text-center">Ordine</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((practice) => (
                <tr 
                  key={practice.id} 
                  onClick={() => navigate(`/practices/${practice.id}`)}
                  className="hover:bg-red-50/20 transition-all cursor-pointer group"
                >
                  <td className="px-6 py-5 text-center">
                    <div className="flex justify-center">
                        <TypeIcon type={practice.tipoTrattativa} />
                    </div>
                  </td>
                  {(user?.isAdmin || user?.isTeamLeader) && (
                      <td className="px-6 py-5">
                          <div className="text-[10px] font-black text-red-700 bg-red-50 px-2.5 py-1 rounded-lg uppercase tracking-wider inline-block max-w-full truncate">
                            {practice.agentName}
                          </div>
                      </td>
                  )}
                  <td className="px-6 py-5 overflow-hidden">
                    <div className="font-black text-gray-900 group-hover:text-red-600 transition-colors uppercase tracking-tight text-sm truncate">{practice.customerData?.nome}</div>
                    <div className="text-[10px] text-gray-400 font-black uppercase tracking-[0.15em] mt-0.5 truncate">{new Date(practice.data).toLocaleDateString()} • {practice.provider}</div>
                  </td>
                  <td className="px-6 py-5 text-right font-black text-gray-900 text-sm tabular-nums whitespace-nowrap">{formatIT(practice.valoreTotale)}</td>
                  <td className="px-6 py-5 text-center"><StatusBadge status={practice.statoTrattativa} /></td>
                  <td className="px-6 py-5 text-center"><StatusBadge status={practice.statoAffidamento} /></td>
                  <td className="px-6 py-5 text-center"><StatusBadge status={practice.statoOrdine} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {filtered.length === 0 && (
        <div className="p-20 text-center flex flex-col items-center justify-center bg-white border border-gray-100 rounded-[2.5rem] shadow-sm">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-4">
                <Search size={32} />
            </div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-[0.3em]">Nessuna corrispondenza trovata</p>
            <button onClick={resetFilters} className="mt-4 text-[10px] font-black text-red-600 uppercase tracking-widest hover:underline">Ripristina tutti i filtri</button>
        </div>
      )}
    </div>
  );
};
