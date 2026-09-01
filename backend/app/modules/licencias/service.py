from fastapi import HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from .schemas import (
    AgregarModuloRequest,
    AsignarCompaniasRequest,
    LicenciaCreate,
    LicenciaUpdate,
)

_SELECT_LIC = """
    SELECT l.id, l.cliente_id,
           cl.nombre AS nombre_cliente,
           cl.estado AS estado_cliente,
           l.numero_licencia,
           l.fecha_emision,
           l.estado,
           l.tipo_licencia,
           l.ambiente,
           l.cantidad_maxima_usuarios,
           CAST(l.permite_jobs_segundo_plano AS BIT) AS permite_jobs_segundo_plano,
           CAST(l.permite_api AS BIT) AS permite_api,
           l.observaciones,
           l.creado_por,
           l.creado_en,
           l.actualizado_en
    FROM dbo.licencias l
    INNER JOIN dbo.clientes cl ON cl.id = l.cliente_id
"""


# ── Licencias básicas ──────────────────────────────────────────────────────────

def list_licencias(db: Session, cliente_id: int | None = None) -> list:
    if cliente_id:
        rows = db.execute(
            text(_SELECT_LIC + " WHERE l.cliente_id = :cid ORDER BY l.creado_en DESC"),
            {"cid": cliente_id},
        ).fetchall()
    else:
        rows = db.execute(
            text(_SELECT_LIC + " ORDER BY l.creado_en DESC")
        ).fetchall()
    return [dict(r._mapping) for r in rows]


def get_licencia(db: Session, licencia_id: int) -> dict:
    row = db.execute(
        text(_SELECT_LIC + " WHERE l.id = :id"),
        {"id": licencia_id},
    ).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Licencia no encontrada")
    return dict(row._mapping)


def get_detalle_licencia(db: Session, licencia_id: int) -> dict:
    lic = get_licencia(db, licencia_id)

    mods = db.execute(text("""
        SELECT lm.id,
               lm.modulo_id,
               lm.cantidad_maxima_companias,
               m.codigo,
               m.nombre,
               m.descripcion,
               m.tipo_modulo,
               m.ruta,
               m.icono,
               m.orden,
               CAST(m.requiere_jobs AS BIT) AS requiere_jobs,
               p.id   AS padre_id,
               p.codigo AS codigo_padre,
               p.nombre AS nombre_padre
        FROM dbo.licencia_modulos lm
        INNER JOIN dbo.modulos m ON m.id = lm.modulo_id
        LEFT  JOIN dbo.modulos p ON p.id = m.modulo_padre_id
        WHERE lm.licencia_id = :lid
        ORDER BY m.orden, m.nombre
    """), {"lid": licencia_id}).fetchall()

    modulos = []
    for mod in mods:
        mod_dict = dict(mod._mapping)
        comps = db.execute(text("""
            SELECT lmc.id,
                   lmc.compania_id,
                   lmc.fecha_vencimiento,
                   lmc.estado,
                   co.codigo_compania,
                   co.nombre_compania,
                   co.identificacion
            FROM dbo.licencia_modulo_companias lmc
            INNER JOIN dbo.companias co ON co.id = lmc.compania_id
            WHERE lmc.licencia_modulo_id = :lmid
            ORDER BY co.nombre_compania
        """), {"lmid": mod_dict["id"]}).fetchall()
        mod_dict["companias"] = [dict(c._mapping) for c in comps]
        modulos.append(mod_dict)

    lic["modulos"] = modulos
    return lic


def create_licencia(db: Session, data: LicenciaCreate, usuario_id: int) -> dict:
    cl = db.execute(
        text("SELECT id, estado FROM dbo.clientes WHERE id = :id"),
        {"id": data.cliente_id},
    ).fetchone()
    if not cl:
        raise HTTPException(status_code=400, detail="El cliente especificado no existe")
    if cl.estado != "activo":
        raise HTTPException(status_code=400, detail="El cliente no está activo")

    conflict = db.execute(
        text("SELECT id FROM dbo.licencias WHERE numero_licencia = :n"),
        {"n": data.numero_licencia},
    ).fetchone()
    if conflict:
        raise HTTPException(status_code=400, detail="El número de licencia ya existe")

    row = db.execute(text("""
        INSERT INTO dbo.licencias
            (cliente_id, numero_licencia, tipo_licencia, ambiente,
             cantidad_maxima_usuarios, permite_jobs_segundo_plano, permite_api,
             observaciones, estado, creado_por)
        OUTPUT INSERTED.id
        VALUES (:cid, :num, :tipo, :amb, :maxu, :jobs, :api, :obs, 'borrador', :uid)
    """), {
        "cid": data.cliente_id,
        "num": data.numero_licencia,
        "tipo": data.tipo_licencia,
        "amb": data.ambiente,
        "maxu": data.cantidad_maxima_usuarios,
        "jobs": 1 if data.permite_jobs_segundo_plano else 0,
        "api":  1 if data.permite_api else 0,
        "obs":  data.observaciones,
        "uid":  usuario_id,
    }).fetchone()
    db.commit()
    return get_detalle_licencia(db, row[0])


