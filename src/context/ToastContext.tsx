import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
}

interface ToastContextType {
  showToast: (type: ToastType, message: string, title?: string) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((type: ToastType, message: string, title?: string) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, type, message, title }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  }, [removeToast]);

  const success = useCallback((msg: string, title?: string) => showToast('success', msg, title), [showToast]);
  const error = useCallback((msg: string, title?: string) => showToast('error', msg, title), [showToast]);
  const info = useCallback((msg: string, title?: string) => showToast('info', msg, title), [showToast]);
  const warning = useCallback((msg: string, title?: string) => showToast('warning', msg, title), [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, info, warning }}>
      {children}
      {/* Toast Notification Container */}
      <div className="fixed top-4 right-4 z-50 flex flex-col space-y-2 pointer-events-none max-w-sm w-full px-4 sm:px-0">
        {toasts.map((toast) => {
          let bg = 'bg-slate-900 border-slate-700 text-white';
          let icon = 'ℹ️';
          if (toast.type === 'success') {
            bg = 'bg-emerald-800/95 border-emerald-600 text-white';
            icon = '✅';
          } else if (toast.type === 'error') {
            bg = 'bg-rose-800/95 border-rose-600 text-white';
            icon = '❌';
          } else if (toast.type === 'warning') {
            bg = 'bg-amber-800/95 border-amber-600 text-white';
            icon = '⚠️';
          }

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start space-x-3 p-3.5 rounded-xl border shadow-xl backdrop-blur-sm transition-all duration-300 animate-in fade-in slide-in-from-top-4 ${bg}`}
            >
              <span className="text-lg shrink-0 mt-0.5">{icon}</span>
              <div className="flex-1 text-xs">
                {toast.title && <p className="font-bold text-sm mb-0.5">{toast.title}</p>}
                <p className="leading-relaxed opacity-95">{toast.message}</p>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="opacity-70 hover:opacity-100 text-white font-bold text-sm p-1"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
