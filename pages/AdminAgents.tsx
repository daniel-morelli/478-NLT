import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { DbService } from '../services/dbService';
import { Agent } from '../types';
import { UserPlus, Shield, Activity, UserX, Save, Briefcase, User } from 'lucide-react';

export const AdminAgents: React.FC = () => {
  const { user } = useAuth();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [formAgent, setFormAgent] = useState<Partial<Agent>>({
    isAdmin: false,
    isActive: true,
    isAgent: true
  });

  useEffect(() => {
    loadAgents();
  }, [user]);

  const loadAgents = () => {
    DbService.getAllAgents().then(setAgents);
  };

  if (!user?.isAdmin) return <div>Accesso Negato</div>;

  const handleEdit = (agent: Agent) => {
    setFormAgent(agent);
    setIsEditing(true);
  };

  const handleNew = () => {
    setFormAgent({ isAdmin: false, isActive: true, isAgent: true, nome: '', email: '', cell: '', pin: '' });
    setIsEditing(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await DbService.saveAgent(formAgent);
    setIsEditing(false);
    loadAgents();
  };

  const toggleActive = async (agent: Agent) => {
      await DbService.saveAgent({ ...agent, isActive: !agent.isActive });
      loadAgents();
  };

  const InputStyle = "border border-gray-300 p-2 w-full focus:ring-2 focus:ring-red-600 outline-none";

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Gestione Agenti</h2>
            <p className="text-sm text-gray-500">Amministrazione permessi e utenze</p>
        </div>
        <button 
          onClick={handleNew}
          className="flex items-center gap-2 bg-black text-white px-4 py-2 hover:bg-gray-800 shadow-lg transition-colors font-medium"
        >
          <UserPlus size={18} />
          Nuovo Agente
        </button>
      </div>

      {isEditing && (
        <div className="bg-white p-6 shadow-lg border border-red-100 mb-6 border-l-4 border-l-red-600 animate-in fade-in slide-in-from-top-4">
            <h3 className="font-bold text-lg mb-4 text-gray-800 uppercase tracking-wide">{formAgent.id ? 'Modifica Agente' : 'Nuovo Agente'}</h3>
            <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input required placeholder="Nome Cognome" className={InputStyle} value={formAgent.nome || ''} onChange={e => setFormAgent({...formAgent, nome: e.target.value})} />
                <input required placeholder="Email" type="email" className={InputStyle} value={formAgent.email || ''} onChange={e => setFormAgent({...formAgent, email: e.target.value})} />
                <input required placeholder="Cellulare" className={InputStyle} value={formAgent.cell || ''} onChange={e => setFormAgent({...formAgent, cell: e.target.value})} />
                <input required placeholder="PIN (4 cifre)" maxLength={4} className={InputStyle} value={formAgent.pin || ''} onChange={e => setFormAgent({...formAgent, pin: e.target.value})} />
                
                <div className="md:col-span-2 bg-gray-50 p-4 border border-gray-200 space-y-3">
                    <p className="text-sm font-bold text-gray-600 mb-2 uppercase">Permessi e Ruoli</p>
                    <div className="flex flex-wrap gap-6">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input type="checkbox" checked={formAgent.isAgent} onChange={e => setFormAgent({...formAgent, isAgent: e.target.checked})} className="w-5 h-5 text-red-600 rounded focus:ring-red-600" />
                            <span className="text-sm text-gray-800 font-medium">Agente Operativo <span className="text-xs text-gray-500 block font-normal">Vede solo le sue pratiche</span></span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input type="checkbox" checked={formAgent.isAdmin} onChange={e => setFormAgent({...formAgent, isAdmin: e.target.checked})} className="w-5 h-5 text-red-600 rounded focus:ring-red-600" />
                            <span className="text-sm text-gray-800 font-medium">Amministratore <span className="text-xs text-gray-500 block font-normal">Gestione completa sistema</span></span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input type="checkbox" checked={formAgent.isActive} onChange={e => setFormAgent({...formAgent, isActive: e.target.checked})} className="w-5 h-5 text-red-600 rounded focus:ring-red-600" />
                            <span className="text-sm text-gray-800 font-medium">Account Attivo <span className="text-xs text-gray-500 block font-normal">Abilitato all'accesso</span></span>
                        </label>
                    </div>
                </div>

                <div className="md:col-span-2 flex gap-2 justify-end mt-2">
                    <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium">Annulla</button>
                    <button type="submit" className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 flex items-center gap-2 font-medium shadow-md">
                        <Save size={16}/> Salva Utente
                    </button>
                </div>
            </form>
        </div>
      )}

      <div className="bg-white shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left">
            <thead className="bg-black text-white">
                <tr>
                    <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider text-gray-300">Nome</th>
                    <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider text-gray-300">Contatti</th>
                    <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider text-gray-300">Ruolo</th>
                    <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider text-gray-300">Stato</th>
                    <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider text-gray-300 text-right">Azioni</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {agents.map(agent => (
                    <tr key={agent.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-bold text-gray-900">{agent.nome}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                            <div>{agent.email}</div>
                            <div className="text-xs text-gray-400">{agent.cell}</div>
                        </td>
                        <td className="px-6 py-4">
                            <div className="flex flex-col gap-1 items-start">
                                {agent.isAdmin && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-black text-white text-xs font-bold uppercase">
                                        <Shield size={10}/> Admin
                                    </span>
                                )}
                                {agent.isAgent ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold uppercase">
                                        <User size={10}/> Agente
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-200 text-gray-700 text-xs font-bold uppercase">
                                        <Briefcase size={10}/> Supervisore
                                    </span>
                                )}
                            </div>
                        </td>
                        <td className="px-6 py-4">
                            {agent.isActive ? 
                                <span className="text-green-600 text-sm font-bold flex items-center gap-1"><Activity size={14}/> ATTIVO</span> : 
                                <span className="text-gray-400 text-sm font-bold flex items-center gap-1"><UserX size={14}/> DISABILITATO</span>
                            }
                        </td>
                        <td className="px-6 py-4 text-right flex justify-end gap-2">
                            <button onClick={() => handleEdit(agent)} className="text-gray-600 hover:text-black p-1 font-bold text-xs uppercase tracking-wide">Modifica</button>
                            <button onClick={() => toggleActive(agent)} className={`${agent.isActive ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'} p-1 font-bold text-xs uppercase tracking-wide`}>
                                {agent.isActive ? 'Disabilita' : 'Attiva'}
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>
    </div>
  );
};