import { Agent, Practice, Provider, Reminder } from '../types';
import { supabase } from './firebaseConfig';

// --- MAPPERS ---
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
  agentName: p.agentName,
  data: p.data,
  cliente: p.cliente,
  provider: p.provider,
  numeroVeicoli: p.numero_veicoli ?? 0,
  valoreTotale: p.valore_totale ?? 0,
  statoTrattativa: p.stato_trattativa,
  annotazioniTrattativa: p.annotazioni_trattativa ?? '',
  dataAffidamento: p.data_affidamento,
  statoAffidamento: p.stato_affidamento ?? '',
  annotazioniAffidamento: p.annotazioni_affidamento ?? '',
  dataOrdine: p.data_ordine,
  numeroVeicoliOrdinati: p.numero_veicoli_ordinati ?? 0,
  valoreProvvigioneTotale: p.valore_provvigione_totale ?? 0,
  statoOrdine: p.stato_ordine ?? '',
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
    stato_affidamento: p.statoAffidamento || null,
    annotazioni_affidamento: p.annotazioniAffidamento,
    data_ordine: p.dataOrdine,
    numero_veicoli_ordinati: p.numeroVeicoliOrdinati,
    valore_provvigione_totale: p.valoreProvvigioneTotale,
    stato_ordine: p.statoOrdine || null,
    annotazione_ordine: p.annotazioneOrdine
  };
  Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);
  return data;
};

const fromDbProvider = (p: any): Provider => ({
    id: p.id,
    name: p.name,
    isActive: p.is_active ?? true
});

const fromDbReminder = (r: any): Reminder => ({
    id: r.id,
    practiceId: r.practice_id,
    createdAt: r.created_at,
    expirationDate: r.expiration_date,
    description: r.description,
    status: r.status,
    feedback: r.feedback
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
    
    let query = supabase.from('practices').select('*');
    
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

    if (canSeeAll && resultPractices.length > 0) {
        const { data: agentsData } = await supabase.from('agents').select('id, nome');
        
        if (agentsData) {
            const agentsMap = new Map(agentsData.map(a => [a.id, a.nome]));
            resultPractices = resultPractices.map(p => ({
                ...p,
                agentName: agentsMap.get(p.agent_id) || '-'
            }));
        }
    }

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

  // --- REMINDERS ---
  getReminders: async (practiceId: string): Promise<Reminder[]> => {
      if (!supabase) return [];
      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .eq('practice_id', practiceId)
        .order('expiration_date', { ascending: true });
      
      if (error) {
          console.error("Errore reminders:", error);
          return [];
      }
      return data.map(fromDbReminder);
  },

  // Metodo per ottenere i reminders di più pratiche contemporaneamente (per la dashboard)
  getRemindersForPractices: async (practiceIds: string[]): Promise<Reminder[]> => {
      if (!supabase || practiceIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .in('practice_id', practiceIds)
        .neq('status', 'eliminato'); // Non ci interessano quelli eliminati per la dashboard
      
      if (error) {
          console.error("Errore bulk reminders:", error);
          return [];
      }
      return data.map(fromDbReminder);
  },

  saveReminder: async (reminder: Partial<Reminder>): Promise<void> => {
      if (!supabase) return;
      
      const dbData = {
          practice_id: reminder.practiceId,
          expiration_date: reminder.expirationDate,
          description: reminder.description,
          status: reminder.status,
          feedback: reminder.feedback
      };

      let error;
      if (reminder.id) {
          ({ error } = await supabase.from('reminders').update(dbData).eq('id', reminder.id));
      } else {
          ({ error } = await supabase.from('reminders').insert([dbData]));
      }

      if (error) throw error;
  },

  deleteReminder: async (id: string): Promise<void> => {
      if (!supabase) return;
      // Soft delete: invece di cancellare, impostiamo lo stato a 'eliminato'
      const { error } = await supabase.from('reminders').update({ status: 'eliminato' }).eq('id', id);
      if (error) throw error;
  },

  initializeDefaults: async (): Promise<void> => {
    // Placeholder kept for compatibility
  }
};