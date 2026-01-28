
import React from 'react';
import { Practice, Reminder, DealStatus, CreditStatus, OrderStatus } from '../types';
import { Calendar, CheckCircle2, AlertCircle, Clock, FileText, ShoppingCart, ShieldCheck, Milestone, Car, Euro } from 'lucide-react';

interface TimelineEvent {
  date: Date;
  title: string;
  description: string;
  details?: React.ReactNode;
  type: 'status' | 'reminder' | 'milestone';
  icon: React.ReactNode;
  color: string;
  value?: string;
}

interface Props {
  practice: Partial<Practice>;
  reminders: Reminder[];
}

const formatCurrency = (val: number | undefined) => {
  if (val === undefined || val === null) return '€ 0,00';
  return '€ ' + new Intl.NumberFormat('it-IT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);
};

export const PracticeTimeline: React.FC<Props> = ({ practice, reminders }) => {
  const events: TimelineEvent[] = [];

  const DetailRow = ({ label, value, icon: Icon }: { label: string, value: string | number, icon: any }) => (
    <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-tight">
      <Icon size={12} className="text-gray-400" />
      <span>{label}:</span>
      <span className="text-gray-900">{value}</span>
    </div>
  );

  // 1. Apertura Pratica (Trattativa)
  if (practice.data) {
    events.push({
      date: new Date(practice.data),
      title: 'Apertura Pratica',
      description: `Cliente: ${practice.cliente || 'N/D'} • Provider: ${practice.provider || 'N/D'}`,
      details: (
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 pt-2 border-t border-gray-50">
          <DetailRow icon={Car} label="Veicoli" value={practice.numeroVeicoli || 0} />
          <DetailRow icon={Euro} label="Listino" value={formatCurrency(practice.valoreListinoTrattativa)} />
          <DetailRow icon={Euro} label="Provv. Stima" value={formatCurrency(practice.valoreTotale)} />
        </div>
      ),
      type: 'milestone',
      icon: <FileText size={16} />,
      color: 'bg-black'
    });
  }

  // 2. Affidamento
  if (practice.dataAffidamento) {
    events.push({
      date: new Date(practice.dataAffidamento),
      title: 'Fase Affidamento',
      description: `Esito: ${practice.statoAffidamento || 'In Attesa'}`,
      details: (
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 pt-2 border-t border-gray-50">
          <DetailRow icon={Car} label="Veicoli" value={practice.numeroVeicoliAffidamento || 0} />
          <DetailRow icon={Euro} label="Listino" value={formatCurrency(practice.valoreListinoAffidamento)} />
          <DetailRow icon={Euro} label="Provvigione" value={formatCurrency(practice.valoreProvvigioneAffidamento)} />
        </div>
      ),
      type: 'status',
      icon: <ShieldCheck size={16} />,
      color: practice.statoAffidamento === CreditStatus.APPROVATO || practice.statoAffidamento === CreditStatus.APPROVATO_CON_CONDIZIONI ? 'bg-green-600' : 'bg-amber-500'
    });
  }

  // 3. Ordine
  if (practice.dataOrdine) {
    events.push({
      date: new Date(practice.dataOrdine),
      title: 'Ordine Eseguito',
      description: `Stato: ${practice.statoOrdine || 'Inviato'}`,
      details: (
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 pt-2 border-t border-gray-50">
          <DetailRow icon={Car} label="Veicoli" value={practice.numeroVeicoliOrdinati || 0} />
          <DetailRow icon={Euro} label="Listino" value={formatCurrency(practice.valoreListinoOrdinato)} />
          <DetailRow icon={Euro} label="Provv. Finale" value={formatCurrency(practice.valoreProvvigioneTotale)} />
        </div>
      ),
      type: 'status',
      icon: <ShoppingCart size={16} />,
      color: practice.statoOrdine === OrderStatus.INVIATO ? 'bg-red-600' : 'bg-gray-400'
    });
  }

  // 4. Promemoria
  reminders.forEach(r => {
    if (r.status === 'eliminato') return;
    const isClosed = r.status === 'chiuso';
    const isExpired = !isClosed && new Date(r.expirationDate) < new Date();

    events.push({
      date: new Date(r.expirationDate),
      title: isClosed ? 'Promemoria Gestito' : 'Promemoria Programmato',
      description: r.description,
      type: 'reminder',
      icon: isClosed ? <CheckCircle2 size={16} /> : (isExpired ? <AlertCircle size={16} /> : <Clock size={16} />),
      color: isClosed ? 'bg-green-500' : (isExpired ? 'bg-red-600 animate-pulse' : 'bg-blue-500')
    });
  });

  // Ordina cronologicamente
  const sortedEvents = events.sort((a, b) => a.date.getTime() - b.date.getTime());

  if (sortedEvents.length === 0) return null;

  return (
    <div className="mt-12 bg-white/50 p-6 rounded-2xl border border-gray-100">
      <h3 className="text-lg font-black text-gray-900 uppercase tracking-widest border-b-2 border-red-600 pb-2 mb-8 w-fit flex items-center gap-2">
        <Milestone className="text-red-600" /> Storia della Pratica
      </h3>

      <div className="relative pl-8 space-y-8 before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
        {sortedEvents.map((event, idx) => (
          <div key={idx} className="relative">
            {/* Icona/Nodo */}
            <div className={`absolute -left-8 top-1 w-6 h-6 rounded-full flex items-center justify-center text-white shadow-lg ${event.color} z-10 border-2 border-white`}>
              {event.icon}
            </div>

            {/* Contenuto Card */}
            <div className="bg-white border border-gray-100 p-4 shadow-sm hover:shadow-md transition-all group rounded-2xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-1">
                <span className="text-[10px] font-black text-red-600 uppercase tracking-[0.2em] flex items-center gap-1">
                  <Calendar size={12} /> {event.date.toLocaleDateString('it-IT')} {event.date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                </span>
                {event.value && (
                  <span className="bg-black text-white px-3 py-1 text-[9px] font-black uppercase tracking-tighter shadow-sm rounded-full">
                    {event.value}
                  </span>
                )}
              </div>
              <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight group-hover:text-red-600 transition-colors">
                {event.title}
              </h4>
              <p className="text-xs text-gray-500 font-medium leading-relaxed mt-1">
                {event.description}
              </p>
              {event.details}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
