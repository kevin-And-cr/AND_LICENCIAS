from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from .schemas import CompaniaCreate, CompaniaUpdate

_SELECT = """
    SELECT co.id, co.cliente_id, cl.nombre AS nombre_cliente,
           co.codigo_compania, co.nombre_compania, co.identificacion,
           co.estado, co.creado_en
    FROM dbo.companias co
    INNER JOIN dbo.clientes cl ON co.cliente_id = cl.id
"""


def list_companias(db: Session, cliente_id: int | None = None) -> list:
    if cliente_id:
        rows = db.execute(
            text(_SELECT + " WHERE co.cliente_id = :cid ORDER BY co.nombre_compania ASC"),
            {"cid": cliente_id},
        ).fetchall()
    else:
        rows = db.execute(
            text(_SELECT + " ORDER BY cl.nombre ASC, co.nombre_compania ASC")
        ).fetchall()
    return [dict(r._mapping) for r in rows]


def get_compania(db: Session, compania_id: int) -> dict:
    row = db.execute(
        text(_SELECT + " WHERE co.id = :id"),
        {"id": compania_id},
    ).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Compañía no encontrada")
    return dict(row._mapping)


def create_compania(db: Session, data: CompaniaCreate) -> dict:
    # Verificar que el cliente existe
    cl = db.execute(text("SELECT id FROM dbo.clientes WHERE id = :id"), {"id": data.cliente_id}).fetchone()
    if not cl:
        raise HTTPException(status_code=400, detail="El cliente especificado no existe")

    # Código de compañía único por cliente
    conflict = db.execute(text("""
        SELECT id FROM dbo.companias
        WHERE cliente_id = :cid AND codigo_compania = :cod
    """), {"cid": data.cliente_id, "cod": data.codigo_compania}).fetchone()
    if conflict:
        raise HTTPException(status_code=400, detail="Ya existe una compañía con ese código para este cliente")

    row = db.execute(text("""
        INSERT INTO dbo.companias (cliente_id, codigo_compania, nombre_compania, identificacion, estado)
        OUTPUT INSERTED.id
        VALUES (:cid, :cod, :nom, :ident, :e)
    """), {
        "cid": data.cliente_id, "cod": data.codigo_compania,
        "nom": data.nombre_compania, "ident": data.identificacion, "e": data.estado,
    }).fetchone()

    db.commit()
    return get_compania(db, row[0])


def update_compania(db: Session, compania_id: int, data: CompaniaUpdate) -> dict:
    existing = db.execute(
        text("SELECT id FROM dbo.companias WHERE id = :id"), {"id": compania_id}
    ).fetchone()
    if not existing:
        raise HTTPException(status_code=404, detail="Compañía no encontrada")

    conflict = db.execute(text("""
        SELECT id FROM dbo.companias
        WHERE cliente_id = :cid AND codigo_compania = :cod AND id != :id
    """), {"cid": data.cliente_id, "cod": data.codigo_compania, "id": compania_id}).fetchone()
    if conflict:
        raise HTTPException(status_code=400, detail="Ya existe otra compañía con ese código para este cliente")

    db.execute(text("""
        UPDATE dbo.companias
        SET cliente_id = :cid, codigo_compania = :cod, nombre_compania = :nom,
            identificacion = :ident, estado = :e
        WHERE id = :id
    """), {
        "cid": data.cliente_id, "cod": data.codigo_compania,
        "nom": data.nombre_compania, "ident": data.identificacion,
        "e": data.estado, "id": compania_id,
    })

    db.commit()
    return get_compania(db, compania_id)


def delete_compania(db: Session, compania_id: int) -> None:
    existing = db.execute(
        text("SELECT id FROM dbo.companias WHERE id = :id"), {"id": compania_id}
    ).fetchone()
    if not existing:
        raise HTTPException(status_code=404, detail="Compañía no encontrada")

    db.execute(text("DELETE FROM dbo.companias WHERE id = :id"), {"id": compania_id})
    db.commit()
