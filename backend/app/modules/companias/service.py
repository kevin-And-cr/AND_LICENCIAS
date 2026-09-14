from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from .schemas import CompaniaCreate, CompaniaUpdate


def list_companias(db: Session, cliente_id: int | None = None) -> list:
    rows = db.execute(
        text("EXEC dbo.usp_companias_listar @cliente_id = :cliente_id"),
        {"cliente_id": cliente_id},
    ).fetchall()
    return [dict(r._mapping) for r in rows]


def get_compania(db: Session, compania_id: int) -> dict:
    row = db.execute(
        text("EXEC dbo.usp_companias_obtener @id = :id"),
        {"id": compania_id},
    ).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Compañía no encontrada")
    return dict(row._mapping)


def create_compania(db: Session, data: CompaniaCreate) -> dict:
    cliente = db.execute(text("EXEC dbo.usp_clientes_existe @id = :id"), {"id": data.cliente_id}).fetchone()
    if not cliente:
        raise HTTPException(status_code=400, detail="El cliente especificado no existe")

    conflict = db.execute(text("EXEC dbo.usp_companias_conflicto @cliente_id = :cliente_id, @codigo_compania = :codigo_compania, @id = NULL"), {
        "cliente_id": data.cliente_id,
        "codigo_compania": data.codigo_compania,
    }).fetchone()
    if conflict:
        raise HTTPException(status_code=400, detail="Ya existe una compañía con ese código para este cliente")

    row = db.execute(text("""
        EXEC dbo.usp_companias_crear
            @cliente_id = :cliente_id,
            @codigo_compania = :codigo_compania,
            @nombre_compania = :nombre_compania,
            @identificacion = :identificacion,
            @estado = :estado
    """), {
        "cliente_id": data.cliente_id,
        "codigo_compania": data.codigo_compania,
        "nombre_compania": data.nombre_compania,
        "identificacion": data.identificacion,
        "estado": data.estado,
    }).fetchone()

    db.commit()
    if not row:
        raise HTTPException(status_code=400, detail="No se pudo crear la compañía")
    return dict(row._mapping)


def update_compania(db: Session, compania_id: int, data: CompaniaUpdate) -> dict:
    existing = db.execute(text("EXEC dbo.usp_companias_existe @id = :id"), {"id": compania_id}).fetchone()
    if not existing:
        raise HTTPException(status_code=404, detail="Compañía no encontrada")

    cliente = db.execute(text("EXEC dbo.usp_clientes_existe @id = :id"), {"id": data.cliente_id}).fetchone()
    if not cliente:
        raise HTTPException(status_code=400, detail="El cliente especificado no existe")

    conflict = db.execute(text("EXEC dbo.usp_companias_conflicto @cliente_id = :cliente_id, @codigo_compania = :codigo_compania, @id = :id"), {
        "cliente_id": data.cliente_id,
        "codigo_compania": data.codigo_compania,
        "id": compania_id,
    }).fetchone()
    if conflict:
        raise HTTPException(status_code=400, detail="Ya existe otra compañía con ese código para este cliente")

    row = db.execute(text("""
        EXEC dbo.usp_companias_actualizar
            @id = :id,
            @cliente_id = :cliente_id,
            @codigo_compania = :codigo_compania,
            @nombre_compania = :nombre_compania,
            @identificacion = :identificacion,
            @estado = :estado
    """), {
        "id": compania_id,
        "cliente_id": data.cliente_id,
        "codigo_compania": data.codigo_compania,
        "nombre_compania": data.nombre_compania,
        "identificacion": data.identificacion,
        "estado": data.estado,
    }).fetchone()

    db.commit()
    if not row:
        raise HTTPException(status_code=404, detail="Compañía no encontrada")
    return dict(row._mapping)


def delete_compania(db: Session, compania_id: int) -> None:
    row = db.execute(text("EXEC dbo.usp_companias_eliminar @id = :id"), {"id": compania_id}).fetchone()
    db.commit()
    if not row or row._mapping.get("filas_afectadas", 0) == 0:
        raise HTTPException(status_code=404, detail="Compañía no encontrada")
