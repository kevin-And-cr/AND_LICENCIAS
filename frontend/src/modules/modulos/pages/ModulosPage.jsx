import { useState, useEffect, useCallback } from "react";
import { Package, Pencil, Trash2, Search, Plus, Layers, Cpu } from "lucide-react";
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

const EMPTY = {
  codigo: "",
  nombre: "",
  descripcion: "",
  modulo_padre_id: "",
  tipo_modulo: "funcionalidad",
  ruta: "",
  icono: "",
  orden: 0,
  requiere_jobs: false,
  estado: "activo",
};

const TIPO_BADGE = {
  contenedor: { bg: "rgba(99,102,241,0.12)", color: "#818cf8", label: "Contenedor" },
  funcionalidad: { bg: "rgba(34,197,94,0.12)", color: "#4ade80", label: "Funcionalidad" },
};

function TipoBadge({ tipo }) {
  const cfg = TIPO_BADGE[tipo] ?? TIPO_BADGE.funcionalidad;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      background: cfg.bg, color: cfg.color,
      borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 600,
    }}>
      {tipo === "contenedor" ? <Layers size={10} /> : <Cpu size={10} />}
      {cfg.label}
    </span>
  );
}

function Field({ label, required, children, t }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: t.labelColor }}>
        {label} {required && <span style={{ color: "#ef4444" }}>*</span>}
      </label>
      {children}
    </div>
  );
}

