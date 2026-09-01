import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FileKey, ArrowLeft, Shield, Package, History,
  CheckCircle2, XCircle, AlertTriangle, Download,
  Trash2, Building2, Settings, ChevronDown, ChevronRight,
  Globe, Wifi, WifiOff, RefreshCw, Eye, Copy, Check,
} from "lucide-react";
import { useTheme } from "../../../store/ThemeContext";
import { tk } from "../../../utils/theme";
import { useToast } from "../../../store/ToastContext";
import { api } from "../../../services/api";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { Spinner } from "../../../components/ui/Spinner";
import { ConfirmDialog } from "../../../components/ui/ConfirmDialog";
import { SelectorModulosLicencia } from "../components/SelectorModulosLicencia";
import { AsignadorCompaniasModulo } from "../components/AsignadorCompaniasModulo";
import { HistorialArchivosLicencia } from "../components/HistorialArchivosLicencia";

const BRAND = "#F48124";
const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1";

// ── Helpers ──────────────────────────────────────────────────────────────────

const ESTADO_MAP = {
  borrador: { variant: "gray",   label: "Borrador"  },
  activa:   { variant: "green",  label: "Activa"    },
  revocada: { variant: "red",    label: "Revocada"  },
  expirada: { variant: "yellow", label: "Expirada"  },
  inactiva: { variant: "gray",   label: "Inactiva"  },
};

function EstadoLicBadge({ estado }) {
  const m = ESTADO_MAP[estado?.toLowerCase()] ?? { variant: "gray", label: estado ?? "—" };
  return <Badge variant={m.variant} style={{ fontSize: 12, padding: "3px 10px" }}>{m.label}</Badge>;
}

const TIPO_MAP = {
  offline: { Icon: WifiOff, color: "#64748b", label: "Offline"  },
  hibrida: { Icon: Wifi,    color: "#3b82f6", label: "Híbrida"  },
  online:  { Icon: Globe,   color: "#10b981", label: "Online"   },
};

function InfoRow({ label, value, t }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: t.textSecondary, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </span>
      <span style={{ fontSize: 13, color: t.textPrimary }}>{value ?? "—"}</span>
    </div>
  );
}

// ── Tab General ───────────────────────────────────────────────────────────────

