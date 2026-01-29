
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  LogOut, 
  Menu,
  X,
  Briefcase,
  UserCircle,
  Calendar,
  ShieldCheck,
  Users2,
  ChevronDown,
  Filter,
  ClipboardCheck,
  AlertCircle,
  Clock,
  Zap,
  ShieldAlert,
  Settings
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  
  // Menu chiusi di default all'apertura
  const [isAdminFiltersOpen, setIsAdminFiltersOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  if (!user) return <>{children}</>;

  const NavItem = ({ to, icon: Icon, label, search }: { to: string, icon: any, label: string, search?: string }) => {
    const fullPath = to + (search || '');
    const isActive = location.pathname === to && (!search || location.search === search);
    
    return (
      <Link
        to={fullPath}
        onClick={() => setIsSidebarOpen(false)}
        className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 group ${
          isActive 
            ? 'bg-red-600 text-white shadow-lg shadow-red-900/40' 
            : 'text-gray-400 hover:bg-gray-800 hover:text-white'
        }`}
      >
        <Icon size={18} className={isActive ? 'text-white' : 'text-gray-500 group-hover:text-red-500'} />
        <span className={`text-xs font-bold uppercase tracking-tight ${isActive ? 'opacity-100' : 'opacity-80'}`}>{label}</span>
      </Link>
    );
  };

  const getRoleLabel = () => {
      if (user.isAdmin) return 'Amministratore';
      if (user.isTeamLeader) return 'Team Leader';
      return 'Agente';
  };

  const isPowerUser = user.isAdmin || user.isTeamLeader;

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 md:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-30 w-72 bg-black text-white transform transition-transform duration-300 ease-out
        md:relative md:translate-x-0 border-r border-gray-800 shadow-2xl
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-zinc-950">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tighter uppercase italic">478 <span className="text-red-600">NLT</span></h1>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mt-0.5">Management Pro</p>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-gray-400 hover:text-white"><X /></button>
        </div>

        <div className="p-4 h-[calc(100vh-160px)] overflow-y-auto custom-scrollbar">
          <div className="mb-8 p-4 bg-gradient-to-br from-zinc-900 to-black rounded-2xl border border-gray-800/50 shadow-inner">
            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Identità Corrente</p>
            <p className="font-black truncate text-white uppercase tracking-tight">{user.nome}</p>
            <div className="flex items-center gap-1.5 text-[9px] text-red-500 mt-2 font-black uppercase tracking-[0.2em] bg-red-500/10 w-fit px-2 py-0.5 rounded-full border border-red-500/20">
               <ShieldCheck size={10}/>
               {getRoleLabel()}
            </div>
          </div>

          <nav className="space-y-1.5">
            <p className="px-4 pb-2 text-[9px] font-black text-gray-600 uppercase tracking-[0.3em]">Principale</p>
            <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />
            <NavItem to="/practices" icon={FileText} label={isPowerUser ? "Pratiche Globali" : "Le Mie Pratiche"} />
            <NavItem to="/customers" icon={Users2} label="Anagrafica Clienti" />
            <NavItem to="/calendar" icon={Calendar} label="Scadenziario" />
            <NavItem to="/profile" icon={UserCircle} label="Il mio Profilo" />
            
            {isPowerUser && (
              <div className="mt-8 space-y-1.5">
                {/* MENU FILTRI ADMIN */}
                <button 
                  onClick={() => setIsAdminFiltersOpen(!isAdminFiltersOpen)}
                  className="flex items-center justify-between w-full px-4 py-2 text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] hover:text-red-500 transition-colors"
                >
                  <span className="flex items-center gap-2"><Filter size={14}/> FILTRI ADMIN</span>
                  <ChevronDown size={14} className={`transition-transform duration-300 ${isAdminFiltersOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isAdminFiltersOpen && (
                  <div className="space-y-1 animate-in slide-in-from-top-2 duration-300">
                    <NavItem 
                      to="/practices" 
                      search="?adminView=ord_chiuso_trat_aperta" 
                      icon={Clock} 
                      label="Ord. chiuso Trat. aperta" 
                    />
                    <NavItem 
                      to="/practices" 
                      search="?adminView=prat_da_verificare" 
                      icon={AlertCircle} 
                      label="Prat. da verificare" 
                    />
                    <NavItem 
                      to="/practices" 
                      search="?adminView=prat_verificate" 
                      icon={ClipboardCheck} 
                      label="Prat. verificate" 
                    />
                    <NavItem 
                      to="/practices" 
                      search="?adminView=rappel_da_verificare" 
                      icon={Zap} 
                      label="Rappel da verificare" 
                    />
                  </div>
                )}

                {/* MENU CONFIGURAZIONE */}
                <button 
                  onClick={() => setIsConfigOpen(!isConfigOpen)}
                  className="flex items-center justify-between w-full px-4 pt-4 pb-2 text-[10px] font-black text-gray-600 uppercase tracking-[0.3em] hover:text-red-500 transition-colors"
                >
                  <span className="flex items-center gap-2"><Settings size={14}/> CONFIGURAZIONE</span>
                  <ChevronDown size={14} className={`transition-transform duration-300 ${isConfigOpen ? 'rotate-180' : ''}`} />
                </button>

                {isConfigOpen && (
                  <div className="space-y-1 animate-in slide-in-from-top-2 duration-300">
                    {user.isAdmin && <NavItem to="/agents" icon={Users} label="Gestione Agenti" />}
                    <NavItem to="/providers" icon={Briefcase} label="Gestione Provider" />
                  </div>
                )}
              </div>
            )}
          </nav>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800 bg-zinc-950">
          <button onClick={logout} className="flex items-center gap-3 w-full px-4 py-3 text-gray-500 hover:text-white hover:bg-red-600/10 group rounded-xl transition-all duration-300">
            <LogOut size={20} className="group-hover:text-red-600 transition-colors" />
            <span className="font-black text-xs uppercase tracking-widest">Logout</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto w-full bg-gray-50 relative">
        <div className="md:hidden bg-white p-4 shadow-md flex items-center justify-between sticky top-0 z-20 border-b border-gray-200">
          <h1 className="font-black text-gray-900 italic">478 <span className="text-red-600">NLT</span></h1>
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-gray-600 bg-gray-100 rounded-lg"><Menu /></button>
        </div>
        <div className="p-4 md:p-10 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
};
