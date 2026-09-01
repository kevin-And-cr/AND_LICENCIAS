from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from .schemas import ModuloCreate, ModuloUpdate


def list_modulos(db: Session) -> list:
    rows = db.execute(text("""
        SELECT
            m.id, m.codigo, m.nombre, m.descripcion,
            m.modulo_padre_id, p.nombre AS nombre_padre,
            m.tipo_modulo, m.ruta, m.icono, m.orden,
            m.requiere_jobs, m.estado, m.creado_en, m.actualizado_en
        FROM dbo.modulos m
        LEFT JOIN dbo.modulos p ON p.id = m.modulo_padre_id
        ORDER BY m.orden ASC, m.nombre ASC
    """)).fetchall()
    return [dict(r._mapping) for r in rows]


def get_modulo(db: Session, modulo_id: int) -> dict:
    row = db.execute(text("""
        SELECT
            m.id, m.codigo, m.nombre, m.descripcion,
            m.modulo_padre_id, p.nombre AS nombre_padre,
            m.tipo_modulo, m.ruta, m.icono, m.orden,
            m.requiere_jobs, m.estado, m.creado_en, m.actualizado_en
        FROM dbo.modulos m
        LEFT JOIN dbo.modulos p ON p.id = m.modulo_padre_id
        WHERE m.id = :id
    """), {"id": modulo_id}).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Módulo no encontrado")
    return dict(row._mapping)


def create_modulo(db: Session, data: ModuloCreate) -> dict:
    existing = db.execute(
        text("SELECT id FROM dbo.modulos WHERE codigo = :c"), {"c": data.codigo}
    ).fetchone()
    if existing:
        raise HTTPException(status_code=400, detail="Ya existe un módulo con ese código")

    if data.modulo_padre_id is not None:
        padre = db.execute(
            text("SELECT id FROM dbo.modulos WHERE id = :id"), {"id": data.modulo_padre_id}
        ).fetchone()
        if not padre:
            raise HTTPException(status_code=400, detail="El módulo padre no existe")

    row = db.execute(text("""
        INSERT INTO dbo.modulos
            (codigo, nombre, descripcion, modulo_padre_id, tipo_modulo, ruta, icono, orden, requiere_jobs, estado)
        OUTPUT INSERTED.id
        VALUES (:codigo, :nombre, :descripcion, :padre, :tipo, :ruta, :icono, :orden, :jobs, :estado)
    """), {
        "codigo": data.codigo,
        "nombre": data.nombre,
        "descripcion": data.descripcion,
        "padre": data.modulo_padre_id,
        "tipo": data.tipo_modulo,
        "ruta": data.ruta,
        "icono": data.icono,
        "orden": data.orden,
        "jobs": 1 if data.requiere_jobs else 0,
        "estado": data.estado,
    }).fetchone()

    db.commit()
    return get_modulo(db, row[0])


def update_modulo(db: Session, modulo_id: int, data: ModuloUpdate) -> dict:
    existing = db.execute(
        text("SELECT id FROM dbo.modulos WHERE id = :id"), {"id": modulo_id}
    ).fetchone()
    if not existing:
        raise HTTPException(status_code=404, detail="Módulo no encontrado")

    conflict = db.execute(
        text("SELECT id FROM dbo.modulos WHERE codigo = :c AND id != :id"),
        {"c": data.codigo, "id": modulo_id},
    ).fetchone()
    if conflict:
        raise HTTPException(status_code=400, detail="Ya existe otro módulo con ese código")

    if data.modulo_padre_id is not None:
        if data.modulo_padre_id == modulo_id:
            raise HTTPException(status_code=400, detail="Un módulo no puede ser su propio padre")
        padre = db.execute(
            text("SELECT id FROM dbo.modulos WHERE id = :id"), {"id": data.modulo_padre_id}
        ).fetchone()
        if not padre:
            raise HTTPException(status_code=400, detail="El módulo padre no existe")

    db.execute(text("""
        UPDATE dbo.modulos
        SET codigo = :codigo, nombre = :nombre, descripcion = :descripcion,
            modulo_padre_id = :padre, tipo_modulo = :tipo, ruta = :ruta,
            icono = :icono, orden = :orden, requiere_jobs = :jobs,
            estado = :estado, actualizado_en = SYSUTCDATETIME()
        WHERE id = :id
    """), {
        "codigo": data.codigo,
        "nombre": data.nombre,
        "descripcion": data.descripcion,
        "padre": data.modulo_padre_id,
        "tipo": data.tipo_modulo,
        "ruta": data.ruta,
        "icono": data.icono,
        "orden": data.orden,
        "jobs": 1 if data.requiere_jobs else 0,
        "estado": data.estado,
        "id": modulo_id,
    })

    db.commit()
    return get_modulo(db, modulo_id)


def delete_modulo(db: Session, modulo_id: int) -> None:
    existing = db.execute(
        text("SELECT id FROM dbo.modulos WHERE id = :id"), {"id": modulo_id}
    ).fetchone()
    if not existing:
        raise HTTPException(status_code=404, detail="Módulo no encontrado")

    hijos = db.execute(
        text("SELECT id FROM dbo.modulos WHERE modulo_padre_id = :id"), {"id": modulo_id}
    ).fetchone()
    if hijos:
        raise HTTPException(
            status_code=400,
            detail="No se puede eliminar un módulo que tiene submódulos. Elimina primero los submódulos.",
        )

    db.execute(text("DELETE FROM dbo.modulos WHERE id = :id"), {"id": modulo_id})
    db.commit()
