/**
 * Tokens de diseño para light/dark mode.
 * Uso: const t = tk(isDark);  →  style={{ background: t.cardBg }}
 */
export const tk = (isDark) => ({
  // ── Fondos de tarjeta / contenedor ──────────────────────────
  cardBg:         isDark ? "#1e293b" : "white",
  cardBorder:     isDark ? "#334155" : "#f1f5f9",
  cardShadow:     isDark ? "0 1px 4px rgba(0,0,0,0.35)" : "0 1px 4px rgba(0,0,0,0.06)",

  // ── Inputs / selects ────────────────────────────────────────
  inputBg:        isDark ? "#0f172a" : "white",
  inputBorder:    isDark ? "#334155" : "#e2e8f0",
  inputText:      isDark ? "#f1f5f9" : "#1e293b",

  // ── Texto ───────────────────────────────────────────────────
  textPrimary:    isDark ? "#f1f5f9" : "#0f172a",
  textSecondary:  isDark ? "#94a3b8" : "#64748b",
  labelColor:     isDark ? "#94a3b8" : "#475569",

  // ── Tabla ───────────────────────────────────────────────────
  rowHover:       isDark ? "#263347" : "#fafbfc",
  rowBorder:      isDark ? "#1e293b" : "#f8fafc",
  headBorder:     isDark ? "#334155" : "#f1f5f9",

  // ── Código inline ───────────────────────────────────────────
  codeBg:         isDark ? "#172033" : "#f1f5f9",
  codeText:       isDark ? "#94a3b8" : "#475569",

  // ── Botón ghost / icon-button ───────────────────────────────
  iconBtnBg:      isDark ? "#263347" : "#f8fafc",
  iconBtnHover:   isDark ? "#2e3f57" : "#f1f5f9",
});
