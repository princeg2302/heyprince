'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType>({
  showToast: () => {},
});

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="hpa-toast-container">
        {toasts.map((toast) => {
          let icon = <CheckCircle2 size={18} style={{ color: 'var(--hpa-success)' }} />;
          let borderColor = 'rgba(0, 245, 160, 0.3)';

          if (toast.type === 'error') {
            icon = <AlertCircle size={18} style={{ color: 'var(--hpa-danger)' }} />;
            borderColor = 'rgba(244, 63, 94, 0.3)';
          } else if (toast.type === 'info') {
            icon = <Info size={18} style={{ color: 'var(--hpa-info)' }} />;
            borderColor = 'rgba(56, 189, 248, 0.3)';
          }

          return (
            <div
              key={toast.id}
              className="hpa-toast"
              style={{ borderColor }}
            >
              {icon}
              <span style={{ flex: 1 }}>{toast.message}</span>
              <button
                onClick={() => removeToast(toast.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--hpa-text-dim)',
                  cursor: 'pointer',
                  padding: '2px',
                }}
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
