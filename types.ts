export enum DealStatus {
  IN_CORSO = 'In Corso',
  CHIUSA = 'Chiusa',
  FALLITA = 'Fallita'
}

export enum CreditStatus {
  IN_ATTESA = 'In Attesa',
  BOCCIATO = 'Bocciato',
  ESITATO = 'Esitato',
  ESITATO_CON_CONDIZIONI = 'Esitato con Condizioni'
}

export enum OrderStatus {
  NON_INVIATO = 'Non Inviato',
  INVIATO = 'Inviato',
  FALLITO = 'Fallito'
}

export interface Agent {
  id: string;
  pin: string;
  nome: string;
  email: string;
  cell: string;
  isAgent: boolean;
  isAdmin: boolean;
  isActive: boolean;
}

export interface Provider {
  id: string;
  name: string;
  isActive: boolean;
}

export interface Practice {
  id: string;
  agentId: string;
  agentName?: string;
  data: string;
  cliente: string;
  provider: string;
  numeroVeicoli: number;
  valoreTotale: number;
  
  // Trattativa
  statoTrattativa: DealStatus;
  annotazioniTrattativa: string;

  // Affidamento
  dataAffidamento?: string;
  statoAffidamento: CreditStatus | '';
  annotazioniAffidamento: string;

  // Ordine
  dataOrdine?: string;
  numeroVeicoliOrdinati?: number;
  valoreProvvigioneTotale?: number;
  statoOrdine: OrderStatus | '';
  annotazioneOrdine: string;
}

export interface Reminder {
  id: string;
  practiceId: string;
  createdAt: string;
  expirationDate: string; // ISO string for datetime-local
  description: string;
  status: 'aperto' | 'chiuso' | 'eliminato';
  feedback?: string;
}

export type KPI = {
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
  color?: string;
};