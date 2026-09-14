from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from .schemas import ModuloCreate, ModuloUpdate


def list_modulos(db: Session) -> list:
    rows = db.execute(text("EXEC dbo.usp_modulos_listar")).fetchall()
    return [dict(r._mapping) for r in rows]


def get_modulo(db: Session, modulo_id: int) -> dict:
    row = db.execute(text("EXEC dbo.usp_modulos_obtener @id = :id"), {"id": modulo_id}).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Módulo no encontrado")
    return dict(row._mapping)


def create_modulo(db: Session, data: ModuloCreate) -> dict:
    conflict = db.execute(text("EXEC dbo.usp_modulos_conflicto @codigo = :codigo, @id = NULL"), {"codigo": data.codigo}).fetchone()
    if conflict:
        raise HTTPException(status_code=400, detail="Ya existe un módulo con ese código")

    if data.modulo_padre_id is not None:
        padre = db.execute(text("EXEC dbo.usp_modulos_existe @id = :id"), {"id": data.modulo_padre_id}).fetchone()
        if not padre:
            raise HTTPException(status_code=400, detail="El módulo padre no existe")

    row = db.execute(text("""
        EXEC dbo.usp_modulos_crear
            @codigo = :codigo,
            @nombre = :nombre,
            @descripcion = :descripcion,
            @modulo_padre_id = :modulo_padre_id,
            @tipo_modulo = :tipo_modulo,
            @ruta = :ruta,
            @icono = :icono,
            @orden = :orden,
            @requiere_jobs = :requiere_jobs,
            @estado = :estado
    """), {
        "codigo": data.codigo,
        "nombre": data.nombre,
        "descripcion": data.descripcion,
        "modulo_padre_id": data.modulo_padre_id,
        "tipo_modulo": data.tipo_modulo,
        "ruta": data.ruta,
        "icono": data.icono,
        "orden": data.orden,
        "requiere_jobs": 1 if data.requiere_jobs else 0,
        "estado": data.estado,
    }).fetchone()

    db.commit()
    if not row:
        raise HTTPException(status_code=400, detail="No se pudo crear el módulo")
    return dict(row._mapping)


def update_modulo(db: Session, modulo_id: int, data: ModuloUpdate) -> dict:
    existing = db.execute(text("EXEC dbo.usp_modulos_existe @id = :id"), {"id": modulo_id}).fetchone()
    if not existing:
        raise HTTPException(status_code=404, detail="Módulo no encontrado")

    conflict = db.execute(text("EXEC dbo.usp_modulos_conflicto @codigo = :codigo, @id = :id"), {"codigo": data.codigo, "id": modulo_id}).fetchone()
    if conflict:
        raise HTTPException(status_code=400, detail="Ya existe otro módulo con ese código")

    if data.modulo_padre_id is not None:
        if data.modulo_padre_id == modulo_id:
            raise HTTPException(status_code=400, detail="Un módulo no puede ser su propio padre")
        padre = db.execute(text("EXEC dbo.usp_modulos_existe @id = :id"), {"id": data.modulo_padre_id}).fetchone()
        if not padre:
            raise HTTPException(status_code=400, detail="El módulo padre no existe")

    row = db.execute(text("""
        EXEC dbo.usp_modulos_actualizar
            @id = :id,
            @codigo = :codigo,
            @nombre = :nombre,
            @descripcion = :descripcion,
            @modulo_padre_id = :modulo_padre_id,
            @tipo_modulo = :tipo_modulo,
            @ruta = :ruta,
            @icono = :icono,
            @orden = :orden,
            @requiere_jobs = :requiere_jobs,
            @estado = :estado
    """), {
        "id": modulo_id,
        "codigo": data.codigo,
        "nombre": data.nombre,
        "descripcion": data.descripcion,
        "modulo_padre_id": data.modulo_padre_id,
        "tipo_modulo": data.tipo_modulo,
        "ruta": data.ruta,
        "icono": data.icono,
        "orden": data.orden,
        "requiere_jobs": 1 if data.requiere_jobs else 0,
        "estado": data.estado,
    }).fetchone()

    db.commit()
    if not row:
        raise HTTPException(status_code=404, detail="Módulo no encontrado")
    return dict(row._mapping)


def delete_modulo(db: Session, modulo_id: int) -> None:
    row = db.execute(text("EXEC dbo.usp_modulos_eliminar @id = :id"), {"id": modulo_id}).fetchone()
    db.commit()
    if not row or row._mapping.get("filas_afectadas", 0) == 0:
        raise HTTPException(status_code=404, detail="Módulo no encontrado")
