import { useState, useEffect, useCallback } from "react";
import { Building2, Pencil, Trash2, Search, Plus } from "lucide-react";
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
const EMPTY = { nombre: "", identificacion: "", correo_contacto: "", telefono_contacto: "", estado: "activo" };

export function ClientesPage() {
  const toast = useToast();
  const { isDark } = useTheme();
  const t = tk(isDark);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchClientes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get("/clientes");
      setRows(data);
    } catch (e) {
      toast.error(e.message ?? "Error al cargar clientes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchClientes(); }, [fetchClientes]);

  const openModal = (c = null) => {
    setSelected(c);
    setForm(c ? {
      nombre: c.nombre,
      identificacion: c.identificacion ?? "",
      correo_contacto: c.correo_contacto ?? "",
      telefono_contacto: c.telefono_contacto ?? "",
      estado: c.estado,
    } : EMPTY);
    setModalOpen(true);
  };

  const filtered = rows.filter((c) =>
    c.nombre?.toLowerCase().includes(search.toLowerCase()) ||
    c.identificacion?.toLowerCase().includes(search.toLowerCase())
  );

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSave = async () => {
    if (!form.nombre.trim()) { toast.warning("El nombre del cliente es requerido"); return; }
    setSaving(true);
    try {
      if (selected) {
        await api.put(`/clientes/${selected.id}`, form);
        toast.success("Cliente actualizado");
      } else {
        await api.post("/clientes", form);
        toast.success("Cliente creado");
      }
      setModalOpen(false);
      fetchClientes();
    } catch (e) {
      toast.error(e.message ?? "Error al guardar cliente");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/clientes/${deleteTarget.id}`);
      toast.success("Cliente eliminado");
      setDeleteTarget(null);
      fetchClientes();
    } catch (e) {
      toast.error(e.message ?? "Error al eliminar cliente");
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
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: t.textPrimary }}>Clientes</h2>
          <p style={{ margin: "3px 0 0", fontSize: 13, color: t.textSecondary }}>Empresas cliente del sistema</p>
        </div>
        <Button icon={<Plus size={15} />} onClick={() => openModal()}>Nuevo cliente</Button>
      </div>

      <div style={{
        background: t.cardBg, borderRadius: 12, border: `1px solid ${t.cardBorder}`,
        boxShadow: t.cardShadow, marginBottom: 18,
        display: "flex", alignItems: "center", padding: "0 14px", gap: 10, height: 42,
      }}>
        <Search size={15} color="#94a3b8" />
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre o identificación..."
          style={{ flex: 1, border: "none", outline: "none", fontSize: 13, color: t.inputText, background: "transparent" }} />
      </div>

      <div style={{ background: t.cardBg, borderRadius: 14, border: `1px solid ${t.cardBorder}`, boxShadow: t.cardShadow, overflow: "hidden" }}>
        {loading ? <PageLoader /> : filtered.length === 0 ? (
          <EmptyState icon={<Building2 size={44} />} title="No se encontraron clientes"
            message="Agrega el primer cliente usando el botón 'Nuevo cliente'."
            action={<Button size="sm" onClick={() => openModal()}>Crear cliente</Button>} />
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${t.headBorder}` }}>
                {["Nombre", "Identificación", "Correo contacto", "Teléfono", "Estado", "Acciones"].map((h) => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr key={c.id} style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${t.rowBorder}` : "none", transition: "background 0.1s" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = t.rowHover}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: isDark ? "#1e3a5f" : "#eff6ff",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "#3b82f6", flexShrink: 0,
                      }}>
                        <Building2 size={16} />
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: t.textPrimary }}>{c.nombre}</span>
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: t.textSecondary }}>{c.identificacion ?? "—"}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: t.textSecondary }}>{c.correo_contacto ?? "—"}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: t.textSecondary }}>{c.telefono_contacto ?? "—"}</td>
                  <td style={{ padding: "12px 16px" }}><EstadoBadge estado={c.estado} /></td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <Button size="sm" variant="ghost" icon={<Pencil size={13} />} onClick={() => openModal(c)}>Editar</Button>
                      <Button size="sm" variant="ghost" icon={<Trash2 size={13} />} style={{ color: "#ef4444" }} onClick={() => setDeleteTarget(c)}>Eliminar</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={selected ? "Editar cliente" : "Nuevo cliente"} size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={handleSave} loading={saving}>{selected ? "Guardar cambios" : "Crear cliente"}</Button>
          </>
        }>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {[
            { key: "nombre",           label: "Nombre",           required: true, placeholder: "Empresa XYZ S.A." },
            { key: "identificacion",   label: "Identificación",   placeholder: "1234567890001" },
            { key: "correo_contacto",  label: "Correo de contacto", type: "email", placeholder: "contacto@empresa.com" },
            { key: "telefono_contacto", label: "Teléfono de contacto", placeholder: "+593 99 999 9999" },
          ].map(({ key, label, placeholder, type = "text", required }) => (
            <div key={key} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: t.labelColor }}>
                {label} {required && <span style={{ color: "#ef4444" }}>*</span>}
              </label>
              <input type={type} value={form[key]} onChange={set(key)} placeholder={placeholder}
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
        variant="danger" title="Eliminar cliente"
        message={`¿Eliminar el cliente "${deleteTarget?.nombre}"? Esto también eliminará sus compañías y datos asociados.`}
        confirmText="Sí, eliminar" loading={deleting} />
    </div>
  );
}
