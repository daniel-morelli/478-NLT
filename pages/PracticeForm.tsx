
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DbService } from '../services/dbService';
import { Practice, DealStatus, CreditStatus, OrderStatus, Provider, Agent, Reminder, Customer, VehicleCredit, VehicleOrder, PracticeType, DealSource } from '../types';
import { ArrowLeft, Save, Lock, User, History, Briefcase, ShieldCheck, ShoppingCart, Bell, Info, Search, UserPlus, Phone, Mail, AlertTriangle, X, Plus, Trash2, RefreshCw, Users, Layers, PhoneCall, Unlock, Target } from 'lucide-react';
import { PracticeReminders } from '../components/PracticeReminders';
import { PracticeTimeline } from '../components/PracticeTimeline';
import { Modal } from '../components/Modal';

const formatIT = (val: number | undefined): string => {
  if (val === undefined || val === null) return '';
  return new Intl.NumberFormat('it-IT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: true,
  }).format(val);
};

const parseIT = (val: string): number | undefined => {
  if (!val) return undefined;
  const clean = val.replace(/\./g, '').replace(',', '.');
  const parsed = parseFloat(clean);
  return isNaN(parsed) ? undefined : parsed;
};

const getMeseAnnoOptions = () => {
  const mesi = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
  const currentYear = new Date().getFullYear();
  const options: string[] = [];
  mesi.forEach(m => options.push(`${m} ${currentYear}`));
  mesi.forEach(m => options.push(`${m} ${currentYear + 1}`));
  return options;
};

type TabType = 'storia' | 'trattativa' | 'affidamento' | 'ordine' | 'promemoria';

