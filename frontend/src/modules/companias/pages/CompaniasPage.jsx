import { useState, useEffect, useCallback } from "react";
import { Landmark, Pencil, Trash2, Search, Plus } from "lucide-react";
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
const EMPTY = { cliente_id: "", codigo_compania: "", nombre_compania: "", identificacion: "", estado: "activo" };

export function CompaniasPage() {
  const toast = useToast();
  const { isDark } = useTheme();
  const t = tk(isDark);
  const [rows, setRows] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCompanias = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get("/companias");
      setRows(data);
    } catch (e) {
      toast.error(e.message ?? "Error al cargar compañías");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompanias();
    api.get("/clientes").then(setClientes).catch(() => setClientes([]));
  }, [fetchCompanias]);

  const openModal = (c = null) => {
    setSelected(c);
    setForm(c ? {
      cliente_id: c.cliente_id ?? "",
      codigo_compania: c.codigo_compania ?? "",
      nombre_compania: c.nombre_compania ?? "",
      identificacion: c.identificacion ?? "",
      estado: c.estado ?? "activo",
    } : EMPTY);
    setModalOpen(true);
  };

  const filtered = rows.filter((c) =>
    c.nombre_compania?.toLowerCase().includes(search.toLowerCase()) ||
    c.codigo_compania?.toLowerCase().includes(search.toLowerCase()) ||
    c.nombre_cliente?.toLowerCase().includes(search.toLowerCase())
  );

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSave = async () => {
    if (!form.nombre_compania.trim()) { toast.warning("El nombre de la compañía es requerido"); return; }
    if (!form.codigo_compania.trim()) { toast.warning("El código de la compañía es requerido"); return; }
    if (!form.cliente_id) { toast.warning("Debe seleccionar un cliente"); return; }
    setSaving(true);
    try {
      const payload = { ...form, cliente_id: Number(form.cliente_id) };
      if (selected) {
        await api.put(`/companias/${selected.id}`, payload);
        toast.success("Compañía actualizada");
      } else {
        await api.post("/companias", payload);
        toast.success("Compañía creada");
      }
      setModalOpen(false);
      fetchCompanias();
    } catch (e) {
      toast.error(e.message ?? "Error al guardar compañía");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/companias/${deleteTarget.id}`);
      toast.success("Compañía eliminada");
      setDeleteTarget(null);
      fetchCompanias();
    } catch (e) {
      toast.error(e.message ?? "Error al eliminar compañía");
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
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: t.textPrimary }}>Compañías</h2>
          <p style={{ margin: "3px 0 0", fontSize: 13, color: t.textSecondary }}>Compañías asociadas a cada cliente</p>
        </div>
        <Button icon={<Plus size={15} />} onClick={() => openModal()}>Nueva compañía</Button>
      </div>

      <div style={{
        background: t.cardBg, borderRadius: 12, border: `1px solid ${t.cardBorder}`,
        boxShadow: t.cardShadow, marginBottom: 18,
        display: "flex", alignItems: "center", padding: "0 14px", gap: 10, height: 42,
      }}>
        <Search size={15} color="#94a3b8" />
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre, código o cliente..."
          style={{ flex: 1, border: "none", outline: "none", fontSize: 13, color: t.inputText, background: "transparent" }} />
      </div>

      <div style={{ background: t.cardBg, borderRadius: 14, border: `1px solid ${t.cardBorder}`, boxShadow: t.cardShadow, overflow: "hidden" }}>
        {loading ? <PageLoader /> : filtered.length === 0 ? (
          <EmptyState icon={<Landmark size={44} />} title="No se encontraron compañías"
            message="Agrega la primera compañía usando el botón 'Nueva compañía'."
            action={<Button size="sm" onClick={() => openModal()}>Crear compañía</Button>} />
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${t.headBorder}` }}>
                {["Compañía", "Código", "Cliente", "Identificación", "Estado", "Acciones"].map((h) => (
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
                        background: isDark ? "#1e3b2f" : "#f0fdf4",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "#22c55e", flexShrink: 0,
                      }}>
                        <Landmark size={16} />
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: t.textPrimary }}>{c.nombre_compania}</span>
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <code style={{ fontSize: 11, background: t.codeBg, padding: "2px 7px", borderRadius: 5, color: t.codeText }}>{c.codigo_compania}</code>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: t.textSecondary }}>{c.nombre_cliente ?? "—"}</td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: t.textSecondary }}>{c.identificacion ?? "—"}</td>
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={selected ? "Editar compañía" : "Nueva compañía"} size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={handleSave} loading={saving}>{selected ? "Guardar cambios" : "Crear compañía"}</Button>
          </>
        }>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Cliente */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: t.labelColor }}>
              Cliente <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <select value={form.cliente_id} onChange={set("cliente_id")} style={inputStyle}
              onFocus={(e) => e.currentTarget.style.borderColor = BRAND}
              onBlur={(e)  => e.currentTarget.style.borderColor = t.inputBorder}>
              <option value="">— Seleccionar cliente —</option>
              {clientes.map((cl) => (
                <option key={cl.id} value={cl.id}>{cl.nombre}</option>
              ))}
            </select>
          </div>

          {[
            { key: "nombre_compania",  label: "Nombre de la compañía",  required: true, placeholder: "Mi Empresa S.A." },
            { key: "codigo_compania",  label: "Código",                  required: true, placeholder: "MIEMP" },
            { key: "identificacion",   label: "Identificación (RUC/NIT)", placeholder: "1234567890001" },
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
        variant="danger" title="Eliminar compañía"
        message={`¿Eliminar la compañía "${deleteTarget?.nombre_compania}"? Esta acción no se puede deshacer.`}
        confirmText="Sí, eliminar" loading={deleting} />
    </div>
  );
}
