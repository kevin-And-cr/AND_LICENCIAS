import { Outlet, Navigate } from "react-router-dom";
import { getAccessToken } from "../modules/auth/hooks/useAuth";
import { Sidebar } from "../components/layout/Sidebar";
import { TopBar } from "../components/layout/TopBar";
import { useTheme } from "../store/ThemeContext";

/** Layout protegido: redirige a /login si no hay token. */
export function MainLayout() {
  const token = getAccessToken();
  if (!token) return <Navigate to="/login" replace />;
  const { isDark } = useTheme();

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <Sidebar />

      {/* Área de contenido */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <TopBar />
        <main style={{
          flex: 1, overflowY: "auto",
          background: isDark ? "#0f172a" : "#f8fafc",
          padding: "28px 28px",
          transition: "background 0.25s",
        }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
