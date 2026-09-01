import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileKey, Plus, Search, ChevronRight, Building2,
  Globe, Wifi, WifiOff, RefreshCw, AlertTriangle, Info,
} from "lucide-react";
import { useTheme } from "../../../store/ThemeContext";
import { tk } from "../../../utils/theme";
import { useToast } from "../../../store/ToastContext";
import { api } from "../../../services/api";
import { Modal } from "../../../components/ui/Modal";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";
import { EmptyState } from "../../../components/ui/EmptyState";
import { PageLoader } from "../../../components/ui/Spinner";

const BRAND = "#F48124";

// ── Mapa de estado → badge ───────────────────────────────────────────────────
function EstadoLicBadge({ estado }) {
  const MAP = {
    borrador:  { variant: "gray",   label: "Borrador"  },
    activa:    { variant: "green",  label: "Activa"    },
    revocada:  { variant: "red",    label: "Revocada"  },
    expirada:  { variant: "yellow", label: "Expirada"  },
    inactiva:  { variant: "gray",   label: "Inactiva"  },
  };
  const m = MAP[estado?.toLowerCase()] ?? { variant: "gray", label: estado ?? "—" };
  return <Badge variant={m.variant}>{m.label}</Badge>;
}

// ── Mapa de tipo → ícono ─────────────────────────────────────────────────────
function TipoChip({ tipo }) {
  const map = {
    offline: { Icon: WifiOff, color: "#64748b", label: "Offline"  },
    hibrida: { Icon: Wifi,    color: "#3b82f6", label: "Híbrida"  },
    online:  { Icon: Globe,   color: "#10b981", label: "Online"   },
  };
  const { Icon, color, label } = map[tipo] ?? { Icon: FileKey, color: "#64748b", label: tipo };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color, fontSize: 12, fontWeight: 500 }}>
      <Icon size={13} />
      {label}
    </span>
  );
}

// ── Formulario de nueva licencia ──────────────────────────────────────────────
const FORM_INIT = {
  cliente_id: "", numero_licencia: "", tipo_licencia: "offline",
  ambiente: "produccion", cantidad_maxima_usuarios: 10,
  permite_jobs_segundo_plano: false, permite_api: false, observaciones: "",
};

