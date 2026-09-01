from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from .schemas import ClienteCreate, ClienteUpdate


def list_clientes(db: Session) -> list:
    rows = db.execute(text("""
        SELECT id, nombre, identificacion, correo_contacto, telefono_contacto, estado, creado_en
        FROM dbo.clientes
        ORDER BY nombre ASC
    """)).fetchall()
    return [dict(r._mapping) for r in rows]


def get_cliente(db: Session, cliente_id: int) -> dict:
    row = db.execute(
        text("""
            SELECT id, nombre, identificacion, correo_contacto, telefono_contacto, estado, creado_en
            FROM dbo.clientes WHERE id = :id
        """),
        {"id": cliente_id},
    ).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return dict(row._mapping)


def create_cliente(db: Session, data: ClienteCreate) -> dict:
    row = db.execute(text("""
        INSERT INTO dbo.clientes (nombre, identificacion, correo_contacto, telefono_contacto, estado)
        OUTPUT INSERTED.id
        VALUES (:n, :i, :c, :t, :e)
    """), {
        "n": data.nombre, "i": data.identificacion,
        "c": data.correo_contacto, "t": data.telefono_contacto, "e": data.estado,
    }).fetchone()

    db.commit()
    return get_cliente(db, row[0])


def update_cliente(db: Session, cliente_id: int, data: ClienteUpdate) -> dict:
    existing = db.execute(
        text("SELECT id FROM dbo.clientes WHERE id = :id"), {"id": cliente_id}
    ).fetchone()
    if not existing:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    db.execute(text("""
        UPDATE dbo.clientes
        SET nombre = :n, identificacion = :i, correo_contacto = :c,
            telefono_contacto = :t, estado = :e
        WHERE id = :id
    """), {
        "n": data.nombre, "i": data.identificacion,
        "c": data.correo_contacto, "t": data.telefono_contacto,
        "e": data.estado, "id": cliente_id,
    })

    db.commit()
    return get_cliente(db, cliente_id)


def delete_cliente(db: Session, cliente_id: int) -> None:
    existing = db.execute(
        text("SELECT id FROM dbo.clientes WHERE id = :id"), {"id": cliente_id}
    ).fetchone()
    if not existing:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    # Eliminar compañías relacionadas primero (en cascada manual)
    db.execute(text("DELETE FROM dbo.companias WHERE cliente_id = :id"), {"id": cliente_id})
    db.execute(text("DELETE FROM dbo.clientes WHERE id = :id"), {"id": cliente_id})
    db.commit()
