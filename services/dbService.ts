import { Agent, Practice, Provider } from '../types';
import { supabase } from './firebaseConfig';

// --- MAPPERS ---
// Converte da DB (snake_case) a App (camelCase)
const fromDbAgent = (dbAgent: any): Agent => ({
  id: dbAgent.id,
  pin: dbAgent.pin,
  nome: dbAgent.nome,
  email: dbAgent.email,
  cell: dbAgent.cell,
  isAgent: dbAgent.is_agent,
  isAdmin: dbAgent.is_admin,
  isActive: dbAgent.is_active
});

// Converte da App a DB
const toDbAgent = (agent: Partial<Agent>) => ({
  pin: agent.pin,
  nome: agent.nome,
  email: agent.email,
  cell: agent.cell,
  is_agent: agent.isAgent,
  is_admin: agent.isAdmin,
  is_active: agent.isActive
});

const fromDbPractice = (p: any): Practice => ({
  id: p.id,
  agentId: p.agent_id,
  agentName: p.agentName, // Campo aggiunto manualmente nel join
  data: p.data,
  cliente: p.cliente,
  provider: p.provider,
  numeroVeicoli: p.numero_veicoli ?? 0,
  valoreTotale: p.valore_totale ?? 0,
  statoTrattativa: p.stato_trattativa,
  annotazioniTrattativa: p.annotazioni_trattativa ?? '',
  dataAffidamento: p.data_affidamento,
  statoAffidamento: p.stato_affidamento ?? '', // Default a stringa vuota se null
  annotazioniAffidamento: p.annotazioni_affidamento ?? '',
  dataOrdine: p.data_ordine,
  numeroVeicoliOrdinati: p.numero_veicoli_ordinati ?? 0,
  valoreProvvigioneTotale: p.valore_provvigione_totale ?? 0,
  statoOrdine: p.stato_ordine ?? '', // Default a stringa vuota se null
  annotazioneOrdine: p.annotazione_ordine ?? ''
});

const toDbPractice = (p: Partial<Practice>) => {
  const data: any = {
    agent_id: p.agentId,
    data: p.data,
    cliente: p.cliente,
    provider: p.provider,
    numero_veicoli: p.numeroVeicoli,
    valore_totale: p.valoreTotale,
    stato_trattativa: p.statoTrattativa,
    annotazioni_trattativa: p.annotazioniTrattativa,
    data_affidamento: p.dataAffidamento,
    stato_affidamento: p.statoAffidamento || null, // Salva null se stringa vuota
    annotazioni_affidamento: p.annotazioniAffidamento,
    data_ordine: p.dataOrdine,
    numero_veicoli_ordinati: p.numeroVeicoliOrdinati,
    valore_provvigione_totale: p.valoreProvvigioneTotale,
    stato_ordine: p.statoOrdine || null, // Salva null se stringa vuota
    annotazione_ordine: p.annotazioneOrdine
  };
  // Rimuove chiavi undefined (ma mantiene null)
  Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);
  return data;
};

const fromDbProvider = (p: any): Provider => ({
    id: p.id,
    name: p.name,
    isActive: p.is_active ?? true // Default true se manca colonna
});

export const DbService = {
  // --- PROVIDERS ---
  getAllProviders: async (onlyActive = false): Promise<Provider[]> => {
    if (!supabase) return [];
    
    let query = supabase.from('providers').select('*').order('name');
    
    if (onlyActive) {
        query = query.eq('is_active', true);
    }
    
    const { data, error } = await query;
    if (error) {
        console.error("Errore recupero providers:", error);
        return [];
    }
    return data.map(fromDbProvider);
  },

  saveProvider: async (provider: Partial<Provider>): Promise<void> => {
    if (!supabase) return;
    
    const dbData = {
        name: provider.name,
        is_active: provider.isActive
    };

    if (provider.id) {
        await supabase.from('providers').update(dbData).eq('id', provider.id);
    } else {
        await supabase.from('providers').insert([dbData]);
    }
  },

  // --- AGENTS ---
  getAgentByPin: async (pin: string): Promise<Agent | null> => {
    if (!supabase) return null;
    
    // Cerchiamo il PIN maiuscolo per compatibilità
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('pin', pin)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      console.error("Errore login:", error);
      return null;
    }
    
    // Auto-fix: se l'utente '0000' non esiste, lo creiamo al volo (per primo accesso)
    if (!data && pin === '0000') {
        const adminData = {
            pin: '0000',
            nome: 'Amministratore',
            email: 'admin@478nlt.it',
            is_admin: true,
            is_agent: true,
            is_active: true
        };
        const { data: newData, error: newError } = await supabase.from('agents').insert([adminData]).select().single();
        if (newData) return fromDbAgent(newData);
    }

    return data ? fromDbAgent(data) : null;
  },

  getAllAgents: async (): Promise<Agent[]> => {
    if (!supabase) return [];
    const { data, error } = await supabase.from('agents').select('*');
    if (error) {
      console.error(error);
      return [];
    }
    return data.map(fromDbAgent);
  },

  saveAgent: async (agent: Partial<Agent>): Promise<void> => {
    if (!supabase) return;
    const dbData = toDbAgent(agent);
    
    if (agent.id) {
       await supabase.from('agents').update(dbData).eq('id', agent.id);
    } else {
       await supabase.from('agents').insert([dbData]);
    }
  },

  // --- PRACTICES ---
  getPractices: async (user: Agent): Promise<Practice[]> => {
    if (!supabase) return [];
    
    // 1. Scarica le pratiche
    let query = supabase.from('practices').select('*');
    
    // LOGICA FILTRO:
    // - Se Admin: Vede tutto
    // - Se NON è agente (es. Supervisore): Vede tutto
    // - Se è Agente E non Admin: Vede solo le sue
    const canSeeAll = user.isAdmin || !user.isAgent;

    if (!canSeeAll) {
      query = query.eq('agent_id', user.id);
    }

    const { data: practicesData, error } = await query;
    if (error) {
      console.error(error);
      return [];
    }

    if (!practicesData) return [];

    let resultPractices = practicesData;

    // 2. Se l'utente può vedere tutto, facciamo il "join" manuale con gli agenti per avere i nomi
    if (canSeeAll && resultPractices.length > 0) {
        const { data: agentsData } = await supabase.from('agents').select('id, nome');
        
        if (agentsData) {
            // Crea una mappa id -> nome per velocità
            const agentsMap = new Map(agentsData.map(a => [a.id, a.nome]));
            
            // Arricchisci le pratiche col nome
            resultPractices = resultPractices.map(p => ({
                ...p,
                agentName: agentsMap.get(p.agent_id) || '-'
            }));
        }
    }

    // Safe mapping per evitare errori su campi nulli
    return resultPractices.map(fromDbPractice);
  },

  savePractice: async (practice: Partial<Practice>): Promise<void> => {
    if (!supabase) return;
    const dbData = toDbPractice(practice);
    
    if (practice.id) {
      const { error } = await supabase.from('practices').update(dbData).eq('id', practice.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('practices').insert([dbData]);
      if (error) throw error;
    }
  },

  initializeDefaults: async (): Promise<void> => {
    // Placeholder kept for compatibility
  }
};