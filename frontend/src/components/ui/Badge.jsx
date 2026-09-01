const VARIANTS = {
  green:   { bg: "#dcfce7", color: "#166534", dot: "#16a34a" },
  red:     { bg: "#fee2e2", color: "#991b1b", dot: "#dc2626" },
  yellow:  { bg: "#fef9c3", color: "#854d0e", dot: "#ca8a04" },
  blue:    { bg: "#dbeafe", color: "#1e40af", dot: "#2563eb" },
  orange:  { bg: "#ffedd5", color: "#9a3412", dot: "#f48124" },
  gray:    { bg: "#f1f5f9", color: "#475569", dot: "#94a3b8" },
  purple:  { bg: "#ede9fe", color: "#5b21b6", dot: "#7c3aed" },
};

/**
 * Badge de estado con punto de color.
 *
 * Props:
 *   variant  keyof VARIANTS   (default "gray")
 *   dot      boolean          (muestra el punto)  (default true)
 */
export function Badge({ children, variant = "gray", dot = true, style: extra = {} }) {
  const v = VARIANTS[variant] ?? VARIANTS.gray;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: v.bg, color: v.color,
      fontSize: 11, fontWeight: 600,
      padding: "2px 9px", borderRadius: 99,
      whiteSpace: "nowrap",
      ...extra,
    }}>
      {dot && (
        <span style={{
          width: 6, height: 6, borderRadius: "50%",
          background: v.dot, flexShrink: 0,
        }} />
      )}
      {children}
    </span>
  );
}

/** Mapa rápido: activo → green, inactivo → red, etc. */
export function EstadoBadge({ estado }) {
  const map = {
    activo:   { variant: "green",  label: "Activo"   },
    inactivo: { variant: "red",    label: "Inactivo" },
    pendiente:{ variant: "yellow", label: "Pendiente"},
    expirado: { variant: "gray",   label: "Expirado" },
  };
  const m = map[estado?.toLowerCase()] ?? { variant: "gray", label: estado ?? "—" };
  return <Badge variant={m.variant}>{m.label}</Badge>;
}
