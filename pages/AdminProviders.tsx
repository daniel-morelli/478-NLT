import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { DbService } from '../services/dbService';
import { Provider } from '../types';
import { Plus, CheckCircle, XCircle, Save, Briefcase } from 'lucide-react';

export const AdminProviders: React.FC = () => {
  const { user } = useAuth();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [formProvider, setFormProvider] = useState<Partial<Provider>>({
    name: '',
    isActive: true
  });

  useEffect(() => {
    loadProviders();
  }, [user]);

  const loadProviders = () => {
    DbService.getAllProviders(false).then(setProviders); // False = mostra tutti, anche i disattivi
  };

  if (!user?.isAdmin) return <div>Accesso Negato</div>;

  const handleNew = () => {
    setFormProvider({ name: '', isActive: true });
    setIsEditing(true);
  };

  const handleEdit = (p: Provider) => {
    setFormProvider(p);
    setIsEditing(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formProvider.name) return;
    
    await DbService.saveProvider(formProvider);
    setIsEditing(false);
    loadProviders();
  };

  const toggleActive = async (provider: Provider) => {
    await DbService.saveProvider({ ...provider, isActive: !provider.isActive });
    loadProviders();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-2xl font-bold text-gray-800">Gestione Provider</h2>
            <p className="text-sm text-gray-500">Aggiungi o disabilita i fornitori</p>
        </div>
        <button 
          onClick={handleNew}
          className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 shadow-md transition-colors"
        >
          <Plus size={18} />
          Nuovo Provider
        </button>
      </div>

      {isEditing && (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-red-100 mb-6 animate-in fade-in slide-in-from-top-4">
            <h3 className="font-bold text-lg mb-4 text-gray-800">{formProvider.id ? 'Modifica Provider' : 'Nuovo Provider'}</h3>
            <form onSubmit={handleSave} className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 w-full">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome Provider</label>
                    <input 
                        required 
                        placeholder="Es. Arval" 
                        className="w-full border p-2 rounded focus:ring-2 focus:ring-red-500 outline-none" 
                        value={formProvider.name || ''} 
                        onChange={e => setFormProvider({...formProvider, name: e.target.value})} 
                    />
                </div>
                
                <div className="flex items-center gap-2 mb-2">
                    <input 
                        type="checkbox" 
                        id="isActive"
                        checked={formProvider.isActive} 
                        onChange={e => setFormProvider({...formProvider, isActive: e.target.checked})} 
                        className="w-5 h-5 text-red-600 rounded" 
                    />
                    <label htmlFor="isActive" className="text-sm text-gray-700 cursor-pointer">Attivo</label>
                </div>

                <div className="flex gap-2">
                    <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-50">Annulla</button>
                    <button type="submit" className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-2">
                        <Save size={16}/> Salva
                    </button>
                </div>
            </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                    <th className="px-6 py-3 font-semibold text-gray-600">Nome Provider</th>
                    <th className="px-6 py-3 font-semibold text-gray-600">Stato</th>
                    <th className="px-6 py-3 font-semibold text-gray-600 text-right">Azioni</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {providers.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-2">
                            <Briefcase size={16} className="text-gray-400"/>
                            {p.name}
                        </td>
                        <td className="px-6 py-4">
                            {p.isActive ? 
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">
                                    <CheckCircle size={12}/> Attivo
                                </span> : 
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-500 text-xs font-bold">
                                    <XCircle size={12}/> Disabilitato
                                </span>
                            }
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                            <button onClick={() => handleEdit(p)} className="text-gray-600 hover:text-black font-medium text-sm transition-colors">
                                Rinomina
                            </button>
                            <button 
                                onClick={() => toggleActive(p)} 
                                className={`${p.isActive ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'} font-medium text-sm transition-colors`}
                            >
                                {p.isActive ? 'Disabilita' : 'Riattiva'}
                            </button>
                        </td>
                    </tr>
                ))}
                {providers.length === 0 && (
                    <tr>
                        <td colSpan={3} className="px-6 py-8 text-center text-gray-400">Nessun provider inserito.</td>
                    </tr>
                )}
            </tbody>
        </table>
      </div>
    </div>
  );
};