function NuevaLicenciaModal({ open, onClose, onCreated }) {
  const { isDark } = useTheme();
  const t = tk(isDark);
  const toast = useToast();
  const [clientes, setClientes] = useState([]);
  const [modulosFuncionales, setModulosFuncionales] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingNumero, setLoadingNumero] = useState(false);
  const [form, setForm] = useState(FORM_INIT);

  useEffect(() => {
    if (!open) return;
    setForm(FORM_INIT);
    Promise.all([
      api.get("/clientes").catch(() => []),
      api.get("/modulos").catch(() => []),
    ]).then(([clts, mods]) => {
      setClientes(clts);
      setModulosFuncionales(mods.filter((m) => m.tipo_modulo === "funcionalidad" && m.estado === "activo"));
    });
    setLoadingNumero(true);
    api.get("/licencias/siguiente-numero")
      .then((res) => setForm((f) => ({ ...f, numero_licencia: res.numero })))
      .catch(() => {})
      .finally(() => setLoadingNumero(false));
  }, [open]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.cliente_id) { toast.warning("Selecciona un cliente"); return; }
    if (!form.numero_licencia.trim()) { toast.warning("El número de licencia es obligatorio"); return; }
    setLoading(true);
    try {
      const body = {
        ...form,
        cliente_id: Number(form.cliente_id),
        cantidad_maxima_usuarios: Number(form.cantidad_maxima_usuarios) || 1,
        observaciones: form.observaciones.trim() || null,
      };
      const nueva = await api.post("/licencias", body);
      toast.success("Licencia creada en borrador — ahora asigna los módulos");
      onCreated(nueva);
    } catch (err) {
      toast.error(err.message ?? "Error al crear la licencia");
    } finally {
      setLoading(false);
    }
  };

  const inp = {
    width: "100%", padding: "8px 10px", borderRadius: 8,
    border: `1px solid ${t.inputBorder}`,
    background: t.inputBg, color: t.inputText,
    fontSize: 13, outline: "none", boxSizing: "border-box",
  };
  const lbl = { fontSize: 12, fontWeight: 600, color: t.labelColor, display: "block", marginBottom: 4 };
  const fld = { display: "flex", flexDirection: "column" };

  const clientesActivos = clientes.filter((c) => c.estado === "activo");
  const sinModulos = modulosFuncionales !== null && modulosFuncionales.length === 0;

  return (
    <Modal open={open} onClose={onClose} title="Nueva licencia" icon={<FileKey size={15} />} size="md">
      {sinModulos && (
        <div style={{
          display: "flex", gap: 10, alignItems: "flex-start",
          background: "#fffbeb", border: "1px solid #fde68a",
          borderRadius: 8, padding: "10px 14px", marginBottom: 16,
        }}>
          <AlertTriangle size={16} color="#d97706" style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#92400e" }}>
              No hay módulos funcionales activos
            </p>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "#b45309" }}>
              La licencia quedará vacía. Ve a <strong>Módulos</strong> y crea al menos uno
              de tipo <em>funcionalidad</em> antes de generar el archivo .lic.
            </p>
          </div>
        </div>
      )}
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={fld}>
          <label style={lbl}>Cliente *</label>
          <select style={inp} value={form.cliente_id} onChange={(e) => set("cliente_id", e.target.value)}>
            <option value="">— Selecciona el cliente —</option>
            {clientesActivos.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </div>

        <div style={fld}>
          <label style={lbl}>
            Número de licencia *
            <span style={{ marginLeft: 6, fontSize: 11, color: t.textSecondary, fontWeight: 400 }}>
              (sugerido automáticamente, editable)
            </span>
          </label>
          <div style={{ position: "relative" }}>
            <input
              style={{ ...inp, paddingRight: loadingNumero ? 32 : 10, fontFamily: "monospace" }}
              placeholder="LIC-2026-001"
              value={form.numero_licencia}
              onChange={(e) => set("numero_licencia", e.target.value.toUpperCase())}
            />
            {loadingNumero && (
              <RefreshCw size={13} color="#94a3b8" style={{
                position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                animation: "spin 1s linear infinite",
              }} />
            )}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={fld}>
            <label style={lbl}>Tipo de licencia</label>
            <select style={inp} value={form.tipo_licencia} onChange={(e) => set("tipo_licencia", e.target.value)}>
              <option value="offline">Offline — sin conexión permanente</option>
              <option value="hibrida">Híbrida — conexión ocasional</option>
              <option value="online">Online — requiere conexión</option>
            </select>
          </div>
          <div style={fld}>
            <label style={lbl}>Ambiente</label>
            <select style={inp} value={form.ambiente} onChange={(e) => set("ambiente", e.target.value)}>
              <option value="produccion">Producción</option>
              <option value="pruebas">Pruebas / QA</option>
              <option value="desarrollo">Desarrollo</option>
            </select>
          </div>
        </div>

        <div style={fld}>
          <label style={lbl}>Máx. usuarios simultáneos</label>
          <input
            type="number" min={1} max={9999} style={inp}
            value={form.cantidad_maxima_usuarios}
            onChange={(e) => set("cantidad_maxima_usuarios", e.target.value)}
          />
        </div>

        <div style={{
          display: "flex", gap: 20, flexWrap: "wrap",
          padding: "10px 12px", borderRadius: 8,
          background: t.codeBg, border: `1px solid ${t.inputBorder}`,
        }}>
          {[
            { key: "permite_jobs_segundo_plano", label: "Permite jobs en segundo plano" },
            { key: "permite_api",                label: "Permite acceso vía API" },
          ].map(({ key, label }) => (
            <label key={key} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, color: t.textPrimary, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={form[key]}
                onChange={(e) => set(key, e.target.checked)}
                style={{ accentColor: BRAND, width: 15, height: 15 }}
              />
              {label}
            </label>
          ))}
        </div>

        <div style={fld}>
          <label style={lbl}>Observaciones <span style={{ fontWeight: 400 }}>(opcional)</span></label>
          <textarea
            rows={2} style={{ ...inp, resize: "vertical" }}
            placeholder="Notas internas sobre esta licencia..."
            value={form.observaciones}
            onChange={(e) => set("observaciones", e.target.value)}
          />
        </div>

        <div style={{
          display: "flex", gap: 8, alignItems: "flex-start",
          background: "#eff6ff", border: "1px solid #bfdbfe",
          borderRadius: 8, padding: "8px 12px",
        }}>
          <Info size={14} color="#2563eb" style={{ flexShrink: 0, marginTop: 1 }} />
          <p style={{ margin: 0, fontSize: 12, color: "#1e40af" }}>
            Se crea en estado <strong>borrador</strong>. Después asigna módulos,
            compañías y genera el archivo <code>.lic</code> firmado.
          </p>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, paddingTop: 4 }}>
          <Button variant="ghost" type="button" onClick={onClose} disabled={loading}>Cancelar</Button>
          <Button variant="primary" type="submit" loading={loading} icon={<FileKey size={14} />}>
            Crear licencia
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
const FILTROS = ["todos", "borrador", "activa", "inactiva", "revocada", "expirada"];

