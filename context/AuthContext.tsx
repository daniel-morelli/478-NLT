import React, { createContext, useContext, useState, useEffect } from 'react';
import { Agent } from '../types';
import { DbService } from '../services/dbService';

interface AuthContextType {
  user: Agent | null;
  loading: boolean;
  login: (pin: string) => Promise<{success: boolean, message?: string}>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check local storage
    try {
      const storedUser = localStorage.getItem('478_USER');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.warn("Storage access blocked", e);
    }
    
    // Check connection
    DbService.initializeDefaults();
  }, []);

  const login = async (pin: string) => {
    setLoading(true);
    try {
      console.log("Login richiesto per PIN:", pin);
      const agent = await DbService.getAgentByPin(pin);
      
      if (agent) {
        setUser(agent);
        try {
            localStorage.setItem('478_USER', JSON.stringify(agent));
        } catch (e) { console.warn("Storage blocked"); }
        return { success: true };
      }
      
      return { success: false, message: 'PIN non valido o utente disabilitato.' };
    } catch (e: any) {
      console.error("Errore Login:", e);
      return { success: false, message: 'Errore di connessione al database.' };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    try {
        localStorage.removeItem('478_USER');
    } catch (e) {}
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};