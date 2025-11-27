import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { DbService } from '../services/dbService';
import { Practice, DealStatus, CreditStatus, OrderStatus } from '../types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { TrendingUp, AlertCircle, CheckCircle, Clock } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [practices, setPractices] = useState<Practice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      DbService.getPractices(user).then(data => {
        setPractices(data);
        setLoading(false);
      });
    }
  }, [user]);

  if (loading) return <div className="text-center py-10 text-gray-500">Caricamento dati...</div>;

  // --- KPI LOGIC ---
  const currentYear = new Date().getFullYear();
  const yearlyPractices = practices.filter(p => new Date(p.data).getFullYear() === currentYear);
  
  const totalValue = yearlyPractices.reduce((acc, curr) => acc + (curr.valoreTotale || 0), 0);
  
  const pendingCount = practices.filter(p => {
    const isTrattativaPending = p.statoTrattativa === DealStatus.IN_CORSO;
    const isAffidamentoPending = p.statoAffidamento === CreditStatus.IN_ATTESA;
    const isOrdinePending = p.statoOrdine === OrderStatus.NON_INVIATO;
    return isTrattativaPending || isAffidamentoPending || isOrdinePending;
  }).length;
  
  const closedDeals = yearlyPractices.filter(p => p.statoTrattativa === DealStatus.CHIUSA).length;

  // --- CHART DATA ---
  const monthlyData = Array(12).fill(0).map((_, i) => ({
    name: new Date(0, i).toLocaleString('it-IT', { month: 'short' }).toUpperCase(),
    valore: 0
  }));
  
  yearlyPractices.forEach(p => {
    const date = new Date(p.data);
    const month = date.getMonth();
    if (!isNaN(month)) {
        monthlyData[month].valore += (p.valoreTotale || 0);
    }
  });

  const statusData = [
    { name: 'In Corso', value: practices.filter(p => p.statoTrattativa === DealStatus.IN_CORSO).length, color: '#ef4444' }, // Rosso
    { name: 'Chiuse', value: practices.filter(p => p.statoTrattativa === DealStatus.CHIUSA).length, color: '#171717' },  // Nero
    { name: 'Fallite', value: practices.filter(p => p.statoTrattativa === DealStatus.FALLITA).length, color: '#d4d4d4' }, // Grigio
  ].filter(d => d.value > 0);

  const StatCard = ({ title, value, sub, icon: Icon, type }: any) => {
    let colors = "";
    if (type === 'value') colors = "bg-black text-white";
    if (type === 'pending') colors = "bg-red-600 text-white";
    if (type === 'closed') colors = "bg-white border border-gray-200 text-gray-800";

    return (
        <div className={`p-6 rounded-none shadow-sm flex items-start justify-between ${colors}`}>
        <div>
            <p className={`text-sm font-bold uppercase tracking-wider mb-1 ${type === 'closed' ? 'text-gray-500' : 'text-white/70'}`}>{title}</p>
            <h3 className="text-3xl font-bold">{value}</h3>
            {sub && <p className={`text-xs mt-2 ${type === 'closed' ? 'text-gray-400' : 'text-white/60'}`}>{sub}</p>}
        </div>
        <div className={`p-2 rounded ${type === 'closed' ? 'bg-gray-100 text-gray-600' : 'bg-white/20 text-white'}`}>
            <Icon className="w-6 h-6" />
        </div>
        </div>
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center mb-6">
        <div>
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard</h2>
            <p className="text-gray-500">Panoramica attività</p>
        </div>
        <div className="text-sm font-bold text-gray-600 bg-white px-4 py-2 border border-gray-200 shadow-sm">
            ANNO {currentYear}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Valore Totale" 
          value={`€ ${totalValue.toLocaleString()}`} 
          sub="Pratiche Anno Corrente"
          icon={TrendingUp} 
          type="value"
        />
        <StatCard 
          title="Attività Pendenti" 
          value={pendingCount} 
          sub="Azioni Richieste"
          icon={AlertCircle} 
          type="pending"
        />
        <StatCard 
          title="Contratti Chiusi" 
          value={closedDeals} 
          sub="Obiettivi Raggiunti"
          icon={CheckCircle} 
          type="closed"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="bg-white p-6 shadow-sm border border-gray-200 lg:col-span-2">
          <h3 className="text-lg font-bold text-gray-800 mb-6 uppercase tracking-wide">Andamento Mensile</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 11, fontWeight: 'bold'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 11}} tickFormatter={(val) => `€${val/1000}k`} />
                <Tooltip 
                  cursor={{fill: '#f3f4f6'}}
                  contentStyle={{backgroundColor: '#171717', color: '#fff', borderRadius: '0', border: 'none'}}
                />
                <Bar dataKey="valore" fill="#dc2626" radius={[0, 0, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-white p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-6 uppercase tracking-wide">Stato Trattative</h3>
          <div className="h-64 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{backgroundColor: '#171717', color: '#fff', borderRadius: '0', border: 'none'}} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-4xl font-bold text-gray-900">{practices.length}</span>
                <span className="text-xs font-bold text-gray-400 uppercase">Totale</span>
            </div>
          </div>
          <div className="mt-6 space-y-3">
              {statusData.map((d) => (
                  <div key={d.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-3">
                          <div className="w-3 h-3" style={{backgroundColor: d.color}}></div>
                          <span className="text-gray-600 font-medium">{d.name}</span>
                      </div>
                      <span className="font-bold text-gray-800">{d.value}</span>
                  </div>
              ))}
          </div>
        </div>
      </div>

      {/* Pending Actions List */}
      <div className="bg-white shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-100 bg-gray-50">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 uppercase tracking-wide">
                <Clock className="text-red-600 w-5 h-5"/> Attività Recenti in Corso
            </h3>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead className="bg-white text-gray-500 border-b border-gray-200">
                    <tr>
                        <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider">Cliente</th>
                        <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider">Data</th>
                        <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider">Provider</th>
                        <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider">Stato</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {practices.filter(p => p.statoTrattativa === DealStatus.IN_CORSO).slice(0, 5).map(p => (
                        <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 font-bold text-gray-800">{p.cliente}</td>
                            <td className="px-6 py-4 text-gray-600 font-medium">{p.data}</td>
                            <td className="px-6 py-4 text-gray-600">{p.provider}</td>
                            <td className="px-6 py-4">
                                <span className="inline-flex items-center px-2 py-1 text-xs font-bold bg-red-50 text-red-700 border border-red-100">
                                    IN CORSO
                                </span>
                            </td>
                        </tr>
                    ))}
                    {practices.filter(p => p.statoTrattativa === DealStatus.IN_CORSO).length === 0 && (
                        <tr>
                            <td colSpan={4} className="px-6 py-8 text-center text-gray-400 italic">Nessuna attività in corso</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};