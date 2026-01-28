
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Agent } from '../types';
import { DbService } from '../services/dbService';

interface AuthContextType {
  user: Agent | null;
  loading: boolean;
  login: (email: string, pin: string) => Promise<{success: boolean, message?: string}>;
  logout: () => void;
  changePassword: (newPassword: string) => Promise<{success: boolean, message?: string}>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_KEY = 'nlt_user_session_id';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const savedUserId = localStorage.getItem(SESSION_KEY);
      if (savedUserId) {
        const profile = await DbService.getAgentProfile(savedUserId);
        if (profile && profile.isActive) {
          setUser(profile);
        } else {
          localStorage.removeItem(SESSION_KEY);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, pin: string) => {
    setLoading(true);
    try {
      const profile = await DbService.validateLogin(email, pin);
      
      if (profile) {
          setUser(profile);
          localStorage.setItem(SESSION_KEY, profile.id.toString());
          return { success: true };
      } else {
          return { success: false, message: 'Email o Password non validi o account disattivato.' };
      }
    } catch (e: any) {
      console.error("Errore Login:", e);
      return { success: false, message: 'Errore di connessione con il database.' };
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (newPassword: string) => {
    try {
        if (user) {
            await DbService.updatePassword(user.id, newPassword);
            // Aggiorniamo lo stato locale
            setUser({ ...user, password: newPassword });
        }
        return { success: true };
    } catch (e: any) {
        return { success: false, message: e.message || 'Errore durante l\'aggiornamento della password.' };
    }
  };

  const logout = () => {
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
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
