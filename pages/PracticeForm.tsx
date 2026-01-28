
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DbService } from '../services/dbService';
import { Practice, DealStatus, CreditStatus, OrderStatus, Provider, Agent, Reminder } from '../types';
import { ArrowLeft, Save, Lock, Trash2, User, History, Briefcase, ShieldCheck, ShoppingCart, Bell, Info } from 'lucide-react';
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
  const [agents, setAgents] = useState<Agent[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<Practice>>({
    data: new Date().toISOString().split('T')[0],
    agentId: user?.id,
    statoTrattativa: DealStatus.IN_CORSO,
    statoAffidamento: '',
    statoOrdine: '',
    numeroVeicoli: undefined,
    valoreTotale: undefined,
    valoreListinoTrattativa: undefined,
    mesePrevistoChiusura: '',
    valoreListinoAffidamento: undefined,
    valoreProvvigioneAffidamento: undefined,
    numeroVeicoliAffidamento: undefined,
    valoreListinoOrdinato: undefined,
    provider: '',
    annotazioniTrattativa: '',
    annotazioniAffidamento: '',
    annotazioneOrdine: '',
  });

  useEffect(() => {
    DbService.getAllProviders(true).then(setProviders);
    if (user?.isAdmin || user?.isTeamLeader) {
        DbService.getAllAgents(true).then(data => {
            setAgents(data.filter(a => a.isAgent && a.isActive));
        });
    }

    if (id && user) {
      loadPracticeData();
    }
  }, [id, user]);

  const loadPracticeData = async () => {
    if (!id || !user) return;
    setLoading(true);
    try {
        const [practices, remindersData] = await Promise.all([
            DbService.getPractices(user),
            DbService.getReminders(id)
        ]);
        const found = practices.find(p => p.id === id);
        if (found) {
          setFormData(found);
          setReminders(remindersData);
        } else {
          setErrorMessage("Pratica non trovata o non autorizzato.");
        }
    } catch (err) {
        setErrorMessage("Errore nel caricamento della pratica.");
    } finally {
        setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name.includes('numero')) {
      setFormData(prev => ({ ...prev, [name]: value === '' ? undefined : Number(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleCurrencyChange = (name: string, numericValue: number | undefined) => {
    setFormData(prev => ({ ...prev, [name]: numericValue }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      await DbService.savePractice({
        ...formData,
        agentId: formData.agentId || user.id
      });
      navigate('/practices');
    } catch (error: any) {
      setErrorMessage(`Errore durante il salvataggio: ${error.message || 'Riprova più tardi.'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!id || !user?.isAdmin) return;
    setLoading(true);
    try {
        await DbService.deletePractice(id);
        navigate('/practices');
    } catch (error: any) {
        setErrorMessage(`Impossibile eliminare la pratica: ${error.message}`);
    } finally {
        setLoading(false);
    }
  };

  const isAffidamentoEnabled = formData.statoTrattativa === DealStatus.IN_CORSO || formData.statoTrattativa === DealStatus.CHIUSA;
  const isOrdineEnabled = formData.statoAffidamento === CreditStatus.APPROVATO || formData.statoAffidamento === CreditStatus.APPROVATO_CON_CONDIZIONI;

  const openRemindersCount = useMemo(() => {
    return reminders.filter(r => r.status === 'aperto').length;
  }, [reminders]);

  const InputStyle = "w-full border border-gray-200 bg-white text-gray-900 rounded-xl p-3.5 focus:ring-2 focus:ring-red-600 focus:border-red-600 outline-none transition-all disabled:bg-gray-50 disabled:text-gray-400 text-sm font-semibold shadow-sm";
  const NumberInputStyle = `${InputStyle} text-right font-mono`;
  const LabelStyle = "block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1";

  const CurrencyInput = ({ name, value, onChange, disabled, label, highlight }: { name: string, value: number | undefined, onChange: (name: string, val: number | undefined) => void, disabled?: boolean, label: string, highlight?: boolean }) => {
    const [localValue, setLocalValue] = useState(formatIT(value));
    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => {
      if (!isFocused) setLocalValue(formatIT(value));
    }, [value, isFocused]);

    const handleFocus = () => {
      setIsFocused(true);
      if (value !== undefined) setLocalValue(value.toString().replace('.', ','));
    };

    const handleBlur = () => {
      setIsFocused(false);
      const numeric = parseIT(localValue);
      onChange(name, numeric);
    };

    return (
      <div className="space-y-1">
        <label className={LabelStyle}>{label}</label>
        <input 
          type="text"
          disabled={disabled}
          value={localValue}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={(e) => setLocalValue(e.target.value)}
          className={`${NumberInputStyle} ${highlight ? 'border-red-100 bg-red-50/20' : ''}`}
          placeholder="0,00"
        />
      </div>
    );
  };

  const TabButton = ({ type, icon: Icon, label, statusColor }: { type: TabType, icon: any, label: string, statusColor?: string }) => {
    const isActive = activeTab === type;
    return (
      <button
        type="button"
        onClick={() => setActiveTab(type)}
        className={`flex-1 flex flex-col items-center gap-2 py-4 px-2 transition-all border-b-4 ${
          isActive 
            ? 'border-red-600 text-red-600 bg-red-50/30' 
            : 'border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-50'
        } first:rounded-tl-2xl last:rounded-tr-2xl`}
      >
        <div className="relative">
            <Icon size={20} className={isActive ? 'text-red-600' : 'text-gray-400'} />
            {statusColor && (
                <span className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-white ${statusColor}`}></span>
            )}
            {type === 'promemoria' && openRemindersCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-black text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-white">
                    {openRemindersCount}
                </span>
            )}
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest hidden md:block">{label}</span>
      </button>
    );
  };

  const getTrattativaColor = () => {
    if (formData.statoTrattativa === DealStatus.CHIUSA) return 'bg-green-500';
    if (formData.statoTrattativa === DealStatus.FALLITA) return 'bg-gray-400';
    return 'bg-red-500';
  };

  const getAffidamentoColor = () => {
    if (!formData.statoAffidamento) return 'bg-gray-200';
    if (formData.statoAffidamento === CreditStatus.APPROVATO || formData.statoAffidamento === CreditStatus.APPROVATO_CON_CONDIZIONI) return 'bg-green-500';
    if (formData.statoAffidamento === CreditStatus.BOCCIATO) return 'bg-red-500';
    return 'bg-amber-500';
  };

  const getOrdineColor = () => {
    if (formData.statoOrdine === OrderStatus.INVIATO) return 'bg-green-500';
    if (formData.statoOrdine === OrderStatus.ANNULLATO) return 'bg-red-500';
    return '';
  };

  return (
    <div className="max-w-5xl mx-auto pb-24 px-4">
        <Modal 
          isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} onConfirm={handleDeleteConfirm} type="danger" title="Conferma Eliminazione"
          message={`Sei sicuro di voler eliminare la pratica di "${formData.cliente}"?`} confirmLabel="Elimina Definitivamente" loading={loading}
        />
        <Modal isOpen={!!errorMessage} onClose={() => setErrorMessage(null)} title="Attenzione" message={errorMessage || ''} confirmLabel="Ho capito" onConfirm={() => setErrorMessage(null)} />

        <div className="flex justify-between items-center mb-6">
            <button onClick={() => navigate('/practices')} className="flex items-center text-gray-400 hover:text-red-600 transition-colors font-black text-[10px] uppercase tracking-widest">
                <ArrowLeft className="w-4 h-4 mr-2" /> Torna all'elenco
            </button>
            {id && user?.isAdmin && (
                <button type="button" onClick={() => setShowDeleteModal(true)} className="text-gray-300 hover:text-red-600 p-2 transition-colors">
                    <Trash2 size={20} />
                </button>
            )}
        </div>

        <div className="bg-white shadow-xl border border-gray-200 rounded-3xl overflow-hidden relative">
            {loading && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-[60] flex items-center justify-center">
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 border-4 border-red-600 border-t-transparent animate-spin rounded-full"></div>
                        <span className="text-[10px] font-black uppercase text-red-600 tracking-widest">Sincronizzazione...</span>
                    </div>
                </div>
            )}

            <div className="bg-black text-white p-6 md:p-8 flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-gray-900">
                <div>
                    <h2 className="text-2xl font-black tracking-tight uppercase">{formData.cliente || 'Nuova Pratica'}</h2>
                    <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{formData.provider || 'Provider non definito'}</span>
                        <span className="text-red-600 text-[10px] font-black">•</span>
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{id ? `ID: ${id.substring(0,8)}` : 'Bozza'}</span>
                    </div>
                </div>
                {(user?.isAdmin || user?.isTeamLeader) ? (
                    <div className="flex items-center gap-3 bg-gray-900 px-4 py-3 border border-gray-800 rounded-2xl">
                        <User size={16} className="text-red-600" />
                        <select 
                            name="agentId" 
                            value={formData.agentId} 
                            onChange={handleChange} 
                            className="bg-transparent border-none text-white text-[11px] font-black focus:ring-0 cursor-pointer outline-none uppercase tracking-widest"
                        >
                            {agents.map(a => <option key={a.id} value={a.id} className="bg-black">{a.nome}</option>)}
                        </select>
                    </div>
                ) : (
                    <div className="text-[10px] font-black text-gray-400 tracking-widest uppercase flex items-center gap-2 bg-gray-900 px-4 py-3 rounded-2xl border border-gray-800">
                        <User size={14} className="text-red-600"/> {user?.nome}
                    </div>
                )}
            </div>

            <div className="flex border-b border-gray-50 bg-white sticky top-0 z-50">
                <TabButton type="storia" icon={History} label="Storia" />
                <TabButton type="trattativa" icon={Briefcase} label="Trattativa" statusColor={getTrattativaColor()} />
                <TabButton type="affidamento" icon={ShieldCheck} label="Affidamento" statusColor={getAffidamentoColor()} />
                <TabButton type="ordine" icon={ShoppingCart} label="Ordine" statusColor={getOrdineColor()} />
                <TabButton type="promemoria" icon={Bell} label="Promemoria" />
            </div>

            <form onSubmit={handleSubmit} className="p-6 md:p-10 min-h-[500px]">
                
                {activeTab === 'storia' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {id ? (
                             <PracticeTimeline practice={formData} reminders={reminders} />
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
                                <History size={48} className="text-gray-300 mb-4" />
                                <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest">Salva la pratica per vedere la timeline</h4>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'trattativa' && (
                    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <section>
                            <h3 className="text-[11px] font-black text-gray-900 uppercase tracking-[0.3em] flex items-center gap-2 mb-8 border-b border-gray-50 pb-2 w-full">
                                <Info size={16} className="text-red-600"/> DATI IDENTIFICATIVI
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                <div>
                                    <label className={LabelStyle}>Data Inserimento</label>
                                    <input type="date" name="data" required value={formData.data} onChange={handleChange} className={InputStyle} />
                                </div>
                                <div className="lg:col-span-2">
                                    <label className={LabelStyle}>Cliente / Ragione Sociale</label>
                                    <input type="text" name="cliente" required value={formData.cliente || ''} onChange={handleChange} className={InputStyle} placeholder="Inserisci Ragione Sociale..." />
                                </div>
                                <div>
                                    <label className={LabelStyle}>Provider</label>
                                    <select name="provider" required value={formData.provider || ''} onChange={handleChange} className={InputStyle}>
                                        <option value="">-- SELEZIONA PROVIDER --</option>
                                        {providers.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className={LabelStyle}>Mese Previsto Chiusura</label>
                                    <select name="mesePrevistoChiusura" value={formData.mesePrevistoChiusura} onChange={handleChange} className={InputStyle}>
                                        <option value="">-- SELEZIONA MESE --</option>
                                        {getMeseAnnoOptions().map(opt => <option key={opt} value={opt}>{opt.toUpperCase()}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className={LabelStyle}>Stato Trattativa</label>
                                    <select name="statoTrattativa" value={formData.statoTrattativa} onChange={handleChange} className={`${InputStyle} font-black text-red-600 bg-red-50/20`}>
                                        {Object.values(DealStatus).map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                                    </select>
                                </div>
                            </div>
                        </section>

                        <section className="pt-2 border-t border-gray-100">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                <div>
                                    <label className={LabelStyle}>Veicoli Potenziali</label>
                                    <input type="number" name="numeroVeicoli" value={formData.numeroVeicoli ?? ''} onChange={handleChange} className={NumberInputStyle} placeholder="0" />
                                </div>
                                <CurrencyInput 
                                    label="Valore Listino Trattativa (€)" 
                                    name="valoreListinoTrattativa" 
                                    value={formData.valoreListinoTrattativa} 
                                    onChange={handleCurrencyChange} 
                                />
                                <CurrencyInput 
                                    label="Provv. Tot. Trattativa (€)" 
                                    name="valoreTotale" 
                                    value={formData.valoreTotale} 
                                    onChange={handleCurrencyChange}
                                    highlight={true}
                                />
                                <div className="lg:col-span-3">
                                    <label className={LabelStyle}>Note & Annotazioni Trattativa</label>
                                    <textarea name="annotazioniTrattativa" rows={4} value={formData.annotazioniTrattativa || ''} onChange={handleChange} className={`${InputStyle} font-medium`} placeholder="Dettagli negoziazione..." />
                                </div>
                            </div>
                        </section>
                    </div>
                )}

                {activeTab === 'affidamento' && (
                    <div className={`space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-300 ${!isAffidamentoEnabled ? 'opacity-30' : ''}`}>
                        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                            <h3 className="text-[11px] font-black text-gray-900 uppercase tracking-[0.3em] flex items-center gap-2">
                                <ShieldCheck size={16} className="text-red-600"/> ISTRUTTORIA CREDITIZIA
                            </h3>
                            {!isAffidamentoEnabled && <div className="text-[10px] font-black text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-100 flex items-center gap-1 uppercase"><Lock size={12}/> Fase Bloccata</div>}
                        </div>
                        <div className="space-y-8 relative">
                            {!isAffidamentoEnabled && <div className="absolute inset-0 z-10 cursor-not-allowed"></div>}
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <label className={LabelStyle}>Esito Affidamento</label>
                                    <select disabled={!isAffidamentoEnabled} name="statoAffidamento" value={formData.statoAffidamento} onChange={handleChange} className={InputStyle}>
                                        <option value="">-- IN ATTESA / NON DEFINITO --</option>
                                        {Object.values(CreditStatus).map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className={LabelStyle}>Data Esito</label>
                                    <input disabled={!isAffidamentoEnabled} type="date" name="dataAffidamento" value={formData.dataAffidamento || ''} onChange={handleChange} className={InputStyle} />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div>
                                    <label className={LabelStyle}>Veicoli Affidati</label>
                                    <input disabled={!isAffidamentoEnabled} type="number" name="numeroVeicoliAffidamento" value={formData.numeroVeicoliAffidamento ?? ''} onChange={handleChange} className={NumberInputStyle} placeholder="0" />
                                </div>
                                <CurrencyInput 
                                    label="Valore Listino Affidamento (€)" 
                                    name="valoreListinoAffidamento" 
                                    disabled={!isAffidamentoEnabled}
                                    value={formData.valoreListinoAffidamento} 
                                    onChange={handleCurrencyChange} 
                                />
                                <CurrencyInput 
                                    label="Provv. Tot. Affidamento (€)" 
                                    name="valoreProvvigioneAffidamento" 
                                    disabled={!isAffidamentoEnabled}
                                    value={formData.valoreProvvigioneAffidamento} 
                                    onChange={handleCurrencyChange} 
                                    highlight={true}
                                />
                            </div>

                            <div className="w-full">
                                <label className={LabelStyle}>Annotazioni Credito</label>
                                <textarea disabled={!isAffidamentoEnabled} name="annotazioniAffidamento" rows={4} value={formData.annotazioniAffidamento || ''} onChange={handleChange} className={InputStyle} placeholder="Dettagli dell'ufficio affidamenti..." />
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'ordine' && (
                    <div className={`space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-300 ${!isOrdineEnabled ? 'opacity-30' : ''}`}>
                        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                            <h3 className="text-[11px] font-black text-gray-900 uppercase tracking-[0.3em] flex items-center gap-2">
                                <ShoppingCart size={16} className="text-red-600"/> FASE CONTRATTUALE
                            </h3>
                            {!isOrdineEnabled && <div className="text-[10px] font-black text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-100 flex items-center gap-1 uppercase"><Lock size={12}/> Fase Bloccata</div>}
                        </div>
                        <div className="space-y-8 relative">
                            {!isOrdineEnabled && <div className="absolute inset-0 z-10 cursor-not-allowed"></div>}
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <label className={LabelStyle}>Stato Ordine</label>
                                    <select disabled={!isOrdineEnabled} name="statoOrdine" value={formData.statoOrdine} onChange={handleChange} className={InputStyle}>
                                        <option value="">-- SELEZIONA STATO --</option>
                                        {Object.values(OrderStatus).map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className={LabelStyle}>Data Firma Ordine</label>
                                    <input disabled={!isOrdineEnabled} type="date" name="dataOrdine" value={formData.dataOrdine || ''} onChange={handleChange} className={InputStyle} />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div>
                                    <label className={LabelStyle}>Veicoli Ordinati</label>
                                    <input disabled={!isOrdineEnabled} type="number" name="numeroVeicoliOrdinati" value={formData.numeroVeicoliOrdinati ?? ''} onChange={handleChange} className={NumberInputStyle} placeholder="0" />
                                </div>
                                <CurrencyInput 
                                    label="Valore Listino Ordinato (€)" 
                                    name="valoreListinoOrdinato" 
                                    disabled={!isOrdineEnabled}
                                    value={formData.valoreListinoOrdinato} 
                                    onChange={handleCurrencyChange} 
                                />
                                <CurrencyInput 
                                    label="Provv. Tot. Ordine (€)" 
                                    name="valoreProvvigioneTotale" 
                                    disabled={!isOrdineEnabled}
                                    value={formData.valoreProvvigioneTotale} 
                                    onChange={handleCurrencyChange} 
                                    highlight={true}
                                />
                            </div>

                            <div className="w-full">
                                <label className={LabelStyle}>Note sull'Ordine</label>
                                <textarea disabled={!isOrdineEnabled} name="annotazioneOrdine" rows={4} value={formData.annotazioneOrdine || ''} onChange={handleChange} className={InputStyle} placeholder="Dettagli relativi al contratto firmato..." />
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'promemoria' && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {id ? (
                            <PracticeReminders practiceId={id} />
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
                                <Bell size={48} className="text-gray-300 mb-4" />
                                <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest">Salva la pratica per aggiungere promemoria</h4>
                            </div>
                        )}
                    </div>
                )}

                <div className="mt-16 pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-end gap-4">
                    <button type="button" onClick={() => navigate('/practices')} className="px-8 py-4 text-gray-500 font-black uppercase text-[10px] tracking-widest hover:bg-gray-50 transition-all rounded-2xl">
                        Annulla Modifiche
                    </button>
                    <button type="submit" disabled={loading} className="px-12 py-4 bg-red-600 text-white font-black uppercase text-[10px] tracking-widest hover:bg-red-700 shadow-xl shadow-red-600/20 flex items-center justify-center gap-2 transition-all transform active:scale-95 rounded-2xl">
                        <Save size={18} /> {loading ? 'SINCRONIZZAZIONE...' : 'Salva Pratica'}
                    </button>
                </div>
            </form>
        </div>
    </div>
  );
};
