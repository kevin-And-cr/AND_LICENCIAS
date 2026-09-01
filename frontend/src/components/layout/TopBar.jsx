import { useLocation } from "react-router-dom";
import { Bell } from "lucide-react";
import { useTheme } from "../../store/ThemeContext";

const BREADCRUMBS = {
  "/dashboard":  "Dashboard",
  "/usuarios":   "Usuarios",
  "/roles":      "Roles",
  "/clientes":   "Clientes",
  "/companias":  "Compañías",
  "/modulos":    "Módulos",
  "/licencias":  "Licencias",
};

export function TopBar() {
  const { pathname } = useLocation();
  const { isDark } = useTheme();
  const title = BREADCRUMBS[pathname] ?? "AND Tools";

  // Leer nombre de usuario del token (simple decode)
  let userName = "Admin";
  try {
    const token = localStorage.getItem("access_token");
    if (token) {
      const payload = JSON.parse(atob(token.split(".")[1]));
      userName = payload.sub ?? "Admin";
    }
  } catch {/* ignora */}

  return (
    <header style={{
      height: 60, flexShrink: 0,
      background: isDark ? "#1e293b" : "white",
      borderBottom: `1px solid ${isDark ? "#334155" : "#f1f5f9"}`,
      display: "flex", alignItems: "center",
      justifyContent: "space-between",
      padding: "0 24px",
      position: "sticky", top: 0, zIndex: 100,
      transition: "background 0.25s, border-color 0.25s",
    }}>
      {/* Título de sección */}
      <div>
        <h1 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: isDark ? "#f1f5f9" : "#0f172a" }}>
          {title}
        </h1>
      </div>

      {/* Acciones derecha */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {/* Notificaciones (placeholder) */}
        <button style={{
          background: isDark ? "#263347" : "#f8fafc",
          border: `1px solid ${isDark ? "#334155" : "transparent"}`,
          cursor: "pointer",
          width: 36, height: 36, borderRadius: 9,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#94a3b8", transition: "background 0.15s",
        }}
          onMouseEnter={(e) => e.currentTarget.style.background = isDark ? "#2e3f57" : "#f1f5f9"}
          onMouseLeave={(e) => e.currentTarget.style.background = isDark ? "#263347" : "#f8fafc"}
        >
          <Bell size={17} />
        </button>

        {/* Avatar de usuario */}
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{
            width: 34, height: 34, borderRadius: "50%",
            background: "#F48124", color: "white",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, fontWeight: 700,
          }}>
            {userName.charAt(0).toUpperCase()}
          </div>
          <div style={{ lineHeight: 1 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: isDark ? "#f1f5f9" : "#1e293b" }}>
              {userName}
            </p>
            <p style={{ margin: 0, fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
              Administrador
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
