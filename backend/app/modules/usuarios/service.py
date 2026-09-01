from fastapi import HTTPException, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.security import hash_password
from .schemas import UsuarioCreate, UsuarioUpdate


def _row_to_dict(row, roles_nombres: str | None, rol_ids_str: str | None) -> dict:
    return {
        "id": row.id,
        "nombre_usuario": row.nombre_usuario,
        "correo": row.correo,
        "estado": row.estado,
        "creado_en": row.creado_en,
        "roles": [x.strip() for x in roles_nombres.split(",") if x.strip()] if roles_nombres else [],
        "rol_ids": [int(x) for x in rol_ids_str.split(",") if x.strip()] if rol_ids_str else [],
    }


def list_usuarios(db: Session) -> list:
    rows = db.execute(text("""
        SELECT
            u.id, u.nombre_usuario, u.correo, u.estado, u.creado_en,
            STRING_AGG(r.nombre, ',') AS roles_nombres,
            STRING_AGG(CAST(r.id AS NVARCHAR), ',') AS rol_ids_str
        FROM dbo.usuarios u
        LEFT JOIN dbo.usuario_roles ur ON u.id = ur.usuario_id
        LEFT JOIN dbo.roles r ON ur.rol_id = r.id
        GROUP BY u.id, u.nombre_usuario, u.correo, u.estado, u.creado_en
        ORDER BY u.id DESC
    """)).fetchall()

    return [_row_to_dict(r, r.roles_nombres, r.rol_ids_str) for r in rows]


def get_usuario(db: Session, usuario_id: int) -> dict:
    row = db.execute(
        text("SELECT id, nombre_usuario, correo, estado, creado_en FROM dbo.usuarios WHERE id = :id"),
        {"id": usuario_id},
    ).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    roles_rows = db.execute(text("""
        SELECT r.id, r.nombre
        FROM dbo.roles r
        INNER JOIN dbo.usuario_roles ur ON r.id = ur.rol_id
        WHERE ur.usuario_id = :uid
    """), {"uid": usuario_id}).fetchall()

    return {
        "id": row.id,
        "nombre_usuario": row.nombre_usuario,
        "correo": row.correo,
        "estado": row.estado,
        "creado_en": row.creado_en,
        "roles": [r.nombre for r in roles_rows],
        "rol_ids": [r.id for r in roles_rows],
    }


def create_usuario(db: Session, data: UsuarioCreate) -> dict:
    existing = db.execute(
        text("SELECT id FROM dbo.usuarios WHERE nombre_usuario = :u OR correo = :c"),
        {"u": data.nombre_usuario, "c": data.correo},
    ).fetchone()
    if existing:
        raise HTTPException(status_code=400, detail="El nombre de usuario o correo ya está en uso")

    hashed = hash_password(data.password)
    row = db.execute(text("""
        INSERT INTO dbo.usuarios (nombre_usuario, correo, password_hash, estado)
        OUTPUT INSERTED.id
        VALUES (:u, :c, :h, :e)
    """), {"u": data.nombre_usuario, "c": data.correo, "h": hashed, "e": data.estado}).fetchone()

    nuevo_id = row[0]

    for rol_id in data.rol_ids:
        db.execute(
            text("INSERT INTO dbo.usuario_roles (usuario_id, rol_id) VALUES (:u, :r)"),
            {"u": nuevo_id, "r": rol_id},
        )

    db.commit()
    return get_usuario(db, nuevo_id)


def update_usuario(db: Session, usuario_id: int, data: UsuarioUpdate) -> dict:
    existing = db.execute(
        text("SELECT id FROM dbo.usuarios WHERE id = :id"), {"id": usuario_id}
    ).fetchone()
    if not existing:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    conflict = db.execute(text("""
        SELECT id FROM dbo.usuarios
        WHERE (nombre_usuario = :u OR correo = :c) AND id != :id
    """), {"u": data.nombre_usuario, "c": data.correo, "id": usuario_id}).fetchone()
    if conflict:
        raise HTTPException(status_code=400, detail="El nombre de usuario o correo ya está en uso")

    if data.password:
        hashed = hash_password(data.password)
        db.execute(text("""
            UPDATE dbo.usuarios
            SET nombre_usuario = :u, correo = :c, password_hash = :h, estado = :e
            WHERE id = :id
        """), {"u": data.nombre_usuario, "c": data.correo, "h": hashed, "e": data.estado, "id": usuario_id})
    else:
        db.execute(text("""
            UPDATE dbo.usuarios
            SET nombre_usuario = :u, correo = :c, estado = :e
            WHERE id = :id
        """), {"u": data.nombre_usuario, "c": data.correo, "e": data.estado, "id": usuario_id})

    db.execute(text("DELETE FROM dbo.usuario_roles WHERE usuario_id = :uid"), {"uid": usuario_id})
    for rol_id in data.rol_ids:
        db.execute(
            text("INSERT INTO dbo.usuario_roles (usuario_id, rol_id) VALUES (:u, :r)"),
            {"u": usuario_id, "r": rol_id},
        )

    db.commit()
    return get_usuario(db, usuario_id)


def delete_usuario(db: Session, usuario_id: int) -> None:
    existing = db.execute(
        text("SELECT id FROM dbo.usuarios WHERE id = :id"), {"id": usuario_id}
    ).fetchone()
    if not existing:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    db.execute(text("DELETE FROM dbo.usuario_roles WHERE usuario_id = :uid"), {"uid": usuario_id})
    db.execute(text("DELETE FROM dbo.usuarios WHERE id = :id"), {"id": usuario_id})
    db.commit()
