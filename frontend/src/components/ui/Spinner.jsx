const BRAND = "#F48124";

export function Spinner({ size = 24, color = BRAND, style: extra = {} }) {
  return (
    <svg
      style={{ animation: "spin 0.75s linear infinite", ...extra }}
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      aria-label="Cargando"
    >
      <circle cx="12" cy="12" r="10" stroke={color} strokeOpacity="0.2" strokeWidth="3" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke={color} strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function PageLoader() {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      height: "100%", minHeight: 300,
    }}>
      <Spinner size={36} />
    </div>
  );
}
