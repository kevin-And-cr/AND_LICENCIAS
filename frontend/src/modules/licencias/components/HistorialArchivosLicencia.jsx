/**
 * Tabla de historial de archivos .lic generados.
 * Props:
 *   licenciaId   number
 *   isDark       boolean
 *   onRecargar   () => void   (señal para recargar después de nueva generación)
 */
import { useEffect, useState } from "react";
import { FileDown, Hash, User, Calendar, RefreshCw } from "lucide-react";
import { tk } from "../../../utils/theme";
import { useToast } from "../../../store/ToastContext";
import { api } from "../../../services/api";
import { Spinner } from "../../../components/ui/Spinner";
import { Button } from "../../../components/ui/Button";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1";

async function descargarArchivo(licenciaId, archivoId, nombreArchivo) {
  const token = localStorage.getItem("access_token");
  const res = await fetch(
    `${BASE_URL}/licencias/${licenciaId}/archivos/${archivoId}/descargar`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error("Error al descargar el archivo");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombreArchivo;
  a.click();
  URL.revokeObjectURL(url);
}

export function HistorialArchivosLicencia({ licenciaId, isDark, recargar }) {
  const t = tk(isDark);
  const toast = useToast();
  const [archivos, setArchivos] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchArchivos = () => {
    setLoading(true);
    api.get(`/licencias/${licenciaId}/archivos`)
      .then(setArchivos)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchArchivos(); }, [licenciaId, recargar]);

  const handleDescargar = async (archivo) => {
    try {
      await descargarArchivo(licenciaId, archivo.id, archivo.nombre_archivo);
      toast.success(`Descargando ${archivo.nombre_archivo}`);
    } catch (err) {
      toast.error(err.message ?? "Error al descargar archivo");
    }
  };

  if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: 24 }}><Spinner size={20} /></div>;

  if (archivos.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: 32, color: t.textSecondary }}>
        <FileDown size={28} strokeWidth={1.2} style={{ marginBottom: 8, opacity: 0.4 }} />
        <p style={{ margin: 0, fontSize: 13 }}>No se han generado archivos para esta licencia</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Button variant="ghost" onClick={fetchArchivos} style={{ fontSize: 12, padding: "4px 10px" }}>
          <RefreshCw size={12} style={{ marginRight: 4 }} />
          Actualizar
        </Button>
      </div>
      <div style={{
        border: `1px solid ${t.cardBorder}`, borderRadius: 10, overflow: "hidden",
      }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: isDark ? "#263347" : "#f8fafc", borderBottom: `1px solid ${t.headBorder}` }}>
              {["Archivo", "Hash SHA-256", "Generado por", "Fecha", ""].map((h) => (
                <th key={h} style={{
                  padding: "8px 12px", textAlign: "left",
                  fontSize: 11, fontWeight: 600, color: t.textSecondary,
                  textTransform: "uppercase", letterSpacing: "0.06em",
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {archivos.map((a) => (
              <tr key={a.id} style={{ borderBottom: `1px solid ${t.rowBorder}` }}>
                <td style={{ padding: "10px 12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <FileDown size={13} color="#F48124" />
                    <span style={{ fontSize: 12, fontFamily: "monospace", color: t.textPrimary }}>
                      {a.nombre_archivo}
                    </span>
                  </div>
                </td>
                <td style={{ padding: "10px 12px" }}>
                  <span style={{
                    fontSize: 11, fontFamily: "monospace",
                    color: t.codeText, background: t.codeBg,
                    padding: "2px 6px", borderRadius: 4,
                  }}>
                    {a.hash_archivo?.slice(0, 16)}…
                  </span>
                </td>
                <td style={{ padding: "10px 12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: t.textSecondary }}>
                    <User size={12} />
                    {a.nombre_usuario}
                  </div>
                </td>
                <td style={{ padding: "10px 12px", fontSize: 12, color: t.textSecondary }}>
                  {a.generado_en
                    ? new Date(a.generado_en).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" })
                    : "—"}
                </td>
                <td style={{ padding: "10px 12px" }}>
                  <button
                    onClick={() => handleDescargar(a)}
                    title="Descargar"
                    style={{
                      border: "none", background: "transparent",
                      cursor: "pointer", color: "#F48124", padding: 4,
                      display: "flex", alignItems: "center", gap: 4,
                      fontSize: 12,
                    }}
                  >
                    <FileDown size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
