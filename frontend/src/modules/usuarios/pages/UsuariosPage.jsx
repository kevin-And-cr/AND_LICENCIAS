import { useState, useEffect, useCallback } from "react";
import { UserPlus, Pencil, Trash2, Search, Users, RefreshCw } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { Badge, EstadoBadge } from "../../../components/ui/Badge";
import { EmptyState } from "../../../components/ui/EmptyState";
import { PageLoader } from "../../../components/ui/Spinner";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import { useToast } from "../../../store/ToastContext";
import { useTheme } from "../../../store/ThemeContext";
import { tk } from "../../../utils/theme";
import { UsuarioModal } from "../components/UsuarioModal";
import { api } from "../../../services/api";

export function UsuariosPage() {
  const toast = useToast();
  const { isDark } = useTheme();
  const t = tk(isDark);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modal de creación/edición
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState(null); // null = crear, objeto = editar

  // Modal de confirmación de eliminación
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchUsuarios = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get("/usuarios");
      setRows(data);
    } catch (e) {
      toast.error(e.message ?? "Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsuarios(); }, [fetchUsuarios]);

  const filtered = rows.filter((u) =>
    u.nombre_usuario?.toLowerCase().includes(search.toLowerCase()) ||
    u.correo?.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/usuarios/${deleteTarget.id}`);
      toast.success("Usuario eliminado correctamente");
      setDeleteTarget(null);
      fetchUsuarios();
    } catch (e) {
      toast.error(e.message ?? "Error al eliminar usuario");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div style={{ animation: "fadeInUp 0.3s ease-out" }}>
      {/* Encabezado */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: t.textPrimary }}>Usuarios</h2>
          <p style={{ margin: "3px 0 0", fontSize: 13, color: t.textSecondary }}>
            Gestión de usuarios del sistema
          </p>
        </div>
        <Button
          icon={<UserPlus size={15} />}
          onClick={() => { setSelected(null); setModalOpen(true); }}
        >
          Nuevo usuario
        </Button>
      </div>

      {/* Barra de búsqueda */}
      <div style={{
        background: t.cardBg, borderRadius: 12, border: `1px solid ${t.cardBorder}`,
        boxShadow: t.cardShadow,
        marginBottom: 18,
        display: "flex", alignItems: "center", padding: "0 14px", gap: 10,
        height: 42,
      }}>
        <Search size={15} color="#94a3b8" style={{ flexShrink: 0 }} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre o correo..."
          style={{
            flex: 1, border: "none", outline: "none",
            fontSize: 13, color: t.inputText, background: "transparent",
          }}
        />
        {loading && <RefreshCw size={14} color="#94a3b8" style={{ animation: "spin 1s linear infinite" }} />}
      </div>

      {/* Tabla */}
      <div style={{
        background: t.cardBg, borderRadius: 14,
        border: `1px solid ${t.cardBorder}`,
        boxShadow: t.cardShadow,
        overflow: "hidden",
      }}>
        {loading ? (
          <PageLoader />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Users size={44} />}
            title="No se encontraron usuarios"
            message={search ? "Intenta con otro término de búsqueda." : "Crea el primer usuario usando el botón 'Nuevo usuario'."}
            action={!search && (
              <Button size="sm" onClick={() => { setSelected(null); setModalOpen(true); }}>
                Crear usuario
              </Button>
            )}
          />
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${t.headBorder}` }}>
                {["Usuario", "Correo", "Estado", "Roles", "Acciones"].map((h) => (
                  <th key={h} style={{
                    padding: "12px 16px", textAlign: "left",
                    fontSize: 11, fontWeight: 700, color: "#94a3b8",
                    textTransform: "uppercase", letterSpacing: "0.06em",
                    whiteSpace: "nowrap",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => (
                <tr key={u.id} style={{
                  borderBottom: i < filtered.length - 1 ? `1px solid ${t.rowBorder}` : "none",
                  transition: "background 0.1s",
                }}
                  onMouseEnter={(e) => e.currentTarget.style.background = t.rowHover}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: "50%",
                        background: "#F48124", color: "white",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 12, fontWeight: 700, flexShrink: 0,
                      }}>
                        {u.nombre_usuario?.charAt(0).toUpperCase()}
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: t.textPrimary }}>
                        {u.nombre_usuario}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: t.textSecondary }}>{u.correo}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <EstadoBadge estado={u.estado} />
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {(u.roles ?? []).map((r) => (
                        <Badge key={r} variant="blue" dot={false}>{r}</Badge>
                      ))}
                      {(!u.roles || u.roles.length === 0) && (
                        <span style={{ fontSize: 12, color: "#94a3b8" }}>Sin roles</span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <Button
                        size="sm" variant="ghost"
                        icon={<Pencil size={13} />}
                        onClick={() => { setSelected(u); setModalOpen(true); }}
                      >
                        Editar
                      </Button>
                      <Button
                        size="sm" variant="ghost"
                        icon={<Trash2 size={13} />}
                        style={{ color: "#ef4444" }}
                        onClick={() => setDeleteTarget(u)}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal crear/editar */}
      <UsuarioModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        usuario={selected}
        onSaved={() => { setModalOpen(false); fetchUsuarios(); }}
      />

      {/* Modal confirmar eliminación */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        variant="danger"
        title="Eliminar usuario"
        message={`¿Estás seguro de eliminar al usuario "${deleteTarget?.nombre_usuario}"? Esta acción no se puede deshacer.`}
        confirmText="Sí, eliminar"
        loading={deleting}
      />
    </div>
  );
}