export function LicenciasPage() {
  const { isDark } = useTheme();
  const t = tk(isDark);
  const navigate = useNavigate();
  const toast = useToast();

  const [licencias, setLicencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [modalOpen, setModalOpen] = useState(false);

  const fetchLicencias = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get("/licencias");
      setLicencias(data);
    } catch (err) {
      toast.error(err.message ?? "Error al cargar las licencias");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLicencias(); }, [fetchLicencias]);

  const filtered = licencias.filter((l) => {
    const q = search.toLowerCase();
    const matchSearch =
      l.numero_licencia?.toLowerCase().includes(q) ||
      l.nombre_cliente?.toLowerCase().includes(q) ||
      l.ambiente?.toLowerCase().includes(q);
    const matchEstado = filtroEstado === "todos" || l.estado === filtroEstado;
    return matchSearch && matchEstado;
  });

  const countPorEstado = (e) => licencias.filter((l) => l.estado === e).length;

  const handleCreated = (nueva) => {
    setModalOpen(false);
    navigate(`/licencias/${nueva.id}`);
  };

  return (
    <div style={{ animation: "fadeInUp 0.3s ease-out" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: t.textPrimary }}>Licencias</h2>
          <p style={{ margin: "3px 0 0", fontSize: 13, color: t.textSecondary }}>
            {licencias.length} licencia{licencias.length !== 1 ? "s" : ""} registrada{licencias.length !== 1 ? "s" : ""}
            {filtroEstado !== "todos" && ` · filtrando por "${filtroEstado}"`}
          </p>
        </div>
        <Button icon={<Plus size={15} />} onClick={() => setModalOpen(true)}>
          Nueva licencia
        </Button>
      </div>

      {/* Chips de filtro rápido */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
        {FILTROS.map((f) => {
          const active = filtroEstado === f;
          const count = f === "todos" ? licencias.length : countPorEstado(f);
          return (
            <button
              key={f}
              onClick={() => setFiltroEstado(f)}
              style={{
                padding: "5px 12px", borderRadius: 99, border: "none", cursor: "pointer",
                fontSize: 12, fontWeight: active ? 700 : 500,
                background: active ? BRAND : t.iconBtnBg,
                color: active ? "white" : t.textSecondary,
                transition: "all 0.15s",
              }}
            >
              {f === "todos" ? "Todas" : f.charAt(0).toUpperCase() + f.slice(1)}
              {" "}
              <span style={{ opacity: 0.75 }}>({count})</span>
            </button>
          );
        })}
      </div>

      {/* Buscador */}
      <div style={{
        background: t.cardBg, borderRadius: 12, border: `1px solid ${t.cardBorder}`,
        boxShadow: t.cardShadow, marginBottom: 16,
        display: "flex", alignItems: "center", padding: "0 14px", gap: 10, height: 42,
      }}>
        <Search size={15} color="#94a3b8" style={{ flexShrink: 0 }} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por número, cliente o ambiente..."
          style={{ flex: 1, border: "none", outline: "none", fontSize: 13, color: t.inputText, background: "transparent" }}
        />
        {loading && <RefreshCw size={14} color="#94a3b8" style={{ animation: "spin 1s linear infinite" }} />}
        {search && (
          <button
            onClick={() => setSearch("")}
            style={{ border: "none", background: "transparent", cursor: "pointer", color: "#94a3b8", fontSize: 12 }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Tabla */}
      <div style={{
        background: t.cardBg, borderRadius: 14,
        border: `1px solid ${t.cardBorder}`,
        boxShadow: t.cardShadow, overflow: "hidden",
      }}>
        {loading ? (
          <PageLoader />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<FileKey size={44} />}
            title={search || filtroEstado !== "todos" ? "Sin resultados" : "No hay licencias registradas"}
            message={
              search
                ? `No coincide ninguna licencia con "${search}".`
                : filtroEstado !== "todos"
                  ? `No hay licencias en estado "${filtroEstado}".`
                  : "Crea la primera licencia usando el botón 'Nueva licencia'."
            }
            action={!search && filtroEstado === "todos" && (
              <Button size="sm" icon={<Plus size={13} />} onClick={() => setModalOpen(true)}>
                Nueva licencia
              </Button>
            )}
          />
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${t.headBorder}` }}>
                {["Número", "Cliente", "Tipo", "Ambiente", "Estado", "Emisión", ""].map((h) => (
                  <th key={h} style={{
                    padding: "10px 16px", textAlign: "left",
                    fontSize: 11, fontWeight: 600, color: t.textSecondary,
                    textTransform: "uppercase", letterSpacing: "0.06em",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((lic) => (
                <tr
                  key={lic.id}
                  onClick={() => navigate(`/licencias/${lic.id}`)}
                  style={{ borderBottom: `1px solid ${t.rowBorder}`, cursor: "pointer", transition: "background 0.12s" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = t.rowHover}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <FileKey size={14} color={BRAND} style={{ flexShrink: 0 }} />
                      <span style={{ fontWeight: 700, fontSize: 13, color: t.textPrimary, fontFamily: "monospace" }}>
                        {lic.numero_licencia}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Building2 size={13} color={t.textSecondary} style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: t.textPrimary }}>{lic.nombre_cliente}</span>
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <TipoChip tipo={lic.tipo_licencia} />
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ fontSize: 12, color: t.textSecondary, textTransform: "capitalize" }}>
                      {lic.ambiente}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <EstadoLicBadge estado={lic.estado} />
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: t.textSecondary }}>
                    {lic.fecha_emision
                      ? new Date(lic.fecha_emision).toLocaleDateString("es-ES")
                      : <em style={{ opacity: 0.6 }}>Sin emitir</em>}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <ChevronRight size={16} color={t.textSecondary} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <NuevaLicenciaModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={handleCreated}
      />
    </div>
  );
}