def update_licencia(db: Session, licencia_id: int, data: LicenciaUpdate) -> dict:
    lic = get_licencia(db, licencia_id)
    if lic["estado"] not in ("borrador",):
        raise HTTPException(
            status_code=400,
            detail="Solo se pueden editar licencias en estado 'borrador'",
        )

    conflict = db.execute(
        text("SELECT id FROM dbo.licencias WHERE numero_licencia = :n AND id <> :id"),
        {"n": data.numero_licencia, "id": licencia_id},
    ).fetchone()
    if conflict:
        raise HTTPException(status_code=400, detail="El número de licencia ya existe")

    db.execute(text("""
        UPDATE dbo.licencias
        SET numero_licencia            = :num,
            tipo_licencia              = :tipo,
            ambiente                   = :amb,
            cantidad_maxima_usuarios   = :maxu,
            permite_jobs_segundo_plano = :jobs,
            permite_api                = :api,
            observaciones              = :obs,
            actualizado_en             = SYSUTCDATETIME()
        WHERE id = :id
    """), {
        "num":  data.numero_licencia,
        "tipo": data.tipo_licencia,
        "amb":  data.ambiente,
        "maxu": data.cantidad_maxima_usuarios,
        "jobs": 1 if data.permite_jobs_segundo_plano else 0,
        "api":  1 if data.permite_api else 0,
        "obs":  data.observaciones,
        "id":   licencia_id,
    })
    db.commit()
    return get_detalle_licencia(db, licencia_id)


def cambiar_estado(db: Session, licencia_id: int, nuevo_estado: str) -> dict:
    ESTADOS_VALIDOS = ("borrador", "activa", "revocada", "expirada", "inactiva")
    if nuevo_estado not in ESTADOS_VALIDOS:
        raise HTTPException(
            status_code=400,
            detail=f"Estado inválido. Valores posibles: {ESTADOS_VALIDOS}",
        )
    get_licencia(db, licencia_id)  # verifica que existe
    db.execute(text("""
        UPDATE dbo.licencias
        SET estado = :e, actualizado_en = SYSUTCDATETIME()
        WHERE id = :id
    """), {"e": nuevo_estado, "id": licencia_id})
    db.commit()
    return get_detalle_licencia(db, licencia_id)


# ── Módulos de la licencia ─────────────────────────────────────────────────────

def agregar_modulo(db: Session, licencia_id: int, data: AgregarModuloRequest) -> dict:
    lic = get_licencia(db, licencia_id)
    if lic["estado"] not in ("borrador", "activa"):
        raise HTTPException(
            status_code=400,
            detail="Solo se pueden agregar módulos a licencias en borrador o activas",
        )

    mod = db.execute(
        text("SELECT id, tipo_modulo, estado, modulo_padre_id FROM dbo.modulos WHERE id = :id"),
        {"id": data.modulo_id},
    ).fetchone()
    if not mod:
        raise HTTPException(status_code=400, detail="El módulo no existe")
    if mod.tipo_modulo != "funcionalidad":
        raise HTTPException(
            status_code=400,
            detail="Solo se pueden licenciar módulos de tipo 'funcionalidad'",
        )
    if mod.estado != "activo":
        raise HTTPException(status_code=400, detail="El módulo no está activo")

    if mod.modulo_padre_id:
        padre = db.execute(
            text("SELECT estado FROM dbo.modulos WHERE id = :id"),
            {"id": mod.modulo_padre_id},
        ).fetchone()
        if not padre or padre.estado != "activo":
            raise HTTPException(status_code=400, detail="El módulo padre no está activo")

    dup = db.execute(
        text("SELECT id FROM dbo.licencia_modulos WHERE licencia_id = :lid AND modulo_id = :mid"),
        {"lid": licencia_id, "mid": data.modulo_id},
    ).fetchone()
    if dup:
        raise HTTPException(status_code=400, detail="El módulo ya está asignado a esta licencia")

    db.execute(text("""
        INSERT INTO dbo.licencia_modulos (licencia_id, modulo_id, cantidad_maxima_companias)
        VALUES (:lid, :mid, :max)
    """), {"lid": licencia_id, "mid": data.modulo_id, "max": data.cantidad_maxima_companias})
    db.commit()
    return get_detalle_licencia(db, licencia_id)


