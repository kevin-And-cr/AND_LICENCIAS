"""
Construye el payload JSON que será firmado para generar el archivo .lic.
"""
from datetime import datetime

from sqlalchemy import text
from sqlalchemy.orm import Session

from . import service as licencia_service


def construir_payload(db: Session, licencia_id: int, usuario_nombre: str) -> dict:
    detalle = licencia_service.get_detalle_licencia(db, licencia_id)

    modulos_payload = []
    for mod in detalle["modulos"]:
        # Acciones activas del módulo
        acciones = db.execute(text("""
            SELECT codigo_accion, nombre_accion, permiso_generado
            FROM dbo.modulo_acciones
            WHERE modulo_id = :mid AND estado = 'activo'
            ORDER BY codigo_accion
        """), {"mid": mod["modulo_id"]}).fetchall()

        modulos_payload.append({
            "id_modulo":            mod["modulo_id"],
            "codigo_modulo":        mod["codigo"],
            "nombre_modulo":        mod["nombre"],
            "descripcion":          mod.get("descripcion"),
            "tipo_modulo":          mod["tipo_modulo"],
            "codigo_modulo_padre":  mod.get("codigo_padre"),
            "nombre_modulo_padre":  mod.get("nombre_padre"),
            "ruta":                 mod.get("ruta"),
            "icono":                mod.get("icono"),
            "orden":                mod.get("orden"),
            "requiere_jobs":        bool(mod.get("requiere_jobs")),
            "acciones":             [a.codigo_accion for a in acciones],
            "permisos_requeridos":  [a.permiso_generado for a in acciones],
            "cantidad_companias_permitidas": mod["cantidad_maxima_companias"],
            "companias": [
                {
                    "id_compania":     c["compania_id"],
                    "codigo_compania": c["codigo_compania"],
                    "nombre_compania": c["nombre_compania"],
                    "fecha_vencimiento": (
                        c["fecha_vencimiento"].isoformat()
                        if c["fecha_vencimiento"] else None
                    ),
                    "estado": c["estado"],
                }
                for c in mod["companias"]
            ],
        })

    now = datetime.utcnow()
    payload = {
        "numero_licencia":  detalle["numero_licencia"],
        "version_payload":  "1.0",
        "tipo_licencia":    detalle["tipo_licencia"],
        "ambiente":         detalle["ambiente"],
        "fecha_emision":    now.strftime("%Y-%m-%d"),
        "emitida_por":      usuario_nombre,
        "cliente": {
            "id_cliente": detalle["cliente_id"],
            "nombre":     detalle["nombre_cliente"],
        },
        "caracteristicas": {
            "cantidad_maxima_usuarios":    detalle["cantidad_maxima_usuarios"],
            "permite_jobs_segundo_plano":  bool(detalle.get("permite_jobs_segundo_plano")),
            "permite_api":                 bool(detalle.get("permite_api")),
        },
        "modulos": modulos_payload,
        "metadata": {
            "generada_en":  now.isoformat() + "Z",
            "zona_horaria": "UTC",
            "observaciones": detalle.get("observaciones"),
        },
    }
    return payload
