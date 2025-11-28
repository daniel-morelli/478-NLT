import React, { useState, useEffect } from 'react';
import { Reminder } from '../types';
import { DbService } from '../services/dbService';
import { Bell, Plus, Check, Trash2, Clock, AlertTriangle, Pencil, X, Save } from 'lucide-react';

interface Props {
  practiceId: string;
}

export const PracticeReminders: React.FC<Props> = ({ practiceId }) => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // State per nuovo promemoria (default data di oggi)
  const [newReminder, setNewReminder] = useState({
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    description: ''
  });

  // State per chiusura
  const [closingId, setClosingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');

  // State per modifica
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({
    date: '',
    time: '',
    description: ''
  });

  // State per conferma cancellazione (sostituisce window.confirm)
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  // Prepara la modifica
  const handleEditClick = (rem: Reminder) => {
    setError(null);
    const dt = new Date(rem.expirationDate);
    // Formatta data e ora per gli input HTML
    const dateStr = dt.toISOString().split('T')[0];
    const timeStr = dt.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

    setEditData({
        date: dateStr,
        time: timeStr,
        description: rem.description
    });
    setEditingId(rem.id);
    setClosingId(null); // Chiudi eventuale box di feedback
    setDeletingId(null);
  };

  // Salva la modifica
  const handleUpdate = async () => {
    setError(null);
    if (!editingId || !editData.description || !editData.date) return;

    try {
        await DbService.saveReminder({
            id: editingId,
            practiceId, // Manteniamo il riferimento
            expirationDate: `${editData.date}T${editData.time}`,
            description: editData.description,
            // Non tocchiamo lo stato
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
        await DbService.saveReminder({
            ...reminder,
            status: 'chiuso',
            feedback
        });
        setClosingId(null);
        setFeedback('');
        loadReminders();
    } catch (e) {
        setError("Errore durante la chiusura del promemoria.");
    }
  };

  const performDelete = async (id: string) => {
      try {
          await DbService.deleteReminder(id);
          setDeletingId(null);
          loadReminders();
      } catch (e) {
          setError("Impossibile eliminare il promemoria. Controlla la connessione.");
      }
  };

  const isExpired = (dateStr: string) => new Date(dateStr) < new Date();
  
  // Stili
  const InputStyle = "border border-gray-300 p-2 rounded w-full text-sm outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600";
  const ButtonStyle = "px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wide transition-colors";

  return (
    <div className="mt-12 bg-gray-50 border border-gray-200 p-6 relative">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
            <Bell className="text-red-600" size={20}/> Promemoria
        </h3>
        <button 
          type="button"
          onClick={() => setIsAdding(!isAdding)}
          className={`flex items-center gap-1 ${ButtonStyle} ${isAdding ? 'bg-gray-200 text-gray-700' : 'bg-black text-white hover:bg-gray-800'}`}
        >
          <Plus size={14}/> {isAdding ? 'Annulla' : 'Aggiungi'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 mb-4 rounded text-sm font-bold border border-red-200 flex items-center gap-2">
            <AlertTriangle size={16}/> {error}
        </div>
      )}

      {isAdding && (
        <div className="bg-white p-4 mb-6 border-l-4 border-red-600 shadow-sm animate-in fade-in slide-in-from-top-2">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
                <input 
                    type="date" 
                    required 
                    className={InputStyle}
                    value={newReminder.date}
                    onChange={e => setNewReminder({...newReminder, date: e.target.value})}
                    onKeyDown={e => handleKeyDown(e, 'add')}
                />
                <input 
                    type="time" 
                    required 
                    className={InputStyle}
                    value={newReminder.time}
                    onChange={e => setNewReminder({...newReminder, time: e.target.value})}
                    onKeyDown={e => handleKeyDown(e, 'add')}
                />
                <input 
                    type="text" 
                    required 
                    placeholder="Descrizione promemoria..."
                    className={`${InputStyle} md:col-span-2`}
                    value={newReminder.description}
                    onChange={e => setNewReminder({...newReminder, description: e.target.value})}
                    onKeyDown={e => handleKeyDown(e, 'add')}
                />
            </div>
            <div className="flex justify-end">
                <button 
                    type="button" 
                    onClick={handleAdd}
                    className={`${ButtonStyle} bg-red-600 text-white hover:bg-red-700`}
                >
                    Salva Promemoria
                </button>
            </div>
        </div>
      )}

      <div className="space-y-3">
        {reminders.map(rem => {
            if (editingId === rem.id) {
                // VISUALIZZAZIONE MODIFICA
                return (
                    <div key={rem.id} className="bg-white border border-blue-300 p-4 shadow-md ring-2 ring-blue-100 rounded-md">
                         <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
                            <input 
                                type="date" 
                                className={InputStyle}
                                value={editData.date}
                                onChange={e => setEditData({...editData, date: e.target.value})}
                                onKeyDown={e => handleKeyDown(e, 'update')}
                            />
                            <input 
                                type="time" 
                                className={InputStyle}
                                value={editData.time}
                                onChange={e => setEditData({...editData, time: e.target.value})}
                                onKeyDown={e => handleKeyDown(e, 'update')}
                            />
                            <input 
                                type="text" 
                                className={`${InputStyle} md:col-span-2`}
                                value={editData.description}
                                onChange={e => setEditData({...editData, description: e.target.value})}
                                onKeyDown={e => handleKeyDown(e, 'update')}
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => setEditingId(null)} className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 flex items-center gap-1 text-xs font-bold uppercase"><X size={14}/> Annulla</button>
                            <button type="button" onClick={handleUpdate} className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1 text-xs font-bold uppercase"><Save size={14}/> Aggiorna</button>
                        </div>
                    </div>
                );
            }

            // VISUALIZZAZIONE NORMALE
            const isDeleted = rem.status === 'eliminato';
            const isClosed = rem.status === 'chiuso';
            const expired = !isClosed && !isDeleted && isExpired(rem.expirationDate);

            return (
            <div key={rem.id} className={`bg-white border p-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between ${isDeleted ? 'bg-gray-50 border-gray-100 opacity-60' : 'border-gray-200 shadow-sm'}`}>
                
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                        {isDeleted ? (
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full uppercase bg-gray-200 text-gray-500 border border-gray-300">ELIMINATO</span>
                        ) : (
                            // LOGICA COLORI BADGE RICHIESTA
                            // SCADUTO: ROSSO
                            // APERTO: ARANCIONE
                            // COMPLETATO: VERDE
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase border ${
                                isClosed 
                                    ? 'bg-green-50 text-green-700 border-green-200'
                                    : expired
                                        ? 'bg-red-50 text-red-600 border-red-200'
                                        : 'bg-orange-50 text-orange-600 border-orange-200'
                            }`}>
                                {isClosed ? 'Completato' : (expired ? 'Scaduto' : 'Aperto')}
                            </span>
                        )}
                        <span className="text-xs text-gray-500 font-mono flex items-center gap-1">
                             <Clock size={12}/> {new Date(rem.expirationDate).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                    {/* TESTO: Se è chiuso non è barrato. Se è eliminato è barrato. */}
                    <p className={`font-medium ${isDeleted ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{rem.description}</p>
                    
                    {rem.feedback && (
                        <p className="text-xs text-gray-600 mt-2 p-2 bg-gray-50 border-l-2 border-green-500">
                            <strong>Feedback:</strong> {rem.feedback}
                        </p>
                    )}
                </div>

                {!isDeleted && (
                    <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                        {!isClosed ? (
                            closingId === rem.id ? (
                                <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto items-end">
                                    <input 
                                        autoFocus
                                        type="text" 
                                        placeholder="Esito/Feedback..." 
                                        className="border border-red-300 text-sm p-1.5 w-full md:w-48 outline-none focus:ring-1 focus:ring-red-500"
                                        value={feedback}
                                        onChange={e => setFeedback(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleClose(rem.id);
                                            }
                                        }}
                                    />
                                    <div className="flex gap-1">
                                        <button type="button" onClick={() => handleClose(rem.id)} className="bg-red-600 text-white p-1.5 rounded hover:bg-red-700"><Check size={16}/></button>
                                        <button type="button" onClick={() => {setClosingId(null); setFeedback('')}} className="bg-gray-200 text-gray-600 p-1.5 rounded hover:bg-gray-300"><AlertTriangle size={16}/></button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <button type="button" onClick={() => handleEditClick(rem)} className="text-blue-600 hover:bg-blue-50 p-2 rounded" title="Modifica">
                                        <Pencil size={18} />
                                    </button>
                                    <button type="button" onClick={() => setClosingId(rem.id)} className="text-green-600 hover:bg-green-50 p-2 rounded" title="Chiudi Promemoria">
                                        <Check size={18} strokeWidth={3} />
                                    </button>
                                </>
                            )
                        ) : null}
                        
                        {deletingId === rem.id ? (
                            <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-200">
                                <span className="text-xs font-bold text-red-600">Eliminare?</span>
                                <button onClick={() => performDelete(rem.id)} className="bg-red-600 text-white text-xs px-2 py-1 rounded hover:bg-red-700">SI</button>
                                <button onClick={() => setDeletingId(null)} className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded hover:bg-gray-300">NO</button>
                            </div>
                        ) : (
                            <button type="button" onClick={() => setDeletingId(rem.id)} className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 rounded" title="Elimina">
                                <Trash2 size={18} />
                            </button>
                        )}
                    </div>
                )}
            </div>
        )})}
        {reminders.length === 0 && !isAdding && (
            <div className="text-center py-8 text-gray-400 italic">
                Nessun promemoria presente per questa pratica.
            </div>
        )}
      </div>
    </div>
  );
};