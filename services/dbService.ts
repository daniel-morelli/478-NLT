
import { Agent, Practice, Provider, Reminder, Customer, PracticeType } from '../types';
import { supabase } from './firebaseConfig';

// --- MAPPERS ---
const fromDbAgent = (dbAgent: any): Agent => ({
  id: dbAgent.id,
  password: dbAgent.pin,
  nome: dbAgent.nome,
  email: dbAgent.email,
  cell: dbAgent.cell,
  isAgent: dbAgent.is_agent,
  isAdmin: dbAgent.is_admin,
  isTeamLeader: dbAgent.is_team_leader ?? false,
  isActive: dbAgent.is_active
});

const toDbAgent = (agent: Partial<Agent>) => ({
  pin: agent.password,
  nome: agent.nome,
  email: agent.email,
  cell: agent.cell,
  is_agent: agent.isAgent,
  is_admin: agent.isAdmin,
  is_team_leader: agent.isTeamLeader,
  is_active: agent.isActive
});

const fromDbCustomer = (c: any): Customer => ({
  id: c.id,
  nome: c.nome,
  email: c.email,
  cell: c.cell,
  agentId: c.agent_id,
  createdAt: c.created_at
});

const fromDbPractice = (p: any): Practice => ({
  id: p.id,
  agentId: p.agent_id,
  agentName: p.agentName,
  customerId: p.customer_id,
  data: p.data,
  provider: p.provider,
  tipoTrattativa: p.tipo_trattativa || PracticeType.ORDINE,
  numeroVeicoli: p.numero_veicoli ?? 0,
  valoreTotale: p.valore_totale ?? 0,
  valoreListinoTrattativa: p.valore_listino_trattativa ?? 0,
  mesePrevistoChiusura: p.mese_previsto_chiusura ?? '',
  valoreListinoAffidamento: p.valore_listino_affidamento ?? 0,
  valoreProvvigioneAffidamento: p.valore_provvigione_affidamento ?? 0, 
  numeroVeicoliAffidamento: p.numero_veicoli_affidamento ?? 0,
  veicoliAffidamento: p.veicoli_affidamento || [],
  valoreListinoOrdinato: p.valore_listino_ordinato ?? 0,
  statoTrattativa: p.stato_trattativa,
  annotazioniTrattativa: p.annotazioni_trattativa ?? '',
  dataAffidamento: p.data_affidamento,
  statoAffidamento: p.stato_affidamento ?? '',
  annotazioniAffidamento: p.annotazioni_affidamento ?? '',
  dataOrdine: p.data_ordine,
  numeroVeicoliOrdinati: p.numero_veicoli_ordinati ?? 0,
  valoreProvvigioneTotale: p.valore_provvigione_totale ?? 0,
  veicoliOrdine: p.veicoli_ordine || [],
  statoOrdine: p.stato_ordine ?? '',
  annotazioneOrdine: p.annotazione_ordine ?? '',
  validoRappel: p.valido_rappel ?? '',
  isLocked: p.is_locked ?? false,
  deletedAt: p.deleted_at
});

const toDbPractice = (p: Partial<Practice>) => {
  const data: any = {
    agent_id: p.agentId,
    customer_id: p.customerId,
    data: p.data,
    provider: p.provider,
    tipo_trattativa: p.tipoTrattativa,
    numero_veicoli: p.numeroVeicoli,
    valore_totale: p.valoreTotale,
    valore_listino_trattativa: p.valoreListinoTrattativa,
    mese_previsto_chiusura: p.mesePrevistoChiusura,
    valore_listino_affidamento: p.valoreListinoAffidamento,
    valore_provvigione_affidamento: p.valoreProvvigioneAffidamento,
    numero_veicoli_affidamento: p.numeroVeicoliAffidamento,
    veicoli_affidamento: p.veicoliAffidamento,
    valore_listino_ordinato: p.valoreListinoOrdinato,
    stato_trattativa: p.statoTrattativa,
    annotazioni_trattativa: p.annotazioniTrattativa ?? '',
    data_affidamento: p.dataAffidamento,
    stato_affidamento: p.statoAffidamento || null,
    annotazioni_affidamento: p.annotazioniAffidamento ?? '',
    data_ordine: p.dataOrdine,
    numero_veicoli_ordinati: p.numeroVeicoliOrdinati,
    valore_provvigione_totale: p.valoreProvvigioneTotale,
    veicoli_ordine: p.veicoliOrdine,
    stato_ordine: p.statoOrdine || null,
    annotazione_ordine: p.annotazioneOrdine ?? '',
    valido_rappel: p.validoRappel || null,
    is_locked: p.isLocked ?? false,
    deleted_at: p.deletedAt
  };
  Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);
  return data;
};

