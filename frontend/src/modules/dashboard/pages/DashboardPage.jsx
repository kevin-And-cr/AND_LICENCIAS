import { useEffect, useState } from "react";
import { Users, Building2, Package, FileKey, Activity } from "lucide-react";
import { PageLoader } from "../../../components/ui/Spinner";
import { useTheme } from "../../../store/ThemeContext";
import { tk } from "../../../utils/theme";

const BRAND = "#F48124";

const STAT_CARDS = [
  { key: "clientes",  label: "Clientes activos",  icon: Building2, color: "#3b82f6", lightBg: "#eff6ff", darkBg: "rgba(59,130,246,0.12)" },
  { key: "usuarios",  label: "Usuarios",           icon: Users,     color: "#8b5cf6", lightBg: "#f5f3ff", darkBg: "rgba(139,92,246,0.12)" },
  { key: "modulos",   label: "Módulos",            icon: Package,   color: BRAND,     lightBg: "#fff7ed", darkBg: "rgba(244,129,36,0.12)" },
  { key: "licencias", label: "Licencias activas",  icon: FileKey,   color: "#10b981", lightBg: "#ecfdf5", darkBg: "rgba(16,185,129,0.12)" },
];

export function DashboardPage() {
  const { isDark } = useTheme();
  const t = tk(isDark);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: reemplazar con llamadas reales a la API
    const timeout = setTimeout(() => {
      setStats({ clientes: 0, usuarios: 0, modulos: 0, licencias: 0 });
      setLoading(false);
    }, 600);
    return () => clearTimeout(timeout);
  }, []);

  if (loading) return <PageLoader />;

  return (
    <div style={{ animation: "fadeInUp 0.3s ease-out" }}>
      {/* Bienvenida */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: t.textPrimary }}>
          Bienvenido de vuelta 👋
        </h2>
        <p style={{ margin: "4px 0 0", fontSize: 14, color: t.textSecondary }}>
          Resumen general del sistema de licenciamiento
        </p>
      </div>

      {/* Stats cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
        gap: 18, marginBottom: 32,
      }}>
        {STAT_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.key} style={{
              background: t.cardBg, borderRadius: 14,
              padding: "20px 22px",
              boxShadow: t.cardShadow,
              border: `1px solid ${t.cardBorder}`,
              display: "flex", alignItems: "center", gap: 16,
              transition: "box-shadow 0.2s",
            }}
              onMouseEnter={(e) => e.currentTarget.style.boxShadow = isDark ? "0 4px 20px rgba(0,0,0,0.4)" : "0 4px 16px rgba(0,0,0,0.10)"}
              onMouseLeave={(e) => e.currentTarget.style.boxShadow = t.cardShadow}
            >
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: isDark ? card.darkBg : card.lightBg,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: card.color, flexShrink: 0,
              }}>
                <Icon size={22} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 26, fontWeight: 800, color: t.textPrimary, lineHeight: 1 }}>
                  {stats[card.key]}
                </p>
                <p style={{ margin: "4px 0 0", fontSize: 12, color: t.textSecondary, fontWeight: 500 }}>
                  {card.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Accesos rápidos */}
      <div style={{
        background: t.cardBg, borderRadius: 14,
        border: `1px solid ${t.cardBorder}`,
        boxShadow: t.cardShadow,
        padding: "20px 24px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <Activity size={16} color={BRAND} />
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: t.textPrimary }}>
            Accesos rápidos
          </h3>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10 }}>
          {[
            { label: "Gestionar usuarios",   to: "/usuarios",  color: "#8b5cf6" },
            { label: "Ver licencias",        to: "/licencias", color: "#10b981" },
            { label: "Administrar clientes", to: "/clientes",  color: "#3b82f6" },
            { label: "Configurar módulos",   to: "/modulos",   color: BRAND     },
          ].map((link) => (
            <a
              key={link.to}
              href={link.to}
              style={{
                display: "block", padding: "12px 16px", borderRadius: 10,
                background: t.iconBtnBg,
                border: `1px solid ${t.cardBorder}`,
                textDecoration: "none",
                fontSize: 12, fontWeight: 600, color: link.color,
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = t.iconBtnHover}
              onMouseLeave={(e) => e.currentTarget.style.background = t.iconBtnBg}
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
