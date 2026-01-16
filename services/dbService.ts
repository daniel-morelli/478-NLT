
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
  
  // Nuovi campi
  valoreListinoTrattativa: p.valore_listino_trattativa ?? 0,
  mesePrevistoChiusura: p.mese_previsto_chiusura ?? '',
  valoreListinoAffidamento: p.valore_listino_affidamento ?? 0,
  numeroVeicoliAffidamento: p.numero_veicoli_affidamento ?? 0,
  valoreListinoOrdinato: p.valore_listino_ordinato ?? 0,

  statoTrattativa: p.stato_trattativa,
  annotazioniTrattativa: p.annotazioni_trattativa ?? '',
  dataAffidamento: p.data_affidamento,
  statoAffidamento: p.stato_affidamento ?? '',
  annotazioniAffidamento: p.annotazioni_affidamento ?? '',
  dataOrdine: p.data_ordine,
  numeroVeicoliOrdinati: p.numero_veicoli_ordinati ?? 0,
  valoreProvvigioneTotale: p.valore_provvigione_totale ?? 0,
  statoOrdine: p.stato_ordine ?? '',
  annotazioneOrdine: p.annotazione_ordine ?? '',
  deletedAt: p.deleted_at
});

const toDbPractice = (p: Partial<Practice>) => {
  const data: any = {
    agent_id: p.agentId,
    data: p.data,
    cliente: p.cliente,
    provider: p.provider,
    numero_veicoli: p.numeroVeicoli,
    valore_totale: p.valoreTotale,
    
    // Nuovi campi
    valore_listino_trattativa: p.valoreListinoTrattativa,
    mese_previsto_chiusura: p.mesePrevistoChiusura,
    valore_listino_affidamento: p.valoreListinoAffidamento,
    numero_veicoli_affidamento: p.numeroVeicoliAffidamento,
    valore_listino_ordinato: p.valoreListinoOrdinato,

    stato_trattativa: p.statoTrattativa,
    annotazioni_trattativa: p.annotazioniTrattativa,
    data_affidamento: p.dataAffidamento,
    stato_affidamento: p.statoAffidamento || null,
    annotazioni_affidamento: p.annotazioniAffidamento,
    data_ordine: p.dataOrdine,
    numero_veicoli_ordinati: p.numeroVeicoliOrdinati,
    valore_provvigione_totale: p.valoreProvvigioneTotale,
    stato_ordine: p.statoOrdine || null,
    // Fix: access correct property name from Practice interface
    annotazione_ordine: p.annotazioneOrdine,
    deleted_at: p.deletedAt
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
  // --- AGENTS ---
  getAgentByPin: async (pin: string): Promise<Agent | null> => {
    if (!supabase) throw new Error("Supabase client non inizializzato");
    const { data, error } = await supabase
      .from('nlt_agents')
      .select('*')
      .eq('pin', pin)
      .eq('is_active', true)
      .maybeSingle();
    if (error) throw error;
    return data ? fromDbAgent(data) : null;
  },

  getAllAgents: async (): Promise<Agent[]> => {
    if (!supabase) return [];
    const { data, error } = await supabase.from('nlt_agents').select('*').order('nome');
    if (error) return [];
    return data.map(fromDbAgent);
  },

  saveAgent: async (agent: Partial<Agent>): Promise<void> => {
    if (!supabase) return;
    const dbData = toDbAgent(agent);
    if (agent.id) {
       await supabase.from('nlt_agents').update(dbData).eq('id', agent.id);
    } else {
       await supabase.from('nlt_agents').insert([dbData]);
    }
  },

  getAllProviders: async (onlyActive = false): Promise<Provider[]> => {
    if (!supabase) return [];
    let query = supabase.from('nlt_providers').select('*').order('name');
    if (onlyActive) query = query.eq('is_active', true);
    const { data, error } = await query;
    if (error) return [];
    return data.map(fromDbProvider);
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
    
    // Filtro per escludere le pratiche cancellate (deleted_at IS NULL)
    let query = supabase.from('nlt_practices').select('*').is('deleted_at', null);
    
    if (user.isAgent && !user.isAdmin) {
      query = query.eq('agent_id', user.id);
    }

    const { data: practicesData, error } = await query;
    
    if (error) {
      console.error("Errore recupero pratiche:", error);
      if (error.code === '42703') {
          const retry = await supabase.from('nlt_practices').select('*');
          if (retry.data) return retry.data.map(fromDbPractice);
      }
      return [];
    }

    if (!practicesData) return [];

    let resultPractices = [...practicesData];
    if ((user.isAdmin || !user.isAgent) && resultPractices.length > 0) {
        const { data: agentsData } = await supabase.from('nlt_agents').select('id, nome');
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
      const { error } = await supabase.from('nlt_practices').update(dbData).eq('id', practice.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('nlt_practices').insert([dbData]);
      if (error) throw error;
    }
  },

  deletePractice: async (id: string): Promise<void> => {
    if (!supabase) throw new Error("Database non connesso.");
    
    // Tentativo di soft delete impostando il timestamp corrente
    const timestamp = new Date().toISOString();
    
    const { error, status } = await supabase
      .from('nlt_practices')
      .update({ deleted_at: timestamp })
      .eq('id', id);

    if (error) {
      console.error("Dettagli errore cancellazione:", error);
      throw new Error(`Errore DB (${error.code}): ${error.message}`);
    }
  },

  // --- REMINDERS ---
  getReminders: async (practiceId: string): Promise<Reminder[]> => {
      if (!supabase) return [];
      const { data, error } = await supabase.from('nlt_reminders').select('*').eq('practice_id', practiceId).order('expiration_date');
      if (error) return [];
      return data.map(fromDbReminder);
  },

  getRemindersForPractices: async (practiceIds: string[]): Promise<Reminder[]> => {
      if (!supabase || practiceIds.length === 0) return [];
      const { data, error } = await supabase.from('nlt_reminders').select('*').in('practice_id', practiceIds).neq('status', 'eliminato');
      if (error) return [];
      return data.map(fromDbReminder);
  },

  saveReminder: async (reminder: Partial<Reminder>): Promise<void> => {
      if (!supabase) return;
      const dbData = { practice_id: reminder.practiceId, expiration_date: reminder.expirationDate, description: reminder.description, status: reminder.status, feedback: reminder.feedback };
      let error;
      if (reminder.id) ({ error } = await supabase.from('nlt_reminders').update(dbData).eq('id', reminder.id));
      else ({ error } = await supabase.from('nlt_reminders').insert([dbData]));
      if (error) throw error;
  },

  deleteReminder: async (id: string): Promise<void> => {
      if (!supabase) return;
      await supabase.from('nlt_reminders').update({ status: 'eliminato' }).eq('id', id);
  },

  initializeDefaults: async (): Promise<void> => {}
};
