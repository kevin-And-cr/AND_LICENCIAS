from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from .schemas import RolCreate, RolUpdate


def list_roles(db: Session) -> list:
    rows = db.execute(text("""
        SELECT id, codigo, nombre, descripcion, estado, creado_en
        FROM dbo.roles
        ORDER BY nombre ASC
    """)).fetchall()
    return [dict(r._mapping) for r in rows]


def get_rol(db: Session, rol_id: int) -> dict:
    row = db.execute(
        text("SELECT id, codigo, nombre, descripcion, estado, creado_en FROM dbo.roles WHERE id = :id"),
        {"id": rol_id},
    ).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Rol no encontrado")
    return dict(row._mapping)


def create_rol(db: Session, data: RolCreate) -> dict:
    existing = db.execute(
        text("SELECT id FROM dbo.roles WHERE codigo = :c"), {"c": data.codigo}
    ).fetchone()
    if existing:
        raise HTTPException(status_code=400, detail="Ya existe un rol con ese código")

    row = db.execute(text("""
        INSERT INTO dbo.roles (codigo, nombre, descripcion, estado)
        OUTPUT INSERTED.id
        VALUES (:c, :n, :d, :e)
    """), {"c": data.codigo, "n": data.nombre, "d": data.descripcion, "e": data.estado}).fetchone()

    db.commit()
    return get_rol(db, row[0])


def update_rol(db: Session, rol_id: int, data: RolUpdate) -> dict:
    existing = db.execute(
        text("SELECT id FROM dbo.roles WHERE id = :id"), {"id": rol_id}
    ).fetchone()
    if not existing:
        raise HTTPException(status_code=404, detail="Rol no encontrado")

    conflict = db.execute(
        text("SELECT id FROM dbo.roles WHERE codigo = :c AND id != :id"),
        {"c": data.codigo, "id": rol_id},
    ).fetchone()
    if conflict:
        raise HTTPException(status_code=400, detail="Ya existe otro rol con ese código")

    db.execute(text("""
        UPDATE dbo.roles
        SET codigo = :c, nombre = :n, descripcion = :d, estado = :e
        WHERE id = :id
    """), {"c": data.codigo, "n": data.nombre, "d": data.descripcion, "e": data.estado, "id": rol_id})

    db.commit()
    return get_rol(db, rol_id)


def delete_rol(db: Session, rol_id: int) -> None:
    existing = db.execute(
        text("SELECT id FROM dbo.roles WHERE id = :id"), {"id": rol_id}
    ).fetchone()
    if not existing:
        raise HTTPException(status_code=404, detail="Rol no encontrado")

    db.execute(text("DELETE FROM dbo.rol_permisos WHERE rol_id = :id"), {"id": rol_id})
    db.execute(text("DELETE FROM dbo.usuario_roles WHERE rol_id = :id"), {"id": rol_id})
    db.execute(text("DELETE FROM dbo.roles WHERE id = :id"), {"id": rol_id})
    db.commit()
