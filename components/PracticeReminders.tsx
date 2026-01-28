
import React, { useState, useEffect } from 'react';
import { Reminder } from '../types';
import { DbService } from '../services/dbService';
import { Bell, Plus, Check, Trash2, Clock, AlertTriangle, Pencil, X, Save, Calendar } from 'lucide-react';

interface Props {
  practiceId: string;
}

export const PracticeReminders: React.FC<Props> = ({ practiceId }) => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  const [newReminder, setNewReminder] = useState({
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    description: ''
  });

  const [closingId, setClosingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({
    date: '',
    time: '',
    description: ''
  });

  useEffect(() => {
    loadReminders();
  }, [practiceId]);

  const loadReminders = () => {
    DbService.getReminders(practiceId).then(setReminders);
  };

  const handleAdd = async () => {
    setError(null);
    if (!newReminder.date || !newReminder.description) {
        setError("Data e descrizione sono obbligatorie.");
        return;
    }

    try {
        await DbService.saveReminder({
            practiceId,
            expirationDate: `${newReminder.date}T${newReminder.time}`,
            description: newReminder.description,
            status: 'aperto'
        });

        setNewReminder({ date: new Date().toISOString().split('T')[0], time: '09:00', description: '' });
        setIsAdding(false);
        loadReminders();
    } catch (e: any) {
        console.error(e);
        setError("Errore durante il salvataggio. Riprova.");
    }
  };

  const handleEditClick = (rem: Reminder) => {
    setError(null);
    const dt = new Date(rem.expirationDate);
    const dateStr = dt.toISOString().split('T')[0];
    const timeStr = dt.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

    setEditData({ date: dateStr, time: timeStr, description: rem.description });
    setEditingId(rem.id);
    setClosingId(null);
    setDeletingId(null);
  };

  const handleUpdate = async () => {
    setError(null);
    if (!editingId || !editData.description || !editData.date) return;
    try {
        await DbService.saveReminder({
            id: editingId,
            practiceId,
            expirationDate: `${editData.date}T${editData.time}`,
            description: editData.description,
        });
        setEditingId(null);
        loadReminders();
    } catch (e: any) {
        setError("Impossibile aggiornare il promemoria.");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, action: 'add' | 'update') => {
    if (e.key === 'Enter') {
      e.preventDefault(); 
      if (action === 'add') handleAdd();
      if (action === 'update') handleUpdate();
    }
  };

  const handleClose = async (id: string) => {
    if (!feedback) return;
    const reminder = reminders.find(r => r.id === id);
    if (!reminder) return;
    try {
        await DbService.saveReminder({ ...reminder, status: 'chiuso', feedback });
        setClosingId(null);
        setFeedback('');
        loadReminders();
    } catch (e) {
        setError("Errore durante la chiusura.");
    }
  };

  const performDelete = async (id: string) => {
      try {
          await DbService.deleteReminder(id);
          setDeletingId(null);
          loadReminders();
      } catch (e) {
          setError("Impossibile eliminare.");
      }
  };

  const isExpired = (dateStr: string) => new Date(dateStr) < new Date();
  
  const InputStyle = "w-full border border-gray-200 bg-white text-gray-900 rounded-xl p-3.5 focus:ring-2 focus:ring-red-600 focus:border-red-600 outline-none transition-all text-sm font-semibold shadow-sm";
  const ButtonStyle = "px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2";

  return (
    <div className="mt-12 bg-gray-50/50 border border-gray-100 p-6 md:p-8 relative rounded-[2rem]">
      <div className="flex justify-between items-center mb-10">
        <h3 className="text-sm font-black text-gray-900 uppercase tracking-[0.3em] flex items-center gap-2">
            <Bell className="text-red-600" size={18}/> PROMEMORIA E SCADENZE
        </h3>
        <button 
          type="button"
          onClick={() => setIsAdding(!isAdding)}
          className={`${ButtonStyle} ${isAdding ? 'bg-gray-200 text-gray-600' : 'bg-black text-white hover:bg-gray-800 shadow-lg shadow-black/10'}`}
        >
          {isAdding ? <X size={14}/> : <Plus size={14}/>} 
          {isAdding ? 'Annulla' : 'Nuovo Promemoria'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 mb-6 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-red-100 flex items-center gap-3 animate-in shake duration-300">
            <AlertTriangle size={18} className="flex-shrink-0"/> {error}
        </div>
      )}

      {isAdding && (
        <div className="bg-white p-6 mb-10 border border-red-100 shadow-xl shadow-red-600/5 rounded-3xl animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div>
                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Data</label>
                  <input type="date" className={InputStyle} value={newReminder.date} onChange={e => setNewReminder({...newReminder, date: e.target.value})} onKeyDown={e => handleKeyDown(e, 'add')} />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Ora</label>
                  <input type="time" className={InputStyle} value={newReminder.time} onChange={e => setNewReminder({...newReminder, time: e.target.value})} onKeyDown={e => handleKeyDown(e, 'add')} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Descrizione Attività</label>
                  <input type="text" placeholder="Es: Ricontattare cliente per firma..." className={InputStyle} value={newReminder.description} onChange={e => setNewReminder({...newReminder, description: e.target.value})} onKeyDown={e => handleKeyDown(e, 'add')} />
                </div>
            </div>
            <div className="flex justify-end">
                <button type="button" onClick={handleAdd} className="w-full md:w-auto px-10 py-4 bg-red-600 text-white font-black uppercase text-[10px] tracking-widest hover:bg-red-700 shadow-xl shadow-red-600/20 transition-all active:scale-95 rounded-2xl">
                  Salva Promemoria
                </button>
            </div>
        </div>
      )}

      <div className="space-y-4">
        {reminders.length === 0 && !isAdding && (
          <div className="py-20 text-center flex flex-col items-center gap-4 opacity-30">
            <Clock size={48} className="text-gray-400" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Nessun promemoria attivo</span>
          </div>
        )}

        {reminders.map(rem => {
            if (editingId === rem.id) {
                return (
                    <div key={rem.id} className="bg-white border border-red-200 p-6 shadow-xl ring-4 ring-red-50/50 rounded-3xl animate-in zoom-in-95 duration-200">
                         <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                            <input type="date" className={InputStyle} value={editData.date} onChange={e => setEditData({...editData, date: e.target.value})} />
                            <input type="time" className={InputStyle} value={editData.time} onChange={e => setEditData({...editData, time: e.target.value})} />
                            <input type="text" className={`${InputStyle} md:col-span-2`} value={editData.description} onChange={e => setEditData({...editData, description: e.target.value})} />
                        </div>
                        <div className="flex justify-end gap-3">
                            <button type="button" onClick={() => setEditingId(null)} className="px-6 py-3 text-gray-400 hover:text-gray-900 text-[10px] font-black uppercase tracking-widest transition-colors">Annulla</button>
                            <button type="button" onClick={handleUpdate} className="px-8 py-3 bg-black text-white rounded-2xl hover:bg-red-600 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-black/10 transition-all"><Save size={14}/> Aggiorna</button>
                        </div>
                    </div>
                );
            }

            const isDeleted = rem.status === 'eliminato';
            const isClosed = rem.status === 'chiuso';
            const expired = !isClosed && !isDeleted && isExpired(rem.expirationDate);

            return (
            <div key={rem.id} className={`bg-white border p-6 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between rounded-3xl transition-all hover:shadow-md ${isDeleted ? 'opacity-40 grayscale border-gray-100 bg-gray-50' : 'border-gray-100'}`}>
                <div className="flex-1 w-full">
                    <div className="flex flex-wrap items-center gap-4 mb-3">
                        {isDeleted ? (
                            <span className="text-[9px] font-black px-3 py-1 rounded-full uppercase bg-gray-100 text-gray-400 tracking-widest">ELIMINATO</span>
                        ) : (
                            <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${isClosed ? 'bg-green-50 text-green-700' : expired ? 'bg-red-600 text-white' : 'bg-orange-50 text-orange-600'}`}>
                                {isClosed ? 'Completato' : (expired ? 'Scaduto' : 'Aperto')}
                            </span>
                        )}
                        <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest flex items-center gap-2">
                             <Calendar size={12} className="text-gray-300"/> {new Date(rem.expirationDate).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                    <p className={`text-sm font-bold tracking-tight ${isDeleted ? 'text-gray-400 line-through' : 'text-gray-900'} break-words leading-relaxed`}>{rem.description}</p>
                    {rem.feedback && <div className="mt-4 p-4 bg-gray-50/50 rounded-2xl border border-gray-100"><span className="text-[9px] font-black text-green-600 uppercase tracking-widest block mb-1">Esito Attività:</span> <p className="text-xs font-semibold text-gray-600">{rem.feedback}</p></div>}
                </div>

                {!isDeleted && (
                    <div className="flex items-center gap-3 w-full md:w-auto justify-end border-t md:border-t-0 pt-6 md:pt-0">
                        {!isClosed ? (
                            closingId === rem.id ? (
                                <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto items-end animate-in slide-in-from-right-2">
                                    <input autoFocus type="text" placeholder="Annotazioni esito..." className="w-full md:w-64 border border-red-200 bg-red-50/20 text-gray-900 font-semibold text-xs p-3.5 rounded-xl outline-none focus:ring-2 focus:ring-red-600" value={feedback} onChange={e => setFeedback(e.target.value)} onKeyDown={(e) => {if (e.key === 'Enter') {e.preventDefault(); handleClose(rem.id);}}}/>
                                    <div className="flex gap-2 w-full md:w-auto">
                                        <button type="button" onClick={() => handleClose(rem.id)} className="flex-1 bg-red-600 text-white p-3.5 rounded-xl hover:bg-red-700 flex justify-center shadow-lg shadow-red-600/20"><Check size={18} strokeWidth={3}/></button>
                                        <button type="button" onClick={() => {setClosingId(null); setFeedback('')}} className="flex-1 bg-gray-100 text-gray-400 p-3.5 rounded-xl hover:text-gray-900 flex justify-center"><X size={18} strokeWidth={3}/></button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <button type="button" onClick={() => handleEditClick(rem)} className="text-gray-300 hover:text-black p-3 hover:bg-gray-50 rounded-xl transition-all" title="Modifica"><Pencil size={18} /></button>
                                    <button type="button" onClick={() => setClosingId(rem.id)} className="text-gray-300 hover:text-green-600 p-3 hover:bg-green-50 rounded-xl transition-all" title="Segna come gestito"><Check size={20} strokeWidth={3} /></button>
                                </>
                            )
                        ) : null}
                        
                        {deletingId === rem.id ? (
                            <div className="flex items-center gap-2 animate-in zoom-in-95">
                                <button onClick={() => performDelete(rem.id)} className="bg-red-600 text-white text-[9px] font-black px-4 py-2 rounded-lg uppercase tracking-widest shadow-lg shadow-red-600/20">Si, elimina</button>
                                <button onClick={() => setDeletingId(null)} className="bg-gray-100 text-gray-400 text-[9px] font-black px-4 py-2 rounded-lg uppercase tracking-widest">No</button>
                            </div>
                        ) : (
                            <button type="button" onClick={() => setDeletingId(rem.id)} className="text-gray-300 hover:text-red-600 p-3 hover:bg-red-50 rounded-xl transition-all" title="Elimina"><Trash2 size={18} /></button>
                        )}
                    </div>
                )}
            </div>
        )})}
      </div>
    </div>
  );
};
