
import React, { useState, useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DbService } from '../services/dbService';
import { Practice, DealStatus, CreditStatus, OrderStatus, Provider } from '../types';
import { ArrowLeft, Save, Lock, Trash2, AlertCircle } from 'lucide-react';
import { PracticeReminders } from '../components/PracticeReminders';
import { Modal } from '../components/Modal';

const { useNavigate, useParams } = ReactRouterDOM;

// Funzione per generare le opzioni Mese + Anno (Anno corrente e Anno successivo)
const getMeseAnnoOptions = () => {
  const mesi = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
  ];
  const currentYear = new Date().getFullYear();
  const options: string[] = [];
  
  // Aggiungiamo i mesi dell'anno corrente
  mesi.forEach(m => options.push(`${m} ${currentYear}`));
  // Aggiungiamo i mesi dell'anno successivo per gestire lo scavallamento
  mesi.forEach(m => options.push(`${m} ${currentYear + 1}`));
  
  return options;
};

export const PracticeForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<Practice>>({
    data: new Date().toISOString().split('T')[0],
    statoTrattativa: DealStatus.IN_CORSO,
    statoAffidamento: '',
    statoOrdine: '',
    numeroVeicoli: 1,
    valoreTotale: 0,
    valoreListinoTrattativa: 0,
    mesePrevistoChiusura: '',
    valoreListinoAffidamento: 0,
    numeroVeicoliAffidamento: 0,
    valoreListinoOrdinato: 0,
    provider: '',
    annotazioniTrattativa: '',
    annotazioniAffidamento: '',
    annotazioneOrdine: '',
  });

  const MESE_ANNO_OPTIONS = getMeseAnnoOptions();

  useEffect(() => {
    DbService.getAllProviders(true).then(setProviders);

    if (id && user) {
      setLoading(true);
      DbService.getPractices(user).then(practices => {
        const found = practices.find(p => p.id === id);
        if (found) {
          setFormData(found);
        } else {
          setErrorMessage("Pratica non trovata o non autorizzato.");
        }
        setLoading(false);
      }).catch(err => {
        console.error(err);
        setErrorMessage("Errore nel caricamento della pratica.");
        setLoading(false);
      });
    }
  }, [id, user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: (name.includes('numero') || name.includes('valore') || name.includes('Provvigione')) ? Number(value) : value
    }));
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
      console.error("Error saving:", error);
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
        setShowDeleteModal(false);
        navigate('/practices');
    } catch (error: any) {
        console.error("Errore cancellazione:", error);
        setErrorMessage(`Impossibile eliminare la pratica: ${error.message}`);
        setShowDeleteModal(false);
    } finally {
        setLoading(false);
    }
  };

  const SectionTitle = ({ title }: { title: string }) => (
    <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wide border-b-2 border-red-600 pb-2 mb-6 mt-10 w-fit">{title}</h3>
  );

  const isAffidamentoEnabled = formData.statoTrattativa === DealStatus.IN_CORSO || formData.statoTrattativa === DealStatus.CHIUSA;
  const isOrdineEnabled = formData.statoAffidamento === CreditStatus.ESITATO || 
                          formData.statoAffidamento === CreditStatus.ESITATO_CON_CONDIZIONI;

  const InputStyle = "w-full border border-gray-300 bg-white text-gray-900 rounded-none p-3 focus:ring-2 focus:ring-red-600 focus:border-red-600 outline-none transition-all disabled:bg-gray-100 disabled:text-gray-400";
  const LabelStyle = "block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2";

  return (
    <div className="max-w-4xl mx-auto pb-24 md:pb-20">
        {/* Modali Personalizzati */}
        <Modal 
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteConfirm}
          type="danger"
          title="Conferma Eliminazione"
          message={`Sei sicuro di voler eliminare la pratica di "${formData.cliente}"? L'operazione non può essere annullata.`}
          confirmLabel="Elimina Definitivamente"
          loading={loading}
        />

        <Modal 
          isOpen={!!errorMessage}
          onClose={() => setErrorMessage(null)}
          title="Attenzione"
          message={errorMessage || ''}
          confirmLabel="Ho capito"
          onConfirm={() => setErrorMessage(null)}
        />

        <button 
            onClick={() => navigate('/practices')}
            className="flex items-center text-gray-500 hover:text-red-600 mb-6 transition-colors font-medium text-sm uppercase tracking-wide"
        >
            <ArrowLeft className="w-4 h-4 mr-2" /> Torna all'elenco
        </button>

        <div className="bg-white shadow-sm border border-gray-200 rounded-lg md:rounded-none overflow-hidden relative">
            {loading && (
                <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] z-50 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-10 h-10 border-4 border-red-600 border-t-transparent animate-spin"></div>
                        <span className="text-xs font-bold uppercase text-red-600 tracking-widest">Elaborazione...</span>
                    </div>
                </div>
            )}

            <div className="bg-black text-white p-4 md:p-6 flex flex-col md:flex-row justify-between md:items-center gap-2">
                <h2 className="text-xl md:text-2xl font-bold tracking-tight">
                    {id ? 'MODIFICA PRATICA' : 'NUOVA PRATICA'}
                </h2>
                <div className="text-xs font-mono text-gray-400">
                    AGENTE: {user?.nome.toUpperCase()}
                </div>
            </div>

            <form onSubmit={handleSubmit} className="p-4 md:p-8">
                {/* Error Banner */}
                {errorMessage && (
                    <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-600 flex items-start gap-3 text-red-700">
                        <AlertCircle size={20} className="flex-shrink-0" />
                        <div>
                            <p className="font-bold text-sm uppercase">Si è verificato un errore</p>
                            <p className="text-xs">{errorMessage}</p>
                        </div>
                    </div>
                )}

                {/* Dati Generali */}
                <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wide border-b-2 border-red-600 pb-2 mb-6 w-fit">Dati Generali</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                    <div>
                        <label className={LabelStyle}>Data Pratica</label>
                        <input type="date" name="data" required value={formData.data} onChange={handleChange} className={InputStyle} />
                    </div>
                    <div>
                        <label className={LabelStyle}>Cliente / Ragione Sociale</label>
                        <input type="text" name="cliente" required value={formData.cliente || ''} onChange={handleChange} className={InputStyle} placeholder="Inserisci nome cliente" />
                    </div>
                    <div>
                        <label className={LabelStyle}>Provider</label>
                        <select name="provider" required value={formData.provider || ''} onChange={handleChange} className={InputStyle}>
                            <option value="">-- SELEZIONA PROVIDER --</option>
                            {providers.map(p => (
                                <option key={p.id} value={p.name}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={LabelStyle}>N. VEICOLI POTENZIALI</label>
                            <input type="number" name="numeroVeicoli" value={formData.numeroVeicoli} onChange={handleChange} className={InputStyle} />
                        </div>
                        <div>
                            <label className={LabelStyle}>PROV. TOTALE (€)</label>
                            <input type="number" name="valoreTotale" value={formData.valoreTotale} onChange={handleChange} className={InputStyle} />
                        </div>
                    </div>
                    <div>
                        <label className={LabelStyle}>VAL TOT DI LISTINO IN TRATTATIVA (€)</label>
                        <input type="number" name="valoreListinoTrattativa" value={formData.valoreListinoTrattativa} onChange={handleChange} className={InputStyle} />
                    </div>
                    <div>
                        <label className={LabelStyle}>MESE PREVISTO DI CHIUSURA</label>
                        <select name="mesePrevistoChiusura" value={formData.mesePrevistoChiusura} onChange={handleChange} className={InputStyle}>
                            <option value="">-- SELEZIONA MESE E ANNO --</option>
                            {MESE_ANNO_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </div>
                </div>

                {/* Trattativa */}
                <SectionTitle title="Stato Trattativa" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                    <div>
                        <label className={LabelStyle}>Stato Corrente</label>
                        <select name="statoTrattativa" value={formData.statoTrattativa} onChange={handleChange} className={`${InputStyle} font-bold text-red-700 bg-red-50`}>
                            {Object.values(DealStatus).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div className="md:col-span-2">
                        <label className={LabelStyle}>Note & Annotazioni</label>
                        <textarea name="annotazioniTrattativa" rows={3} value={formData.annotazioniTrattativa || ''} onChange={handleChange} className={InputStyle} placeholder="Dettagli sulla trattativa..." />
                    </div>
                </div>

                {/* Affidamento */}
                <div className={`transition-all duration-300 ${!isAffidamentoEnabled ? 'opacity-40 grayscale' : ''}`}>
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-6 mt-10">
                        <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wide">Affidamento</h3>
                        {!isAffidamentoEnabled && <div className="flex items-center gap-1 text-xs font-bold text-red-600 border border-red-200 px-2 py-1"><Lock size={12}/> BLOCCATO</div>}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 relative">
                         {!isAffidamentoEnabled && <div className="absolute inset-0 z-10 cursor-not-allowed"></div>}
                        <div>
                            <label className={LabelStyle}>Data Affidamento</label>
                            <input disabled={!isAffidamentoEnabled} type="date" name="dataAffidamento" value={formData.dataAffidamento || ''} onChange={handleChange} className={InputStyle} />
                        </div>
                        <div>
                            <label className={LabelStyle}>Esito Affidamento</label>
                            <select disabled={!isAffidamentoEnabled} name="statoAffidamento" value={formData.statoAffidamento} onChange={handleChange} className={InputStyle}>
                                <option value="">-- IN ATTESA / NON DEFINITO --</option>
                                {Object.values(CreditStatus).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={LabelStyle}>VEICOLI AFFIDAMENTO</label>
                            <input disabled={!isAffidamentoEnabled} type="number" name="numeroVeicoliAffidamento" value={formData.numeroVeicoliAffidamento} onChange={handleChange} className={InputStyle} />
                        </div>
                        <div>
                            <label className={LabelStyle}>VAL TOT DI LISTINO IN AFFIDAMENTO (€)</label>
                            <input disabled={!isAffidamentoEnabled} type="number" name="valoreListinoAffidamento" value={formData.valoreListinoAffidamento} onChange={handleChange} className={InputStyle} />
                        </div>
                         <div className="md:col-span-2">
                            <label className={LabelStyle}>Note Affidamento</label>
                            <textarea disabled={!isAffidamentoEnabled} name="annotazioniAffidamento" rows={2} value={formData.annotazioniAffidamento || ''} onChange={handleChange} className={InputStyle} />
                        </div>
                    </div>
                </div>

                {/* Ordine */}
                <div className={`transition-all duration-300 ${!isOrdineEnabled ? 'opacity-40 grayscale' : ''}`}>
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-6 mt-10">
                        <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wide">Ordine</h3>
                         {!isOrdineEnabled && <div className="flex items-center gap-1 text-xs font-bold text-red-600 border border-red-200 px-2 py-1"><Lock size={12}/> BLOCCATO</div>}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 relative">
                        {!isOrdineEnabled && <div className="absolute inset-0 z-10 cursor-not-allowed"></div>}
                        <div>
                            <label className={LabelStyle}>Data Ordine</label>
                            <input disabled={!isOrdineEnabled} type="date" name="dataOrdine" value={formData.dataOrdine || ''} onChange={handleChange} className={InputStyle} />
                        </div>
                        <div>
                             <label className={LabelStyle}>Stato Ordine</label>
                             <select disabled={!isOrdineEnabled} name="statoOrdine" value={formData.statoOrdine} onChange={handleChange} className={InputStyle}>
                                <option value="">-- SELEZIONA STATO --</option>
                                {Object.values(OrderStatus).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={LabelStyle}>Veicoli Ordinati</label>
                            <input disabled={!isOrdineEnabled} type="number" name="numeroVeicoliOrdinati" value={formData.numeroVeicoliOrdinati || 0} onChange={handleChange} className={InputStyle} />
                        </div>
                        <div>
                            <label className={LabelStyle}>PROV. TOTALE (€)</label>
                            <input disabled={!isOrdineEnabled} type="number" name="valoreProvvigioneTotale" value={formData.valoreProvvigioneTotale || 0} onChange={handleChange} className={InputStyle} />
                        </div>
                        <div>
                            <label className={LabelStyle}>VAL TOT DI LISTINO ORDINATO (€)</label>
                            <input disabled={!isOrdineEnabled} type="number" name="valoreListinoOrdinato" value={formData.valoreListinoOrdinato || 0} onChange={handleChange} className={InputStyle} />
                        </div>
                        <div className="md:col-span-2">
                            <label className={LabelStyle}>Note Ordine</label>
                            <textarea disabled={!isOrdineEnabled} name="annotazioneOrdine" rows={2} value={formData.annotazioneOrdine || ''} onChange={handleChange} className={InputStyle} />
                        </div>
                    </div>
                </div>

                {id && <PracticeReminders practiceId={id} />}

                <div className="mt-12 pt-6 border-t border-gray-200 flex flex-col md:flex-row justify-end gap-3 sticky bottom-0 bg-white/95 backdrop-blur-sm p-4 z-20 border-t shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] -mx-4 md:mx-0">
                    {id && user?.isAdmin && (
                        <button 
                            type="button"
                            onClick={() => setShowDeleteModal(true)}
                            disabled={loading}
                            className="w-full md:w-auto px-8 py-3 border border-red-600 text-red-600 font-bold uppercase tracking-wider hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                        >
                            <Trash2 size={18} />
                            Elimina Pratica
                        </button>
                    )}
                    <button 
                        type="button"
                        onClick={() => navigate('/practices')}
                        className="w-full md:w-auto px-8 py-3 border border-gray-300 text-gray-700 font-bold uppercase tracking-wider hover:bg-gray-100 transition-colors"
                    >
                        Annulla
                    </button>
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full md:w-auto px-8 py-3 bg-red-600 text-white font-bold uppercase tracking-wider hover:bg-red-700 shadow-xl shadow-red-600/20 flex items-center justify-center gap-2 transition-transform transform active:scale-95"
                    >
                        <Save size={18} />
                        {loading ? 'Salvataggio...' : 'Salva Pratica'}
                    </button>
                </div>
            </form>
        </div>
    </div>
  );
};
