/**
 * Asigna compañías a un módulo licenciado.
 * Props:
 *   licenciaModuloId   number
 *   maxCias            number
 *   clienteId          number
 *   companiasAsignadas [{compania_id, fecha_vencimiento, estado, ...}]
 *   onActualizado      (detalleActualizado) => void
 *   isDark             boolean
 */
import { useEffect, useState } from "react";
import { Building2, Trash2, Plus, Save } from "lucide-react";
import { tk } from "../../../utils/theme";
import { useToast } from "../../../store/ToastContext";
import { api } from "../../../services/api";
import { Button } from "../../../components/ui/Button";
import { Badge } from "../../../components/ui/Badge";

const BRAND = "#F48124";

export function AsignadorCompaniasModulo({
  licenciaModuloId,
  maxCias,
  clienteId,
  companiasAsignadas,
  onActualizado,
  isDark,
}) {
  const t = tk(isDark);
  const toast = useToast();

  // Cargamos todas las companías del cliente
  const [companias, setCompanias] = useState([]);
  const [filas, setFilas] = useState(
    companiasAsignadas.map((c) => ({
      compania_id: c.compania_id,
      fecha_vencimiento: c.fecha_vencimiento ? c.fecha_vencimiento.split("T")[0] : "",
    }))
  );
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    api.get(`/companias?cliente_id=${clienteId}`).then(setCompanias).catch(() => {});
  }, [clienteId]);

  // Sync cuando cambian las asignadas desde afuera (recarga del detalle)
  useEffect(() => {
    setFilas(
      companiasAsignadas.map((c) => ({
        compania_id: c.compania_id,
        fecha_vencimiento: c.fecha_vencimiento ? c.fecha_vencimiento.split("T")[0] : "",
      }))
    );
  }, [companiasAsignadas]);

  const activas = companias.filter((c) => c.estado === "activo");

  const agregarFila = () => {
    if (filas.length >= maxCias) {
      toast.warning(`Límite alcanzado: máximo ${maxCias} compañía(s) para este módulo`);
      return;
    }
    setFilas((f) => [...f, { compania_id: "", fecha_vencimiento: "" }]);
  };

  const quitarFila = (i) => setFilas((f) => f.filter((_, idx) => idx !== i));

  const actualizarFila = (i, campo, val) =>
    setFilas((f) => f.map((fila, idx) => (idx === i ? { ...fila, [campo]: val } : fila)));

  const handleGuardar = async () => {
    for (const fila of filas) {
      if (!fila.compania_id || !fila.fecha_vencimiento) {
        toast.warning("Completa la compañía y fecha de vencimiento en todas las filas");
        return;
      }
    }
    setGuardando(true);
    try {
      const data = await api.put(`/licencias/modulos/${licenciaModuloId}/companias`, {
        companias: filas.map((f) => ({
          compania_id: Number(f.compania_id),
          fecha_vencimiento: f.fecha_vencimiento,
        })),
      });
      toast.success("Compañías guardadas correctamente");
      onActualizado(data);
    } catch (err) {
      toast.error(err.message ?? "Error al guardar compañías");
    } finally {
      setGuardando(false);
    }
  };

  const inputStyle = {
    padding: "6px 10px", borderRadius: 7,
    border: `1px solid ${t.inputBorder}`,
    background: t.inputBg, color: t.inputText,
    fontSize: 13, outline: "none", width: "100%", boxSizing: "border-box",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Contador */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 12, color: t.textSecondary }}>
          {filas.length} / {maxCias} compañía(s) asignada(s)
        </span>
        <Button variant="ghost" onClick={agregarFila} style={{ padding: "4px 10px", fontSize: 12 }}>
          <Plus size={13} style={{ marginRight: 4 }} />
          Agregar
        </Button>
      </div>

      {/* Filas */}
      {filas.length === 0 && (
        <p style={{ fontSize: 12, color: t.textSecondary, textAlign: "center", padding: "8px 0" }}>
          Sin compañías asignadas. Usa el botón Agregar.
        </p>
      )}
      {filas.map((fila, i) => (
        <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 8, alignItems: "center" }}>
          <select
            style={inputStyle}
            value={fila.compania_id}
            onChange={(e) => actualizarFila(i, "compania_id", e.target.value)}
          >
            <option value="">— Compañía —</option>
            {activas.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre_compania}</option>
            ))}
          </select>
          <input
            type="date"
            style={{ ...inputStyle, width: 150 }}
            value={fila.fecha_vencimiento}
            onChange={(e) => actualizarFila(i, "fecha_vencimiento", e.target.value)}
          />
          <button
            onClick={() => quitarFila(i)}
            style={{
              border: "none", background: "transparent",
              cursor: "pointer", color: "#ef4444", padding: 4,
            }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}

      {/* Guardar */}
      {filas.length > 0 && (
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Button variant="primary" onClick={handleGuardar} loading={guardando}>
            <Save size={13} style={{ marginRight: 5 }} />
            Guardar compañías
          </Button>
        </div>
      )}
    </div>
  );
}
