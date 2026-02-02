
import { supabase } from './firebaseConfig';

const TABLES = ['nlt_agents', 'nlt_providers', 'nlt_customers', 'nlt_practices', 'nlt_reminders'];
const BUCKET_NAME = 'backups';
const FILE_PREFIX = '478-NLT_backup_';

export const BackupService = {
  /**
   * Genera un nome file standardizzato basato sul timestamp ISO
   */
  generateFileName() {
    const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\./g, '-');
    return `${FILE_PREFIX}${timestamp}.json`;
  },

  /**
   * Estrae tutti i dati dal DB e genera un oggetto JSON
   */
  async generateBackupData() {
    const backup: Record<string, any> = {
      version: '1.1.0',
      timestamp: new Date().toISOString(),
      data: {}
    };

    for (const table of TABLES) {
      const { data, error } = await supabase.from(table).select('*');
      if (error) throw new Error(`Errore estrazione tabella ${table}: ${error.message}`);
      backup.data[table] = data;
    }

    return backup;
  },

  /**
   * Esegue il backup e lo salva su Supabase Storage
   */
  async runAutoBackup() {
    try {
      const now = new Date();
      const todayPrefix = `${FILE_PREFIX}${now.toISOString().split('T')[0]}`;
      
      // 1. Controlla se esiste già un backup per oggi (basato sul prefisso della data)
      const { data: existingFiles } = await supabase.storage.from(BUCKET_NAME).list('', {
        limit: 100
      });

      const todayBackup = existingFiles?.find(f => f.name.startsWith(todayPrefix));

      if (todayBackup) {
        console.log("Backup odierno già presente.");
        return;
      }

      // 2. Genera i dati
      const fileName = this.generateFileName();
      const backupData = await this.generateBackupData();
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });

      // 3. Upload
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, blob, { contentType: 'application/json', upsert: true });

      if (uploadError) throw uploadError;

      // 4. Esegui la politica di retention
      await this.runRetentionPolicy();

      console.log("Backup automatico completato con successo.");
    } catch (error) {
      console.error("Errore durante il backup automatico:", error);
    }
  },

  /**
   * Politica di pulizia dei backup obsoleti
   */
  async runRetentionPolicy() {
    try {
      const { data: files, error } = await supabase.storage.from(BUCKET_NAME).list('');
      if (error || !files) return;

      const now = new Date();
      const filesToDelete: string[] = [];

      files.forEach(file => {
        if (!file.name.startsWith(FILE_PREFIX)) return;
        
        // Estrai data dal nome: 478-NLT_backup_YYYY-MM-DDTHH-mm-ss-SSSZ.json
        // Ripristiniamo il formato ISO per creare l'oggetto Date
        const timestampPart = file.name.replace(FILE_PREFIX, '').replace('.json', '');
        const isoString = timestampPart.substring(0, 10) + 'T' + 
                         timestampPart.substring(11).replace(/-/g, ':').replace(/:(?=[^:]*$)/, '.');
        
        const fileDate = new Date(isoString);
        
        if (isNaN(fileDate.getTime())) return;

        const diffDays = Math.floor((now.getTime() - fileDate.getTime()) / (1000 * 60 * 60 * 24));
        const isMonday = now.getDay() === 1;
        const isFirstOfMonth = now.getDate() === 1;

        // Logica Settimanale (Ogni Lunedì puliamo la settimana precedente tranne la Domenica)
        if (isMonday && diffDays > 1 && diffDays <= 8) {
          if (fileDate.getDay() !== 0) { // Se non è domenica
            filesToDelete.push(file.name);
          }
        }

        // Logica Mensile (Ogni 1° del mese puliamo il mese precedente tranne il 1°)
        if (isFirstOfMonth && diffDays > 1 && diffDays <= 31) {
          if (fileDate.getDate() !== 1) { // Se non è il primo del mese
            filesToDelete.push(file.name);
          }
        }
        
        // Sicurezza: elimina tutto ciò che è più vecchio di 90 giorni
        if (diffDays > 90) {
          filesToDelete.push(file.name);
        }
      });

      if (filesToDelete.length > 0) {
        await supabase.storage.from(BUCKET_NAME).remove(filesToDelete);
        console.log(`Retention policy: eliminati ${filesToDelete.length} backup obsoleti.`);
      }
    } catch (error) {
      console.error("Errore retention policy:", error);
    }
  },

  /**
   * Ripristina i dati da un oggetto JSON
   */
  async restoreFromData(backupData: any) {
    if (!backupData || !backupData.data) throw new Error("Formato backup non valido.");

    // Ordine di ripristino per rispettare i vincoli FK
    const restoreOrder = ['nlt_agents', 'nlt_providers', 'nlt_customers', 'nlt_practices', 'nlt_reminders'];

    for (const table of restoreOrder) {
      const rows = backupData.data[table];
      if (rows && rows.length > 0) {
        const { error } = await supabase.from(table).upsert(rows);
        if (error) throw new Error(`Errore ripristino tabella ${table}: ${error.message}`);
      }
    }
  },

  /**
   * Lista i backup disponibili nel Cloud filtrando per prefisso applicativo
   */
  async listCloudBackups() {
    const { data, error } = await supabase.storage.from(BUCKET_NAME).list('', {
      sortBy: { column: 'name', order: 'desc' },
      limit: 100
    });
    if (error) throw error;
    // Filtriamo solo i file che iniziano con il nostro prefisso specifico
    return (data || []).filter(f => f.name.startsWith(FILE_PREFIX));
  },

  /**
   * Scarica un backup dal cloud
   */
  async downloadFromCloud(fileName: string) {
    const { data, error } = await supabase.storage.from(BUCKET_NAME).download(fileName);
    if (error) throw error;
    return data;
  },

  /**
   * Elimina un backup dal cloud
   */
  async deleteFromCloud(fileName: string) {
    const { error } = await supabase.storage.from(BUCKET_NAME).remove([fileName]);
    if (error) throw error;
  }
};
