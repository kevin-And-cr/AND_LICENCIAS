"""
Persistencia y descarga de los archivos .lic generados.
"""
from datetime import datetime

from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session


def guardar_archivo(
    db: Session,
    licencia_id: int,
    contenido_json: str,
    generado_por: int,
    hash_archivo: str,
    id_llave: str,
) -> dict:
    lic = db.execute(
        text("SELECT numero_licencia FROM dbo.licencias WHERE id = :id"),
        {"id": licencia_id},
    ).fetchone()
    numero = (lic[0] or "licencia").replace("/", "-").replace("\\", "-").replace(" ", "_")
    ts = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    nombre_archivo = f"{numero}_{ts}.lic"

    row = db.execute(text("""
        INSERT INTO dbo.licencia_archivos_generados
            (licencia_id, version_licencia, algoritmo, id_llave,
             nombre_archivo, contenido_firmado, hash_archivo, generado_por)
        OUTPUT INSERTED.id, INSERTED.generado_en
        VALUES (:lid, '1.0', 'Ed25519', :id_llave, :nombre, :contenido, :hash, :genpor)
    """), {
        "lid":       licencia_id,
        "id_llave":  id_llave,
        "nombre":    nombre_archivo,
        "contenido": contenido_json,
        "hash":      hash_archivo,
        "genpor":    generado_por,
    }).fetchone()
    db.commit()
    return {
        "id":            row[0],
        "nombre_archivo": nombre_archivo,
        "hash_archivo":  hash_archivo,
        "generado_en":   row[1],
    }


def obtener_ultimo_archivo(db: Session, licencia_id: int) -> dict | None:
    row = db.execute(text("""
        SELECT TOP 1
               id, nombre_archivo, contenido_firmado,
               hash_archivo, generado_por, generado_en
        FROM dbo.licencia_archivos_generados
        WHERE licencia_id = :lid
        ORDER BY generado_en DESC
    """), {"lid": licencia_id}).fetchone()
    if not row:
        return None
    return dict(row._mapping)


def obtener_archivo_por_id(db: Session, licencia_id: int, archivo_id: int) -> dict:
    row = db.execute(text("""
        SELECT id, nombre_archivo, contenido_firmado, hash_archivo, generado_por, generado_en
        FROM dbo.licencia_archivos_generados
        WHERE id = :aid AND licencia_id = :lid
    """), {"aid": archivo_id, "lid": licencia_id}).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Archivo no encontrado")
    return dict(row._mapping)


def listar_archivos(db: Session, licencia_id: int) -> list:
    rows = db.execute(text("""
        SELECT lag.id,
               lag.nombre_archivo,
               lag.hash_archivo,
               lag.version_licencia,
               lag.id_llave,
               lag.generado_por,
               u.nombre_usuario,
               lag.generado_en
        FROM dbo.licencia_archivos_generados lag
        INNER JOIN dbo.usuarios u ON u.id = lag.generado_por
        WHERE lag.licencia_id = :lid
        ORDER BY lag.generado_en DESC
    """), {"lid": licencia_id}).fetchall()
    return [dict(r._mapping) for r in rows]
