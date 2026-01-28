
import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { DbService } from '../services/dbService';
import { Agent, Practice } from '../types';
import { UserPlus, Shield, Activity, UserX, Save, User, Star, Lock, X, FileStack, Trash2, AlertCircle } from 'lucide-react';
import { Modal } from '../components/Modal';

export const AdminAgents: React.FC = () => {
  const { user } = useAuth();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [practices, setPractices] = useState<Practice[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [agentToDelete, setAgentToDelete] = useState<Agent | null>(null);

  const [formAgent, setFormAgent] = useState<Partial<Agent>>({
    isAdmin: false,
    isTeamLeader: false,
    isActive: true,
    isAgent: true,
    password: ''
  });

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    try {
        const [agentsData, practicesData] = await Promise.all([
            DbService.getAllAgents(),
            DbService.getPractices(user)
        ]);
        setAgents(agentsData);
        setPractices(practicesData);
    } catch (e) {
        console.error("Errore caricamento dati admin:", e);
    }
  };

  const practiceCounts = useMemo(() => {
    const counts = new Map<string, number>();
    practices.forEach(p => {
        counts.set(p.agentId, (counts.get(p.agentId) || 0) + 1);
    });
    return counts;
  }, [practices]);

  if (!user?.isAdmin) return <div className="p-8 text-center text-red-600 font-bold tracking-widest uppercase">Accesso Negato.</div>;

  const handleEdit = (agent: Agent) => {
    setFormAgent(agent);
    setIsModalOpen(true);
  };

  const handleNew = () => {
    setFormAgent({ isAdmin: false, isTeamLeader: false, isActive: true, isAgent: true, nome: '', email: '', cell: '', password: '' });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
        await DbService.saveAgent(formAgent);
        setIsModalOpen(false);
        loadData();
    } catch (e: any) {
        setErrorMsg(e.message);
    } finally {
        setLoading(false);
    }
  };

  const toggleActive = async (agent: Agent) => {
      await DbService.saveAgent({ ...agent, isActive: !agent.isActive });
      loadData();
  };

  const handleDeleteAgent = async () => {
    if (!agentToDelete) return;
    setLoading(true);
    try {
        await DbService.deleteAgent(agentToDelete.id);
        setAgentToDelete(null);
        loadData();
    } catch (e: any) {
        setErrorMsg("Errore durante l'eliminazione dell'agente.");
    } finally {
        setLoading(false);
    }
  };

  const InputStyle = "border border-gray-300 p-3 w-full focus:ring-2 focus:ring-red-600 outline-none bg-white text-gray-900 text-sm font-medium transition-all rounded-xl";
  const LabelStyle = "block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1";

  return (
    <div className="space-y-6">
      <Modal isOpen={!!errorMsg} onClose={() => setErrorMsg(null)} title="Errore" message={errorMsg || ''} />
      
      <Modal 
        isOpen={!!agentToDelete} 
        onClose={() => setAgentToDelete(null)} 
        onConfirm={handleDeleteAgent}
        type="danger"
        title="Elimina Agente" 
        message={`Sei sicuro di voler eliminare definitivamente l'agente ${agentToDelete?.nome}? Questa operazione è irreversibile.`} 
        confirmLabel="Elimina Definitivamente"
        loading={loading}
      />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tighter uppercase">Gestione <span className="text-red-600">Agenti</span></h2>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Configurazione utenze e volumi di lavoro</p>
        </div>
        <button 
            onClick={handleNew} 
            className="w-full md:w-auto flex items-center justify-center gap-2 bg-black text-white px-6 py-3 hover:bg-gray-800 shadow-xl transition-all transform active:scale-95 font-bold uppercase text-xs tracking-widest rounded-2xl"
        >
          <UserPlus size={18} /> Nuovo Agente
        </button>
      </div>

      {/* MODALE DI INSERIMENTO / MODIFICA */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl shadow-2xl overflow-hidden border-t-4 border-red-600 flex flex-col rounded-2xl animate-in zoom-in-95 duration-200">
            <div className="bg-black p-4 flex justify-between items-center">
              <h3 className="text-white font-black uppercase text-sm tracking-[0.2em]">
                {formAgent.id ? 'Modifica Profilo' : 'Nuovo Agente'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 md:p-8 overflow-y-auto max-h-[80vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <label className={LabelStyle}>Nome e Cognome</label>
                  <input 
                    required 
                    placeholder="Mario Rossi" 
                    className={InputStyle} 
                    value={formAgent.nome || ''} 
                    onChange={e => setFormAgent({...formAgent, nome: e.target.value})} 
                  />
                </div>
                <div>
                  <label className={LabelStyle}>Email Aziendale</label>
                  <input 
                    required 
                    placeholder="m.rossi@nlt.it" 
                    type="email" 
                    className={InputStyle} 
                    value={formAgent.email || ''} 
                    onChange={e => setFormAgent({...formAgent, email: e.target.value})} 
                  />
                </div>
                <div>
                  <label className={LabelStyle}>Cellulare</label>
                  <input 
                    placeholder="+39 333..." 
                    className={InputStyle} 
                    value={formAgent.cell || ''} 
                    onChange={e => setFormAgent({...formAgent, cell: e.target.value})} 
                  />
                </div>
                <div>
                  <label className={LabelStyle}>Password / PIN Accesso</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3.5 text-gray-300" size={16} />
                    <input 
                        required 
                        placeholder="Minimo 4 caratteri" 
                        className={`${InputStyle} pl-10 font-mono`} 
                        value={formAgent.password || ''} 
                        onChange={e => setFormAgent({...formAgent, password: e.target.value})} 
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-6 border border-gray-100 mb-8 rounded-2xl">
                <p className={LabelStyle}>Ruoli e Permessi di Sistema</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" checked={formAgent.isAgent} onChange={e => setFormAgent({...formAgent, isAgent: e.target.checked})} className="w-5 h-5 text-red-600 border-gray-300 focus:ring-red-600 rounded-lg" />
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-tight group-hover:text-black">Agente</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" checked={formAgent.isTeamLeader} onChange={e => setFormAgent({...formAgent, isTeamLeader: e.target.checked})} className="w-5 h-5 text-red-600 border-gray-300 focus:ring-red-600 rounded-lg" />
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-tight group-hover:text-black">Team Leader</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" checked={formAgent.isAdmin} onChange={e => setFormAgent({...formAgent, isAdmin: e.target.checked})} className="w-5 h-5 text-red-600 border-gray-300 focus:ring-red-600 rounded-lg" />
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-tight group-hover:text-black">Admin</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" checked={formAgent.isActive} onChange={e => setFormAgent({...formAgent, isActive: e.target.checked})} className="w-5 h-5 text-red-600 border-gray-300 focus:ring-red-600 rounded-lg" />
                    <span className="text-xs font-bold text-green-600 uppercase tracking-tight">Attivo</span>
                  </label>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-3 justify-end border-t border-gray-100 pt-6">
                <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)} 
                    className="px-8 py-3 border border-gray-300 text-gray-500 hover:bg-gray-50 font-black uppercase text-[10px] tracking-[0.2em] transition-colors rounded-xl"
                >
                  Annulla
                </button>
                <button 
                    type="submit" 
                    disabled={loading} 
                    className="px-8 py-3 bg-red-600 text-white hover:bg-red-700 flex items-center justify-center gap-2 font-black uppercase text-[10px] tracking-[0.2em] shadow-lg shadow-red-600/20 disabled:bg-gray-400 rounded-xl"
                >
                    <Save size={16}/> {loading ? 'Elaborazione...' : 'Salva Profilo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TABELLA AGENTI */}
      <div className="bg-white shadow-sm border border-gray-200 overflow-hidden rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-black text-white">
                <tr>
                    <th className="px-6 py-4 font-black uppercase text-[10px] tracking-[0.2em] text-gray-400">Anagrafica</th>
                    <th className="px-6 py-4 font-black uppercase text-[10px] tracking-[0.2em] text-gray-400">Ruoli Assegnati</th>
                    <th className="px-6 py-4 font-black uppercase text-[10px] tracking-[0.2em] text-gray-400 text-center">N. Pratiche</th>
                    <th className="px-6 py-4 font-black uppercase text-[10px] tracking-[0.2em] text-gray-400">Stato</th>
                    <th className="px-6 py-4 font-black uppercase text-[10px] tracking-[0.2em] text-gray-400 text-right">Gestione</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {agents.map(agent => {
                    const count = practiceCounts.get(agent.id) || 0;
                    return (
                        <tr key={agent.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                                <div className="font-black text-gray-900 uppercase tracking-tighter text-sm">{agent.nome}</div>
                                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{agent.email}</div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex flex-wrap gap-1.5 items-start">
                                    {agent.isAdmin && <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-black text-white text-[9px] font-black uppercase tracking-tighter border border-gray-700 rounded-lg"><Shield size={10}/> Admin</span>}
                                    {agent.isTeamLeader && <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500 text-white text-[9px] font-black uppercase tracking-tighter shadow-sm rounded-lg"><Star size={10}/> Team Leader</span>}
                                    {agent.isAgent && <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 text-[9px] font-black uppercase tracking-tighter border border-red-200 rounded-lg"><User size={10}/> Agente</span>}
                                </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                                <div className="inline-flex items-center gap-2 text-gray-900 px-3 py-1 font-black text-xs rounded-xl border border-gray-100 shadow-sm">
                                    <FileStack size={14} className="text-red-600" />
                                    <span>{count}</span>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                {agent.isActive ? 
                                    <span className="text-green-600 text-[9px] font-black flex items-center gap-1 uppercase tracking-widest bg-green-50 px-3 py-1 border border-green-100 rounded-full"><Activity size={14}/> Attivo</span> : 
                                    <span className="text-gray-400 text-[9px] font-black flex items-center gap-1 uppercase tracking-widest bg-gray-50 px-3 py-1 border border-gray-200 rounded-full"><UserX size={14}/> Disabilitato</span>
                                }
                            </td>
                            <td className="px-6 py-4 text-right">
                                <button 
                                    onClick={() => handleEdit(agent)} 
                                    className="text-gray-400 hover:text-black p-2 font-black text-[10px] uppercase tracking-[0.15em] transition-colors"
                                >
                                    Modifica
                                </button>
                                <button 
                                    onClick={() => toggleActive(agent)} 
                                    className={`${agent.isActive ? 'text-amber-600 hover:text-amber-800' : 'text-green-600 hover:text-green-800'} p-2 font-black text-[10px] uppercase tracking-[0.15em] transition-colors`}
                                >
                                    {agent.isActive ? 'Disabilita' : 'Attiva'}
                                </button>
                                
                                {count === 0 ? (
                                    <button 
                                        onClick={() => setAgentToDelete(agent)} 
                                        className="text-red-600 hover:text-red-800 p-2 font-black text-[10px] uppercase tracking-[0.15em] transition-colors"
                                        title="Elimina definitivamente"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                ) : (
                                    <span className="inline-block p-2 text-gray-300" title="Impossibile eliminare: l'agente ha pratiche collegate. Usa 'Disabilita'.">
                                        <Lock size={16} />
                                    </span>
                                )}
                            </td>
                        </tr>
                    );
                })}
            </tbody>
          </table>
        </div>
      </div>
      
      {agents.length === 0 && (
          <div className="bg-white p-12 text-center border border-gray-200 rounded-2xl">
              <p className="text-gray-400 text-sm font-bold uppercase tracking-[0.2em]">Nessun agente registrato nel sistema.</p>
          </div>
      )}
    </div>
  );
};
