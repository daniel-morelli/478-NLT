
import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { PracticesList } from './pages/PracticesList';
import { PracticeForm } from './pages/PracticeForm';
import { CustomersList } from './pages/CustomersList';
import { AdminAgents } from './pages/AdminAgents';
import { AdminProviders } from './pages/AdminProviders';
import { AdminDealSources } from './pages/AdminDealSources';
import { Profile } from './pages/Profile';
import { CalendarPage } from './pages/CalendarPage';
import { BackupView } from './components/BackupView';
import { BackupService } from './services/backupService';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
};

const AppRoutes = () => {
    const { user } = useAuth();

    // Trigger Backup Automatico all'avvio se l'utente è Admin
    useEffect(() => {
        if (user?.isAdmin) {
            BackupService.runAutoBackup();
        }
    }, [user]);
    
    return (
        <Routes>
            <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
            <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />
            
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/practices" element={<ProtectedRoute><PracticesList /></ProtectedRoute>} />
            <Route path="/practices/new" element={<ProtectedRoute><PracticeForm /></ProtectedRoute>} />
            <Route path="/practices/:id" element={<ProtectedRoute><PracticeForm /></ProtectedRoute>} />
            <Route path="/customers" element={<ProtectedRoute><CustomersList /></ProtectedRoute>} />
            <Route path="/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/backup" element={<ProtectedRoute><BackupView /></ProtectedRoute>} />
            
            {/* Admin Routes */}
            <Route path="/agents" element={<ProtectedRoute><AdminAgents /></ProtectedRoute>} />
            <Route path="/providers" element={<ProtectedRoute><AdminProviders /></ProtectedRoute>} />
            <Route path="/deal-sources" element={<ProtectedRoute><AdminDealSources /></ProtectedRoute>} />
            
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

const App: React.FC = () => {
  return (
    <AuthProvider>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </AuthProvider>
  );
};

export default App;
