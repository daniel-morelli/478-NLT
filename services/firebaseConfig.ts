import { createClient } from '@supabase/supabase-js';

// Configurazione Supabase - Nuovo database di produzione
const supabaseUrl = 'https://zexebsppdssnlfstnbyz.supabase.co';
const supabaseKey = 'sb_publishable_tanxhyT6r5f4x9ChM67mIQ_CCtgRdND';

// Esportiamo l'istanza del client
export const supabase = createClient(supabaseUrl, supabaseKey);

// Log di debug (rimuovere in produzione se necessario)
console.log("Client Supabase inizializzato sul nuovo endpoint:", supabaseUrl);