import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { DbService } from '../services/dbService';
import { Practice, DealStatus, CreditStatus, OrderStatus, Reminder } from '../types';
import * as ReactRouterDOM from 'react-router-dom';
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
import { Bell, Clock, AlertCircle } from 'lucide-react';

const { useNavigate } = ReactRouterDOM;

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [practices, setPractices] = useState<Practice[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const fetchData = async () => {
          const practicesData = await DbService.getPractices(user);
          setPractices(practicesData);
          
          if (practicesData.length > 0) {
              const pIds = practicesData.map(p => p.id);
              const remindersData = await DbService.getRemindersForPractices(pIds);
              setReminders(remindersData);
          }
          setLoading(false);
      };
      fetchData();
    }
  }, [user]);

  const handleFilterClick = (type: string, value: string) => {
      navigate(`/practices?filterType=${type}&filterValue=${encodeURIComponent(value)}`);
  };

  if (loading) return <div className="text-center py-10 text-gray-500">Caricamento dati...</div>;

  // --- CALCOLI STATISTICHE ---
  const currentYear = new Date().getFullYear();
  const yearlyPractices = practices.filter(p => new Date(p.data).getFullYear() === currentYear);
  const totalValue = yearlyPractices.reduce((acc, curr) => acc + (curr.valoreTotale || 0), 0);

  // Stats Promemoria
  const now = new Date();
  
  // Promemoria non ancora scaduti (Futuri o Oggi) - Status 'aperto'
  const futureReminders = reminders.filter(r => 
    r.status === 'aperto' && new Date(r.expirationDate) >= now
  );

  // Promemoria scaduti senza feedback - Status 'aperto' e data passata
  const expiredNoFeedbackReminders = reminders.filter(r => 
    r.status === 'aperto' && new Date(r.expirationDate) < now
  );

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

  // Componente per i Box Cliccabili
  const FilterBox = ({ title, items, type }: { title: string, items: {label: string, value: number, filterVal: string}[], type: string }) => (
    <div className="bg-white border border-gray-200 shadow-sm overflow-hidden flex flex-col h-full">
        <div className="bg-black text-white px-4 py-2 text-sm font-bold uppercase tracking-wider">
            {title}
        </div>
        <div className="p-4 flex-1 flex flex-col justify-center gap-3">
            {items.map((item, idx) => (
                <div 
                    key={idx} 
                    onClick={() => handleFilterClick(type, item.filterVal)}
                    className="flex justify-between items-center cursor-pointer group hover:bg-gray-50 p-1 rounded transition-colors"
                >
                    <span className="text-gray-600 text-sm font-medium group-hover:text-red-600 transition-colors">{item.label}</span>
                    <span className="font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded text-xs group-hover:bg-red-100 group-hover:text-red-700">
                        {item.value}
                    </span>
                </div>
            ))}
        </div>
    </div>
  );

  return (
    <div className="space-y-8 pb-10">
      <div className="flex justify-between items-center mb-6">
        <div>
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard</h2>
            <p className="text-sm text-gray-500">Panoramica operativa</p>
        </div>
        <div className="text-sm font-bold text-gray-600 bg-white px-4 py-2 border border-gray-200 shadow-sm">
            ANNO {currentYear}
        </div>
      </div>

      {/* BOX PRINCIPALI FILTRABILI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-auto">
        <FilterBox 
            title="PRATICHE" 
            type="statoTrattativa"
            items={[
                { label: 'In Corso', value: practices.filter(p => p.statoTrattativa === DealStatus.IN_CORSO).length, filterVal: DealStatus.IN_CORSO },
                { label: 'Fallite', value: practices.filter(p => p.statoTrattativa === DealStatus.FALLITA).length, filterVal: DealStatus.FALLITA },
                { label: 'Chiuse', value: practices.filter(p => p.statoTrattativa === DealStatus.CHIUSA).length, filterVal: DealStatus.CHIUSA },
            ]}
        />
        <FilterBox 
            title="AFFIDAMENTI" 
            type="statoAffidamento"
            items={[
                { label: 'In Attesa', value: practices.filter(p => p.statoAffidamento === CreditStatus.IN_ATTESA).length, filterVal: CreditStatus.IN_ATTESA },
                { label: 'Bocciati', value: practices.filter(p => p.statoAffidamento === CreditStatus.BOCCIATO).length, filterVal: CreditStatus.BOCCIATO },
                { label: 'Esitati', value: practices.filter(p => p.statoAffidamento === CreditStatus.ESITATO).length, filterVal: CreditStatus.ESITATO },
                { label: 'Esitati con Cond.', value: practices.filter(p => p.statoAffidamento === CreditStatus.ESITATO_CON_CONDIZIONI).length, filterVal: CreditStatus.ESITATO_CON_CONDIZIONI },
            ]}
        />
        <FilterBox 
            title="ORDINI" 
            type="statoOrdine"
            items={[
                { label: 'Non Inviati', value: practices.filter(p => p.statoOrdine === OrderStatus.NON_INVIATO).length, filterVal: OrderStatus.NON_INVIATO },
                { label: 'Inviati', value: practices.filter(p => p.statoOrdine === OrderStatus.INVIATO).length, filterVal: OrderStatus.INVIATO },
                { label: 'Falliti', value: practices.filter(p => p.statoOrdine === OrderStatus.FALLITO).length, filterVal: OrderStatus.FALLITO },
            ]}
        />
      </div>

      {/* BOX PROMEMORIA */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div 
            onClick={() => handleFilterClick('reminder', 'future')}
            className="bg-white border border-gray-200 p-6 flex items-center justify-between cursor-pointer hover:border-red-600 transition-colors shadow-sm group"
          >
              <div>
                  <h4 className="text-gray-500 font-bold uppercase text-xs tracking-wider mb-1 group-hover:text-red-600">Promemoria In Arrivo</h4>
                  <p className="text-gray-400 text-xs">Non ancora scaduti</p>
              </div>
              <div className="flex items-center gap-4">
                  <span className="text-3xl font-bold text-gray-900">{futureReminders.length}</span>
                  <div className="bg-orange-50 p-3 rounded-full text-orange-600 group-hover:bg-red-600 group-hover:text-white transition-colors">
                      <Clock size={24} />
                  </div>
              </div>
          </div>

          <div 
            onClick={() => handleFilterClick('reminder', 'expired')}
            className="bg-white border border-gray-200 p-6 flex items-center justify-between cursor-pointer hover:border-red-600 transition-colors shadow-sm group"
          >
              <div>
                  <h4 className="text-gray-500 font-bold uppercase text-xs tracking-wider mb-1 group-hover:text-red-600">Scaduti senza Feedback</h4>
                  <p className="text-gray-400 text-xs">Richiedono attenzione</p>
              </div>
              <div className="flex items-center gap-4">
                  <span className="text-3xl font-bold text-gray-900">{expiredNoFeedbackReminders.length}</span>
                  <div className="bg-red-50 p-3 rounded-full text-red-600 group-hover:bg-red-600 group-hover:text-white transition-colors">
                      <AlertCircle size={24} />
                  </div>
              </div>
          </div>
      </div>

      {/* GRAFICI */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="bg-white p-6 shadow-sm border border-gray-200 lg:col-span-2">
          <h3 className="text-lg font-bold text-gray-800 mb-6 uppercase tracking-wide">Volume d'Affari Mensile (€)</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 11, fontWeight: 'bold'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 11}} tickFormatter={(val) => `${val/1000}k`} />
                <Tooltip 
                  cursor={{fill: '#f3f4f6'}}
                  contentStyle={{backgroundColor: '#171717', color: '#fff', borderRadius: '0', border: 'none'}}
                  formatter={(value: number) => [`€ ${value.toLocaleString()}`, 'Valore']}
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
    </div>
  );
};