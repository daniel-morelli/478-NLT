import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, ChevronRight, AlertCircle } from 'lucide-react';

export const Login: React.FC = () => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const { login, loading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const success = await login(pin);
    if (!success) {
      setError('PIN non valido o account disabilitato.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white rounded-none shadow-2xl w-full max-w-md overflow-hidden border-t-4 border-red-600">
        <div className="bg-black p-10 text-center">
          <h1 className="text-4xl font-bold text-white mb-2 tracking-tighter">478 <span className="text-red-600">NLT</span></h1>
          <p className="text-gray-400 text-sm tracking-widest uppercase">Portale Rete Agenti</p>
        </div>
        
        <div className="p-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="pin" className="block text-sm font-semibold text-gray-800 mb-2 uppercase tracking-wide">
                Codice Personale (PIN)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  id="pin"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 focus:ring-2 focus:ring-red-600 focus:border-red-600 transition-colors text-lg tracking-widest outline-none text-gray-900 bg-gray-50 focus:bg-white"
                  placeholder="••••"
                  autoFocus
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 text-sm border-l-4 border-red-600">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || pin.length < 4}
              className={`w-full flex items-center justify-center gap-2 py-4 px-4 text-white font-bold uppercase tracking-wider transition-all transform active:scale-95 ${
                loading || pin.length < 4
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/30'
              }`}
            >
              {loading ? 'Verifica...' : 'Accedi al Portale'}
              {!loading && <ChevronRight size={18} />}
            </button>
            
            <div className="text-center mt-6 space-y-1">
              <p className="text-xs text-gray-400">
                Accesso monitorato e riservato.
              </p>
              <p className="text-xs text-gray-300 font-mono">v1.1.0</p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};