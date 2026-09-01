import { useState, useEffect } from "react";
import { Modal } from "../../../components/ui/Modal";
import { Button } from "../../../components/ui/Button";
import { useToast } from "../../../store/ToastContext";
import { useTheme } from "../../../store/ThemeContext";
import { tk } from "../../../utils/theme";
import { api } from "../../../services/api";
import { Eye, EyeOff } from "lucide-react";

const BRAND = "#F48124";
const EMPTY = { nombre_usuario: "", correo: "", password: "", estado: "activo", rol_ids: [] };

function Field({ label, required, children, error, t }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: t.labelColor }}>
        {label} {required && <span style={{ color: "#ef4444" }}>*</span>}
      </label>
      {children}
      {error && <span style={{ fontSize: 11, color: "#ef4444" }}>{error}</span>}
    </div>
  );
}

function StyledInput({ t, style: extra = {}, ...props }) {
  return (
    <input
      style={{
        border: `1.5px solid ${t.inputBorder}`, borderRadius: 9, padding: "9px 12px",
        fontSize: 13, color: t.inputText, outline: "none",
        transition: "border-color 0.15s",
        background: t.inputBg,
        ...extra,
      }}
      onFocus={(e) => e.currentTarget.style.borderColor = BRAND}
      onBlur={(e)  => e.currentTarget.style.borderColor = t.inputBorder}
      {...props}
    />
  );
}

export function UsuarioModal({ open, onClose, usuario, onSaved }) {
  const toast = useToast();
  const { isDark } = useTheme();
  const t = tk(isDark);
  const isEdit = !!usuario;
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [rolesDisponibles, setRolesDisponibles] = useState([]);

  // Cargar roles disponibles cuando el modal abre
  useEffect(() => {
    if (!open) return;
    api.get("/roles").then(setRolesDisponibles).catch(() => setRolesDisponibles([]));
    setForm(usuario ? {
      nombre_usuario: usuario.nombre_usuario ?? "",
      correo: usuario.correo ?? "",
      password: "",
      estado: usuario.estado ?? "activo",
      rol_ids: usuario.rol_ids ?? [],
    } : EMPTY);
    setErrors({});
  }, [open, usuario]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const toggleRol = (rolId) => {
    setForm((f) => ({
      ...f,
      rol_ids: f.rol_ids.includes(rolId)
        ? f.rol_ids.filter((id) => id !== rolId)
        : [...f.rol_ids, rolId],
    }));
  };

  const validate = () => {
    const errs = {};
    if (!form.nombre_usuario.trim()) errs.nombre_usuario = "El nombre de usuario es requerido";
    if (!form.correo.trim()) errs.correo = "El correo es requerido";
    if (!isEdit && !form.password.trim()) errs.password = "La contraseña es requerida";
    return errs;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      const payload = { ...form };
      if (isEdit && !payload.password) delete payload.password;
      if (isEdit) {
        await api.put(`/usuarios/${usuario.id}`, payload);
        toast.success("Usuario actualizado correctamente");
      } else {
        await api.post("/usuarios", payload);
        toast.success("Usuario creado correctamente");
      }
      onSaved?.();
    } catch (e) {
      toast.error(e.message ?? "Error al guardar usuario");
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    border: `1.5px solid ${t.inputBorder}`, borderRadius: 9, padding: "9px 12px",
    fontSize: 13, color: t.inputText, outline: "none", background: t.inputBg,
    width: "100%", boxSizing: "border-box",
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Editar usuario" : "Nuevo usuario"}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSubmit} loading={saving}>
            {isEdit ? "Guardar cambios" : "Crear usuario"}
          </Button>
        </>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Field label="Nombre de usuario" required error={errors.nombre_usuario} t={t}>
          <StyledInput t={t} value={form.nombre_usuario} onChange={set("nombre_usuario")} placeholder="ej: jperez" />
        </Field>

        <Field label="Correo electrónico" required error={errors.correo} t={t}>
          <StyledInput t={t} type="email" value={form.correo} onChange={set("correo")} placeholder="ej: juan@empresa.com" />
        </Field>

        <Field label={isEdit ? "Nueva contraseña (dejar vacío para no cambiar)" : "Contraseña"} required={!isEdit} error={errors.password} t={t}>
          <div style={{ position: "relative" }}>
            <input
              type={showPass ? "text" : "password"}
              value={form.password}
              onChange={set("password")}
              placeholder="••••••••"
              style={{ ...inputStyle, paddingRight: 38 }}
              onFocus={(e) => e.currentTarget.style.borderColor = BRAND}
              onBlur={(e)  => e.currentTarget.style.borderColor = t.inputBorder}
            />
            <button type="button" onClick={() => setShowPass((v) => !v)} style={{
              position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
              background: "none", border: "none", cursor: "pointer", color: "#94a3b8",
              display: "flex", alignItems: "center",
            }}>
              {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </Field>

        <Field label="Estado" required t={t}>
          <select value={form.estado} onChange={set("estado")} style={{ ...inputStyle }}
            onFocus={(e) => e.currentTarget.style.borderColor = BRAND}
            onBlur={(e)  => e.currentTarget.style.borderColor = t.inputBorder}>
            <option value="activo">Activo</option>
            <option value="inactivo">Inactivo</option>
            <option value="bloqueado">Bloqueado</option>
          </select>
        </Field>

        {/* Selector de roles */}
        {rolesDisponibles.length > 0 && (
          <Field label="Roles asignados" t={t}>
            <div style={{
              border: `1.5px solid ${t.inputBorder}`, borderRadius: 9, padding: "8px 12px",
              background: t.inputBg, display: "flex", flexDirection: "column", gap: 6,
            }}>
              {rolesDisponibles.map((rol) => (
                <label key={rol.id} style={{
                  display: "flex", alignItems: "center", gap: 8,
                  cursor: "pointer", fontSize: 13, color: t.inputText,
                }}>
                  <input
                    type="checkbox"
                    checked={form.rol_ids.includes(rol.id)}
                    onChange={() => toggleRol(rol.id)}
                    style={{ accentColor: BRAND, width: 14, height: 14 }}
                  />
                  <span style={{ fontWeight: 500 }}>{rol.nombre}</span>
                  <span style={{ fontSize: 11, color: t.textSecondary }}>({rol.codigo})</span>
                </label>
              ))}
            </div>
          </Field>
        )}
      </div>
    </Modal>
  );
}
