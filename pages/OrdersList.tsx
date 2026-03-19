
import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { DbService } from '../services/dbService';
import { Practice, VehicleOrder, Agent } from '../types';
import { useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, ArrowRight, Filter, X, RotateCcw } from 'lucide-react';

// Utility per formattazione valuta IT
const formatIT = (val: number | undefined): string => {
  if (val === undefined || val === null) return '€ 0,00';
  return '€ ' + new Intl.NumberFormat('it-IT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);
};

const getMeseAnnoOptions = () => {
  const mesi = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
  const currentYear = new Date().getFullYear();
  const options: string[] = [];
  mesi.forEach(m => options.push(`${m} ${currentYear}`));
  mesi.forEach(m => options.push(`${m} ${currentYear + 1}`));
  return options;
};

export const OrdersList: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [practices, setPractices] = useState<Practice[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Stati Filtri
  const [showFilters, setShowFilters] = useState(false);
  const [agentFilter, setAgentFilter] = useState('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [monthFilter, setMonthFilter] = useState('all');

  // 1. CARICAMENTO FILTRI DA SESSION STORAGE ALL'AVVIO
  useEffect(() => {
    const saved = sessionStorage.getItem('nlt_orders_filters');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSearch(parsed.search || '');
        setAgentFilter(parsed.agentFilter || 'all');
        setYearFilter(parsed.yearFilter || 'all');
        setMonthFilter(parsed.monthFilter || 'all');
        if (parsed.showFilters) setShowFilters(true);
      } catch (e) {
        console.error("Errore parsing filtri salvati:", e);
      }
    }
  }, []);

  // 2. SALVATAGGIO FILTRI SU SESSION STORAGE
  useEffect(() => {
    const filters = {
      search,
      agentFilter,
      yearFilter,
      monthFilter,
      showFilters
    };
    sessionStorage.setItem('nlt_orders_filters', JSON.stringify(filters));
  }, [search, agentFilter, yearFilter, monthFilter, showFilters]);

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      setLoading(true);
      const [practicesData, agentsData] = await Promise.all([
        DbService.getPractices(user),
        DbService.getAllAgents(true)
      ]);
      setPractices(practicesData);
      setAgents(agentsData);
      setLoading(false);
    };
    loadData();
  }, [user]);

  const orders = useMemo(() => {
    const allOrders: { practice: Practice, vehicle: VehicleOrder }[] = [];
    practices.forEach(p => {
      if (p.veicoliOrdine && p.veicoliOrdine.length > 0) {
        p.veicoliOrdine.forEach(v => {
          allOrders.push({ practice: p, vehicle: v });
        });
      }
    });
    
    // Filtro ricerca e filtri avanzati
    return allOrders.filter(o => {
      // Filtro Ricerca Testuale
      const s = search.toLowerCase();
      const matchesSearch = !search || 
        o.practice.customerData?.nome?.toLowerCase().includes(s) ||
        o.practice.practiceNumber?.toString().includes(s) ||
        o.vehicle.marca.toLowerCase().includes(s) ||
        o.vehicle.modello.toLowerCase().includes(s);

      // Filtro Agente
      const matchesAgent = agentFilter === 'all' || o.practice.agentId === agentFilter;

      // Filtro Anno
      const matchesYear = yearFilter === 'all' || o.practice.practiceYear?.toString() === yearFilter;

      // Filtro Mese
      const matchesMonth = monthFilter === 'all' || o.practice.mesePrevistoChiusura === monthFilter;

      return matchesSearch && matchesAgent && matchesYear && matchesMonth;
    });
  }, [practices, search, agentFilter, yearFilter, monthFilter]);

  const resetFilters = () => {
    setSearch('');
    setAgentFilter('all');
    setYearFilter('all');
    setMonthFilter('all');
  };

  const isPowerUser = user?.isAdmin || user?.isTeamLeader;
  const years = Array.from(new Set(practices.map(p => p.practiceYear).filter(Boolean))).sort((a, b) => (b || 0) - (a || 0));
  const monthOptions = getMeseAnnoOptions();

  const summaryStats = useMemo(() => {
    return orders.reduce((acc, o) => ({
      count: acc.count + 1,
      lockedCount: acc.lockedCount + (o.practice.isLocked ? 1 : 0),
      totalCommissions: acc.totalCommissions + (o.vehicle.provvigione || 0)
    }), { count: 0, lockedCount: 0, totalCommissions: 0 });
  }, [orders]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter italic flex items-center gap-3">
            <ShoppingCart className="text-red-600" size={32} />
            Veicoli in <span className="text-red-600">Ordine</span>
          </h2>
          <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.3em] mt-1">Elenco dettagliato dei veicoli ordinati</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-3 rounded-2xl border transition-all flex items-center gap-2 ${
              showFilters 
                ? 'bg-red-600 border-red-600 text-white shadow-lg shadow-red-900/20' 
                : 'bg-white border-gray-100 text-gray-500 hover:border-red-600 hover:text-red-600 shadow-sm'
            }`}
          >
            <Filter size={18} />
            <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Filtri</span>
          </button>

          <div className="relative group max-w-md w-full">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400 group-focus-within:text-red-600 transition-colors" />
            </div>
            <input
              type="text"
              placeholder="CERCA PER CLIENTE, PRATICA O VEICOLO..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-widest focus:ring-2 focus:ring-red-600/20 focus:border-red-600 transition-all shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Pannello Filtri Avanzati */}
      {showFilters && (
        <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between border-b border-gray-50 pb-4">
            <h3 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.3em] flex items-center gap-2">
              <Filter size={14} className="text-red-600" />
              Filtri di Ricerca
            </h3>
            <button 
              onClick={resetFilters}
              className="text-[9px] font-black text-gray-400 hover:text-red-600 uppercase tracking-widest flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw size={12} />
              Reset Filtri
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Filtro Agente */}
            {isPowerUser && (
              <div className="space-y-2">
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Agente</label>
                <select
                  value={agentFilter}
                  onChange={(e) => setAgentFilter(e.target.value)}
                  className="w-full p-3 bg-gray-50 border-none rounded-xl text-[10px] font-black uppercase tracking-widest focus:ring-2 focus:ring-red-600/20 transition-all"
                >
                  <option value="all">TUTTI GLI AGENTI</option>
                  {agents.map(a => (
                    <option key={a.id} value={a.id}>{a.nome}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Filtro Anno */}
            <div className="space-y-2">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Anno Pratica</label>
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="w-full p-3 bg-gray-50 border-none rounded-xl text-[10px] font-black uppercase tracking-widest focus:ring-2 focus:ring-red-600/20 transition-all"
              >
                <option value="all">TUTTI GLI ANNI</option>
                {years.map(y => (
                  <option key={y} value={y?.toString()}>{y}</option>
                ))}
              </select>
            </div>

            {/* Filtro Mese */}
            <div className="space-y-2">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Mese di Riferimento</label>
              <select
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                className="w-full p-3 bg-gray-50 border-none rounded-xl text-[10px] font-black uppercase tracking-widest focus:ring-2 focus:ring-red-600/20 transition-all"
              >
                <option value="all">TUTTI I MESI</option>
                {monthOptions.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-4 py-4 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">Pratica</th>
                <th className="px-4 py-4 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Data Ordine</th>
                <th className="px-4 py-4 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Cliente</th>
                <th className="px-4 py-4 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Marca</th>
                <th className="px-4 py-4 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Modello</th>
                <th className="px-4 py-4 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">Mesi</th>
                <th className="px-4 py-4 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">KM</th>
                <th className="px-4 py-4 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] text-right">Provvigione</th>
                <th className="px-4 py-4 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orders.map((order, idx) => (
                <tr key={`${order.practice.id}-${idx}`} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-4 py-3 text-center">
                    <div className="text-[9px] font-black text-gray-900 bg-gray-100 px-2 py-0.5 rounded-md uppercase tracking-widest inline-block">
                      {order.practice.practiceNumber ? `${order.practice.practiceYear}/${order.practice.practiceNumber}` : 'N/D'}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-[10px] font-black text-gray-900 uppercase">
                      {order.practice.dataOrdine ? new Date(order.practice.dataOrdine).toLocaleDateString() : '-'}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-[10px] font-black text-gray-900 uppercase truncate max-w-[150px]">
                      {order.practice.customerData?.nome || '-'}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-[10px] font-black text-gray-900 uppercase">
                      {order.vehicle.marca}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-[10px] font-black text-gray-900 uppercase truncate max-w-[150px]">
                      {order.vehicle.modello}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="text-[10px] font-black text-gray-900">
                      {order.vehicle.durataMesi}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="text-[10px] font-black text-gray-900 tabular-nums">
                      {order.vehicle.km.toLocaleString()}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="text-[10px] font-black text-gray-900 tabular-nums">
                      {formatIT(order.vehicle.provvigione)}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => navigate(`/practices/${order.practice.id}`)}
                      className="p-1.5 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      title="Vedi Pratica"
                    >
                      <ArrowRight size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {orders.length === 0 && (
        <div className="p-20 text-center flex flex-col items-center justify-center bg-white border border-gray-100 rounded-[2.5rem] shadow-sm">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-4">
                <Search size={32} />
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Nessun ordine trovato</p>
        </div>
      )}

      {/* Summary Banner */}
      {orders.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-black border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.4)]">
          <div className="max-w-[1600px] mx-auto px-6 py-3 flex flex-wrap items-center justify-end gap-x-8 gap-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500">Ordini:</span>
              <span className="text-sm font-black text-white tabular-nums">{summaryStats.count}</span>
            </div>
            
            <div className="hidden md:block w-px h-4 bg-white/10"></div>

            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500">Ordini Bloccati:</span>
              <span className="text-sm font-black text-emerald-500 tabular-nums">{summaryStats.lockedCount}</span>
            </div>
            
            <div className="hidden md:block w-px h-4 bg-white/10"></div>
            
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500">Totale Provvigioni:</span>
              <span className="text-sm font-black text-red-500 tabular-nums">{formatIT(summaryStats.totalCommissions)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
