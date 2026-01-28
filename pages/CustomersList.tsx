
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { DbService } from '../services/dbService';
import { Customer } from '../types';
import { User, Mail, Phone, Search, Plus, X, Save, Edit3, Briefcase, PhoneCall } from 'lucide-react';
import { Modal } from '../components/Modal';

export const CustomersList: React.FC = () => {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formCustomer, setFormCustomer] = useState<Partial<Customer>>({ nome: '', email: '', cell: '' });

  useEffect(() => {
    if (user) {
      loadCustomers();
    }
  }, [user]);

  const loadCustomers = async () => {
    setLoading(true);
    const data = await DbService.getCustomers(user!);
    setCustomers(data);
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
        await DbService.saveCustomer({ ...formCustomer, agentId: user.id });
        setIsModalOpen(false);
        loadCustomers();
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  const filtered = customers.filter(c => c.nome.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase()));

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
            onClick={() => {setFormCustomer({ nome: '', email: '', cell: '' }); setIsModalOpen(true);}} 
            className="w-full md:w-auto flex items-center justify-center gap-2 bg-black text-white px-6 py-3 hover:bg-gray-800 shadow-xl transition-all transform active:scale-95 font-bold uppercase text-xs tracking-widest rounded-2xl"
        >
          <Plus size={18} /> Nuovo Cliente
        </button>
      </div>

      <div className="bg-white p-4 shadow-sm border border-gray-200 flex items-center gap-4 rounded-2xl">
        <Search className="text-gray-400" size={20} />
        <input 
            type="text" 
            placeholder="Cerca per nome o email..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent border-none outline-none text-sm font-semibold placeholder:text-gray-300"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
            <div className="col-span-full py-20 text-center"><div className="w-8 h-8 border-4 border-red-600 border-t-transparent animate-spin rounded-full mx-auto"></div></div>
        ) : filtered.length > 0 ? (
            filtered.map(c => (
                <div key={c.id} className="bg-white border border-gray-100 p-6 rounded-3xl shadow-sm hover:shadow-xl transition-all group">
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

                    <div className="space-y-3">
                        <div className="flex items-center gap-3 text-gray-500">
                            <Mail size={14} className="text-red-600" />
                            <span className="text-xs font-bold truncate">{c.email || 'Email non presente'}</span>
                        </div>
                        <div className="flex items-center gap-3 text-gray-500">
                            <Phone size={14} className="text-red-600" />
                            <span className="text-xs font-bold">{c.cell || 'Cellulare non presente'}</span>
                        </div>
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
