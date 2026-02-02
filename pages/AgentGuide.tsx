
import React from 'react';
import { 
  BookOpen, 
  LayoutDashboard, 
  FileText, 
  Users2, 
  Calendar, 
  ShieldCheck, 
  ShoppingCart, 
  Bell, 
  ArrowRight,
  Clock,
  CheckCircle2,
  Lock,
  RefreshCw,
  Info,
  AlertTriangle,
  Car,
  Briefcase,
  ChevronRight
} from 'lucide-react';

export const AgentGuide: React.FC = () => {
  const Section = ({ title, icon: Icon, children }: { title: string, icon: any, children?: React.ReactNode }) => (
    <section className="bg-white border border-gray-100 rounded-[2.5rem] shadow-sm overflow-hidden mb-8">
      <div className="bg-black p-6 flex items-center gap-4">
        <div className="bg-red-600 p-2.5 rounded-2xl text-white">
          <Icon size={24} />
        </div>
        <h3 className="text-xl font-black text-white uppercase tracking-tighter">{title}</h3>
      </div>
      <div className="p-8 md:p-10">{children}</div>
    </section>
  );

  const Step = ({ number, title, text }: { number: string, title: string, text: string }) => (
    <div className="flex gap-4 mb-6 last:mb-0">
      <div className="flex-shrink-0 w-10 h-10 bg-red-50 border border-red-100 rounded-full flex items-center justify-center text-red-600 font-black text-sm">
        {number}
      </div>
      <div>
        <h4 className="font-black text-gray-900 uppercase text-xs tracking-widest mb-1">{title}</h4>
        <p className="text-gray-500 text-sm leading-relaxed">{text}</p>
      </div>
    </div>
  );

  const BadgeInfo = ({ label, color }: { label: string, color: string }) => (
    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${color} border`}>
      {label}
    </span>
  );

  return (
    <div className="max-w-4xl mx-auto pb-20 animate-in fade-in duration-500">
      <div className="mb-12">
        <h2 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tighter uppercase leading-none">
          Guida <span className="text-red-600">Operativa</span>
        </h2>
        <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mt-2">
          Manuale d'uso per la rete agenti 478 NLT
        </p>
      </div>

      {/* INTRODUZIONE */}
      <div className="bg-red-600 text-white p-8 rounded-[2.5rem] mb-12 shadow-xl shadow-red-600/20 flex flex-col md:flex-row items-center gap-8">
        <div className="bg-white/20 p-6 rounded-3xl">
          <BookOpen size={48} />
        </div>
        <div>
          <h3 className="text-2xl font-black uppercase tracking-tight mb-2">Benvenuto nel tuo Portale</h3>
          <p className="text-sm font-bold text-red-100 leading-relaxed uppercase tracking-wide">
            Questa piattaforma è stata progettata per semplificare ogni fase del tuo lavoro: dalla prima quotazione alla firma del contratto, mantenendo sempre il controllo sui tuoi obiettivi provvigionali.
          </p>
        </div>
      </div>

      {/* DASHBOARD */}
      <Section title="1. Dashboard & Obiettivi" icon={LayoutDashboard}>
        <p className="text-gray-600 mb-8 font-medium">La Dashboard è la tua centrale di controllo. Qui monitori le performance in tempo reale.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <Clock className="text-red-600" />
              <span className="text-xs font-black uppercase text-gray-700">Scadenze: Promemoria futuri</span>
            </div>
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <AlertTriangle className="text-orange-500" />
              <span className="text-xs font-black uppercase text-gray-700">Scaduti: Azioni critiche da gestire</span>
            </div>
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <Car className="text-black" />
              <span className="text-xs font-black uppercase text-gray-700">Veicoli: Volume totale opportunità</span>
            </div>
          </div>
          <div className="bg-zinc-900 text-white p-6 rounded-3xl flex flex-col justify-center">
            <h4 className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-4">Grafico Provvigionale</h4>
            <p className="text-xs leading-relaxed opacity-80">
              Il grafico mostra la stima delle tue provvigioni divise per mese e stato (Trattativa, Affidamento, Ordine). È lo strumento ideale per pianificare i tuoi incassi futuri.
            </p>
          </div>
        </div>
      </Section>

      {/* GESTIONE PRATICHE */}
      <Section title="2. Ciclo di Vita della Pratica" icon={FileText}>
        <div className="mb-10 p-6 bg-red-50 border border-red-100 rounded-3xl">
          <div className="flex items-center gap-2 mb-4">
             <Info size={16} className="text-red-600" />
             <h4 className="text-xs font-black text-red-600 uppercase tracking-widest">Le Tre Fasi Fondamentali</h4>
          </div>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 bg-white p-4 rounded-2xl shadow-sm text-center">
              <Briefcase size={20} className="mx-auto mb-2 text-gray-400" />
              <span className="text-[10px] font-black uppercase block">Trattativa</span>
              <p className="text-[9px] text-gray-400 font-bold mt-1">QUOTAZIONE E INTERESSE</p>
            </div>
            <div className="flex items-center justify-center text-red-200 hidden md:flex"><ArrowRight /></div>
            <div className="flex-1 bg-white p-4 rounded-2xl shadow-sm text-center">
              <ShieldCheck size={20} className="mx-auto mb-2 text-emerald-500" />
              <span className="text-[10px] font-black uppercase block">Affidamento</span>
              <p className="text-[9px] text-gray-400 font-bold mt-1">ISTRUTTORIA CREDITIZIA</p>
            </div>
            <div className="flex items-center justify-center text-red-200 hidden md:flex"><ArrowRight /></div>
            <div className="flex-1 bg-white p-4 rounded-2xl shadow-sm text-center">
              <ShoppingCart size={20} className="mx-auto mb-2 text-red-600" />
              <span className="text-[10px] font-black uppercase block">Ordine</span>
              <p className="text-[9px] text-gray-400 font-bold mt-1">CONTRATTO E CONSEGNA</p>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <Step 
            number="01" 
            title="Creazione" 
            text="Clicca su 'Nuova Pratica'. Seleziona l'agente (se richiesto) e cerca il cliente nell'anagrafica. Se il cliente non esiste, puoi crearlo istantaneamente tramite il tasto '+' nel campo ricerca."
          />
          <Step 
            number="02" 
            title="Dati Trattativa" 
            text="Inserisci il numero di veicoli previsti e il valore di listino. Indica sempre il 'Mese Previsto Chiusura' per permettere al sistema di generare statistiche accurate."
          />
          <Step 
            number="03" 
            title="Passaggio ad Affidamento" 
            text="Quando il cliente è pronto per l'istruttoria, vai nel tab 'Affidamento'. Inserisci i dati tecnici dei veicoli (marca, modello, provvigione specifica). Lo stato cambierà automaticamente in base all'esito caricato."
          />
          <Step 
            number="04" 
            title="Chiusura Ordine" 
            text="Una volta ottenuto l'affidamento, compila i dati nel tab 'Ordine'. Inserisci i dettagli della consegna, la durata dei mesi e i chilometri pattuiti. Salva per confermare la chiusura positiva."
          />
        </div>

        <div className="mt-10 pt-8 border-t border-gray-100">
           <div className="flex items-center gap-3 text-red-600 mb-4">
              <Lock size={18} />
              <h4 className="text-xs font-black uppercase tracking-widest">Blocco Pratica (Lock)</h4>
           </div>
           <p className="text-xs text-gray-500 leading-relaxed font-medium">
             Una volta che un Amministratore verifica la pratica e attiva il <strong>Lock</strong>, non potrai più modificare i dati economici o di stato. Potrai però continuare ad aggiungere <strong>Promemoria</strong> e visualizzare la <strong>Timeline</strong>.
           </p>
        </div>
      </Section>

      {/* ANAGRAFICA E PROMEMORIA */}
      <Section title="3. Clienti & Scadenze" icon={Users2}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div>
            <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Users2 size={16} className="text-red-600"/> Anagrafica Intelligente
            </h4>
            <ul className="space-y-4">
              <li className="flex gap-3 items-start">
                <CheckCircle2 size={14} className="text-green-500 mt-0.5" />
                <span className="text-xs text-gray-600 font-bold uppercase tracking-tight leading-relaxed">
                  <strong>Click-to-Call:</strong> Usa l'icona del telefono per chiamare direttamente il cliente dal tuo dispositivo.
                </span>
              </li>
              <li className="flex gap-3 items-start">
                <CheckCircle2 size={14} className="text-green-500 mt-0.5" />
                <span className="text-xs text-gray-600 font-bold uppercase tracking-tight leading-relaxed">
                  <strong>Storico Centralizzato:</strong> Ogni cliente è collegato alle sue pratiche passate e presenti.
                </span>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Bell size={16} className="text-red-600"/> Gestione Promemoria
            </h4>
            <p className="text-xs text-gray-500 leading-relaxed mb-4 font-medium">
              Non dimenticare mai un follow-up. All'interno di ogni pratica puoi aggiungere scadenze specifiche.
            </p>
            <div className="flex flex-wrap gap-2">
               <BadgeInfo label="Aperto" color="bg-orange-50 text-orange-600 border-orange-100" />
               <BadgeInfo label="Scaduto" color="bg-red-600 text-white border-red-700" />
               <BadgeInfo label="Completato" color="bg-green-50 text-green-700 border-green-100" />
            </div>
          </div>
        </div>

        <div className="mt-12 bg-black text-white p-8 rounded-[2rem] flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Calendar size={32} className="text-red-600" />
              <div>
                <h4 className="text-lg font-black uppercase tracking-tight">Calendario Attività</h4>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Sincronizza i tuoi appuntamenti</p>
              </div>
            </div>
            <div className="hidden md:block">
              <p className="text-xs opacity-60 italic text-right max-w-xs">
                Visualizza tutti i tuoi promemoria in una vista mensile per ottimizzare i tuoi spostamenti e le chiamate.
              </p>
            </div>
        </div>
      </Section>

      {/* PROFILO E SICUREZZA */}
      <Section title="4. Profilo & Sicurezza" icon={ShieldCheck}>
        <div className="flex flex-col md:flex-row gap-8">
           <div className="flex-1 space-y-4">
              <div className="flex items-center gap-3">
                 <RefreshCw size={16} className="text-red-600" />
                 <span className="text-xs font-black uppercase text-gray-700 tracking-widest">Cambio Password</span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed font-medium">
                Accedi alla sezione "Il mio Profilo" per aggiornare la tua password di accesso. Ti consigliamo di usare un PIN di almeno 4 cifre facile da ricordare ma sicuro.
              </p>
           </div>
           <div className="flex-1 p-6 bg-gray-900 rounded-3xl border border-gray-800">
              <h4 className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-4">Supporto Tecnico</h4>
              <p className="text-[11px] text-gray-300 font-bold uppercase tracking-tight leading-relaxed mb-4">
                In caso di problemi con il caricamento delle pratiche o errori di accesso, contatta il tuo Team Leader di riferimento.
              </p>
              <div className="flex items-center gap-2 text-[10px] font-black text-white uppercase tracking-widest">
                <Info size={14} className="text-red-600" /> Versione App: 1.1.0 (Stable)
              </div>
           </div>
        </div>
      </Section>
    </div>
  );
};
