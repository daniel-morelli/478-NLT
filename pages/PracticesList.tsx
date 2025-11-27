import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { DbService } from '../services/dbService';
import { Practice, DealStatus, CreditStatus, OrderStatus } from '../types';
import { Link } from 'react-router-dom';
import { Plus, Search, Edit2, Filter, ArrowRight } from 'lucide-react';

export const PracticesList: React.FC = () => {
  const { user } = useAuth();
  const [practices, setPractices] = useState<Practice[]>([]);
  const [filtered, setFiltered] = useState<Practice[]>([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      DbService.getPractices(user).then(data => {
        setPractices(data);
        setFiltered(data);
        setLoading(false);
      });
    }
  }, [user]);

  useEffect(() => {
    let res = practices;
    if (search) {
      const s = search.toLowerCase();
      res = res.filter(p => p.cliente.toLowerCase().includes(s) || p.provider.toLowerCase().includes(s));
    }
    if (filterStatus !== 'all') {
      res = res.filter(p => p.statoTrattativa === filterStatus);
    }
    setFiltered(res);
  }, [search, filterStatus, practices]);

  const getStatusColor = (status: string) => {
    if (!status) return 'bg-gray-100 text-gray-400 border border-gray-200';

    // Trattativa
    if (status === DealStatus.IN_CORSO) return 'bg-red-50 text-red-700 border border-red-100'; // ROSSO (Focus)
    if (status === DealStatus.CHIUSA) return 'bg-black text-white border border-black'; // NERO (Chiuso/Solido)
    if (status === DealStatus.FALLITA) return 'bg-gray-200 text-gray-600 border border-gray-300'; // GRIGIO (Spento)
    
    // Altri stati: Colori neutri o funzionali
    if (status.includes('Esitato')) return 'bg-green-50 text-green-700 border border-green-200';
    if (status === OrderStatus.INVIATO) return 'bg-gray-800 text-white border border-gray-800';

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
        <div className="flex items-center gap-2">
            <Filter className="text-gray-400 w-5 h-5" />
            <select 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-gray-300 px-4 py-2.5 outline-none focus:ring-2 focus:ring-red-600 bg-white text-gray-700 font-medium"
            >
                <option value="all">Tutti gli stati</option>
                {Object.values(DealStatus).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
        </div>
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
                    Nessuna pratica trovata.
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