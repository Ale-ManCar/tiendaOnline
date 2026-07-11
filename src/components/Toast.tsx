import { CheckCircle2, XCircle, X } from 'lucide-react';

export type ToastState = { message: string; type: 'success' | 'error' } | null;

export function Toast({ toast, onClose }: { toast: ToastState; onClose: () => void }) {
  if (!toast) return null;
  return (
    <div className={`toast ${toast.type}`} role="status">
      {toast.type === 'success' ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
      <span>{toast.message}</span>
      <button aria-label="Cerrar notificación" onClick={onClose}><X size={18} /></button>
    </div>
  );
}
