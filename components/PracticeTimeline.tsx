
import React from 'react';
import { Practice, Reminder, DealStatus, CreditStatus, OrderStatus } from '../types';
import { Calendar, CheckCircle2, AlertCircle, Clock, FileText, ShoppingCart, ShieldCheck, Milestone } from 'lucide-react';

interface TimelineEvent {
  date: Date;
  title: string;
  description: string;
  type: 'status' | 'reminder' | 'milestone';
  icon: React.ReactNode;
  color: string;
  value?: string;
}

interface Props {
  practice: Partial<Practice>;
  reminders: Reminder[];
}

export const PracticeTimeline: React.FC<Props> = ({ practice, reminders }) => {
  const events: TimelineEvent[] = [];

  // 1. Creazione Pratica
  if (practice.data) {
    events.push({
      date: new Date(practice.data),
      title: 'Apertura Pratica',
      description: `Cliente: ${practice.cliente || 'N/D'} - Provider: ${practice.provider || 'N/D'}`,
      type: 'milestone',
      icon: <FileText size={16} />,
      color: 'bg-black',
      value: practice.valoreListinoTrattativa ? `€ ${practice.valoreListinoTrattativa.toLocaleString('it-IT')}` : undefined
    });
  }

  // 2. Affidamento
  if (practice.dataAffidamento) {
    events.push({
      date: new Date(practice.dataAffidamento),
      title: 'Fase Affidamento',
      description: `Esito: ${practice.statoAffidamento || 'In Attesa'}`,
      type: 'status',
      icon: <ShieldCheck size={16} />,
      color: practice.statoAffidamento === CreditStatus.APPROVATO ? 'bg-green-600' : 'bg-amber-500',
      value: practice.valoreProvvigioneAffidamento ? `Provv: € ${practice.valoreProvvigioneAffidamento.toLocaleString('it-IT')}` : undefined
    });
  }

  // 3. Ordine
  if (practice.dataOrdine) {
    events.push({
      date: new Date(practice.dataOrdine),
      title: 'Ordine Eseguito',
      description: `Stato: ${practice.statoOrdine || 'Inviato'}`,
      type: 'status',
      icon: <ShoppingCart size={16} />,
      color: practice.statoOrdine === OrderStatus.INVIATO ? 'bg-red-600' : 'bg-gray-400',
      value: practice.valoreProvvigioneTotale ? `Tot: € ${practice.valoreProvvigioneTotale.toLocaleString('it-IT')}` : undefined
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
            {/* Icona/Nodo - Ora Circolare */}
            <div className={`absolute -left-8 top-1 w-6 h-6 rounded-full flex items-center justify-center text-white shadow-lg ${event.color} z-10 border-2 border-white`}>
              {event.icon}
            </div>

            {/* Contenuto Card - Ora con angoli arrotondati */}
            <div className="bg-white border border-gray-100 p-4 shadow-sm hover:shadow-md transition-all group rounded-2xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-1">
                <span className="text-[10px] font-black text-red-600 uppercase tracking-[0.2em] flex items-center gap-1">
                  <Calendar size={12} /> {event.date.toLocaleDateString('it-IT')} {event.date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                </span>
                {event.value && (
                  <span className="bg-black text-white px-3 py-1 text-[10px] font-black uppercase tracking-tighter shadow-sm rounded-full">
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
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
