import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { useTheme } from "../../store/ThemeContext";
import { tk } from "../../utils/theme";

const BRAND = "#F48124";

const MAX_WIDTHS = { sm: 400, md: 540, lg: 720, xl: 960 };

/**
 * Modal base reutilizable.
 *
 * Props:
 *   open      boolean
 *   onClose   () => void
 *   title     string
 *   icon      ReactNode   (opcional, ícono junto al título)
 *   size      "sm" | "md" | "lg" | "xl"   (default "md")
 *   children  ReactNode
 *   footer    ReactNode   (opcional)
 */
export function Modal({ open, onClose, title, icon, size = "md", children, footer }) {
  const overlayRef = useRef(null);
  const { isDark } = useTheme();
  const t = tk(isDark);
  const [closeBtnHover, setCloseBtnHover] = useState(false);

  // Cerrar con Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Bloquear scroll del body
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  const overlayBg = isDark
    ? "rgba(2, 8, 23, 0.75)"
    : "rgba(15, 23, 42, 0.55)";

  const cardBg = isDark ? "#0f172a" : "#ffffff";
  const headerBg = isDark
    ? "linear-gradient(135deg, #1e293b 0%, #162032 100%)"
    : "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)";

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose?.(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: overlayBg,
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "16px",
        animation: "overlayFadeIn 0.2s ease-out",
      }}
    >
      <div style={{
        background: cardBg,
        borderRadius: 20,
        border: `1px solid ${isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)"}`,
        width: "100%", maxWidth: MAX_WIDTHS[size] ?? 540,
        boxShadow: isDark
          ? "0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.06)"
          : "0 32px 80px rgba(15,23,42,0.18), 0 0 0 1px rgba(0,0,0,0.04)",
        display: "flex", flexDirection: "column",
        maxHeight: "90vh",
        overflow: "hidden",
        animation: "modalSlideUp 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)",
      }}>

        {/* Accent bar top */}
        <div style={{
          height: 3,
          background: `linear-gradient(90deg, ${BRAND}, #fb923c, #fbbf24)`,
          flexShrink: 0,
        }} />

        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "18px 24px 16px",
          background: headerBg,
          borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)"}`,
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {icon && (
              <div style={{
                width: 34, height: 34, borderRadius: 10,
                background: isDark ? "rgba(244,129,36,0.15)" : "rgba(244,129,36,0.10)",
                border: `1px solid ${isDark ? "rgba(244,129,36,0.25)" : "rgba(244,129,36,0.20)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: BRAND, flexShrink: 0,
              }}>
                {icon}
              </div>
            )}
            <h3 style={{
              margin: 0, fontSize: 15, fontWeight: 700,
              color: t.textPrimary, letterSpacing: "-0.01em",
            }}>
              {title}
            </h3>
          </div>

          <button
            onClick={onClose}
            onMouseEnter={() => setCloseBtnHover(true)}
            onMouseLeave={() => setCloseBtnHover(false)}
            style={{
              background: closeBtnHover
                ? (isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)")
                : "transparent",
              border: "none", cursor: "pointer",
              color: closeBtnHover ? t.textPrimary : t.textSecondary,
              width: 32, height: 32, borderRadius: 9,
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "background 0.15s, color 0.15s",
              flexShrink: 0,
            }}
          >
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>

        {/* Body */}
        <div style={{
          padding: "22px 24px",
          overflowY: "auto", flex: 1,
          scrollbarWidth: "thin",
          scrollbarColor: isDark ? "#334155 transparent" : "#e2e8f0 transparent",
        }}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div style={{
            padding: "14px 24px",
            background: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)",
            borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)"}`,
            display: "flex", justifyContent: "flex-end", gap: 8,
            flexShrink: 0,
          }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
