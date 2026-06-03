"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { X, CheckCircle2, AlertTriangle, Info, XCircle } from "lucide-react";

type ToastType = "success" | "info" | "warning" | "error";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType>({ showToast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

let toastId = 0;

const iconMap = {
  success: CheckCircle2,
  info: Info,
  warning: AlertTriangle,
  error: XCircle,
};

const styleMap = {
  success: "bg-success/10 border-success/30 text-success-text",
  info: "bg-primary/10 border-primary/30 text-foreground",
  warning: "bg-warning/10 border-warning/30 text-warning-text",
  error: "bg-destructive/10 border-destructive/30 text-destructive-text",
};

const iconColorMap = {
  success: "text-success",
  info: "text-primary",
  warning: "text-warning",
  error: "text-destructive-text",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "success") => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container */}
      <div role="status" aria-live="polite" className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none" style={{ maxWidth: 380 }}>
        {toasts.map((toast) => {
          const Icon = iconMap[toast.type];
          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-2.5 px-4 py-3 rounded-lg border shadow-md text-sm animate-[slideIn_0.2s_ease-out] ${styleMap[toast.type]}`}
            >
              <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${iconColorMap[toast.type]}`} />
              <span className="flex-1 text-xs font-medium leading-relaxed">{toast.message}</span>
              <button
                onClick={() => dismiss(toast.id)}
                className="flex-shrink-0 p-0.5 rounded hover:bg-accent transition-colors cursor-pointer bg-transparent border-none"
              >
                <X className="w-3.5 h-3.5 opacity-50" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
