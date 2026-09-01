/**
 * Selector de módulos para agregar a una licencia.
 * Muestra árbol de módulos (solo funcionalidades seleccionables).
 * Props:
 *   licenciaId          number
 *   modulosAsignados    [{modulo_id}]
 *   onModuloAgregado    (detalleActualizado) => void
 *   isDark              boolean
 */
import { useEffect, useState } from "react";
import { Package, CheckCircle2, PlusCircle } from "lucide-react";
import { tk } from "../../../utils/theme";
import { useToast } from "../../../store/ToastContext";
import { api } from "../../../services/api";
import { Button } from "../../../components/ui/Button";
import { Spinner } from "../../../components/ui/Spinner";

const BRAND = "#F48124";

export function SelectorModulosLicencia({ licenciaId, modulosAsignados, onModuloAgregado, isDark }) {
  const t = tk(isDark);
  const toast = useToast();
  const [todosModulos, setTodosModulos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seleccionado, setSeleccionado] = useState(null);
  const [maxCias, setMaxCias] = useState(1);
  const [agregando, setAgregando] = useState(false);

  useEffect(() => {
    api.get("/modulos")
      .then((data) => setTodosModulos(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const asignadosIds = new Set(modulosAsignados.map((m) => m.modulo_id));

  // Solo funcionalidades activas no ya asignadas
  const disponibles = todosModulos.filter(
    (m) => m.tipo_modulo === "funcionalidad" && m.estado === "activo" && !asignadosIds.has(m.id)
  );

  // Agrupar por padre para mostrar organizado
  const padres = todosModulos.filter((m) => m.tipo_modulo === "contenedor" && m.estado === "activo");
  const sinPadre = disponibles.filter((m) => !m.modulo_padre_id);

  const handleAgregar = async () => {
    if (!seleccionado) return;
    setAgregando(true);
    try {
      const data = await api.post(`/licencias/${licenciaId}/modulos`, {
        modulo_id: seleccionado,
        cantidad_maxima_companias: Number(maxCias) || 1,
      });
      toast.success("Módulo agregado correctamente");
      setSeleccionado(null);
      setMaxCias(1);
      onModuloAgregado(data);
    } catch (err) {
      toast.error(err.message ?? "Error al agregar módulo");
    } finally {
      setAgregando(false);
    }
  };

  const inputStyle = {
    padding: "6px 10px", borderRadius: 7,
    border: `1px solid ${t.inputBorder}`,
    background: t.inputBg, color: t.inputText,
    fontSize: 13, outline: "none",
  };

  if (loading) return <div style={{ padding: 24, textAlign: "center" }}><Spinner size={20} /></div>;

  if (disponibles.length === 0) {
    return (
      <p style={{ fontSize: 13, color: t.textSecondary, textAlign: "center", padding: 16 }}>
        Todos los módulos funcionales ya están asignados.
      </p>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <p style={{ margin: 0, fontSize: 13, color: t.textSecondary }}>
        Selecciona un módulo de tipo <strong>funcionalidad</strong> para agregar:
      </p>

      {/* Lista agrupada por contenedor */}
      <div style={{
        border: `1px solid ${t.inputBorder}`, borderRadius: 8,
        maxHeight: 240, overflowY: "auto",
      }}>
        {padres.map((padre) => {
          const hijos = disponibles.filter((m) => m.modulo_padre_id === padre.id);
          if (hijos.length === 0) return null;
          return (
            <div key={padre.id}>
              <div style={{
                padding: "6px 12px", fontSize: 11, fontWeight: 700,
                color: t.textSecondary, textTransform: "uppercase", letterSpacing: "0.06em",
                background: isDark ? "#263347" : "#f8fafc",
                borderBottom: `1px solid ${t.rowBorder}`,
              }}>
                {padre.nombre}
              </div>
              {hijos.map((mod) => (
                <ModuloFila key={mod.id} mod={mod} seleccionado={seleccionado === mod.id}
                  onClick={() => setSeleccionado(mod.id)} t={t} />
              ))}
            </div>
          );
        })}
        {sinPadre.map((mod) => (
          <ModuloFila key={mod.id} mod={mod} seleccionado={seleccionado === mod.id}
            onClick={() => setSeleccionado(mod.id)} t={t} />
        ))}
      </div>

      {/* Cantidad máxima de compañías */}
      {seleccionado && (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <label style={{ fontSize: 13, color: t.labelColor, whiteSpace: "nowrap" }}>
            Máx. compañías:
          </label>
          <input
            type="number" min={1} style={{ ...inputStyle, width: 80 }}
            value={maxCias}
            onChange={(e) => setMaxCias(e.target.value)}
          />
          <Button variant="primary" onClick={handleAgregar} loading={agregando} disabled={!seleccionado}>
            <PlusCircle size={14} style={{ marginRight: 5 }} />
            Agregar
          </Button>
        </div>
      )}
    </div>
  );
}

function ModuloFila({ mod, seleccionado, onClick, t }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: "8px 14px", cursor: "pointer",
        background: seleccionado ? `${BRAND}18` : "transparent",
        borderBottom: `1px solid ${t.rowBorder}`,
        display: "flex", alignItems: "center", gap: 8,
        transition: "background 0.12s",
      }}
      onMouseEnter={(e) => { if (!seleccionado) e.currentTarget.style.background = t.rowHover; }}
      onMouseLeave={(e) => { if (!seleccionado) e.currentTarget.style.background = "transparent"; }}
    >
      {seleccionado
        ? <CheckCircle2 size={14} color={BRAND} />
        : <Package size={14} color={t.textSecondary} />}
      <div>
        <span style={{ fontSize: 13, fontWeight: 500, color: t.textPrimary }}>{mod.nombre}</span>
        {mod.codigo && (
          <span style={{
            marginLeft: 6, fontSize: 11, color: t.textSecondary,
            background: t.codeBg, padding: "1px 6px", borderRadius: 4, fontFamily: "monospace",
          }}>
            {mod.codigo}
          </span>
        )}
      </div>
    </div>
  );
}
