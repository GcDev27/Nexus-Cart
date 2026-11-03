"use client";

import { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence, type PanInfo } from "framer-motion";

// ─── Types ───────────────────────────────────────────────────────
type ToastVariant = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastContextType {
  addToast: (message: string, variant?: ToastVariant) => void;
}

// ─── Context ─────────────────────────────────────────────────────
const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast deve ser usado dentro de <ToastProvider>");
  return ctx;
}

// ─── Icons ───────────────────────────────────────────────────────
function SuccessIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

const iconMap = {
  success: SuccessIcon,
  error: ErrorIcon,
  info: InfoIcon,
};

const variantStyles: Record<ToastVariant, { bg: string; border: string; icon: string; progress: string }> = {
  success: {
    bg: "bg-emerald-950/80",
    border: "border-emerald-800/50",
    icon: "text-emerald-400",
    progress: "bg-emerald-400",
  },
  error: {
    bg: "bg-red-950/80",
    border: "border-red-800/50",
    icon: "text-red-400",
    progress: "bg-red-400",
  },
  info: {
    bg: "bg-violet-950/80",
    border: "border-violet-800/50",
    icon: "text-violet-400",
    progress: "bg-violet-400",
  },
};

// ─── Single Toast Item ───────────────────────────────────────────
const TOAST_DURATION = 4000;

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: number) => void }) {
  const styles = variantStyles[toast.variant];
  const Icon = iconMap[toast.variant];
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Auto dismiss
  const startTimer = useCallback(() => {
    timerRef.current = setTimeout(() => onRemove(toast.id), TOAST_DURATION);
  }, [toast.id, onRemove]);

  const clearTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  // Start timer on mount
  useEffect(() => {
    startTimer();
  }, [startTimer]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    // Se arrastou mais de 100px pra direita ou com velocidade suficiente, dismiss
    if (info.offset.x > 100 || info.velocity.x > 500) {
      onRemove(toast.id);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 500, damping: 35, mass: 1 }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.9}
      onDragEnd={handleDragEnd}
      onHoverStart={clearTimer}
      onHoverEnd={startTimer}
      className={`
        relative flex items-center gap-3 px-4 py-3.5 rounded-xl border shadow-2xl
        backdrop-blur-xl cursor-grab active:cursor-grabbing select-none
        min-w-[320px] max-w-105
        ${styles.bg} ${styles.border}
      `}
      style={{ touchAction: "none" }}
    >
      {/* Icon */}
      <div className={`shrink-0 ${styles.icon}`}>
        <Icon />
      </div>

      {/* Message */}
      <span className="text-sm font-medium text-white flex-1">{toast.message}</span>

      {/* Close button */}
      <button
        onClick={() => onRemove(toast.id)}
        className="shrink-0 text-neutral-500 hover:text-white transition-colors p-0.5"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      {/* Progress bar */}
      <motion.div
        className={`absolute bottom-0 left-0 h-0.5 rounded-b-xl ${styles.progress}`}
        initial={{ width: "100%" }}
        animate={{ width: "0%" }}
        transition={{ duration: TOAST_DURATION / 1000, ease: "linear" }}
        style={{ opacity: 0.6 }}
      />
    </motion.div>
  );
}

// ─── Provider ────────────────────────────────────────────────────
let toastCounter = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, variant: ToastVariant = "success") => {
    const id = ++toastCounter;
    setToasts((prev) => [...prev, { id, message, variant }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}

      {/* Toast Container - Bottom Right */}
      <div className="fixed bottom-6 right-6 z-100 flex flex-col gap-3 items-end pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <div key={toast.id} className="pointer-events-auto">
              <ToastItem toast={toast} onRemove={removeToast} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