function TabGeneral({ lic, t, onEstadoCambiado }) {
  const toast = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [nuevoEstado, setNuevoEstado] = useState("");
  const [cambiando, setCambiando] = useState(false);

  const tipoInfo = TIPO_MAP[lic.tipo_licencia] ?? { Icon: FileKey, color: "#64748b", label: lic.tipo_licencia };

  const confirmarEstado = (estado) => {
    setNuevoEstado(estado);
    setConfirmOpen(true);
  };

  const ejecutarCambio = async () => {
    setCambiando(true);
    try {
      const data = await api.patch(`/licencias/${lic.id}/estado`, { estado: nuevoEstado });
      toast.success(`Estado cambiado a "${nuevoEstado}" correctamente`);
      onEstadoCambiado(data);
    } catch (err) {
      toast.error(err.message ?? "Error al cambiar estado");
    } finally {
      setCambiando(false);
      setConfirmOpen(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Datos principales */}
      <div style={{
        background: t.cardBg, border: `1px solid ${t.cardBorder}`,
        borderRadius: 12, padding: 20, boxShadow: t.cardShadow,
      }}>
        <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: t.textPrimary }}>
          Información general
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 16 }}>
          <InfoRow label="N° de licencia" value={
            <span style={{ fontFamily: "monospace", fontWeight: 600, color: BRAND }}>
              {lic.numero_licencia}
            </span>
          } t={t} />
          <InfoRow label="Cliente" value={lic.nombre_cliente} t={t} />
          <InfoRow label="Tipo" value={
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: tipoInfo.color, fontWeight: 500 }}>
              <tipoInfo.Icon size={14} />
              {tipoInfo.label}
            </span>
          } t={t} />
          <InfoRow label="Ambiente" value={
            <span style={{ textTransform: "capitalize" }}>{lic.ambiente}</span>
          } t={t} />
          <InfoRow label="Estado" value={<EstadoLicBadge estado={lic.estado} />} t={t} />
          <InfoRow label="Fecha de emisión" value={
            lic.fecha_emision
              ? new Date(lic.fecha_emision).toLocaleDateString("es-ES")
              : "Sin emitir"
          } t={t} />
          <InfoRow label="Máx. usuarios" value={lic.cantidad_maxima_usuarios} t={t} />
          <InfoRow label="Permite jobs" value={lic.permite_jobs_segundo_plano ? "Sí" : "No"} t={t} />
          <InfoRow label="Permite API" value={lic.permite_api ? "Sí" : "No"} t={t} />
        </div>
        {lic.observaciones && (
          <div style={{ marginTop: 16, padding: "10px 14px", background: t.codeBg, borderRadius: 8 }}>
            <p style={{ margin: 0, fontSize: 13, color: t.textSecondary }}>
              <strong>Observaciones:</strong> {lic.observaciones}
            </p>
          </div>
        )}
      </div>

      {/* Acciones de estado */}
      {lic.estado !== "revocada" && (
        <div style={{
          background: t.cardBg, border: `1px solid ${t.cardBorder}`,
          borderRadius: 12, padding: 16, boxShadow: t.cardShadow,
        }}>
          <h3 style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 700, color: t.textPrimary }}>
            Cambiar estado
          </h3>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {lic.estado !== "activa" && lic.estado !== "borrador" && (
              <Button variant="ghost" onClick={() => confirmarEstado("activa")}>
                <CheckCircle2 size={14} style={{ marginRight: 5, color: "#16a34a" }} />
                Reactivar
              </Button>
            )}
            {lic.estado === "activa" && (
              <Button variant="ghost" onClick={() => confirmarEstado("inactiva")}>
                <XCircle size={14} style={{ marginRight: 5, color: "#64748b" }} />
                Desactivar
              </Button>
            )}
            {(lic.estado === "activa" || lic.estado === "borrador") && (
              <Button
                variant="ghost"
                onClick={() => confirmarEstado("revocada")}
                style={{ color: "#dc2626" }}
              >
                <AlertTriangle size={14} style={{ marginRight: 5 }} />
                Revocar
              </Button>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={ejecutarCambio}
        title={`¿Cambiar estado a "${nuevoEstado}"?`}
        message={
          nuevoEstado === "revocada"
            ? "Esta acción es irreversible. La licencia quedará revocada permanentemente."
            : `El estado de la licencia cambiará a "${nuevoEstado}".`
        }
        variant={nuevoEstado === "revocada" ? "danger" : "default"}
        confirmText="Confirmar"
        loading={cambiando}
      />
    </div>
  );
}

// ── Tab Módulos ───────────────────────────────────────────────────────────────

