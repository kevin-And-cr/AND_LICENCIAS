/**
 * EmptyState — se muestra cuando una tabla/lista no tiene datos.
 *
 * Props:
 *   icon     ReactNode   (ícono lucide)
 *   title    string
 *   message  string
 *   action   ReactNode   (botón opcional)
 */
export function EmptyState({ icon, title = "Sin resultados", message, action }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "60px 24px", textAlign: "center", gap: 12,
    }}>
      {icon && (
        <div style={{ color: "#cbd5e1", marginBottom: 4 }}>
          {icon}
        </div>
      )}
      <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: "#334155" }}>{title}</p>
      {message && (
        <p style={{ margin: 0, fontSize: 13, color: "#94a3b8", maxWidth: 320 }}>{message}</p>
      )}
      {action && <div style={{ marginTop: 8 }}>{action}</div>}
    </div>
  );
}