export function ModulosPage() {
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

  const fetchModulos = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await api.get("/modulos"));
    } catch (e) {
      toast.error(e.message ?? "Error al cargar módulos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchModulos(); }, [fetchModulos]);

  const openModal = (mod = null) => {
    setSelected(mod);
    setForm(mod ? {
      codigo: mod.codigo ?? "",
      nombre: mod.nombre ?? "",
      descripcion: mod.descripcion ?? "",
      modulo_padre_id: mod.modulo_padre_id ?? "",
      tipo_modulo: mod.tipo_modulo ?? "funcionalidad",
      ruta: mod.ruta ?? "",
      icono: mod.icono ?? "",
      orden: mod.orden ?? 0,
      requiere_jobs: mod.requiere_jobs ?? false,
      estado: mod.estado ?? "activo",
    } : EMPTY);
    setModalOpen(true);
  };

  const set = (k) => (e) => {
    const val = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [k]: val }));
  };

  const filtered = rows.filter((r) =>
    r.nombre?.toLowerCase().includes(search.toLowerCase()) ||
    r.codigo?.toLowerCase().includes(search.toLowerCase())
  );

  // Módulos disponibles como padre (excluye el actual al editar)
  const padresDisponibles = rows.filter((r) => !selected || r.id !== selected.id);

  const handleSave = async () => {
    if (!form.codigo.trim() || !form.nombre.trim()) {
      toast.warning("Código y nombre son requeridos");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        modulo_padre_id: form.modulo_padre_id === "" ? null : Number(form.modulo_padre_id),
        orden: Number(form.orden),
      };
      if (selected) {
        await api.put(`/modulos/${selected.id}`, payload);
        toast.success("Módulo actualizado");
      } else {
        await api.post("/modulos", payload);
        toast.success("Módulo creado");
      }
      setModalOpen(false);
      fetchModulos();
    } catch (e) {
      toast.error(e.message ?? "Error al guardar módulo");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/modulos/${deleteTarget.id}`);
      toast.success("Módulo eliminado");
      setDeleteTarget(null);
      fetchModulos();
    } catch (e) {
      toast.error(e.message ?? "Error al eliminar módulo");
    } finally {
      setDeleting(false);
    }
  };

  const inputStyle = {
    border: `1.5px solid ${t.inputBorder}`, borderRadius: 9, padding: "9px 12px",
    fontSize: 13, color: t.inputText, outline: "none", background: t.inputBg,
    width: "100%", boxSizing: "border-box",
    transition: "border-color 0.15s",
  };
  const focusIn  = (e) => (e.currentTarget.style.borderColor = BRAND);
  const focusOut = (e) => (e.currentTarget.style.borderColor = t.inputBorder);

  return (
    <div style={{ animation: "fadeInUp 0.3s ease-out" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: t.textPrimary }}>Módulos</h2>
          <p style={{ margin: "3px 0 0", fontSize: 13, color: t.textSecondary }}>
            Gestión de módulos y funcionalidades del sistema
          </p>
        </div>
        <Button icon={<Plus size={15} />} onClick={() => openModal()}>Nuevo módulo</Button>
      </div>

      {/* Buscador */}
      <div style={{
        background: t.cardBg, borderRadius: 12, border: `1px solid ${t.cardBorder}`,
        boxShadow: t.cardShadow, marginBottom: 18,
        display: "flex", alignItems: "center", padding: "0 14px", gap: 10, height: 42,
      }}>
        <Search size={15} color="#94a3b8" />
        <input
          value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre o código..."
          style={{ flex: 1, border: "none", outline: "none", fontSize: 13, color: t.inputText, background: "transparent" }}
        />
      </div>

      {/* Tabla */}
      <div style={{ background: t.cardBg, borderRadius: 14, border: `1px solid ${t.cardBorder}`, boxShadow: t.cardShadow, overflow: "hidden" }}>
        {loading ? <PageLoader /> : filtered.length === 0 ? (
          <EmptyState
            icon={<Package size={44} />}
            title="No se encontraron módulos"
            message="Crea el primer módulo usando el botón 'Nuevo módulo'."
            action={<Button size="sm" onClick={() => openModal()}>Crear módulo</Button>}
          />
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${t.headBorder}` }}>
                {["Módulo", "Código", "Tipo", "Módulo padre", "Ruta", "Orden", "Estado", "Acciones"].map((h) => (
                  <th key={h} style={{
                    padding: "12px 16px", textAlign: "left",
                    fontSize: 11, fontWeight: 700, color: "#94a3b8",
                    textTransform: "uppercase", letterSpacing: "0.06em",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr
                  key={r.id}
                  style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${t.rowBorder}` : "none", transition: "background 0.1s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = t.rowHover)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: t.textPrimary }}>{r.nombre}</div>
                    {r.descripcion && (
                      <div style={{ fontSize: 11, color: t.textSecondary, marginTop: 2 }}>{r.descripcion}</div>
                    )}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <code style={{ fontSize: 11, background: t.codeBg, padding: "2px 7px", borderRadius: 5, color: t.codeText }}>
                      {r.codigo}
                    </code>
                  </td>
                  <td style={{ padding: "12px 16px" }}><TipoBadge tipo={r.tipo_modulo} /></td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: t.textSecondary }}>
                    {r.nombre_padre ?? <span style={{ color: t.textSecondary, opacity: 0.45 }}>—</span>}
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: t.textSecondary }}>
                    {r.ruta ? (
                      <code style={{ fontSize: 11, background: t.codeBg, padding: "2px 7px", borderRadius: 5, color: t.codeText }}>
                        {r.ruta}
                      </code>
                    ) : <span style={{ opacity: 0.4 }}>—</span>}
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: t.textSecondary, textAlign: "center" }}>
                    {r.orden}
                  </td>
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

      {/* Modal crear / editar */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selected ? "Editar módulo" : "Nuevo módulo"}
        icon={<Package size={16} />}
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={handleSave} loading={saving}>{selected ? "Guardar cambios" : "Crear módulo"}</Button>
          </>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Fila: código + nombre */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Código" required t={t}>
              <input value={form.codigo} onChange={set("codigo")} placeholder="ej: gestion_usuarios"
                style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
            </Field>
            <Field label="Nombre" required t={t}>
              <input value={form.nombre} onChange={set("nombre")} placeholder="ej: Gestión de Usuarios"
                style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
            </Field>
          </div>

          <Field label="Descripción" t={t}>
            <input value={form.descripcion} onChange={set("descripcion")} placeholder="Descripción breve del módulo"
              style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
          </Field>

          {/* Fila: tipo + padre */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Tipo de módulo" t={t}>
              <select value={form.tipo_modulo} onChange={set("tipo_modulo")} style={inputStyle} onFocus={focusIn} onBlur={focusOut}>
                <option value="funcionalidad">Funcionalidad</option>
                <option value="contenedor">Contenedor</option>
              </select>
            </Field>
            <Field label="Módulo padre" t={t}>
              <select value={form.modulo_padre_id} onChange={set("modulo_padre_id")} style={inputStyle} onFocus={focusIn} onBlur={focusOut}>
                <option value="">— Sin padre (raíz) —</option>
                {padresDisponibles.map((p) => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
            </Field>
          </div>

          {/* Fila: ruta + icono */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Ruta" t={t}>
              <input value={form.ruta} onChange={set("ruta")} placeholder="ej: /usuarios"
                style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
            </Field>
            <Field label="Ícono" t={t}>
              <input value={form.icono} onChange={set("icono")} placeholder="ej: Users"
                style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
            </Field>
          </div>

          {/* Fila: orden + estado */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Orden" t={t}>
              <input type="number" min={0} value={form.orden} onChange={set("orden")}
                style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
            </Field>
            <Field label="Estado" t={t}>
              <select value={form.estado} onChange={set("estado")} style={inputStyle} onFocus={focusIn} onBlur={focusOut}>
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </Field>
          </div>

          {/* Requiere jobs */}
          <label style={{
            display: "flex", alignItems: "center", gap: 10, cursor: "pointer",
            padding: "10px 12px", borderRadius: 9,
            background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
            border: `1px solid ${t.inputBorder}`,
          }}>
            <input
              type="checkbox"
              checked={form.requiere_jobs}
              onChange={set("requiere_jobs")}
              style={{ width: 15, height: 15, accentColor: BRAND, cursor: "pointer" }}
            />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: t.textPrimary }}>Requiere Jobs</div>
              <div style={{ fontSize: 11, color: t.textSecondary }}>Indica si este módulo necesita procesos en background</div>
            </div>
          </label>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        variant="danger"
        title="Eliminar módulo"
        message={`¿Eliminar el módulo "${deleteTarget?.nombre}"? Esta acción no se puede deshacer.`}
        confirmText="Sí, eliminar"
        loading={deleting}
      />
    </div>
  );
}
