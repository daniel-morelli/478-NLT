import { createClient } from '@supabase/supabase-js';

// Configurazione Supabase
const supabaseUrl = 'https://mxfqgmxkzyxhpxmxuzov.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14ZnFnbXhrenl4aHB4bXh1em92Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyMzcyMDcsImV4cCI6MjA3OTgxMzIwN30.6FDuXjiSkQFV8mt5zav-DThXVCN8ocjXC90feCdFwCc';

// Esportiamo l'istanza del client
export const supabase = createClient(supabaseUrl, supabaseKey);

// Log di debug
console.log("Client Supabase inizializzato su:", supabaseUrl);