def quitar_modulo(db: Session, licencia_id: int, licencia_modulo_id: int) -> None:
    lic = get_licencia(db, licencia_id)
    if lic["estado"] not in ("borrador", "activa"):
        raise HTTPException(
            status_code=400,
            detail="Solo se pueden quitar módulos de licencias en borrador o activas",
        )

    lm = db.execute(
        text("SELECT id FROM dbo.licencia_modulos WHERE id = :lmid AND licencia_id = :lid"),
        {"lmid": licencia_modulo_id, "lid": licencia_id},
    ).fetchone()
    if not lm:
        raise HTTPException(status_code=404, detail="Módulo no encontrado en esta licencia")

    db.execute(
        text("DELETE FROM dbo.licencia_modulo_companias WHERE licencia_modulo_id = :lmid"),
        {"lmid": licencia_modulo_id},
    )
    db.execute(
        text("DELETE FROM dbo.licencia_modulos WHERE id = :lmid"),
        {"lmid": licencia_modulo_id},
    )
    db.commit()


# ── Compañías por módulo ───────────────────────────────────────────────────────

def _get_licencia_id_from_lm(db: Session, licencia_modulo_id: int) -> int:
    row = db.execute(
        text("SELECT licencia_id FROM dbo.licencia_modulos WHERE id = :id"),
        {"id": licencia_modulo_id},
    ).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="licencia_modulo no encontrado")
    return row[0]


def asignar_companias(
    db: Session, licencia_modulo_id: int, data: AsignarCompaniasRequest
) -> dict:
    """Agrega compañías sin reemplazar las existentes."""
    licencia_id = _get_licencia_id_from_lm(db, licencia_modulo_id)

    lic_row = db.execute(
        text("SELECT cliente_id, estado FROM dbo.licencias WHERE id = :id"),
        {"id": licencia_id},
    ).fetchone()
    if lic_row.estado not in ("borrador", "activa"):
        raise HTTPException(
            status_code=400,
            detail="Solo se pueden asignar compañías a licencias en borrador o activas",
        )

    cliente_id = lic_row.cliente_id
    lm = db.execute(
        text("SELECT cantidad_maxima_companias FROM dbo.licencia_modulos WHERE id = :id"),
        {"id": licencia_modulo_id},
    ).fetchone()

    for item in data.companias:
        co = db.execute(
            text("SELECT id, estado FROM dbo.companias WHERE id = :cid AND cliente_id = :kid"),
            {"cid": item.compania_id, "kid": cliente_id},
        ).fetchone()
        if not co:
            raise HTTPException(
                status_code=400,
                detail=f"La compañía {item.compania_id} no pertenece al cliente de la licencia",
            )
        if co.estado != "activo":
            raise HTTPException(
                status_code=400,
                detail=f"La compañía {item.compania_id} no está activa",
            )

        dup = db.execute(
            text("SELECT id FROM dbo.licencia_modulo_companias WHERE licencia_modulo_id = :lmid AND compania_id = :cid"),
            {"lmid": licencia_modulo_id, "cid": item.compania_id},
        ).fetchone()
        if dup:
            raise HTTPException(
                status_code=400,
                detail=f"La compañía {item.compania_id} ya está asignada a este módulo",
            )

    existing = db.execute(
        text("SELECT COUNT(*) FROM dbo.licencia_modulo_companias WHERE licencia_modulo_id = :lmid"),
        {"lmid": licencia_modulo_id},
    ).fetchone()[0]
    if existing + len(data.companias) > lm.cantidad_maxima_companias:
        raise HTTPException(
            status_code=400,
            detail=f"Se excede la cantidad máxima de compañías ({lm.cantidad_maxima_companias})",
        )

    for item in data.companias:
        db.execute(text("""
            INSERT INTO dbo.licencia_modulo_companias
                (licencia_modulo_id, compania_id, fecha_vencimiento, estado)
            VALUES (:lmid, :cid, :fv, 'activo')
        """), {
            "lmid": licencia_modulo_id,
            "cid":  item.compania_id,
            "fv":   item.fecha_vencimiento.isoformat(),
        })
    db.commit()
    return get_detalle_licencia(db, licencia_id)


