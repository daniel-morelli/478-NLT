
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Save, Lock, User, Mail, Phone, AlertCircle, CheckCircle } from 'lucide-react';

export const Profile: React.FC = () => {
  const { user, changePassword } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  if (!user) return null;

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword.length < 4) {
        setMessage({ type: 'error', text: 'La password deve contenere almeno 4 caratteri.' });
        return;
    }

    if (newPassword !== confirmPassword) {
        setMessage({ type: 'error', text: 'Le password non coincidono.' });
        return;
    }

    setLoading(true);
    const result = await changePassword(newPassword);
    setLoading(false);

    if (result.success) {
        setMessage({ type: 'success', text: 'Password aggiornata con successo!' });
        setNewPassword('');
        setConfirmPassword('');
    } else {
        setMessage({ type: 'error', text: result.message || 'Errore durante l\'aggiornamento.' });
    }
  };

  const getRoleLabel = () => {
    if (user.isAdmin) return 'Amministratore';
    if (user.isTeamLeader) return 'Team Leader';
    return 'Agente';
  };

  const InputStyle = "w-full border border-gray-300 bg-white text-gray-900 p-3 focus:ring-2 focus:ring-red-600 focus:border-red-600 outline-none transition-all";
  const LabelStyle = "block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2";

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-20">
        <div>
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Il mio Profilo</h2>
            <p className="text-sm text-gray-500">Gestisci i tuoi dati e la sicurezza dell'account</p>
        </div>

        {/* Informazioni Account */}
        <div className="bg-white border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-black text-white px-6 py-4 flex items-center gap-2">
                <User size={18} className="text-red-600" />
                <h3 className="font-bold uppercase tracking-wide text-sm">Dati Utente</h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <span className={LabelStyle}>Nome Completo</span>
                    <p className="font-bold text-gray-900 text-lg">{user.nome}</p>
                </div>
                <div>
                    <span className={LabelStyle}>Ruolo</span>
                    <p className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold uppercase">
                        {getRoleLabel()}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-gray-100 p-2 rounded"><Mail size={16} className="text-gray-500" /></div>
                    <div>
                        <span className={LabelStyle}>Email</span>
                        <p className="text-gray-800 font-medium">{user.email}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-gray-100 p-2 rounded"><Phone size={16} className="text-gray-500" /></div>
                    <div>
                        <span className={LabelStyle}>Cellulare</span>
                        <p className="text-gray-800 font-medium">{user.cell}</p>
                    </div>
                </div>
            </div>
        </div>

        {/* Cambio Password */}
        <div className="bg-white border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-black text-white px-6 py-4 flex items-center gap-2">
                <Lock size={18} className="text-red-600" />
                <h3 className="font-bold uppercase tracking-wide text-sm">Cambia Password</h3>
            </div>
            <form onSubmit={handlePasswordChange} className="p-6 space-y-4">
                {message && (
                    <div className={`p-4 flex items-start gap-3 border-l-4 ${message.type === 'success' ? 'bg-green-50 border-green-600 text-green-700' : 'bg-red-50 border-red-600 text-red-700'}`}>
                        {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                        <p className="text-sm font-medium">{message.text}</p>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className={LabelStyle}>Nuova Password</label>
                        <input 
                            type="password" 
                            required 
                            minLength={4}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className={InputStyle} 
                            placeholder="Minimo 4 caratteri"
                        />
                    </div>
                    <div>
                        <label className={LabelStyle}>Conferma Nuova Password</label>
                        <input 
                            type="password" 
                            required 
                            minLength={4}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className={InputStyle} 
                            placeholder="Ripeti la password"
                        />
                    </div>
                </div>

                <div className="pt-4 flex justify-end">
                    <button 
                        type="submit" 
                        disabled={loading || !newPassword || !confirmPassword}
                        className="bg-red-600 text-white px-8 py-3 font-bold uppercase tracking-wider hover:bg-red-700 shadow-lg shadow-red-600/20 flex items-center gap-2 transition-all active:scale-95 disabled:bg-gray-400"
                    >
                        <Save size={18} />
                        {loading ? 'Salvataggio...' : 'Aggiorna Password'}
                    </button>
                </div>
            </form>
        </div>
    </div>
  );
};
