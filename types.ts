
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

export enum PracticeType {
  ORDINE = 'Ordine',
  PROROGA = 'Proroga'
}

export interface Agent {
  id: string;
  password: string;
  nome: string;
  email: string;
  cell: string;
  isAgent: boolean;
  isAdmin: boolean;
  isTeamLeader: boolean;
  isActive: boolean;
}

export interface Provider {
  id: string;
  name: string;
  isActive: boolean;
}

export interface Customer {
  id: string;
  nome: string;
  email: string;
  cell: string;
  agentId: string;
  createdAt: string;
}

export interface VehicleCredit {
  id: string;
  marca: string;
  modello: string;
  valoreListino: number;
  provvigione: number;
}

export interface VehicleOrder extends VehicleCredit {
  durataMesi: number;
  km: number;
  anticipo: number;
  dataConsegna: string;
}

export interface Practice {
  id: string;
  agentId: string;
  agentName?: string;
  customerId: string;
  customerData?: Customer;
  data: string;
  cliente?: string;
  provider: string;
  tipoTrattativa: PracticeType;
  numeroVeicoli: number;
  valoreTotale: number;
  
  valoreListinoTrattativa: number;
  mesePrevistoChiusura: string;

  statoTrattativa: DealStatus;
  annotazioniTrattativa: string;

  dataAffidamento?: string;
  statoAffidamento: CreditStatus | '';
  annotazioniAffidamento: string;
  veicoliAffidamento: VehicleCredit[];

  dataOrdine?: string;
  statoOrdine: OrderStatus | '';
  annotazioneOrdine: string;
  veicoliOrdine: VehicleOrder[];
  validoRappel?: 'SI' | 'NO' | '';
  isLocked?: boolean;

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
