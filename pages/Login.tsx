
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, ChevronRight, AlertCircle, Mail, UserPlus } from 'lucide-react';
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
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border-t-8 border-red-600 animate-in fade-in zoom-in-95 duration-300">
        <div className="bg-black p-12 text-center">
          <h1 className="text-4xl font-black text-white mb-2 tracking-tighter uppercase">478 <span className="text-red-600">NLT</span></h1>
          <p className="text-gray-400 text-[10px] font-black tracking-[0.3em] uppercase">Portale Rete Agenti</p>
        </div>
        
        <div className="p-8 md:p-12">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-[0.2em] ml-1">
                Email Aziendale
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-300" />
                </div>
                <input
                  type="email"
                  id="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-red-600 focus:border-red-600 transition-all text-gray-900 bg-gray-50 focus:bg-white outline-none text-sm"
                  placeholder="nome@azienda.it"
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-[10px] font-black text-gray-400 mb-2 uppercase tracking-[0.2em] ml-1">
                Password / PIN
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-300" />
                </div>
                <input
                  type="password"
                  id="password"
                  required
                  minLength={4}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-red-600 focus:border-red-600 transition-all text-gray-900 bg-gray-50 focus:bg-white outline-none text-sm font-mono"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 text-red-600 bg-red-50 p-4 text-xs font-bold border border-red-100 rounded-2xl animate-shake">
                <AlertCircle size={16} className="flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || email.length < 5 || password.length < 4}
              className={`w-full flex items-center justify-center gap-2 py-4 px-4 text-white font-black uppercase tracking-[0.2em] text-xs transition-all transform active:scale-95 rounded-2xl shadow-xl ${
                loading || email.length < 5 || password.length < 4
                  ? 'bg-gray-300 cursor-not-allowed shadow-none'
                  : 'bg-red-600 hover:bg-red-700 shadow-red-600/20'
              }`}
            >
              {loading ? 'Verifica...' : 'Accedi al Portale'}
              {!loading && <ChevronRight size={16} />}
            </button>
            
            <div className="text-center pt-6 mt-6 border-t border-gray-50 space-y-4">
              <Link to="/register" className="inline-flex items-center gap-2 text-[10px] font-black text-gray-400 hover:text-red-600 transition-colors uppercase tracking-[0.1em]">
                <UserPlus size={14} /> Attivazione Account / Primo Accesso
              </Link>
              <p className="text-[9px] text-gray-300 font-black tracking-widest uppercase">v1.3.0</p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
