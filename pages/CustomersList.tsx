
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { DbService } from '../services/dbService';
import { Customer, Agent } from '../types';
import { User, Mail, Phone, Search, Plus, X, Edit3, Briefcase, PhoneCall, ShieldCheck, Users, Filter, RotateCcw } from 'lucide-react';

export const CustomersList: React.FC = () => {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [search, setSearch] = useState('');
  const [agentFilter, setAgentFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formCustomer, setFormCustomer] = useState<Partial<Customer>>({ nome: '', email: '', cell: '', agentId: '' });

  const isPowerUser = user?.isAdmin || user?.isTeamLeader;

  useEffect(() => {
    if (user) {
      loadCustomers();
      if (isPowerUser) {
        DbService.getAllAgents(true).then(setAgents);
      }
    }
  }, [user, isPowerUser]);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const data = await DbService.getCustomers(user!);
      setCustomers(data);
    } catch (e) {
      console.error("Errore caricamento clienti:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
        const targetAgentId = formCustomer.agentId || user.id;
        await DbService.saveCustomer({ ...formCustomer, agentId: targetAgentId });
        setIsModalOpen(false);
        loadCustomers();
    } catch (e) {
        console.error("Errore salvataggio cliente:", e);
    } finally {
        setLoading(false);
    }
  };

  const filtered = customers.filter(c => {
    const matchesSearch = c.nome.toLowerCase().includes(search.toLowerCase()) || 
                          (c.email && c.email.toLowerCase().includes(search.toLowerCase())) ||
                          (c.agentName && c.agentName.toLowerCase().includes(search.toLowerCase()));
    
    const matchesAgent = agentFilter === 'all' || c.agentId === agentFilter;
    
    return matchesSearch && matchesAgent;
  });

  const InputStyle = "w-full border border-gray-200 bg-white text-gray-900 rounded-xl p-3.5 focus:ring-2 focus:ring-red-600 focus:border-red-600 outline-none transition-all text-sm font-semibold shadow-sm";
  const LabelStyle = "block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1";

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tighter uppercase">Anagrafica <span className="text-red-600">Clienti</span></h2>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Gestione centralizzata dei contatti</p>
        </div>
        <button 
            onClick={() => {setFormCustomer({ nome: '', email: '', cell: '', agentId: user?.id }); setIsModalOpen(true);}} 
            className="w-full md:w-auto flex items-center justify-center gap-2 bg-black text-white px-6 py-3 hover:bg-gray-800 shadow-xl transition-all transform active:scale-95 font-bold uppercase text-xs tracking-widest rounded-2xl"
        >
          <Plus size={18} /> Nuovo Cliente
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 bg-white p-4 shadow-sm border border-gray-200 flex items-center gap-4 rounded-2xl">
          <Search className="text-gray-400" size={20} />
          <input 
              type="text" 
              placeholder="Cerca per nome, email o p.iva..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent border-none outline-none text-sm font-semibold placeholder:text-gray-300"
          />
        </div>

        {isPowerUser && (
          <div className="flex items-center gap-2 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-64">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-red-600" size={16} />
              <select 
                value={agentFilter}
                onChange={(e) => setAgentFilter(e.target.value)}
                className="w-full pl-11 pr-4 py-4 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest border-none outline-none rounded-2xl cursor-pointer hover:bg-black transition-colors appearance-none shadow-xl"
              >
                <option value="all">TUTTI GLI AGENTI</option>
                {agents.map(a => <option key={a.id} value={a.id}>{a.nome.toUpperCase()}</option>)}
              </select>
            </div>
            {agentFilter !== 'all' && (
              <button 
                onClick={() => setAgentFilter('all')}
                className="p-4 bg-white text-gray-400 hover:text-red-600 rounded-2xl border border-gray-200 transition-colors shadow-sm"
                title="Resetta Filtro Agente"
              >
                <RotateCcw size={18} />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
            <div className="col-span-full py-20 text-center"><div className="w-8 h-8 border-4 border-red-600 border-t-transparent animate-spin rounded-full mx-auto"></div></div>
        ) : filtered.length > 0 ? (
            filtered.map(c => (
                <div key={c.id} className="bg-white border border-gray-100 p-6 rounded-3xl shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                    <div className="flex justify-between items-start mb-6">
                        <div className="bg-red-50 p-3 rounded-2xl group-hover:bg-red-600 group-hover:text-white transition-colors">
                            <Briefcase size={24} />
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => {setFormCustomer(c); setIsModalOpen(true);}} className="text-gray-300 hover:text-black transition-colors p-1">
                              <Edit3 size={18} />
                          </button>
                        </div>
                    </div>
                    
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight group-hover:text-red-600 transition-colors truncate flex-1">{c.nome}</h3>
                      {c.cell ? (
                        <a 
                          href={`tel:${c.cell}`} 
                          title={`Chiama ${c.nome}`}
                          className="bg-red-50 text-red-600 p-2.5 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm"
                        >
                          <PhoneCall size={18} />
                        </a>
                      ) : (
                        <div className="text-gray-200 p-2.5 rounded-xl" title="Nessun numero salvato">
                          <PhoneCall size={18} />
                        </div>
                      )}
                    </div>

                    <div className="space-y-3 mb-6">
                        <div className="flex items-center gap-3 text-gray-500">
                            <Mail size={14} className="text-red-600" />
                            <span className="text-xs font-bold truncate">{c.email || 'Email non presente'}</span>
                        </div>
                        <div className="flex items-center gap-3 text-gray-500">
                            <Phone size={14} className="text-red-600" />
                            <span className="text-xs font-bold">{c.cell || 'Cellulare non presente'}</span>
                        </div>
                    </div>

                    {/* Badge Agente Assegnato */}
                    <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <User size={12} className="text-gray-400" />
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Agente:</span>
                        </div>
                        <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest ${c.agentId === user?.id ? 'bg-red-600 text-white shadow-lg' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
                            {c.agentName || 'N/D'}
                        </span>
                    </div>
                </div>
            ))
        ) : (
            <div className="col-span-full py-20 text-center bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl">
                <p className="text-sm font-black text-gray-300 uppercase tracking-widest">Nessun cliente trovato</p>
            </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-white w-full max-w-xl shadow-2xl rounded-3xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="bg-black p-6 flex justify-between items-center">
                    <h3 className="text-white font-black uppercase text-sm tracking-widest">{formCustomer.id ? 'Modifica Cliente' : 'Nuovo Cliente'}</h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white"><X size={20}/></button>
                </div>
                <form onSubmit={handleSave} className="p-8 space-y-6">
                    <div>
                        <label className={LabelStyle}>Ragione Sociale / Nome</label>
                        <input required type="text" value={formCustomer.nome || ''} onChange={e => setFormCustomer({...formCustomer, nome: e.target.value})} className={InputStyle} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className={LabelStyle}>Email</label>
                            <input type="email" value={formCustomer.email || ''} onChange={e => setFormCustomer({...formCustomer, email: e.target.value})} className={InputStyle} />
                        </div>
                        <div>
                            <label className={LabelStyle}>Cellulare</label>
                            <input type="tel" value={formCustomer.cell || ''} onChange={e => setFormCustomer({...formCustomer, cell: e.target.value})} className={InputStyle} />
                        </div>
                    </div>
                    
                    {/* Selettore Agente (Solo per Admin e Team Leader) */}
                    {isPowerUser ? (
                      <div>
                        <label className={LabelStyle}>Agente di Riferimento</label>
                        <div className="relative">
                          <Users size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-red-600" />
                          <select 
                            required
                            value={formCustomer.agentId || ''} 
                            onChange={e => setFormCustomer({...formCustomer, agentId: e.target.value})} 
                            className={`${InputStyle} pl-11 font-black uppercase text-[11px] tracking-widest`}
                          >
                            <option value="">-- SELEZIONA AGENTE --</option>
                            {agents.map(a => (
                              <option key={a.id} value={a.id}>{a.nome.toUpperCase()}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center gap-3">
                          <ShieldCheck size={18} className="text-red-600" />
                          <span className="text-xs font-bold text-gray-500 uppercase tracking-tight">Proprietario Attuale: <span className="text-black">{formCustomer.agentName || user?.nome}</span></span>
                      </div>
                    )}

                    <div className="flex justify-end gap-4 pt-6">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 text-gray-400 font-black uppercase text-[10px] tracking-widest">Annulla</button>
                        <button type="submit" className="bg-red-600 text-white px-10 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-red-700 shadow-xl shadow-red-600/20 transition-all">
                            {formCustomer.id ? 'Aggiorna' : 'Crea Cliente'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};