def reemplazar_companias(
    db: Session, licencia_modulo_id: int, data: AsignarCompaniasRequest
) -> dict:
    """Reemplaza todas las compañías de un módulo licenciado."""
    licencia_id = _get_licencia_id_from_lm(db, licencia_modulo_id)

    lic_row = db.execute(
        text("SELECT cliente_id, estado FROM dbo.licencias WHERE id = :id"),
        {"id": licencia_id},
    ).fetchone()
    if lic_row.estado not in ("borrador", "activa"):
        raise HTTPException(
            status_code=400,
            detail="Solo se pueden asignar compañías a licencias en borrador o activas",
        )

    cliente_id = lic_row.cliente_id
    lm = db.execute(
        text("SELECT cantidad_maxima_companias FROM dbo.licencia_modulos WHERE id = :id"),
        {"id": licencia_modulo_id},
    ).fetchone()

    if len(data.companias) > lm.cantidad_maxima_companias:
        raise HTTPException(
            status_code=400,
            detail=f"Se excede la cantidad máxima de compañías ({lm.cantidad_maxima_companias})",
        )

    for item in data.companias:
        co = db.execute(
            text("SELECT id, estado FROM dbo.companias WHERE id = :cid AND cliente_id = :kid"),
            {"cid": item.compania_id, "kid": cliente_id},
        ).fetchone()
        if not co:
            raise HTTPException(
                status_code=400,
                detail=f"La compañía {item.compania_id} no pertenece al cliente de la licencia",
            )
        if co.estado != "activo":
            raise HTTPException(
                status_code=400,
                detail=f"La compañía {item.compania_id} no está activa",
            )

    db.execute(
        text("DELETE FROM dbo.licencia_modulo_companias WHERE licencia_modulo_id = :lmid"),
        {"lmid": licencia_modulo_id},
    )
    for item in data.companias:
        db.execute(text("""
            INSERT INTO dbo.licencia_modulo_companias
                (licencia_modulo_id, compania_id, fecha_vencimiento, estado)
            VALUES (:lmid, :cid, :fv, 'activo')
        """), {
            "lmid": licencia_modulo_id,
            "cid":  item.compania_id,
            "fv":   item.fecha_vencimiento.isoformat(),
        })
    db.commit()
    return get_detalle_licencia(db, licencia_id)


# ── Validación pre-generación ──────────────────────────────────────────────────

def validar_para_generacion(db: Session, licencia_id: int) -> list[str]:
    errors: list[str] = []

    row = db.execute(text("""
        SELECT l.estado, cl.estado AS estado_cliente
        FROM dbo.licencias l
        INNER JOIN dbo.clientes cl ON cl.id = l.cliente_id
        WHERE l.id = :id
    """), {"id": licencia_id}).fetchone()

    if not row:
        return ["Licencia no encontrada"]

    if row.estado_cliente != "activo":
        errors.append("El cliente de la licencia no está activo")
    if row.estado == "revocada":
        errors.append("No se puede regenerar una licencia revocada")

    mods = db.execute(text("""
        SELECT lm.id, m.nombre
        FROM dbo.licencia_modulos lm
        INNER JOIN dbo.modulos m ON m.id = lm.modulo_id
        WHERE lm.licencia_id = :lid
    """), {"lid": licencia_id}).fetchall()

    if not mods:
        errors.append("La licencia debe tener al menos un módulo asignado")

    for mod in mods:
        cnt = db.execute(
            text("SELECT COUNT(*) FROM dbo.licencia_modulo_companias WHERE licencia_modulo_id = :lmid"),
            {"lmid": mod.id},
        ).fetchone()[0]
        if cnt == 0:
            errors.append(f"El módulo '{mod.nombre}' no tiene compañías asignadas")

        inactive = db.execute(text("""
            SELECT COUNT(*)
            FROM dbo.licencia_modulo_companias lmc
            INNER JOIN dbo.companias co ON co.id = lmc.compania_id
            WHERE lmc.licencia_modulo_id = :lmid AND co.estado != 'activo'
        """), {"lmid": mod.id}).fetchone()[0]
        if inactive > 0:
            errors.append(f"El módulo '{mod.nombre}' tiene compañías inactivas")

    return errors
