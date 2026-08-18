import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ toasts, onDismiss }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <aside className="toast-container" aria-label="Notifications" role="region">
      {toasts.map((toast) => {
        const { id, type = 'info', message } = toast;
        return (
          <div key={id} className={`toast ${type}`} role="status">
            {type === 'success' && <CheckCircle2 className="toast-icon-success" size={18} />}
            {type === 'error' && <AlertCircle className="toast-icon-error" size={18} />}
            {type === 'info' && <Info className="toast-icon-info" size={18} />}
            <span style={{ flex: 1 }}>{message}</span>
            <button
              className="action-btn"
              onClick={() => onDismiss(id)}
              aria-label="Dismiss notification"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </aside>
  );
}
