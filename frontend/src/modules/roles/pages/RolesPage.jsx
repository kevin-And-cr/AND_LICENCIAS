import { useState, useEffect, useCallback } from "react";
import { Shield, Pencil, Trash2, Search, Plus } from "lucide-react";
import { Button } from "../../../components/ui/Button";
import { EstadoBadge } from "../../../components/ui/Badge";
import { EmptyState } from "../../../components/ui/EmptyState";
import { PageLoader } from "../../../components/ui/Spinner";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import { Modal } from "../../../components/ui/Modal";
import { useToast } from "../../../store/ToastContext";
import { useTheme } from "../../../store/ThemeContext";
import { tk } from "../../../utils/theme";
import { api } from "../../../services/api";

const BRAND = "#F48124";
const EMPTY_ROL = { nombre: "", codigo: "", descripcion: "", estado: "activo" };

export function RolesPage() {
  const toast = useToast();
  const { isDark } = useTheme();
  const t = tk(isDark);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY_ROL);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get("/roles");
      setRows(data);
    } catch (e) {
      toast.error(e.message ?? "Error al cargar roles");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRoles(); }, [fetchRoles]);

  const openModal = (rol = null) => {
    setSelected(rol);
    setForm(rol ? { nombre: rol.nombre, codigo: rol.codigo, descripcion: rol.descripcion ?? "", estado: rol.estado } : EMPTY_ROL);
    setModalOpen(true);
  };

  const filtered = rows.filter((r) =>
    r.nombre?.toLowerCase().includes(search.toLowerCase()) ||
    r.codigo?.toLowerCase().includes(search.toLowerCase())
  );

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSave = async () => {
    if (!form.nombre.trim() || !form.codigo.trim()) { toast.warning("Nombre y código son requeridos"); return; }
    setSaving(true);
    try {
      if (selected) {
        await api.put(`/roles/${selected.id}`, form);
        toast.success("Rol actualizado");
      } else {
        await api.post("/roles", form);
        toast.success("Rol creado");
      }
      setModalOpen(false);
      fetchRoles();
    } catch (e) {
      toast.error(e.message ?? "Error al guardar rol");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/roles/${deleteTarget.id}`);
      toast.success("Rol eliminado");
      setDeleteTarget(null);
      fetchRoles();
    } catch (e) {
      toast.error(e.message ?? "Error al eliminar rol");
    } finally {
      setDeleting(false);
    }
  };

  const inputStyle = {
    border: `1.5px solid ${t.inputBorder}`, borderRadius: 9, padding: "9px 12px",
    fontSize: 13, color: t.inputText, outline: "none", background: t.inputBg,
    width: "100%", boxSizing: "border-box",
  };

  return (
    <div style={{ animation: "fadeInUp 0.3s ease-out" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: t.textPrimary }}>Roles</h2>
          <p style={{ margin: "3px 0 0", fontSize: 13, color: t.textSecondary }}>Control de acceso por roles</p>
        </div>
        <Button icon={<Plus size={15} />} onClick={() => openModal()}>Nuevo rol</Button>
      </div>

      <div style={{
        background: t.cardBg, borderRadius: 12, border: `1px solid ${t.cardBorder}`,
        boxShadow: t.cardShadow, marginBottom: 18,
        display: "flex", alignItems: "center", padding: "0 14px", gap: 10, height: 42,
      }}>
        <Search size={15} color="#94a3b8" />
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre o código..."
          style={{ flex: 1, border: "none", outline: "none", fontSize: 13, color: t.inputText, background: "transparent" }} />
      </div>

      <div style={{ background: t.cardBg, borderRadius: 14, border: `1px solid ${t.cardBorder}`, boxShadow: t.cardShadow, overflow: "hidden" }}>
        {loading ? <PageLoader /> : filtered.length === 0 ? (
          <EmptyState icon={<Shield size={44} />} title="No se encontraron roles"
            message="Crea el primer rol usando el botón 'Nuevo rol'."
            action={<Button size="sm" onClick={() => openModal()}>Crear rol</Button>} />
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${t.headBorder}` }}>
                {["Rol", "Código", "Descripción", "Estado", "Acciones"].map((h) => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr key={r.id} style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${t.rowBorder}` : "none", transition: "background 0.1s" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = t.rowHover}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600, color: t.textPrimary }}>{r.nombre}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <code style={{ fontSize: 11, background: t.codeBg, padding: "2px 7px", borderRadius: 5, color: t.codeText }}>{r.codigo}</code>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: t.textSecondary }}>{r.descripcion ?? "—"}</td>
                  <td style={{ padding: "12px 16px" }}><EstadoBadge estado={r.estado} /></td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <Button size="sm" variant="ghost" icon={<Pencil size={13} />} onClick={() => openModal(r)}>Editar</Button>
                      <Button size="sm" variant="ghost" icon={<Trash2 size={13} />} style={{ color: "#ef4444" }} onClick={() => setDeleteTarget(r)}>Eliminar</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={selected ? "Editar rol" : "Nuevo rol"} size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={handleSave} loading={saving}>{selected ? "Guardar cambios" : "Crear rol"}</Button>
          </>
        }>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {[
            { key: "nombre",      label: "Nombre",      placeholder: "Administrador", required: true },
            { key: "codigo",      label: "Código",      placeholder: "administrador", required: true },
            { key: "descripcion", label: "Descripción", placeholder: "Descripción del rol" },
          ].map(({ key, label, placeholder, required }) => (
            <div key={key} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: t.labelColor }}>
                {label} {required && <span style={{ color: "#ef4444" }}>*</span>}
              </label>
              <input value={form[key]} onChange={set(key)} placeholder={placeholder}
                style={inputStyle}
                onFocus={(e) => e.currentTarget.style.borderColor = BRAND}
                onBlur={(e)  => e.currentTarget.style.borderColor = t.inputBorder} />
            </div>
          ))}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: t.labelColor }}>Estado</label>
            <select value={form.estado} onChange={set("estado")} style={inputStyle}
              onFocus={(e) => e.currentTarget.style.borderColor = BRAND}
              onBlur={(e)  => e.currentTarget.style.borderColor = t.inputBorder}>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        variant="danger" title="Eliminar rol"
        message={`¿Eliminar el rol "${deleteTarget?.nombre}"? Esta acción no se puede deshacer.`}
        confirmText="Sí, eliminar" loading={deleting} />
    </div>
  );
}