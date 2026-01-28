
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, ChevronRight, AlertCircle, Mail, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, loading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 4) {
      setError('La password deve contenere almeno 4 caratteri.');
      return;
    }
    const result = await login(email, password);
    if (!result.success) {
      setError(result.message || 'Credenziali non valide.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa] p-6 font-sans selection:bg-red-100">
      {/* Elementi decorativi di sfondo per profondità */}
      <div className="fixed top-0 left-0 w-full h-1 bg-red-600 z-50"></div>
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-red-500/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-black/5 rounded-full blur-3xl"></div>

      <div className="w-full max-w-[440px] z-10">
        {/* Logo Section */}
        <div className="text-center mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-black rounded-3xl shadow-2xl shadow-black/20 mb-6 rotate-3 hover:rotate-0 transition-transform duration-500">
            <span className="text-white font-black text-2xl tracking-tighter">478</span>
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase mb-2">
            PORTALE <span className="text-red-600">NLT</span>
          </h1>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-[0.3em]">Gestione Flotta & Agenti</p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-gray-100 p-10 md:p-12 animate-in fade-in zoom-in-95 duration-500">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-6">
              {/* Email Input */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                  Email Account
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-300 group-focus-within:text-red-600 transition-colors" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-12 pr-4 py-4 bg-gray-50 border-transparent border-2 rounded-2xl focus:bg-white focus:border-red-600 transition-all text-gray-900 font-semibold outline-none"
                    placeholder="Esempio: nome@478nlt.it"
                    autoFocus
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <div className="flex justify-between items-end px-1">
                  <label htmlFor="password" className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Password / PIN
                  </label>
                  <Link to="/register" className="text-[9px] font-bold text-red-600 hover:underline uppercase tracking-wider">
                    Dimenticata?
                  </Link>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-300 group-focus-within:text-red-600 transition-colors" />
                  </div>
                  <input
                    type="password"
                    id="password"
                    required
                    minLength={4}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-12 pr-4 py-4 bg-gray-50 border-transparent border-2 rounded-2xl focus:bg-white focus:border-red-600 transition-all text-gray-900 font-mono tracking-[0.3em] outline-none"
                    placeholder="••••"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-3 text-red-600 bg-red-50 p-4 rounded-2xl border border-red-100 animate-in shake duration-300">
                <AlertCircle size={18} className="flex-shrink-0" />
                <span className="text-xs font-bold uppercase tracking-tight">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex items-center justify-center gap-3 py-5 bg-black text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all hover:bg-red-600 hover:shadow-2xl hover:shadow-red-600/30 active:scale-[0.98] disabled:bg-gray-200 disabled:shadow-none overflow-hidden"
            >
              <div className="absolute inset-0 w-1/3 h-full bg-white/10 skew-x-[-20deg] group-hover:translate-x-[300%] transition-transform duration-1000"></div>
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white animate-spin rounded-full"></div>
                  Verifica in corso...
                </span>
              ) : (
                <>
                  Entra nel Sistema
                  <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" strokeWidth={3} />
                </>
              )}
            </button>
          </form>
          
          <div className="mt-10 pt-8 border-t border-gray-50 flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 text-gray-300">
              <ShieldCheck size={14} />
              <span className="text-[9px] font-bold uppercase tracking-[0.2em]">Connessione Protetta SSL</span>
            </div>
            <Link to="/register" className="text-[10px] font-black text-gray-400 hover:text-black transition-colors uppercase tracking-[0.1em]">
              Non hai un account? <span className="text-red-600">Attivalo qui</span>
            </Link>
          </div>
        </div>
        
        {/* Footer info */}
        <p className="text-center mt-8 text-[9px] font-bold text-gray-400 uppercase tracking-widest opacity-50">
          © {new Date().getFullYear()} 478 NLT Manager • Tutti i diritti riservati
        </p>
      </div>
    </div>
  );
};
