"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { cn } from "@/lib/utils";

type ToastVariant = "success" | "error" | "info";

type ToastOptions = {
  title: string;
  description?: string;
  variant?: ToastVariant;
  actionLabel?: string;
  actionHref?: string;
  duration?: number;
};

type ToastItem = Required<Omit<ToastOptions, "duration">> & {
  id: string;
};

type ToastContextValue = {
  toast: (options: ToastOptions) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const variantStyles: Record<ToastVariant, string> = {
  success: "border-brand-400/60 bg-brand-500/20 text-brand-50",
  error: "border-rose-400/70 bg-rose-500/20 text-rose-50",
  info: "border-white/20 bg-white/10 text-slate-100",
};

function generateId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((previous) => previous.filter((toast) => toast.id !== id));
  }, []);

  const toast = useCallback(
    ({
      title,
      description,
      variant = "info",
      actionHref,
      actionLabel,
      duration = 4500,
    }: ToastOptions) => {
      const id = generateId();
      const toastItem: ToastItem = {
        id,
        title,
        description: description ?? "",
        variant,
        actionHref: actionHref ?? "",
        actionLabel: actionLabel ?? "",
      };
      setToasts((previous) => [...previous, toastItem]);

      if (duration !== Infinity) {
        setTimeout(() => removeToast(id), duration);
      }
    },
    [removeToast],
  );

  const contextValue = useMemo<ToastContextValue>(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div className="pointer-events-none fixed bottom-6 right-6 z-[60] flex w-80 flex-col gap-3">
        {toasts.map((item) => (
          <div
            key={item.id}
            className={cn(
              "pointer-events-auto flex gap-3 rounded-2xl border px-4 py-4 shadow-card backdrop-blur-md",
              variantStyles[item.variant],
            )}
          >
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">{item.title}</p>
              {item.description ? (
                <p className="mt-1 text-xs text-white/80">{item.description}</p>
              ) : null}
              {item.actionHref && item.actionLabel ? (
                <a
                  href={item.actionHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex text-xs font-semibold text-white/90 underline decoration-white/60 underline-offset-4"
                >
                  {item.actionLabel}
                </a>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => removeToast(item.id)}
              className="text-sm text-white/70 transition hover:text-white"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
