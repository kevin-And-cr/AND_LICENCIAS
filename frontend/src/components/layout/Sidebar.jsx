import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Users, Shield, Building2, Building,
  Package, FileKey, ChevronLeft, ChevronRight, LogOut,
  Sun, Moon,
} from "lucide-react";
import { logout } from "../../modules/auth/hooks/useAuth";
import { useTheme } from "../../store/ThemeContext";

const BRAND        = "#F48124";
const SIDEBAR_BG   = "#0f1623";
const SIDEBAR_HOVER = "#162032";

/** Curva compartida con la transición del width del aside */
const ANIM = "0.28s cubic-bezier(0.4,0,0.2,1)";

const NAV_ITEMS = [
  { label: "Licencias", icon: FileKey,         to: "/licencias" },
  { label: "Clientes",  icon: Building2,       to: "/clientes"  },
  { label: "Compañías", icon: Building,        to: "/companias" },
  { label: "Módulos",   icon: Package,         to: "/modulos"   },
  { label: "Usuarios",  icon: Users,           to: "/usuarios"  },
  { label: "Roles",     icon: Shield,          to: "/roles"     },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const { isDark, toggle } = useTheme();

  return (
    <aside style={{
      width: collapsed ? 64 : 230,
      minWidth: collapsed ? 64 : 230,
      background: SIDEBAR_BG,
      display: "flex", flexDirection: "column",
      height: "100vh", flexShrink: 0,
      /* width + minWidth sincronizan para que flex no produzca saltos */
      transition: `width ${ANIM}, min-width ${ANIM}`,
      overflow: "hidden",
    }}>

      {/* ── Logo ──────────────────────────────── */}
      <div style={{
        height: 68, flexShrink: 0,
        display: "flex", alignItems: "center",
        padding: "0 15px", gap: 10,
        borderBottom: "1px solid #1e2d42",
        overflow: "hidden",
      }}>
        <img
          src="/logo-and.png"
          alt="AND Tools"
          style={{ width: 34, height: 34, objectFit: "contain", flexShrink: 0 }}
        />
        {/*
          El div NO se desmonta: siempre está en el DOM.
          La transición de opacity + maxWidth produce el fade suave.
        */}
        <div style={{
          overflow: "hidden",
          opacity:  collapsed ? 0 : 1,
          maxWidth: collapsed ? 0 : 160,
          transition: `opacity 0.15s ease, max-width ${ANIM}`,
          whiteSpace: "nowrap",
          lineHeight: 1,
        }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "white" }}>AND Tools</p>
          <p style={{ margin: "3px 0 0", fontSize: 10, color: "#4b6280" }}>Administrador</p>
        </div>
      </div>

      {/* ── Nav ───────────────────────────────── */}
      <nav style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "10px 8px" }}>
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 2 }}>
          {NAV_ITEMS.map((item) => (
            <li key={item.to}>
              <NavItem item={item} collapsed={collapsed} />
            </li>
          ))}
        </ul>
      </nav>

      {/* ── Footer ────────────────────────────── */}
      <div style={{
        padding: "10px 8px", flexShrink: 0,
        borderTop: "1px solid #1e2d42",
        display: "flex", flexDirection: "column", gap: 2,
      }}>
        <FooterBtn
          collapsed={collapsed}
          icon={isDark ? <Sun size={15} /> : <Moon size={15} />}
          label={isDark ? "Modo claro" : "Modo oscuro"}
          onClick={toggle}
        />
        <FooterBtn
          collapsed={collapsed}
          icon={collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          label={collapsed ? "Expandir" : "Colapsar"}
          onClick={() => setCollapsed((c) => !c)}
        />
        <FooterBtn
          collapsed={collapsed}
          icon={<LogOut size={15} />}
          label="Cerrar sesión"
          onClick={() => { logout(); navigate("/login", { replace: true }); }}
          danger
        />
      </div>
    </aside>
  );
}

/* ── NavItem ─────────────────────────────────────────────── */
function NavItem({ item, collapsed }) {
  const [hovered, setHovered] = useState(false);
  const Icon = item.icon;

  return (
    <NavLink
      to={item.to}
      title={collapsed ? item.label : undefined}
      /*
        La función recibe isActive de NavLink.
        hovered viene del closure del componente (estado local).
        Activo tiene siempre prioridad sobre hover.
      */
      style={({ isActive }) => ({
        display: "flex", alignItems: "center",
        gap: 10, padding: "10px 12px",
        borderRadius: 9, textDecoration: "none", overflow: "hidden",
        background: isActive ? `${BRAND}22` : hovered ? SIDEBAR_HOVER : "none",
        color:      isActive ? BRAND        : hovered ? "#94a3b8"     : "#4b6280",
        fontWeight: isActive ? 700 : 500,
        fontSize: 13,
        transition: "background 0.15s, color 0.15s",
        borderLeft: isActive ? `3px solid ${BRAND}` : "3px solid transparent",
      })}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Icon size={17} style={{ flexShrink: 0 }} />
      <span style={{
        whiteSpace: "nowrap", overflow: "hidden",
        opacity:  collapsed ? 0 : 1,
        maxWidth: collapsed ? 0 : 150,
        transition: `opacity 0.15s ease, max-width ${ANIM}`,
      }}>
        {item.label}
      </span>
    </NavLink>
  );
}

/* ── FooterBtn ───────────────────────────────────────────── */
function FooterBtn({ collapsed, icon, label, onClick, danger = false }) {
  const [hovered, setHovered] = useState(false);

  const color   = hovered ? (danger ? "#f87171" : "#94a3b8") : (danger ? "#ef4444" : "#4b6280");
  const bg      = hovered ? (danger ? "#1f1215" : SIDEBAR_HOVER) : "none";

  return (
    <button
      onClick={onClick}
      title={collapsed ? label : undefined}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        width: "100%", background: bg,
        border: "none", padding: "10px 12px",
        borderRadius: 9, cursor: "pointer", color,
        transition: "background 0.15s, color 0.15s",
        overflow: "hidden",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span style={{ flexShrink: 0, display: "flex" }}>{icon}</span>
      <span style={{
        fontSize: 12, fontWeight: 500,
        whiteSpace: "nowrap", overflow: "hidden",
        opacity:  collapsed ? 0 : 1,
        maxWidth: collapsed ? 0 : 140,
        transition: `opacity 0.15s ease, max-width ${ANIM}`,
      }}>
        {label}
      </span>
    </button>
  );
}
