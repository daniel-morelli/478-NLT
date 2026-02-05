
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { DbService } from '../services/dbService';
import { DealSource } from '../types';
import { Plus, CheckCircle, XCircle, Save, Info } from 'lucide-react';

export const AdminDealSources: React.FC = () => {
  const { user } = useAuth();
  const [sources, setSources] = useState<DealSource[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [formSource, setFormSource] = useState<Partial<DealSource>>({
    name: '',
    isActive: true
  });

  useEffect(() => {
    loadSources();
  }, [user]);

  const loadSources = () => {
    DbService.getAllDealSources(false).then(setSources);
  };

  if (!user?.isAdmin) return <div className="p-8 text-center text-red-600 font-bold tracking-widest uppercase">Accesso Negato</div>;

  const handleNew = () => {
    setFormSource({ name: '', isActive: true });
    setIsEditing(true);
  };

  const handleEdit = (s: DealSource) => {
    setFormSource(s);
    setIsEditing(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSource.name) return;
    
    await DbService.saveDealSource(formSource);
    setIsEditing(false);
    loadSources();
  };

  const toggleActive = async (source: DealSource) => {
    await DbService.saveDealSource({ ...source, isActive: !source.isActive });
    loadSources();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tighter uppercase">Gestione <span className="text-red-600">Origini</span></h2>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Configura i canali di provenienza delle trattative</p>
        </div>
        <button 
          onClick={handleNew}
          className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-2xl hover:bg-gray-800 shadow-xl transition-all transform active:scale-95 font-bold uppercase text-xs tracking-widest"
        >
          <Plus size={18} />
          Nuova Origine
        </button>
      </div>

      {isEditing && (
        <div className="bg-white p-8 rounded-[2rem] shadow-lg border border-red-100 mb-6 animate-in fade-in slide-in-from-top-4">
            <h3 className="font-black text-sm uppercase tracking-widest mb-6 text-gray-800">{formSource.id ? 'Modifica Origine' : 'Nuova Origine'}</h3>
            <form onSubmit={handleSave} className="flex flex-col md:flex-row gap-6 items-end">
                <div className="flex-1 w-full">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Nome Origine</label>
                    <input 
                        required 
                        placeholder="Es. Passaparola, Sito Web..." 
                        className="w-full border border-gray-200 bg-white text-gray-900 rounded-xl p-3.5 focus:ring-2 focus:ring-red-600 focus:border-red-600 outline-none transition-all text-sm font-semibold shadow-sm" 
                        value={formSource.name || ''} 
                        onChange={e => setFormSource({...formSource, name: e.target.value})} 
                    />
                </div>
                
                <div className="flex items-center gap-2 mb-4">
                    <input 
                        type="checkbox" 
                        id="isActive"
                        checked={formSource.isActive} 
                        onChange={e => setFormSource({...formSource, isActive: e.target.checked})} 
                        className="w-5 h-5 text-red-600 border-gray-300 focus:ring-red-600 rounded-lg" 
                    />
                    <label htmlFor="isActive" className="text-xs font-bold text-gray-700 cursor-pointer uppercase tracking-tight">Attivo</label>
                </div>

                <div className="flex gap-2">
                    <button type="button" onClick={() => setIsEditing(false)} className="px-6 py-3 border border-gray-300 text-gray-500 hover:bg-gray-50 font-black uppercase text-[10px] tracking-widest transition-colors rounded-xl">Annulla</button>
                    <button type="submit" className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 flex items-center gap-2 font-black uppercase text-[10px] tracking-widest shadow-lg shadow-red-600/20">
                        <Save size={16}/> Salva
                    </button>
                </div>
            </form>
        </div>
      )}

      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
            <thead className="bg-black text-white">
                <tr>
                    <th className="px-8 py-4 font-black uppercase text-[10px] tracking-[0.2em] text-gray-400">Canale / Origine</th>
                    <th className="px-8 py-4 font-black uppercase text-[10px] tracking-[0.2em] text-gray-400">Stato</th>
                    <th className="px-8 py-4 font-black uppercase text-[10px] tracking-[0.2em] text-gray-400 text-right">Azioni</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
                {sources.map(s => (
                    <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-8 py-4">
                            <div className="flex items-center gap-3 font-black text-gray-900 uppercase tracking-tighter text-sm">
                                <Info size={16} className="text-gray-300"/>
                                {s.name}
                            </div>
                        </td>
                        <td className="px-8 py-4">
                            {s.isActive ? 
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-50 text-green-700 text-[9px] font-black uppercase tracking-widest border border-green-100">
                                    <CheckCircle size={12}/> Attivo
                                </span> : 
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-50 text-gray-400 text-[9px] font-black uppercase tracking-widest border border-gray-200">
                                    <XCircle size={12}/> Disabilitato
                                </span>
                            }
                        </td>
                        <td className="px-8 py-4 text-right">
                            <div className="flex items-center justify-end gap-3">
                                <button onClick={() => handleEdit(s)} className="text-gray-400 hover:text-black font-black text-[10px] uppercase tracking-widest transition-colors">
                                    Modifica
                                </button>
                                <button 
                                    onClick={() => toggleActive(s)} 
                                    className={`${s.isActive ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'} font-black text-[10px] uppercase tracking-widest transition-colors`}
                                >
                                    {s.isActive ? 'Disabilita' : 'Riattiva'}
                                </button>
                            </div>
                        </td>
                    </tr>
                ))}
                {sources.length === 0 && (
                    <tr>
                        <td colSpan={3} className="px-8 py-12 text-center text-gray-300 font-black uppercase tracking-widest text-xs">Nessuna origine configurata.</td>
                    </tr>
                )}
            </tbody>
        </table>
      </div>
    </div>
  );
};
