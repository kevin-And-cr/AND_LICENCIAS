from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from .schemas import RolCreate, RolUpdate


def list_roles(db: Session) -> list:
    rows = db.execute(text("EXEC dbo.usp_roles_listar")).fetchall()
    return [dict(r._mapping) for r in rows]


def get_rol(db: Session, rol_id: int) -> dict:
    row = db.execute(text("EXEC dbo.usp_roles_obtener @id = :id"), {"id": rol_id}).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Rol no encontrado")
    return dict(row._mapping)


def create_rol(db: Session, data: RolCreate) -> dict:
    conflict = db.execute(text("EXEC dbo.usp_roles_conflicto @codigo = :codigo, @id = NULL"), {"codigo": data.codigo}).fetchone()
    if conflict:
        raise HTTPException(status_code=400, detail="Ya existe un rol con ese código")

    row = db.execute(text("""
        EXEC dbo.usp_roles_crear
            @codigo = :codigo,
            @nombre = :nombre,
            @descripcion = :descripcion,
            @estado = :estado
    """), {
        "codigo": data.codigo,
        "nombre": data.nombre,
        "descripcion": data.descripcion,
        "estado": data.estado,
    }).fetchone()

    db.commit()
    if not row:
        raise HTTPException(status_code=400, detail="No se pudo crear el rol")
    return dict(row._mapping)


def update_rol(db: Session, rol_id: int, data: RolUpdate) -> dict:
    existing = db.execute(text("EXEC dbo.usp_roles_existe @id = :id"), {"id": rol_id}).fetchone()
    if not existing:
        raise HTTPException(status_code=404, detail="Rol no encontrado")

    conflict = db.execute(text("EXEC dbo.usp_roles_conflicto @codigo = :codigo, @id = :id"), {"codigo": data.codigo, "id": rol_id}).fetchone()
    if conflict:
        raise HTTPException(status_code=400, detail="Ya existe otro rol con ese código")

    row = db.execute(text("""
        EXEC dbo.usp_roles_actualizar
            @id = :id,
            @codigo = :codigo,
            @nombre = :nombre,
            @descripcion = :descripcion,
            @estado = :estado
    """), {
        "id": rol_id,
        "codigo": data.codigo,
        "nombre": data.nombre,
        "descripcion": data.descripcion,
        "estado": data.estado,
    }).fetchone()

    db.commit()
    if not row:
        raise HTTPException(status_code=404, detail="Rol no encontrado")
    return dict(row._mapping)


def delete_rol(db: Session, rol_id: int) -> None:
    row = db.execute(text("EXEC dbo.usp_roles_eliminar @id = :id"), {"id": rol_id}).fetchone()
    db.commit()
    if not row or row._mapping.get("filas_afectadas", 0) == 0:
        raise HTTPException(status_code=404, detail="Rol no encontrado")
