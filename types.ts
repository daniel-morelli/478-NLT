
export enum DealStatus {
  IN_CORSO = 'In Corso',
  CHIUSA = 'Chiusa',
  FALLITA = 'Fallita'
}

export enum CreditStatus {
  IN_ATTESA = 'In Attesa',
  BOCCIATO = 'Bocciato',
  APPROVATO = 'Approvato',
  APPROVATO_CON_CONDIZIONI = 'Approvato con Condizioni'
}

export enum OrderStatus {
  NON_INVIATO = 'Non Inviato',
  INVIATO = 'Inviato',
  ANNULLATO = 'Annullato'
}

export interface Agent {
  id: string;
  password: string;
  nome: string;
  email: string;
  cell: string;
  isAgent: boolean;
  isAdmin: boolean;
  isTeamLeader: boolean; // Nuovo ruolo
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
  
  valoreListinoTrattativa: number;
  mesePrevistoChiusura: string;
  valoreListinoAffidamento: number;

  statoTrattativa: DealStatus;
  annotazioniTrattativa: string;

  dataAffidamento?: string;
  valoreProvvigioneAffidamento?: number; // Nuova Provvigione Affidamento
  statoAffidamento: CreditStatus | '';
  annotazioniAffidamento: string;
  numeroVeicoliAffidamento: number;

  dataOrdine?: string;
  numeroVeicoliOrdinati?: number;
  valoreProvvigioneTotale?: number;
  valoreListinoOrdinato: number;
  statoOrdine: OrderStatus | '';
  annotazioneOrdine: string;

  deletedAt?: string;
}

export interface Reminder {
  id: string;
  practiceId: string;
  createdAt: string;
  expirationDate: string;
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
