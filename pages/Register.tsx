
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { DbService } from '../services/dbService';
import { Mail, Lock, UserPlus, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';

export const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const cleanEmail = email.trim();

    if (password !== confirmPassword) {
      setError('Le password non coincidono.');
      return;
    }

    if (password.length < 4) {
      setError('La password deve essere di almeno 4 caratteri.');
      return;
    }

    setLoading(true);

    try {
      const isAuthorized = await DbService.isEmailAuthorized(cleanEmail);
      if (!isAuthorized) {
        setError("Email non autorizzata. Contatta l'amministratore.");
        setLoading(false);
        return;
      }

      await DbService.updatePasswordByEmail(cleanEmail, password);

      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      setError("Errore durante l'attivazione.");
    } finally {
      setLoading(false);
    }
  };

  const InputStyle = "block w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-red-600 focus:border-red-600 transition-all text-gray-900 bg-gray-50 focus:bg-white outline-none text-sm";
  const LabelStyle = "block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-[0.2em] ml-1";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border-t-8 border-black animate-in fade-in zoom-in-95 duration-300">
        <div className="bg-red-600 p-10 text-center">
          <h1 className="text-3xl font-black text-white mb-2 tracking-tighter uppercase">ATTIVAZIONE <span className="text-black">ACCOUNT</span></h1>
          <p className="text-red-100 text-[10px] font-black tracking-[0.3em] uppercase">Imposta la tua password</p>
        </div>
        
        <div className="p-8 md:p-12">
          {success ? (
            <div className="text-center space-y-4 py-6 animate-in zoom-in-50 duration-500">
                <div className="flex justify-center text-green-500"><CheckCircle size={64} /></div>
                <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Account Attivo!</h2>
                <p className="text-sm text-gray-500">Ti stiamo reindirizzando al login...</p>
            </div>
          ) : (
            <form onSubmit={handleRegister} className="space-y-5">
              <div>
                <label className={LabelStyle}>Email Autorizzata</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={InputStyle}
                    placeholder="nome@azienda.it"
                  />
                </div>
              </div>

              <div>
                <label className={LabelStyle}>Scegli Nuova Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300" />
                  <input
                    type="password"
                    required
                    minLength={4}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={InputStyle}
                    placeholder="Minimo 4 caratteri"
                  />
                </div>
              </div>

              <div>
                <label className={LabelStyle}>Conferma Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={InputStyle}
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 text-red-600 bg-red-50 p-4 text-xs font-bold border border-red-100 rounded-2xl">
                  <AlertCircle size={16} className="flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-black text-white font-black py-4 uppercase tracking-[0.2em] text-xs shadow-xl shadow-black/10 transition-all transform active:scale-95 disabled:bg-gray-400 rounded-2xl"
              >
                {loading ? 'Attivazione...' : 'Conferma Attivazione'}
              </button>

              <div className="pt-6 border-t border-gray-50 text-center">
                <Link to="/login" className="inline-flex items-center justify-center gap-2 text-[10px] font-black text-gray-400 hover:text-red-600 transition-colors uppercase tracking-[0.1em]">
                  <ArrowLeft size={14} /> Torna al Login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
