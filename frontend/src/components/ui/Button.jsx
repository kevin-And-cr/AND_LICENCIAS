const BRAND = "#F48124";

const VARIANTS = {
  primary: {
    bg: BRAND, color: "white", border: "transparent",
    hover: "#e06800",
  },
  secondary: {
    bg: "#f1f5f9", color: "#475569", border: "transparent",
    hover: "#e2e8f0",
  },
  ghost: {
    bg: "transparent", color: "#64748b", border: "transparent",
    hover: "#f1f5f9",
  },
  danger: {
    bg: "#dc2626", color: "white", border: "transparent",
    hover: "#b91c1c",
  },
  warning: {
    bg: "#f59e0b", color: "white", border: "transparent",
    hover: "#d97706",
  },
  outline: {
    bg: "white", color: "#475569", border: "#e2e8f0",
    hover: "#f8fafc",
  },
};

const SIZES = {
  sm: { padding: "6px 12px", fontSize: 12, height: 30, borderRadius: 7 },
  md: { padding: "9px 18px", fontSize: 13, height: 38, borderRadius: 9 },
  lg: { padding: "12px 24px", fontSize: 14, height: 46, borderRadius: 11 },
};

/**
 * Botón reutilizable con variantes y estados.
 *
 * Props:
 *   variant   "primary" | "secondary" | "ghost" | "danger" | "warning" | "outline"
 *   size      "sm" | "md" | "lg"
 *   loading   boolean
 *   disabled  boolean
 *   icon      ReactNode   (ícono a la izquierda del texto)
 *   iconRight ReactNode   (ícono a la derecha del texto)
 *   full      boolean     (width: 100%)
 */
export function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  icon,
  iconRight,
  full = false,
  style: extraStyle = {},
  ...props
}) {
  const v = VARIANTS[variant] ?? VARIANTS.primary;
  const s = SIZES[size] ?? SIZES.md;
  const isDisabled = disabled || loading;

  return (
    <button
      disabled={isDisabled}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        gap: 7, cursor: isDisabled ? "not-allowed" : "pointer",
        fontWeight: 600, fontFamily: "inherit",
        background: v.bg, color: v.color,
        border: `1px solid ${v.border}`,
        padding: s.padding, fontSize: s.fontSize, borderRadius: s.borderRadius,
        height: s.height,
        opacity: isDisabled ? 0.6 : 1,
        transition: "background 0.15s, opacity 0.15s",
        whiteSpace: "nowrap",
        width: full ? "100%" : undefined,
        outline: "none",
        ...extraStyle,
      }}
      onMouseEnter={(e) => { if (!isDisabled) e.currentTarget.style.background = v.hover; }}
      onMouseLeave={(e) => { if (!isDisabled) e.currentTarget.style.background = v.bg;    }}
      {...props}
    >
      {loading && <Spinner size={14} color="currentColor" />}
      {!loading && icon && icon}
      {children}
      {!loading && iconRight && iconRight}
    </button>
  );
}

function Spinner({ size = 14, color = BRAND }) {
  return (
    <svg
      style={{ animation: "spin 0.75s linear infinite", flexShrink: 0 }}
      width={size} height={size} viewBox="0 0 24 24" fill="none"
    >
      <circle cx="12" cy="12" r="10" stroke={color} strokeOpacity="0.25" strokeWidth="3" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke={color} strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
