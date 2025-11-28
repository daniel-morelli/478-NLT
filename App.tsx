import React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { PracticesList } from './pages/PracticesList';
import { PracticeForm } from './pages/PracticeForm';
import { AdminAgents } from './pages/AdminAgents';
import { AdminProviders } from './pages/AdminProviders';

const { HashRouter, Routes, Route, Navigate } = ReactRouterDOM;

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
};

const AppRoutes = () => {
    const { user } = useAuth();
    
    return (
        <Routes>
            <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
            
            <Route path="/" element={
                <ProtectedRoute>
                    <Dashboard />
                </ProtectedRoute>
            } />
            
            <Route path="/practices" element={
                <ProtectedRoute>
                    <PracticesList />
                </ProtectedRoute>
            } />
            
            <Route path="/practices/new" element={
                <ProtectedRoute>
                    <PracticeForm />
                </ProtectedRoute>
            } />
            
            <Route path="/practices/:id" element={
                <ProtectedRoute>
                    <PracticeForm />
                </ProtectedRoute>
            } />
            
            <Route path="/agents" element={
                <ProtectedRoute>
                    <AdminAgents />
                </ProtectedRoute>
            } />
            
            <Route path="/providers" element={
                <ProtectedRoute>
                    <AdminProviders />
                </ProtectedRoute>
            } />
            
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