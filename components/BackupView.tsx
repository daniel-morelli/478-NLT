
import React, { useState, useEffect, useRef } from 'react';
import { 
  Cloud, 
  Download, 
  Upload, 
  Trash2, 
  RefreshCw, 
  Database, 
  AlertTriangle, 
  CheckCircle, 
  ShieldCheck, 
  HardDrive,
  FileJson,
  History
} from 'lucide-react';
import { BackupService } from '../services/backupService';
import { Modal } from './Modal';
import { supabase } from '../services/firebaseConfig';

export const BackupView: React.FC = () => {
  const [backups, setBackups] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean, action: () => Promise<void>, title: string, message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadCloudBackups();
  }, []);

  const loadCloudBackups = async () => {
    setLoading(true);
    try {
      const list = await BackupService.listCloudBackups();
      // Il filtraggio è ora gestito a livello di servizio, ma aggiungiamo un controllo extra per sicurezza
      setBackups(list.filter(f => f.name.startsWith('478-NLT') && f.name.endsWith('.json')));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const showStatus = (type: 'success' | 'error', text: string) => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg(null), 5000);
  };

  const handleManualBackup = async () => {
    setLoading(true);
    try {
      const backupData = await BackupService.generateBackupData();
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const fileName = BackupService.generateFileName();

      const { error } = await supabase.storage
        .from('backups')
        .upload(fileName, blob, { contentType: 'application/json', upsert: true });

      if (error) throw error;
      showStatus('success', 'Backup manuale caricato nel cloud!');
      loadCloudBackups();
    } catch (e: any) {
      showStatus('error', 'Errore backup manuale: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLocalExport = async () => {
    try {
      const backupData = await BackupService.generateBackupData();
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = BackupService.generateFileName();
      a.click();
      showStatus('success', 'Export completato!');
    } catch (e: any) {
      showStatus('error', 'Errore export: ' + e.message);
    }
  };

  const handleLocalImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = JSON.parse(event.target?.result as string);
        setConfirmModal({
          isOpen: true,
          title: 'Ripristino Locale',
          message: 'Sei sicuro di voler sovrascrivere i dati attuali con quelli del file caricato? Questa operazione non può essere annullata.',
          action: async () => {
            await BackupService.restoreFromData(content);
            showStatus('success', 'Ripristino completato con successo!');
          }
        });
      } catch (err: any) {
        showStatus('error', 'File non valido: ' + err.message);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRestoreFromCloud = async (fileName: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Ripristino Cloud',
      message: `Vuoi ripristinare il database utilizzando il file ${fileName}? I dati correnti verranno sovrascritti.`,
      action: async () => {
        setLoading(true);
        try {
          const blob = await BackupService.downloadFromCloud(fileName);
          const content = JSON.parse(await blob.text());
          await BackupService.restoreFromData(content);
          showStatus('success', 'Ripristino cloud completato!');
        } catch (e: any) {
          showStatus('error', 'Errore ripristino: ' + e.message);
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handleDeleteFromCloud = async (fileName: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Elimina Backup',
      message: `Sei sicuro di voler eliminare definitivamente il backup ${fileName} dal cloud?`,
      action: async () => {
        setLoading(true);
        try {
          await BackupService.deleteFromCloud(fileName);
          showStatus('success', 'Backup eliminato.');
          loadCloudBackups();
        } catch (e: any) {
          showStatus('error', 'Errore eliminazione: ' + e.message);
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const formatSize = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Modale di Conferma Azioni Critiche */}
      {confirmModal && (
        <Modal 
          isOpen={confirmModal.isOpen} 
          onClose={() => setConfirmModal(null)} 
          title={confirmModal.title}
          message={confirmModal.message}
          confirmLabel="Procedi"
          onConfirm={async () => {
            await confirmModal.action();
            setConfirmModal(null);
          }}
          type={confirmModal.title.includes('Elimina') ? 'danger' : 'info'}
        />
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase leading-none">
            Backup & <span className="text-red-600">Recovery</span>
          </h2>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">
            Sicurezza dei dati e continuità operativa
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-100 rounded-2xl">
          <ShieldCheck className="text-green-600" size={16} />
          <span className="text-[10px] font-black uppercase text-green-700 tracking-widest">Protezione Cloud Attiva</span>
        </div>
      </div>

      {statusMsg && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 border animate-in slide-in-from-top-2 ${statusMsg.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
          {statusMsg.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
          <span className="text-xs font-bold uppercase tracking-tight">{statusMsg.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Sezione Cloud Sync */}
        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-xl shadow-black/5 flex flex-col group">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-red-600 rounded-2xl text-white shadow-lg shadow-red-600/20 group-hover:scale-110 transition-transform">
              <Cloud size={24} />
            </div>
            <div>
              <h3 className="text-lg font-black uppercase tracking-tight">Cloud Synchronization</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Supabase Storage Integration</p>
            </div>
          </div>
          <p className="text-sm text-gray-500 mb-8 leading-relaxed">
            Salva istantaneamente l'intero database sul server cloud sicuro. Il sistema gestisce automaticamente la rotazione dei backup per ottimizzare lo spazio.
          </p>
          <button 
            onClick={handleManualBackup}
            disabled={loading}
            className="mt-auto w-full py-4 bg-black text-white rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 hover:bg-red-600 transition-all active:scale-95 shadow-xl shadow-black/10"
          >
            {loading ? <RefreshCw size={18} className="animate-spin" /> : <Database size={18} />}
            Esegui Backup Ora
          </button>
        </div>

        {/* Sezione Export/Import Locale */}
        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-xl shadow-black/5 flex flex-col group">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-black rounded-2xl text-white shadow-lg shadow-black/20 group-hover:scale-110 transition-transform">
              <HardDrive size={24} />
            </div>
            <div>
              <h3 className="text-lg font-black uppercase tracking-tight">Local Storage Ops</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Export / Import Manuale</p>
            </div>
          </div>
          <p className="text-sm text-gray-500 mb-8 leading-relaxed">
            Scarica una copia fisica dei dati in formato JSON sul tuo computer o ripristina un backup precedentemente esportato.
          </p>
          <div className="grid grid-cols-2 gap-4 mt-auto">
            <button 
              onClick={handleLocalExport}
              className="py-4 border-2 border-black text-black rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-black hover:text-white transition-all"
            >
              <Download size={16} /> Export JSON
            </button>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="py-4 bg-gray-100 text-gray-600 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-gray-200 transition-all"
            >
              <Upload size={16} /> Import JSON
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleLocalImport} 
              accept=".json" 
              className="hidden" 
            />
          </div>
        </div>
      </div>

      {/* Cronologia Backup Cloud */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl overflow-hidden">
        <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-zinc-950 text-white">
          <div className="flex items-center gap-4">
            <History size={20} className="text-red-600" />
            <h3 className="font-black uppercase tracking-widest text-sm">Cronologia Cloud (Solo 478-NLT)</h3>
          </div>
          <button 
            onClick={loadCloudBackups}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                <th className="px-8 py-4">Nome File</th>
                <th className="px-8 py-4">Data Creazione</th>
                <th className="px-8 py-4">Dimensione</th>
                <th className="px-8 py-4 text-right">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {backups.map(file => (
                <tr key={file.id} className="hover:bg-red-50/10 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <FileJson className="text-red-600" size={16} />
                      <span className="font-bold text-gray-900 text-sm truncate max-w-[300px]">{file.name}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-xs font-bold text-gray-500">
                      {new Date(file.created_at).toLocaleString('it-IT')}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-[10px] font-black text-gray-400 uppercase">
                      {formatSize(file.metadata?.size)}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleRestoreFromCloud(file.name)}
                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                        title="Ripristina questo backup"
                      >
                        <RefreshCw size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteFromCloud(file.name)}
                        className="p-2 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="Elimina file"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {backups.length === 0 && !loading && (
                <tr>
                  <td colSpan={4} className="px-8 py-12 text-center">
                    <Database size={40} className="mx-auto text-gray-200 mb-4" />
                    <p className="text-xs font-black text-gray-300 uppercase tracking-widest">Nessun backup trovato nel cloud</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
