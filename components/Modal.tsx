
import React from 'react';
import { X, AlertTriangle, Info, Trash2 } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  message: string;
  type?: 'danger' | 'info';
  confirmLabel?: string;
  loading?: boolean;
}

export const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  type = 'info',
  confirmLabel = 'Conferma',
  loading = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md shadow-2xl overflow-hidden border-t-4 border-black flex flex-col rounded-2xl">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-xl ${type === 'danger' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-black'}`}>
              {type === 'danger' ? <Trash2 size={24} /> : <Info size={24} />}
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 uppercase tracking-tight mb-2">{title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{message}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 flex flex-col md:flex-row justify-end gap-3 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-6 py-2.5 text-sm font-bold uppercase tracking-wider text-gray-600 hover:bg-gray-200 transition-colors rounded-xl"
          >
            Annulla
          </button>
          {onConfirm && (
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className={`px-6 py-2.5 text-sm font-bold uppercase tracking-wider text-white shadow-lg transition-all transform active:scale-95 rounded-xl ${
                type === 'danger' ? 'bg-red-600 hover:bg-red-700 shadow-red-600/20' : 'bg-black hover:bg-gray-800'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Elaborazione...' : confirmLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