function TabModulos({ lic, onDetalleCambiado, t, isDark }) {
  const toast = useToast();
  const [moduloExpandido, setModuloExpandido] = useState(null);
  const [confirmQuitarOpen, setConfirmQuitarOpen] = useState(false);
  const [moduloAQuitar, setModuloAQuitar] = useState(null);
  const [quitando, setQuitando] = useState(false);

  const puedEditar = ["borrador", "activa"].includes(lic.estado);

  const toggleModulo = (id) => setModuloExpandido((prev) => (prev === id ? null : id));

  const confirmarQuitar = (mod) => {
    setModuloAQuitar(mod);
    setConfirmQuitarOpen(true);
  };

  const ejecutarQuitar = async () => {
    setQuitando(true);
    try {
      await api.delete(`/licencias/${lic.id}/modulos/${moduloAQuitar.id}`);
      toast.success("Módulo quitado de la licencia");
      const updated = await api.get(`/licencias/${lic.id}`);
      onDetalleCambiado(updated);
    } catch (err) {
      toast.error(err.message ?? "Error al quitar módulo");
    } finally {
      setQuitando(false);
      setConfirmQuitarOpen(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Módulos asignados */}
      {lic.modulos?.length === 0 && (
        <div style={{
          textAlign: "center", padding: 32,
          background: t.cardBg, border: `1px solid ${t.cardBorder}`,
          borderRadius: 12, color: t.textSecondary,
        }}>
          <Package size={28} strokeWidth={1.2} style={{ marginBottom: 8, opacity: 0.4 }} />
          <p style={{ margin: 0, fontSize: 13 }}>Sin módulos asignados</p>
        </div>
      )}

      {lic.modulos?.map((mod) => {
        const expanded = moduloExpandido === mod.id;
        return (
          <div key={mod.id} style={{
            background: t.cardBg, border: `1px solid ${t.cardBorder}`,
            borderRadius: 12, overflow: "hidden", boxShadow: t.cardShadow,
          }}>
            {/* Cabecera del módulo */}
            <div
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "12px 16px", cursor: "pointer",
                borderBottom: expanded ? `1px solid ${t.headBorder}` : "none",
              }}
              onClick={() => toggleModulo(mod.id)}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {expanded ? <ChevronDown size={15} color={t.textSecondary} /> : <ChevronRight size={15} color={t.textSecondary} />}
                <Package size={16} color={BRAND} />
                <div>
                  <span style={{ fontWeight: 600, fontSize: 14, color: t.textPrimary }}>{mod.nombre}</span>
                  {mod.codigo && (
                    <span style={{
                      marginLeft: 8, fontSize: 11, fontFamily: "monospace",
                      color: t.codeText, background: t.codeBg,
                      padding: "1px 6px", borderRadius: 4,
                    }}>{mod.codigo}</span>
                  )}
                  {mod.nombre_padre && (
                    <span style={{ marginLeft: 8, fontSize: 11, color: t.textSecondary }}>
                      en {mod.nombre_padre}
                    </span>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Badge variant="blue" dot={false}>
                  {mod.companias?.length ?? 0}/{mod.cantidad_maxima_companias} cías.
                </Badge>
                {puedEditar && (
                  <button
                    onClick={(e) => { e.stopPropagation(); confirmarQuitar(mod); }}
                    style={{ border: "none", background: "transparent", cursor: "pointer", color: "#ef4444", padding: 4 }}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Detalle expandible */}
            {expanded && (
              <div style={{ padding: 16 }}>
                {/* Compañías asignadas */}
                <h4 style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 600, color: t.textPrimary }}>
                  Compañías asignadas
                </h4>
                {puedEditar ? (
                  <AsignadorCompaniasModulo
                    licenciaModuloId={mod.id}
                    maxCias={mod.cantidad_maxima_companias}
                    clienteId={lic.cliente_id}
                    companiasAsignadas={mod.companias ?? []}
                    onActualizado={onDetalleCambiado}
                    isDark={isDark}
                  />
                ) : (
                  <CompaniasReadOnly companias={mod.companias ?? []} t={t} />
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Agregar módulo */}
      {puedEditar && (
        <div style={{
          background: t.cardBg, border: `1px dashed ${t.cardBorder}`,
          borderRadius: 12, padding: 16, boxShadow: t.cardShadow,
        }}>
          <h4 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 600, color: t.textPrimary }}>
            Agregar módulo funcional
          </h4>
          <SelectorModulosLicencia
            licenciaId={lic.id}
            modulosAsignados={lic.modulos ?? []}
            onModuloAgregado={onDetalleCambiado}
            isDark={isDark}
          />
        </div>
      )}

      <ConfirmDialog
        open={confirmQuitarOpen}
        onClose={() => setConfirmQuitarOpen(false)}
        onConfirm={ejecutarQuitar}
        title="¿Quitar módulo?"
        message={`Se quitará "${moduloAQuitar?.nombre}" y todas sus compañías asignadas de esta licencia.`}
        variant="danger"
        confirmText="Quitar"
        loading={quitando}
      />
    </div>
  );
}

function CompaniasReadOnly({ companias, t }) {
  if (companias.length === 0)
    return <p style={{ fontSize: 12, color: t.textSecondary }}>Sin compañías</p>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {companias.map((c) => (
        <div key={c.id} style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "6px 10px", borderRadius: 8,
          background: t.rowHover, fontSize: 13,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: t.textPrimary }}>
            <Building2 size={13} color={t.textSecondary} />
            {c.nombre_compania}
          </div>
          <span style={{ fontSize: 11, color: t.textSecondary }}>
            vence: {c.fecha_vencimiento
              ? new Date(c.fecha_vencimiento).toLocaleDateString("es-ES")
              : "—"}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Tab Payload (ver licencia desencriptada) ─────────────────────────────────

function TabPayload({ licenciaId, t, isDark }) {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get(`/licencias/${licenciaId}/payload`)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [licenciaId]);

  const copiar = () => {
    if (!data) return;
    navigator.clipboard.writeText(JSON.stringify(data.payload, null, 2));
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
    toast.success("Payload copiado al portapapeles");
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
        <Spinner size={28} />
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{
        textAlign: "center", padding: 40,
        background: t.cardBg, border: `1px solid ${t.cardBorder}`,
        borderRadius: 12, color: t.textSecondary,
      }}>
        <Eye size={28} strokeWidth={1.2} style={{ marginBottom: 8, opacity: 0.4 }} />
        <p style={{ margin: 0, fontSize: 13 }}>No hay ningún archivo .lic generado todavía</p>
      </div>
    );
  }

  const payloadJson = JSON.stringify(data.payload, null, 2);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Meta del archivo */}
      <div style={{
        background: t.cardBg, border: `1px solid ${t.cardBorder}`,
        borderRadius: 12, padding: 16, boxShadow: t.cardShadow,
        display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14,
      }}>
        <InfoRow label="Archivo" value={
          <span style={{ fontFamily: "monospace", fontSize: 12, color: t.codeText }}>{data.nombre_archivo}</span>
        } t={t} />
        <InfoRow label="Algoritmo" value={data.algoritmo} t={t} />
        <InfoRow label="ID Llave" value={
          <span style={{ fontFamily: "monospace", fontSize: 12, color: t.codeText }}>{data.id_llave}</span>
        } t={t} />
        <InfoRow label="Generado" value={
          data.generado_en ? new Date(data.generado_en).toLocaleString("es-ES") : "—"
        } t={t} />
        <div style={{ gridColumn: "1 / -1" }}>
          <InfoRow label="Hash SHA-256" value={
            <span style={{
              fontFamily: "monospace", fontSize: 11, wordBreak: "break-all",
              color: t.codeText,
            }}>{data.hash_archivo}</span>
          } t={t} />
        </div>
      </div>

      {/* Payload JSON */}
      <div style={{
        background: t.cardBg, border: `1px solid ${t.cardBorder}`,
        borderRadius: 12, overflow: "hidden", boxShadow: t.cardShadow,
      }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 16px",
          borderBottom: `1px solid ${t.headBorder}`,
          background: isDark ? "#1e293b" : "#f8fafc",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Eye size={15} color={BRAND} />
            <span style={{ fontSize: 13, fontWeight: 600, color: t.textPrimary }}>
              Payload decodificado
            </span>
            <span style={{
              fontSize: 11, background: isDark ? "#334155" : "#e2e8f0",
              color: t.textSecondary, padding: "2px 8px", borderRadius: 20,
            }}>
              JSON
            </span>
          </div>
          <button
            onClick={copiar}
            title="Copiar payload"
            style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              border: `1px solid ${t.cardBorder}`, background: isDark ? "#334155" : "#f1f5f9",
              borderRadius: 6, padding: "5px 10px", cursor: "pointer",
              fontSize: 12, color: copiado ? "#16a34a" : t.textSecondary,
              transition: "color 0.2s",
            }}
          >
            {copiado ? <Check size={13} /> : <Copy size={13} />}
            {copiado ? "Copiado" : "Copiar"}
          </button>
        </div>
        <pre style={{
          margin: 0,
          padding: 20,
          fontSize: 12,
          lineHeight: 1.6,
          fontFamily: "'Fira Code', 'Cascadia Code', 'Consolas', monospace",
          color: isDark ? "#e2e8f0" : "#1e293b",
          background: isDark ? "#0f172a" : "#f8fafc",
          overflowX: "auto",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          maxHeight: 600,
          overflowY: "auto",
        }}>
          {payloadJson}
        </pre>
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────

const TABS = [
  { id: "general",  label: "General",  Icon: Shield  },
  { id: "modulos",  label: "Módulos",  Icon: Package },
  { id: "historial",label: "Historial",Icon: History },
  { id: "payload",  label: "Ver Licencia", Icon: Eye },
];

export function LicenciaDetallePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const t = tk(isDark);
  const toast = useToast();

  const [lic, setLic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("general");
  const [validando, setValidando] = useState(false);
  const [generando, setGenerando] = useState(false);
  const [validacion, setValidacion] = useState(null);   // { valida, errores }
  const [recargarHistorial, setRecargarHistorial] = useState(0);

  const fetchDetalle = async () => {
    setLoading(true);
    try {
      const data = await api.get(`/licencias/${id}`);
      setLic(data);
    } catch (err) {
      toast.error(err.message ?? "Error al cargar la licencia");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDetalle(); }, [id]);

  const handleValidar = async () => {
    setValidando(true);
    try {
      const result = await api.post(`/licencias/${id}/validar`);
      setValidacion(result);
      if (result.valida) toast.success("✓ La licencia está lista para generar el archivo .lic");
    } catch (err) {
      toast.error(err.message ?? "Error al validar");
    } finally {
      setValidando(false);
    }
  };

  const handleGenerar = async () => {
    setGenerando(true);
    try {
      await api.post(`/licencias/${id}/generar`);
      toast.success("Archivo .lic generado y firmado correctamente");
      setValidacion(null);
      setRecargarHistorial((n) => n + 1);
      await fetchDetalle();
      setTab("historial");
    } catch (err) {
      toast.error(err.message ?? "Error al generar el archivo");
    } finally {
      setGenerando(false);
    }
  };

  const handleDescargarUltima = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${BASE_URL}/licencias/${id}/descargar`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("No hay archivo generado");
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const filename = disposition.match(/filename="(.+?)"/)?.[1] ?? `licencia_${id}.lic`;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err.message ?? "No hay archivo generado aún");
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 300 }}>
        <Spinner size={32} />
      </div>
    );
  }

  if (!lic) return null;

  const puedeGenerar = !["revocada"].includes(lic.estado);

  return (
    <div style={{ padding: 28, maxWidth: 960, margin: "0 auto" }}>
      {/* Breadcrumb */}
      <button
        onClick={() => navigate("/licencias")}
        style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          border: "none", background: "transparent", cursor: "pointer",
          color: t.textSecondary, fontSize: 13, padding: 0, marginBottom: 20,
        }}
      >
        <ArrowLeft size={14} />
        Volver a licencias
      </button>

      {/* Encabezado */}
      <div style={{
        background: t.cardBg, border: `1px solid ${t.cardBorder}`,
        borderRadius: 14, padding: 20, marginBottom: 20,
        boxShadow: t.cardShadow,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 16,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 11,
            background: `linear-gradient(135deg, ${BRAND}22, ${BRAND}44)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <FileKey size={22} color={BRAND} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: t.textPrimary, fontFamily: "monospace" }}>
                {lic.numero_licencia}
              </h1>
              <EstadoLicBadge estado={lic.estado} />
            </div>
            <p style={{ margin: 0, fontSize: 13, color: t.textSecondary }}>
              {lic.nombre_cliente} · {lic.ambiente}
            </p>
          </div>
        </div>

        {/* Acciones principales */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Button variant="ghost" onClick={handleValidar} loading={validando} disabled={!puedeGenerar}>
            <Shield size={14} style={{ marginRight: 5 }} />
            Validar
          </Button>
          {puedeGenerar && (
            <Button variant="primary" onClick={handleGenerar} loading={generando}>
              <RefreshCw size={14} style={{ marginRight: 5 }} />
              Generar .lic
            </Button>
          )}
          <Button variant="ghost" onClick={handleDescargarUltima}>
            <Download size={14} style={{ marginRight: 5 }} />
            Descargar última
          </Button>
        </div>
      </div>

      {/* Banner de validación */}
      {validacion && (
        <div style={{
          background: validacion.valida ? "#f0fdf4" : "#fef2f2",
          border: `1px solid ${validacion.valida ? "#86efac" : "#fca5a5"}`,
          borderRadius: 10, padding: "12px 16px", marginBottom: 16,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: validacion.errores?.length ? 8 : 0 }}>
            {validacion.valida
              ? <CheckCircle2 size={16} color="#16a34a" />
              : <XCircle size={16} color="#dc2626" />}
            <span style={{ fontWeight: 600, fontSize: 13, color: validacion.valida ? "#166534" : "#991b1b" }}>
              {validacion.valida ? "Lista para generar" : `${validacion.errores?.length} error(es) de validación`}
            </span>
          </div>
          {validacion.errores?.map((e, i) => (
            <div key={i} style={{ fontSize: 12, color: "#991b1b", paddingLeft: 24 }}>· {e}</div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
        {TABS.map(({ id: tid, label, Icon }) => (
          <button
            key={tid}
            onClick={() => setTab(tid)}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "8px 16px", borderRadius: 8, border: "none",
              cursor: "pointer", fontSize: 13, fontWeight: tab === tid ? 600 : 400,
              background: tab === tid ? BRAND : t.iconBtnBg,
              color: tab === tid ? "white" : t.textSecondary,
              transition: "all 0.15s",
            }}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* Contenido del tab */}
      {tab === "general" && (
        <TabGeneral lic={lic} t={t} onEstadoCambiado={(d) => setLic(d)} />
      )}
      {tab === "modulos" && (
        <TabModulos lic={lic} onDetalleCambiado={(d) => setLic(d)} t={t} isDark={isDark} />
      )}
      {tab === "historial" && (
        <HistorialArchivosLicencia licenciaId={lic.id} isDark={isDark} recargar={recargarHistorial} />
      )}
      {tab === "payload" && (
        <TabPayload licenciaId={lic.id} t={t} isDark={isDark} />
      )}
    </div>
  );
}
