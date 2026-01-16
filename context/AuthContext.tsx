
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Agent } from '../types';
import { DbService } from '../services/dbService';

interface AuthContextType {
  user: Agent | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{success: boolean, message?: string}>;
  logout: () => void;
  changePassword: (newPassword: string) => Promise<{success: boolean, message?: string}>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('478_USER');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.warn("Storage access blocked", e);
    }
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const agent = await DbService.getAgentByCredentials(email, password);
      
      if (agent) {
        setUser(agent);
        try {
            localStorage.setItem('478_USER', JSON.stringify(agent));
        } catch (e) { console.warn("Storage blocked"); }
        return { success: true };
      }
      
      return { success: false, message: 'Email o Password errati, o utente non attivo.' };
    } catch (e: any) {
      console.error("Errore Login:", e);
      return { success: false, message: 'Errore di connessione. Verifica le impostazioni del database.' };
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (newPassword: string) => {
    if (!user) return { success: false, message: 'Utente non autenticato' };
    try {
        await DbService.updatePassword(user.id, newPassword);
        const updatedUser = { ...user, password: newPassword };
        setUser(updatedUser);
        localStorage.setItem('478_USER', JSON.stringify(updatedUser));
        return { success: true };
    } catch (e) {
        return { success: false, message: 'Errore durante l\'aggiornamento della password.' };
    }
  };

  const logout = () => {
    setUser(null);
    try {
        localStorage.removeItem('478_USER');
    } catch (e) {}
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