export const DbService = {
  // --- CUSTOMERS ---
  getCustomers: async (user: Agent, targetAgentId?: string): Promise<Customer[]> => {
    if (!supabase) return [];
    let query = supabase.from('nlt_customers').select('*').order('nome');
    
    if (targetAgentId) {
        query = query.eq('agent_id', targetAgentId);
    } else {
        const isPowerUser = user.isAdmin || user.isTeamLeader;
        if (!isPowerUser) {
            query = query.eq('agent_id', user.id);
        }
    }

    const { data, error } = await query;
    if (error) return [];
    return (data || []).map(fromDbCustomer);
  },

  saveCustomer: async (customer: Partial<Customer>): Promise<Customer> => {
    if (!supabase) throw new Error("Database non inizializzato");
    const dbData = { nome: customer.nome, email: customer.email, cell: customer.cell, agent_id: customer.agentId };
    if (customer.id) {
        const { data, error } = await supabase.from('nlt_customers').update(dbData).eq('id', customer.id).select().single();
        if (error) throw error;
        return fromDbCustomer(data);
    } else {
        const { data, error } = await supabase.from('nlt_customers').insert([dbData]).select().single();
        if (error) throw error;
        return fromDbCustomer(data);
    }
  },

  // --- AGENTS ---
  validateLogin: async (email: string, pin: string): Promise<Agent | null> => {
    if (!supabase) return null;
    const { data, error } = await supabase.from('nlt_agents').select('*').ilike('email', email.trim()).eq('pin', pin.trim()).eq('is_active', true).maybeSingle();
    return data ? fromDbAgent(data) : null;
  },

  getAgentProfile: async (userId: string): Promise<Agent | null> => {
    if (!supabase) return null;
    const { data, error } = await supabase.from('nlt_agents').select('*').eq('id', userId).maybeSingle();
    return data ? fromDbAgent(data) : null;
  },

  isEmailAuthorized: async (email: string): Promise<boolean> => {
    if (!supabase) return false;
    const { data } = await supabase.from('nlt_agents').select('email').ilike('email', email.trim()).maybeSingle();
    return !!data;
  },

  updatePasswordByEmail: async (email: string, newPin: string): Promise<void> => {
      if (!supabase) return;
      await supabase.from('nlt_agents').update({ pin: newPin }).ilike('email', email.trim());
  },

  updatePassword: async (agentId: string, newPassword: string): Promise<void> => {
    if (!supabase) return;
    await supabase.from('nlt_agents').update({ pin: newPassword }).eq('id', agentId);
  },

  getAllAgents: async (onlyActive = false): Promise<Agent[]> => {
    if (!supabase) return [];
    let query = supabase.from('nlt_agents').select('*').order('nome');
    if (onlyActive) query = query.eq('is_active', true);
    const { data } = await query;
    return (data || []).map(fromDbAgent);
  },

  saveAgent: async (agent: Partial<Agent>): Promise<void> => {
    if (!supabase) return;
    const dbData = toDbAgent(agent);
    if (agent.id) await supabase.from('nlt_agents').update(dbData).eq('id', agent.id);
    else await supabase.from('nlt_agents').insert([dbData]);
  },

  deleteAgent: async (agentId: string): Promise<void> => {
    if (!supabase) return;
    await supabase.from('nlt_agents').delete().eq('id', agentId);
  },

  getAllProviders: async (onlyActive = false): Promise<Provider[]> => {
    if (!supabase) return [];
    let query = supabase.from('nlt_providers').select('*').order('name');
    if (onlyActive) query = query.eq('is_active', true);
    const { data } = await query;
    return (data || []).map(p => ({ id: p.id, name: p.name, isActive: p.is_active ?? true }));
  },

  saveProvider: async (provider: Partial<Provider>): Promise<void> => {
    if (!supabase) return;
    const dbData = { name: provider.name, is_active: provider.isActive };
    if (provider.id) await supabase.from('nlt_providers').update(dbData).eq('id', provider.id);
    else await supabase.from('nlt_providers').insert([dbData]);
  },

  // --- PRACTICES ---
  getPractices: async (user: Agent): Promise<Practice[]> => {
    if (!supabase) return [];
    let query = supabase.from('nlt_practices').select('*, nlt_customers(*)').is('deleted_at', null).order('data', { ascending: false });
    const isPowerUser = user.isAdmin || user.isTeamLeader;
    if (!isPowerUser) query = query.eq('agent_id', user.id);

    const { data: practicesData, error } = await query;
    if (error) return [];

    let resultPractices = (practicesData || []).map(p => {
        const practice = fromDbPractice(p);
        if (p.nlt_customers) {
            practice.customerData = fromDbCustomer(p.nlt_customers);
            practice.cliente = practice.customerData.nome;
        }
        return practice;
    });
    
    if (isPowerUser) {
        const { data: agentsData } = await supabase.from('nlt_agents').select('id, nome');
        if (agentsData) {
            const agentsMap = new Map(agentsData.map(a => [a.id, a.nome]));
            resultPractices = resultPractices.map(p => ({ ...p, agentName: agentsMap.get(p.agentId) || '-' }));
        }
    }
    return resultPractices;
  },

  savePractice: async (practice: Partial<Practice>): Promise<void> => {
    if (!supabase) return;
    const dbData = toDbPractice(practice);
    if (practice.id) await supabase.from('nlt_practices').update(dbData).eq('id', practice.id);
    else await supabase.from('nlt_practices').insert([dbData]);
  },

  deletePractice: async (id: string): Promise<void> => {
    if (!supabase) return;
    await supabase.from('nlt_practices').update({ deleted_at: new Date().toISOString() }).eq('id', id);
  },

  // --- REMINDERS ---
  getReminders: async (practiceId: string): Promise<Reminder[]> => {
      if (!supabase) return [];
      const { data } = await supabase.from('nlt_reminders').select('*').eq('practice_id', practiceId).order('expiration_date');
      return (data || []).map(r => ({
          id: r.id, practiceId: r.practice_id, createdAt: r.created_at, expirationDate: r.expiration_date, description: r.description, status: r.status, feedback: r.feedback
      }));
  },

  getRemindersForPractices: async (practiceIds: string[]): Promise<Reminder[]> => {
      if (!supabase || practiceIds.length === 0) return [];
      const { data } = await supabase.from('nlt_reminders').select('*').in('practice_id', practiceIds).neq('status', 'eliminato');
      return (data || []).map(r => ({
          id: r.id, practiceId: r.practice_id, createdAt: r.created_at, expirationDate: r.expiration_date, description: r.description, status: r.status, feedback: r.feedback
      }));
  },

  saveReminder: async (reminder: Partial<Reminder>): Promise<void> => {
      if (!supabase) return;
      const dbData = { practice_id: reminder.practiceId, expiration_date: reminder.expirationDate, description: reminder.description, status: reminder.status, feedback: reminder.feedback };
      if (reminder.id) await supabase.from('nlt_reminders').update(dbData).eq('id', reminder.id);
      else await supabase.from('nlt_reminders').insert([dbData]);
  },

  deleteReminder: async (id: string): Promise<void> => {
      if (!supabase) return;
      await supabase.from('nlt_reminders').update({ status: 'eliminato' }).eq('id', id);
  }
};
