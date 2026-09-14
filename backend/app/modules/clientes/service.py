from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from .schemas import ClienteCreate, ClienteUpdate


def list_clientes(db: Session) -> list:
    rows = db.execute(text("EXEC dbo.usp_clientes_listar")).fetchall()
    return [dict(r._mapping) for r in rows]


def get_cliente(db: Session, cliente_id: int) -> dict:
    row = db.execute(
        text("EXEC dbo.usp_clientes_obtener @id = :id"),
        {"id": cliente_id},
    ).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return dict(row._mapping)


def create_cliente(db: Session, data: ClienteCreate) -> dict:
    row = db.execute(text("""
        EXEC dbo.usp_clientes_crear
            @nombre = :nombre,
            @identificacion = :identificacion,
            @correo_contacto = :correo_contacto,
            @telefono_contacto = :telefono_contacto,
            @estado = :estado
    """), {
        "nombre": data.nombre, "identificacion": data.identificacion,
        "correo_contacto": data.correo_contacto,
        "telefono_contacto": data.telefono_contacto, "estado": data.estado,
    }).fetchone()

    db.commit()
    return dict(row._mapping)


def update_cliente(db: Session, cliente_id: int, data: ClienteUpdate) -> dict:
    row = db.execute(text("""
        EXEC dbo.usp_clientes_actualizar
            @id = :id,
            @nombre = :nombre,
            @identificacion = :identificacion,
            @correo_contacto = :correo_contacto,
            @telefono_contacto = :telefono_contacto,
            @estado = :estado
    """), {
        "id": cliente_id, "nombre": data.nombre,
        "identificacion": data.identificacion,
        "correo_contacto": data.correo_contacto,
        "telefono_contacto": data.telefono_contacto, "estado": data.estado,
    }).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    db.commit()
    return dict(row._mapping)


def delete_cliente(db: Session, cliente_id: int) -> None:
    row = db.execute(
        text("EXEC dbo.usp_clientes_eliminar @id = :id"), {"id": cliente_id}
    ).fetchone()
    db.commit()
    if not row or row._mapping["filas_afectadas"] == 0:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
