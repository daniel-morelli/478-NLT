
import React from 'react';
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
  Users2
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  if (!user) return <>{children}</>;

  const NavItem = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => {
    const isActive = location.pathname === to;
    return (
      <Link
        to={to}
        onClick={() => setIsSidebarOpen(false)}
        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
          isActive 
            ? 'bg-red-600 text-white shadow-md shadow-red-900/20' 
            : 'text-gray-400 hover:bg-gray-800 hover:text-white'
        }`}
      >
        <Icon size={20} />
        <span className="font-medium">{label}</span>
      </Link>
    );
  };

  const getRoleLabel = () => {
      if (user.isAdmin) return 'Amministratore';
      if (user.isTeamLeader) return 'Team Leader';
      return 'Agente';
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-black text-white transform transition-transform duration-200 ease-in-out
        md:relative md:translate-x-0 border-r border-gray-800
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b border-gray-800 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">478 <span className="text-red-600">NLT</span></h1>
            <p className="text-xs text-gray-500 mt-1">Gestione Pratiche v1.4.0</p>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-gray-400"><X /></button>
        </div>

        <div className="p-4">
          <div className="mb-6 p-4 bg-gray-900 rounded-lg border border-gray-800">
            <p className="text-sm text-gray-500">Benvenuto,</p>
            <p className="font-semibold truncate text-white">{user.nome}</p>
            <div className="flex items-center gap-1.5 text-[10px] text-red-500 mt-1 font-bold uppercase tracking-wider">
               {(user.isAdmin || user.isTeamLeader) && <ShieldCheck size={12}/>}
               {getRoleLabel()}
            </div>
          </div>

          <nav className="space-y-2">
            <NavItem to="/" icon={LayoutDashboard} label="Dashboard" />
            <NavItem to="/practices" icon={FileText} label={(user.isAdmin || user.isTeamLeader) ? "Pratiche" : "Le Mie Pratiche"} />
            <NavItem to="/customers" icon={Users2} label="Anagrafica Clienti" />
            <NavItem to="/calendar" icon={Calendar} label="Calendario" />
            <NavItem to="/profile" icon={UserCircle} label="Il mio Profilo" />
            
            {(user.isAdmin || user.isTeamLeader) && (
              <>
                <div className="pt-4 pb-2 px-4 text-xs font-bold text-gray-600 uppercase tracking-widest">Strumenti</div>
                {user.isAdmin && <NavItem to="/agents" icon={Users} label="Gestione Agenti" />}
                <NavItem to="/providers" icon={Briefcase} label="Gestione Provider" />
              </>
            )}
          </nav>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800 bg-black">
          <button onClick={logout} className="flex items-center gap-3 w-full px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-900 rounded-lg transition-colors">
            <LogOut size={20} />
            <span>Esci</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto w-full bg-gray-50">
        <div className="md:hidden bg-white p-4 shadow-sm flex items-center justify-between sticky top-0 z-10 border-b border-gray-200">
          <h1 className="font-bold text-gray-900">478 <span className="text-red-600">NLT</span></h1>
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-gray-600"><Menu /></button>
        </div>
        <div className="p-4 md:p-8 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
};