export const PracticeForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState<TabType>(id ? 'storia' : 'trattativa');
  const [loading, setLoading] = useState(false);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [dealSources, setDealSources] = useState<DealSource[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [showAgentConfirm, setShowAgentConfirm] = useState(false);
  const [pendingAgentId, setPendingAgentId] = useState('');

  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerResults, setShowCustomerResults] = useState(false);
  const [isAddingNewCustomer, setIsAddingNewCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ nome: '', email: '', cell: '' });

  const [formData, setFormData] = useState<Partial<Practice>>({
    data: new Date().toISOString().split('T')[0],
    tipoTrattativa: PracticeType.ORDINE,
    agentId: '',
    statoTrattativa: DealStatus.IN_CORSO,
    statoAffidamento: '',
    statoOrdine: '',
    numeroVeicoli: undefined,
    valoreTotale: undefined,
    valoreListinoTrattativa: undefined,
    mesePrevistoChiusura: '',
    dealSource: '',
    veicoliAffidamento: [],
    veicoliOrdine: [],
    provider: '',
    annotazioniTrattativa: '',
    annotazioniAffidamento: '',
    annotazioneOrdine: '',
    validoRappel: '',
    isLocked: false,
    customerId: '',
    dataRichiestaAffidamento: '',
    dataAffidamento: ''
  });

  const isPowerUser = user?.isAdmin || user?.isTeamLeader;
  const isPracticeLocked = formData.isLocked && !isPowerUser;

  // Effetto per impostare l'agente di default se è un agente semplice che crea una nuova pratica
  useEffect(() => {
    if (!id && user && !isPowerUser && !formData.agentId) {
      setFormData(prev => ({ ...prev, agentId: user.id }));
    }
  }, [user, id, isPowerUser, formData.agentId]);

  // Calcoli automatici Affidamento
  const autoCreditTotals = useMemo(() => {
    const list = formData.veicoliAffidamento || [];
    return {
        count: list.length,
        listino: list.reduce((sum, v) => sum + (v.valoreListino || 0), 0),
        provvigione: list.reduce((sum, v) => sum + (v.provvigione || 0), 0)
    };
  }, [formData.veicoliAffidamento]);

  // Calcoli automatici Ordine
  const autoOrderTotals = useMemo(() => {
    const list = formData.veicoliOrdine || [];
    return {
        count: list.length,
        listino: list.reduce((sum, v) => sum + (v.valoreListino || 0), 0),
        provvigione: list.reduce((sum, v) => sum + (v.provvigione || 0), 0)
    };
  }, [formData.veicoliOrdine]);

  useEffect(() => {
    DbService.getAllProviders(true).then(setProviders);
    DbService.getAllDealSources(true).then(setDealSources);
    if (user && isPowerUser) {
        DbService.getAllAgents(true).then(data => {
            setAgents(data.filter(a => a.isAgent && a.isActive));
        });
    }
  }, [user, isPowerUser]);

  useEffect(() => {
    if (id && user) {
      loadPracticeData();
    }
  }, [id, user]);

  useEffect(() => {
    if (user && formData.agentId) {
        setLoading(true);
        DbService.getCustomers(user, formData.agentId).then(data => {
            setCustomers(data);
            setLoading(false);
        }).catch(() => setLoading(false));
    } else {
        setCustomers([]);
    }
  }, [formData.agentId, user]);

  const loadPracticeData = async () => {
    if (!id || !user) return;
    setLoading(true);
    try {
        const [practicesData, remindersData] = await Promise.all([
          DbService.getPractices(user),
          DbService.getReminders(id)
        ]);
        const found = practicesData.find(p => p.id === id);
        if (found) {
          setFormData({
            ...found,
            veicoliAffidamento: found.veicoliAffidamento || [],
            veicoliOrdine: found.veicoliOrdine || []
          });
          setCustomerSearch(found.customerData?.nome || '');
          setReminders(remindersData);
        } else {
          setErrorMessage("Pratica non trovata.");
        }
    } catch (err) {
        setErrorMessage("Errore nel caricamento.");
    } finally {
        setLoading(false);
    }
  };

  const filteredCustomers = useMemo(() => {
    if (!customerSearch) return [];
    return customers.filter(c => c.nome.toLowerCase().includes(customerSearch.toLowerCase()));
  }, [customers, customerSearch]);

  const handleSelectCustomer = (c: Customer) => {
    setFormData(prev => ({ ...prev, customerId: c.id, customerData: c }));
    setCustomerSearch(c.nome);
    setShowCustomerResults(false);
    setIsAddingNewCustomer(false);
  };

  const handleCreateCustomer = async () => {
    if (!newCustomer.nome || !formData.agentId) return;
    setLoading(true);
    try {
        const saved = await DbService.saveCustomer({ ...newCustomer, agentId: formData.agentId });
        setCustomers(prev => [...prev, saved]);
        handleSelectCustomer(saved);
        setNewCustomer({ nome: '', email: '', cell: '' });
    } catch (e) {
        setErrorMessage("Errore creazione cliente.");
    } finally {
        setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    if (isPracticeLocked) return;
    if (name === 'agentId') {
        if (formData.customerId) {
            setPendingAgentId(value);
            setShowAgentConfirm(true);
        } else {
            setFormData(prev => ({ ...prev, agentId: value }));
            setCustomerSearch('');
        }
        return;
    }
    if (type === 'checkbox') {
        const checked = (e.target as HTMLInputElement).checked;
        setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (name.includes('numero')) {
        setFormData(prev => ({ ...prev, [name]: value === '' ? undefined : Number(value) }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const confirmAgentChange = (keepCustomer: boolean) => {
    if (keepCustomer) {
        setFormData(prev => ({ ...prev, agentId: pendingAgentId }));
    } else {
        setFormData(prev => ({ 
            ...prev, 
            agentId: pendingAgentId,
            customerId: '', 
            customerData: undefined 
        }));
        setCustomerSearch('');
    }
    setShowAgentConfirm(false);
    setPendingAgentId('');
  };

  const handleCurrencyChange = (name: string, numericValue: number | undefined) => {
    if (isPracticeLocked) return;
    setFormData(prev => ({ ...prev, [name]: numericValue }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (isPracticeLocked) {
        setErrorMessage("Questa pratica è bloccata e non può essere salvata.");
        return;
    }
    if (!formData.agentId) { setErrorMessage("Seleziona un agente."); return; }
    if (!formData.customerId) { setErrorMessage("Seleziona un cliente."); return; }
    setLoading(true);
    try {
      await DbService.savePractice({ ...formData, agentId: formData.agentId });
      navigate('/practices');
    } catch (error: any) {
      setErrorMessage(`Errore: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const addVehicleCredit = () => {
    if (isPracticeLocked) return;
    const newVehicle: VehicleCredit = { id: crypto.randomUUID(), marca: '', modello: '', valoreListino: 0, provvigione: 0 };
    setFormData(prev => ({ ...prev, veicoliAffidamento: [...(prev.veicoliAffidamento || []), newVehicle] }));
  };

  const removeVehicleCredit = (vId: string) => {
    if (isPracticeLocked) return;
    setFormData(prev => ({ ...prev, veicoliAffidamento: (prev.veicoliAffidamento || []).filter(v => v.id !== vId) }));
  };

  const updateVehicleCredit = (vId: string, field: keyof VehicleCredit, value: string | number) => {
    if (isPracticeLocked) return;
    setFormData(prev => ({
        ...prev,
        veicoliAffidamento: (prev.veicoliAffidamento || []).map(v => v.id === vId ? { ...v, [field]: value } : v)
    }));
  };

  const addVehicleOrder = () => {
    if (isPracticeLocked) return;
    const newVehicle: VehicleOrder = { id: crypto.randomUUID(), marca: '', modello: '', valoreListino: 0, provvigione: 0, durataMesi: 0, km: 0, anticipo: 0, dataConsegna: '' };
    setFormData(prev => ({ ...prev, veicoliOrdine: [...(prev.veicoliOrdine || []), newVehicle] }));
  };

  const removeVehicleOrder = (vId: string) => {
    if (isPracticeLocked) return;
    setFormData(prev => ({ ...prev, veicoliOrdine: (prev.veicoliOrdine || []).filter(v => v.id !== vId) }));
  };

  const updateVehicleOrder = (vId: string, field: keyof VehicleOrder, value: string | number) => {
    if (isPracticeLocked) return;
    setFormData(prev => ({
        ...prev,
        veicoliOrdine: (prev.veicoliOrdine || []).map(v => v.id === vId ? { ...v, [field]: value } : v)
    }));
  };

  const isAffidamentoEnabled = (formData.statoTrattativa === DealStatus.IN_CORSO || formData.statoTrattativa === DealStatus.CHIUSA) && !isPracticeLocked;
  const isOrdineEnabled = (formData.statoAffidamento === CreditStatus.APPROVATO || formData.statoAffidamento === CreditStatus.APPROVATO_CON_CONDIZIONI) && !isPracticeLocked;

  const InputStyle = "w-full border border-gray-200 bg-white text-gray-900 rounded-xl p-3.5 focus:ring-2 focus:ring-red-600 focus:border-red-600 outline-none transition-all disabled:bg-gray-50 disabled:text-gray-400 text-sm font-semibold shadow-sm";
  const CompactInputStyle = "w-full border border-gray-100 bg-white text-gray-900 rounded-lg p-2 focus:ring-1 focus:ring-red-600 outline-none text-xs font-semibold shadow-sm";
  const NumberInputStyle = `${InputStyle} text-right font-mono`;
  const CompactNumberInputStyle = `${CompactInputStyle} text-right font-mono`;
  const LabelStyle = "block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1";

  const CurrencyInput = ({ name, value, onChange, disabled, label, highlight }: { name: string, value: number | undefined, onChange?: (name: string, val: number | undefined) => void, disabled?: boolean, label: string, highlight?: boolean }) => {
    const [localValue, setLocalValue] = useState(formatIT(value));
    const [isFocused, setIsFocused] = useState(false);
    useEffect(() => { if (!isFocused) setLocalValue(formatIT(value)); }, [value, isFocused]);
    const handleFocus = () => { if (onChange) setIsFocused(true); if (value !== undefined && onChange) setLocalValue(value.toString().replace('.', ',')); };
    const handleBlur = () => { setIsFocused(false); if (onChange) { const numeric = parseIT(localValue); onChange(name, numeric); } };
    return (
      <div className="space-y-1">
        <label className={LabelStyle}>{label}</label>
        <input type="text" readOnly={!onChange} disabled={disabled || isPracticeLocked} value={localValue} onFocus={handleFocus} onBlur={handleBlur} onChange={(e) => setLocalValue(e.target.value)} className={`${NumberInputStyle} ${highlight ? 'border-red-100 bg-red-50/20' : ''} ${!onChange ? 'bg-gray-50 text-gray-500 font-black' : ''}`} placeholder="0,00" />
      </div>
    );
  };

  const TabButton = ({ type, icon: Icon, label, statusColor }: { type: TabType, icon: any, label: string, statusColor?: string }) => {
    const isActive = activeTab === type;
    return (
      <button type="button" onClick={() => setActiveTab(type)} className={`flex-1 flex flex-col items-center gap-2 py-4 px-2 transition-all border-b-4 ${isActive ? 'border-red-600 text-red-600 bg-red-50/30' : 'border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-50'} first:rounded-tl-2xl last:rounded-tr-2xl`}>
        <div className="relative">
            <Icon size={20} className={isActive ? 'text-red-600' : 'text-gray-400'} />
            {statusColor && <span className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-white ${statusColor}`}></span>}
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest hidden md:block">{label}</span>
      </button>
    );
  };

  const getDealColor = () => {
    if (formData.statoTrattativa === DealStatus.IN_CORSO) return 'bg-orange-500';
    if (formData.statoTrattativa === DealStatus.CHIUSA) return 'bg-emerald-500';
    if (formData.statoTrattativa === DealStatus.FALLITA) return 'bg-gray-400';
    return undefined;
  };

  const getCreditColor = () => {
    if (formData.statoAffidamento === CreditStatus.IN_ATTESA) return 'bg-orange-500';
    if (formData.statoAffidamento === CreditStatus.APPROVATO) return 'bg-emerald-500';
    if (formData.statoAffidamento === CreditStatus.APPROVATO_CON_CONDIZIONI) return 'bg-sky-500';
    if (formData.statoAffidamento === CreditStatus.BOCCIATO) return 'bg-rose-500';
    return undefined;
  };

  const getOrderColor = () => {
    if (formData.statoOrdine === OrderStatus.INVIATO) return 'bg-emerald-500';
    if (formData.statoOrdine === OrderStatus.NON_INVIATO) return 'bg-gray-400';
    if (formData.statoOrdine === OrderStatus.ANNULLATO) return 'bg-rose-500';
    return undefined;
  };

  return (
    <div className="max-w-7xl mx-auto pb-24 px-4">
        <Modal isOpen={!!errorMessage} onClose={() => setErrorMessage(null)} title="Attenzione" message={errorMessage || ''} confirmLabel="Ho capito" onConfirm={() => setErrorMessage(null)} />

        {showAgentConfirm && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white w-full max-w-md shadow-2xl rounded-3xl overflow-hidden border-t-4 border-red-600 flex flex-col">
                    <div className="p-8">
                        <div className="flex items-start gap-4 mb-6"><div className="p-3 bg-red-50 text-red-600 rounded-2xl"><AlertTriangle size={24} /></div><div><h3 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-2">Cambio Agente</h3><p className="text-gray-500 text-sm leading-relaxed">Vuoi mantenere il cliente <strong className="text-black">"{formData.customerData?.nome}"</strong> o resettare?</p></div></div>
                        <div className="flex flex-col gap-3">
                            <button onClick={() => confirmAgentChange(true)} className="w-full bg-black text-white px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 transition-all shadow-xl shadow-black/10 flex items-center justify-center gap-2"><Users size={16}/> Mantieni Cliente</button>
                            <button onClick={() => confirmAgentChange(false)} className="w-full bg-red-600 text-white px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-xl shadow-red-600/10 flex items-center justify-center gap-2"><RefreshCw size={16}/> Cambia e Resetta</button>
                            <button onClick={() => {setShowAgentConfirm(false); setPendingAgentId('');}} className="w-full text-gray-400 px-6 py-2 text-[10px] font-black uppercase tracking-widest hover:text-gray-900 transition-all">Annulla</button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        <div className="flex justify-between items-center mb-6 max-w-5xl mx-auto">
            <button onClick={() => navigate('/practices')} className="flex items-center text-gray-400 hover:text-red-600 transition-colors font-black text-[10px] uppercase tracking-widest">
                <ArrowLeft className="w-4 h-4 mr-2" /> Torna all'elenco
            </button>
            {formData.isLocked && <div className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-red-600/20"><Lock size={14}/> Pratica Bloccata</div>}
        </div>

        <div className="bg-white shadow-xl border border-gray-200 rounded-3xl overflow-hidden relative">
            {loading && <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-[60] flex items-center justify-center"><div className="w-10 h-10 border-4 border-red-600 border-t-transparent animate-spin rounded-full"></div></div>}

            <div className="bg-black text-white p-6 md:p-8 flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-gray-900">
                <div>
                    <h2 className="text-2xl font-black tracking-tight uppercase">{formData.customerData?.nome || 'Nuova Pratica'}</h2>
                    <div className="flex items-center gap-3 mt-1"><span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{formData.provider || 'Provider N/D'}</span><span className="text-red-600 text-[10px] font-black">•</span><span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{id ? `ID: ${id.substring(0,8)}` : 'Bozza'}</span></div>
                </div>
                {isPowerUser ? (
                    <div className={`flex items-center gap-3 bg-gray-900 px-4 py-3 border rounded-2xl transition-all duration-300 ${!formData.agentId ? 'border-red-600 ring-4 ring-red-600/30 bg-red-600/5' : 'border-gray-800'}`}>
                        <User size={16} className={!formData.agentId ? 'text-red-600 animate-pulse' : 'text-red-600'} />
                        <select name="agentId" required disabled={isPracticeLocked} value={formData.agentId || ''} onChange={handleChange} className="bg-transparent border-none text-white text-[11px] font-black focus:ring-0 cursor-pointer outline-none uppercase tracking-widest">
                            <option value="" className="bg-black text-red-500 italic">-- SELEZIONA AGENTE --</option>
                            {agents.map(a => <option key={a.id} value={a.id} className="bg-black">{a.nome.toUpperCase()}</option>)}
                        </select>
                    </div>
                ) : (
                    <div className="text-[10px] font-black text-gray-400 tracking-widest uppercase flex items-center gap-2 bg-gray-900 px-4 py-3 rounded-2xl border border-gray-800"><User size={14} className="text-red-600"/> {user?.nome}</div>
                )}
            </div>

            <div className="flex border-b border-gray-50 bg-white sticky top-0 z-50">
                <TabButton type="storia" icon={History} label="Storia" />
                <TabButton type="trattativa" icon={Briefcase} label="Trattativa" statusColor={getDealColor()} />
                <TabButton type="affidamento" icon={ShieldCheck} label="Affidamento" statusColor={getCreditColor()} />
                <TabButton type="ordine" icon={ShoppingCart} label="Ordine" statusColor={getOrderColor()} />
                <TabButton type="promemoria" icon={Bell} label="Promemoria" />
            </div>

            <form onSubmit={handleSubmit} className="p-6 md:p-10 min-h-[500px]">
                {activeTab === 'storia' && <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300">{id ? <PracticeTimeline practice={formData} reminders={reminders} /> : <div className="py-20 text-center text-gray-300 font-black uppercase tracking-widest">Salva per la timeline</div>}</div>}

                {activeTab === 'trattativa' && (
                    <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <section>
                            <h3 className="text-[11px] font-black text-gray-900 uppercase tracking-[0.3em] flex items-center gap-2 mb-8 border-b border-gray-50 pb-2 w-full"><Info size={16} className="text-red-600"/> DATI IDENTIFICATIVI</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
                                <div><label className={LabelStyle}>Tipologia Trattativa</label><select name="tipoTrattativa" required disabled={isPracticeLocked} value={formData.tipoTrattativa || PracticeType.ORDINE} onChange={handleChange} className={`${InputStyle} font-black uppercase border-black ring-black/5`}><option value={PracticeType.ORDINE}>ORDINE</option><option value={PracticeType.PROROGA}>PROROGA</option></select></div>
                                <div><label className={LabelStyle}>Data Pratica</label><input type="date" name="data" required disabled={isPracticeLocked} value={formData.data} onChange={handleChange} className={InputStyle} /></div>
                                <div><label className={LabelStyle}>Stato Trattativa</label><select name="statoTrattativa" disabled={isPracticeLocked} value={formData.statoTrattativa} onChange={handleChange} className={`${InputStyle} font-black text-red-600 bg-red-50/20`}>{Object.values(DealStatus).map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}</select></div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                                <div>
                                  <label className={LabelStyle}>Origine Trattativa</label>
                                  <select name="dealSource" disabled={isPracticeLocked} value={formData.dealSource || ''} onChange={handleChange} className={InputStyle}>
                                    <option value="">-- SELEZIONA ORIGINE --</option>
                                    {dealSources.map(s => <option key={s.id} value={s.name}>{s.name.toUpperCase()}</option>)}
                                  </select>
                                </div>
                                <div>
                                  <label className={LabelStyle}>Mese Previsto Chiusura</label>
                                  <select name="mesePrevistoChiusura" disabled={isPracticeLocked} value={formData.mesePrevistoChiusura} onChange={handleChange} className={InputStyle}>
                                    <option value="">-- SELEZIONA MESE --</option>
                                    {getMeseAnnoOptions().map(opt => <option key={opt} value={opt}>{opt.toUpperCase()}</option>)}
                                  </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2 relative">
                                    <label className={LabelStyle}>Ricerca Anagrafica Cliente</label>
                                    <div className="relative group">
                                      <Search size={16} className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${!formData.agentId ? 'text-red-600' : 'text-gray-400'}`} />
                                      <input 
                                        type="text" 
                                        placeholder={formData.agentId ? "Cerca cliente..." : "⚠️ SELEZIONA PRIMA UN AGENTE IN ALTO A DESTRA"} 
                                        disabled={!formData.agentId || isPracticeLocked} 
                                        value={customerSearch} 
                                        onChange={(e) => {setCustomerSearch(e.target.value); setShowCustomerResults(true);}} 
                                        onFocus={() => setShowCustomerResults(true)} 
                                        className={`${InputStyle} pl-11 ${(!formData.agentId || isPracticeLocked) ? 'bg-red-50/50 border-red-200 cursor-not-allowed placeholder:text-red-600/60 placeholder:font-black placeholder:text-[10px]' : ''}`} 
                                      />
                                      {showCustomerResults && formData.agentId && customerSearch.length > 0 && !isPracticeLocked && (
                                            <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-gray-200 shadow-2xl z-[100] rounded-2xl max-h-60 overflow-y-auto">
                                              {filteredCustomers.length > 0 ? (
                                                filteredCustomers.map(c => (
                                                  <div key={c.id} onClick={() => handleSelectCustomer(c)} className="p-4 hover:bg-red-50 cursor-pointer border-b border-gray-50 last:border-0 flex items-center justify-between group">
                                                    <div className="flex flex-col">
                                                      <span className="font-black text-gray-900 text-sm group-hover:text-red-600 transition-colors uppercase">{c.nome}</span>
                                                      <span className="text-[10px] text-gray-400 font-bold">{c.email} • {c.cell}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                      {c.cell && (
                                                        <a href={`tel:${c.cell}`} onClick={(e) => e.stopPropagation()} className="text-red-600 p-2 hover:bg-red-100 rounded-lg transition-colors"><PhoneCall size={14} /></a>
                                                      )}
                                                      <Briefcase size={14} className="text-gray-200" />
                                                    </div>
                                                  </div>
                                                ))
                                              ) : (
                                                <div onClick={() => {setIsAddingNewCustomer(true); setNewCustomer({...newCustomer, nome: customerSearch}); setShowCustomerResults(false);}} className="p-6 text-center cursor-pointer hover:bg-gray-50">
                                                  <UserPlus size={24} className="mx-auto text-red-600 mb-2" />
                                                  <span className="text-xs font-black text-gray-900 uppercase tracking-widest block">" {customerSearch} "</span>
                                                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Anagrafica non trovata. Clicca per censirla.</span>
                                                </div>
                                              )}
                                            </div>
                                        )}
                                    </div>
                                    {formData.customerId && (
                                      <div className="mt-2 flex items-center gap-2">
                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-100 rounded-lg w-fit"><ShieldCheck size={14} className="text-green-600" /><span className="text-[9px] font-black text-green-700 uppercase tracking-widest">Collegata</span></div>
                                        {formData.customerData?.cell && (
                                          <a href={`tel:${formData.customerData.cell}`} className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white border border-red-700 rounded-lg w-fit hover:bg-red-700 transition-colors shadow-sm"><PhoneCall size={12} /><span className="text-[9px] font-black uppercase tracking-widest">Chiama</span></a>
                                        )}
                                      </div>
                                    )}
                                </div>
                                <div><label className={LabelStyle}>Provider</label><select name="provider" required disabled={isPracticeLocked} value={formData.provider || ''} onChange={handleChange} className={InputStyle}><option value="">-- SELEZIONA PROVIDER --</option>{providers.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}</select></div>
                            </div>

                            {isAddingNewCustomer && !isPracticeLocked && (
                                <div className="mt-6 p-6 bg-red-50/30 border border-red-100 rounded-3xl animate-in zoom-in-95 duration-200">
                                  <div className="flex justify-between items-center mb-6"><h4 className="text-[10px] font-black text-red-600 uppercase tracking-widest flex items-center gap-2"><UserPlus size={16}/> NUOVA ANAGRAFICA</h4><button type="button" onClick={() => setIsAddingNewCustomer(false)} className="text-gray-400 hover:text-red-600"><X size={16}/></button></div>
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div><label className={LabelStyle}>Nome</label><input type="text" value={newCustomer.nome} onChange={e => setNewCustomer({...newCustomer, nome: e.target.value})} className={InputStyle} /></div>
                                    <div><label className={LabelStyle}>Email</label><input type="email" value={newCustomer.email} onChange={e => setNewCustomer({...newCustomer, email: e.target.value})} className={InputStyle} /></div>
                                    <div><label className={LabelStyle}>Cellulare</label><input type="tel" value={newCustomer.cell} onChange={e => setNewCustomer({...newCustomer, cell: e.target.value})} className={InputStyle} /></div>
                                  </div>
                                  <div className="mt-6 flex justify-end"><button type="button" onClick={handleCreateCustomer} className="bg-black text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-colors">Salva Anagrafica</button></div>
                                </div>
                            )}
                        </section>

                        <section className="pt-2 border-t border-gray-100">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div><label className={LabelStyle}>Veicoli Potenziali</label><input type="number" name="numeroVeicoli" disabled={isPracticeLocked} value={formData.numeroVeicoli ?? ''} onChange={handleChange} className={NumberInputStyle} placeholder="0" /></div>
                            <CurrencyInput label="Listino Trattativa (€)" name="valoreListinoTrattativa" disabled={isPracticeLocked} value={formData.valoreListinoTrattativa} onChange={handleCurrencyChange} />
                            <CurrencyInput label="Provv. Tot. Trattativa (€)" name="valoreTotale" disabled={isPracticeLocked} value={formData.valoreTotale} onChange={handleCurrencyChange} highlight={true} />
                            <div className="lg:col-span-3"><label className={LabelStyle}>Annotazioni Trattativa</label><textarea name="annotazioniTrattativa" rows={4} disabled={isPracticeLocked} value={formData.annotazioniTrattativa || ''} onChange={handleChange} className={InputStyle} /></div>
                          </div>
                        </section>
                    </div>
                )}

                {activeTab === 'affidamento' && (
                    <div className={`space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-300 ${(!isAffidamentoEnabled || isPracticeLocked) ? 'opacity-50' : ''}`}>
                        <div className="max-w-5xl mx-auto space-y-12"><div className="flex items-center justify-between border-b border-gray-100 pb-4"><h3 className="text-[11px] font-black text-gray-900 uppercase tracking-[0.3em] flex items-center gap-2"><ShieldCheck size={16} className="text-red-600"/> ISTRUTTORIA CREDITIZIA</h3>{(!isAffidamentoEnabled || isPracticeLocked) && <div className="text-[10px] font-black text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-100 flex items-center gap-1 uppercase"><Lock size={12}/> Bloccata</div>}</div><div className="space-y-8"><div className="grid grid-cols-1 md:grid-cols-3 gap-8"><div><label className={LabelStyle}>Esito</label><select disabled={!isAffidamentoEnabled || isPracticeLocked} name="statoAffidamento" value={formData.statoAffidamento} onChange={handleChange} className={InputStyle}><option value="">-- IN ATTESA --</option>{Object.values(CreditStatus).map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}</select></div><div><label className={LabelStyle}>Data Affidamento</label><input disabled={!isAffidamentoEnabled || isPracticeLocked} type="date" name="dataRichiestaAffidamento" value={formData.dataRichiestaAffidamento || ''} onChange={handleChange} className={InputStyle} /></div><div><label className={LabelStyle}>Data Esito</label><input disabled={!isAffidamentoEnabled || isPracticeLocked} type="date" name="dataAffidamento" value={formData.dataAffidamento || ''} onChange={handleChange} className={InputStyle} /></div></div><div className="space-y-4"><div className="flex justify-between items-center"><h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Dettaglio Veicoli</h4><button type="button" disabled={!isAffidamentoEnabled || isPracticeLocked} onClick={addVehicleCredit} className="text-[10px] font-black text-red-600 uppercase tracking-widest flex items-center gap-2"><Plus size={14}/> Aggiungi</button></div><div className="bg-gray-50/50 border border-gray-100 rounded-2xl overflow-hidden"><table className="w-full text-left"><thead><tr className="bg-gray-100 text-[9px] font-black text-gray-500 uppercase tracking-widest border-b border-gray-200"><th className="px-4 py-3">Marca</th><th className="px-4 py-3">Modello</th><th className="px-4 py-3 text-right">Listino</th><th className="px-4 py-3 text-right">Provv</th><th className="px-4 py-3 w-10"></th></tr></thead><tbody className="divide-y divide-gray-100">{formData.veicoliAffidamento?.map((v) => (<tr key={v.id} className="hover:bg-white"><td className="px-2 py-2"><input disabled={!isAffidamentoEnabled || isPracticeLocked} value={v.marca} onChange={e => updateVehicleCredit(v.id, 'marca', e.target.value)} className={CompactInputStyle} /></td><td className="px-2 py-2"><input disabled={!isAffidamentoEnabled || isPracticeLocked} value={v.modello} onChange={e => updateVehicleCredit(v.id, 'modello', e.target.value)} className={CompactInputStyle} /></td><td className="px-2 py-2"><input disabled={!isAffidamentoEnabled || isPracticeLocked} type="number" value={v.valoreListino || ''} onChange={e => updateVehicleCredit(v.id, 'valoreListino', Number(e.target.value))} className={CompactNumberInputStyle} /></td><td className="px-2 py-2"><input disabled={!isAffidamentoEnabled || isPracticeLocked} type="number" value={v.provvigione || ''} onChange={e => updateVehicleCredit(v.id, 'provvigione', Number(e.target.value))} className={CompactNumberInputStyle} /></td><td className="px-2 py-2"><button type="button" onClick={() => removeVehicleCredit(v.id)} className="text-gray-300 hover:text-red-600"><Trash2 size={16}/></button></td></tr>))}</tbody></table></div></div><div className="grid grid-cols-1 md:grid-cols-3 gap-8"><div><label className={LabelStyle}>Veicoli (Auto)</label><input readOnly disabled type="number" value={autoCreditTotals.count} className={`${NumberInputStyle} bg-gray-50 text-gray-500 font-black`} /></div><CurrencyInput name="auto_listino_affidamento" label="Listino (Auto)" value={autoCreditTotals.listino} disabled={!isAffidamentoEnabled || isPracticeLocked} /><CurrencyInput name="auto_provvigione_affidamento" label="Provv. (Auto)" value={autoCreditTotals.provvigione} disabled={!isAffidamentoEnabled || isPracticeLocked} highlight /></div><textarea disabled={!isAffidamentoEnabled || isPracticeLocked} name="annotazioniAffidamento" rows={4} value={formData.annotazioniAffidamento || ''} onChange={handleChange} className={InputStyle} placeholder="Note credito..." /></div></div>
                    </div>
                )}

                {activeTab === 'ordine' && (
                    <div className={`space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-300 ${(!isOrdineEnabled || isPracticeLocked) ? 'opacity-50' : ''}`}>
                        <div className="flex items-center justify-between border-b border-gray-100 pb-4"><h3 className="text-[11px] font-black text-gray-900 uppercase tracking-[0.3em] flex items-center gap-2"><ShoppingCart size={16} className="text-red-600"/> FASE CONTRATTUALE</h3>{(!isOrdineEnabled || isPracticeLocked) && <div className="text-[10px] font-black text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-100 flex items-center gap-1 uppercase"><Lock size={12}/> Bloccata</div>}</div>
                        <div className="space-y-8">
                            <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div><label className={LabelStyle}>Stato Ordine</label><select disabled={!isOrdineEnabled || isPracticeLocked} name="statoOrdine" value={formData.statoOrdine} onChange={handleChange} className={InputStyle}><option value="">-- SELEZIONA --</option>{Object.values(OrderStatus).map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}</select></div>
                                <div><label className={LabelStyle}>Data Firma</label><input disabled={!isOrdineEnabled || isPracticeLocked} type="date" name="dataOrdine" value={formData.dataOrdine || ''} onChange={handleChange} className={InputStyle} /></div>
                            </div>
                            <div className="space-y-4"><div className="flex justify-between items-center"><h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Dettaglio Ordine</h4><button type="button" disabled={!isOrdineEnabled || isPracticeLocked} onClick={addVehicleOrder} className="text-[10px] font-black text-red-600 uppercase tracking-widest flex items-center gap-2"><Plus size={14}/> Aggiungi</button></div><div className="bg-gray-50/50 border border-gray-100 rounded-2xl overflow-hidden overflow-x-auto"><table className="w-full text-left min-w-[1000px]"><thead><tr className="bg-gray-100 text-[9px] font-black text-gray-500 uppercase tracking-widest border-b border-gray-200"><th className="px-4 py-3">Marca</th><th className="px-4 py-3">Modello</th><th className="px-4 py-3 text-right">Listino</th><th className="px-4 py-3 text-right">Provv</th><th className="px-4 py-3 text-center">Mesi</th><th className="px-4 py-3 text-right">KM</th><th className="px-4 py-3 w-10"></th></tr></thead><tbody className="divide-y divide-gray-100">{formData.veicoliOrdine?.map((v) => (<tr key={v.id} className="hover:bg-white"><td className="px-2 py-2"><input disabled={!isOrdineEnabled || isPracticeLocked} value={v.marca} onChange={e => updateVehicleOrder(v.id, 'marca', e.target.value)} className={CompactInputStyle} /></td><td className="px-2 py-2"><input disabled={!isOrdineEnabled || isPracticeLocked} value={v.modello} onChange={e => updateVehicleOrder(v.id, 'modello', e.target.value)} className={CompactInputStyle} /></td><td className="px-2 py-2"><input disabled={!isOrdineEnabled || isPracticeLocked} type="number" value={v.valoreListino || ''} onChange={e => updateVehicleOrder(v.id, 'valoreListino', Number(e.target.value))} className={CompactNumberInputStyle} /></td><td className="px-2 py-2"><input disabled={!isOrdineEnabled || isPracticeLocked} type="number" value={v.provvigione || ''} onChange={e => updateVehicleOrder(v.id, 'provvigione', Number(e.target.value))} className={CompactNumberInputStyle} /></td><td className="px-2 py-2"><input disabled={!isOrdineEnabled || isPracticeLocked} type="number" value={v.durataMesi || ''} onChange={e => updateVehicleOrder(v.id, 'durataMesi', Number(e.target.value))} className={CompactNumberInputStyle} /></td><td className="px-2 py-2"><input disabled={!isOrdineEnabled || isPracticeLocked} type="number" value={v.km || ''} onChange={e => updateVehicleOrder(v.id, 'km', Number(e.target.value))} className={CompactNumberInputStyle} /></td><td className="px-2 py-2"><button type="button" onClick={() => removeVehicleOrder(v.id)} className="text-gray-300 hover:text-red-600"><Trash2 size={16}/></button></td></tr>))}</tbody></table></div></div>
                            <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8"><div><label className={LabelStyle}>Ordinati (Auto)</label><input readOnly disabled type="number" value={autoOrderTotals.count} className={`${NumberInputStyle} bg-gray-50 text-gray-500 font-black`} /></div><CurrencyInput name="auto_listino_ordine" label="Listino (Auto)" value={autoOrderTotals.listino} disabled={!isOrdineEnabled || isPracticeLocked} /><CurrencyInput name="auto_provvigione_ordine" label="Provv. (Auto)" value={autoOrderTotals.provvigione} disabled={!isOrdineEnabled || isPracticeLocked} highlight /></div>
                            <div className="max-w-5xl mx-auto w-full space-y-8">
                                <div><label className={LabelStyle}>Note Ordine</label><textarea disabled={!isOrdineEnabled || isPracticeLocked} name="annotazioneOrdine" rows={5} value={formData.annotazioneOrdine || ''} onChange={handleChange} className={InputStyle} /></div>
                                {isPowerUser && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-gray-50 p-6 rounded-3xl border border-gray-200">
                                        <div><label className={LabelStyle}>Rappel</label><select disabled={!isOrdineEnabled || isPracticeLocked} name="validoRappel" value={formData.validoRappel || ''} onChange={handleChange} className={`${InputStyle} font-black uppercase`}><option value="">DA DEFINIRE</option><option value="SI">SI</option><option value="NO">NO</option></select></div>
                                        <div className="flex flex-col justify-end"><label className={`${LabelStyle} flex items-center gap-2`}><Lock size={12}/> Blocco Pratica</label><button type="button" onClick={() => setFormData(prev => ({...prev, isLocked: !prev.isLocked}))} className={`w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${formData.isLocked ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'bg-green-600 text-white shadow-lg shadow-green-600/30'}`}>{formData.isLocked ? <><Lock size={18}/> Sblocca</> : <><Unlock size={18}/> Blocca Agente</>}</button></div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'promemoria' && <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300">{id ? <PracticeReminders practiceId={id} /> : <div className="py-20 text-center text-gray-300 font-black uppercase tracking-widest">Salva per i promemoria</div>}</div>}

                <div className="mt-16 pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-end gap-4 max-w-5xl mx-auto">
                    <button type="button" onClick={() => navigate('/practices')} className="px-8 py-4 text-gray-500 font-black uppercase text-[10px] tracking-widest rounded-2xl">Annulla</button>
                    {!isPracticeLocked && (<button type="submit" disabled={loading} className="px-12 py-4 bg-red-600 text-white font-black uppercase text-[10px] tracking-widest hover:bg-red-700 shadow-xl shadow-red-600/20 flex items-center justify-center gap-2 rounded-2xl transition-all transform active:scale-95"><Save size={18} /> {loading ? 'SINCRONIZZAZIONE...' : 'Salva Pratica'}</button>)}
                </div>
            </form>
        </div>
    </div>
  );
};
