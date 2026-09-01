import { createContext, useCallback, useContext, useRef, useState } from "react";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";

const BRAND = "#F48124";

const ToastContext = createContext(null);

const ICONS = {
  success: <CheckCircle size={18} color="#16a34a" />,
  error:   <XCircle    size={18} color="#dc2626" />,
  warning: <AlertTriangle size={18} color="#d97706" />,
  info:    <Info       size={18} color="#2563eb" />,
};

const BG = {
  success: "#f0fdf4",
  error:   "#fef2f2",
  warning: "#fffbeb",
  info:    "#eff6ff",
};

const BORDER = {
  success: "#bbf7d0",
  error:   "#fecaca",
  warning: "#fde68a",
  info:    "#bfdbfe",
};

let nextId = 1;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current[id]);
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(({ type = "info", message, duration = 4000 }) => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, type, message }]);
    timers.current[id] = setTimeout(() => dismiss(id), duration);
    return id;
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      {/* Contenedor de toasts */}
      <div style={{
        position: "fixed", bottom: 24, right: 24, zIndex: 9999,
        display: "flex", flexDirection: "column", gap: 10,
        maxWidth: 360, width: "100%",
        pointerEvents: "none",
      }}>
        {toasts.map((t) => (
          <div key={t.id} style={{
            display: "flex", alignItems: "flex-start", gap: 10,
            background: BG[t.type], border: `1px solid ${BORDER[t.type]}`,
            borderRadius: 12, padding: "12px 14px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.10)",
            pointerEvents: "auto",
            animation: "fadeInUp 0.2s ease-out",
          }}>
            <span style={{ flexShrink: 0, marginTop: 1 }}>{ICONS[t.type]}</span>
            <p style={{ flex: 1, fontSize: 13, color: "#1e293b", margin: 0, lineHeight: 1.5 }}>
              {t.message}
            </p>
            <button
              onClick={() => dismiss(t.id)}
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: "#94a3b8", padding: 0, flexShrink: 0,
                display: "flex", alignItems: "center",
              }}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast debe usarse dentro de ToastProvider");
  const { toast, dismiss } = ctx;
  return {
    success: (message, opts) => toast({ type: "success", message, ...opts }),
    error:   (message, opts) => toast({ type: "error",   message, ...opts }),
    warning: (message, opts) => toast({ type: "warning", message, ...opts }),
    info:    (message, opts) => toast({ type: "info",    message, ...opts }),
    dismiss,
  };
}
