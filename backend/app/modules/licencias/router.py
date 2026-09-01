from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.api.v1.deps import get_current_user_id, get_db

from . import archivos, firmador, generador, service
from .schemas import (
    AgregarModuloRequest,
    AsignarCompaniasRequest,
    CambiarEstadoRequest,
    LicenciaCreate,
    LicenciaUpdate,
)

router = APIRouter()


# ── Lista y creación ────────────────────────────────────────────────────────────

@router.get("/")
def list_licencias(
    cliente_id: int | None = None,
    db: Session = Depends(get_db),
    _: int = Depends(get_current_user_id),
):
    return service.list_licencias(db, cliente_id)


@router.get("/siguiente-numero")
def siguiente_numero(
    db: Session = Depends(get_db),
    _: int = Depends(get_current_user_id),
):
    """Sugiere el próximo número de licencia disponible para el año actual."""
    from datetime import date
    year = date.today().year
    row = db.execute(
        text(
            "SELECT COUNT(*) AS total FROM dbo.licencias "
            "WHERE YEAR(fecha_creacion) = :y"
        ),
        {"y": year},
    ).fetchone()
    n = (row.total if row else 0) + 1
    return {"numero": f"LIC-{year}-{n:03d}"}


@router.post("/", status_code=201)
def create_licencia(
    data: LicenciaCreate,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    return service.create_licencia(db, data, user_id)


# ── Compañías de un módulo (rutas con segmento estático "modulos" antes) ────────
# Se definen ANTES de /{licencia_id} para que FastAPI no las confunda.

@router.post("/modulos/{licencia_modulo_id}/companias", status_code=201)
def asignar_companias(
    licencia_modulo_id: int,
    data: AsignarCompaniasRequest,
    db: Session = Depends(get_db),
    _: int = Depends(get_current_user_id),
):
    return service.asignar_companias(db, licencia_modulo_id, data)


@router.put("/modulos/{licencia_modulo_id}/companias")
def reemplazar_companias(
    licencia_modulo_id: int,
    data: AsignarCompaniasRequest,
    db: Session = Depends(get_db),
    _: int = Depends(get_current_user_id),
):
    return service.reemplazar_companias(db, licencia_modulo_id, data)


# ── Detalle, edición, estado ────────────────────────────────────────────────────

@router.get("/{licencia_id}")
def get_licencia(
    licencia_id: int,
    db: Session = Depends(get_db),
    _: int = Depends(get_current_user_id),
):
    return service.get_detalle_licencia(db, licencia_id)


@router.put("/{licencia_id}")
def update_licencia(
    licencia_id: int,
    data: LicenciaUpdate,
    db: Session = Depends(get_db),
    _: int = Depends(get_current_user_id),
):
    return service.update_licencia(db, licencia_id, data)


@router.patch("/{licencia_id}/estado")
def cambiar_estado(
    licencia_id: int,
    data: CambiarEstadoRequest,
    db: Session = Depends(get_db),
    _: int = Depends(get_current_user_id),
):
    return service.cambiar_estado(db, licencia_id, data.estado)


# ── Módulos de la licencia ──────────────────────────────────────────────────────

@router.post("/{licencia_id}/modulos", status_code=201)
def agregar_modulo(
    licencia_id: int,
    data: AgregarModuloRequest,
    db: Session = Depends(get_db),
    _: int = Depends(get_current_user_id),
):
    return service.agregar_modulo(db, licencia_id, data)


@router.delete("/{licencia_id}/modulos/{licencia_modulo_id}", status_code=204)
def quitar_modulo(
    licencia_id: int,
    licencia_modulo_id: int,
    db: Session = Depends(get_db),
    _: int = Depends(get_current_user_id),
):
    service.quitar_modulo(db, licencia_id, licencia_modulo_id)


# ── Validación y generación ─────────────────────────────────────────────────────

@router.post("/{licencia_id}/validar")
def validar_licencia(
    licencia_id: int,
    db: Session = Depends(get_db),
    _: int = Depends(get_current_user_id),
):
    errors = service.validar_para_generacion(db, licencia_id)
    return {"valida": len(errors) == 0, "errores": errors}


@router.post("/{licencia_id}/generar", status_code=201)
def generar_licencia(
    licencia_id: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    errors = service.validar_para_generacion(db, licencia_id)
    if errors:
        raise HTTPException(
            status_code=400,
            detail={"valida": False, "errores": errors},
        )

    u_row = db.execute(
        text("SELECT nombre_usuario FROM dbo.usuarios WHERE id = :id"),
        {"id": user_id},
    ).fetchone()
    usuario_nombre = u_row[0] if u_row else f"usuario-{user_id}"

    payload_dict         = generador.construir_payload(db, licencia_id, usuario_nombre)
    estructura, contenido = firmador.firmar_payload(db, payload_dict)
    hash_archivo         = firmador.calcular_hash(contenido)

    archivo = archivos.guardar_archivo(
        db, licencia_id, contenido, user_id, hash_archivo, estructura["id_llave"]
    )

    # Activar licencia y registrar fecha de emisión si estaba en borrador
    lic = service.get_licencia(db, licencia_id)
    if lic["estado"] == "borrador":
        db.execute(text("""
            UPDATE dbo.licencias
            SET estado       = 'activa',
                fecha_emision = CAST(SYSUTCDATETIME() AS DATE),
                actualizado_en = SYSUTCDATETIME()
            WHERE id = :id
        """), {"id": licencia_id})
        db.commit()

    return {"archivo": archivo, "hash": hash_archivo}


# ── Historial y descarga de archivos ───────────────────────────────────────────

@router.get("/{licencia_id}/archivos")
def listar_archivos(
    licencia_id: int,
    db: Session = Depends(get_db),
    _: int = Depends(get_current_user_id),
):
    return archivos.listar_archivos(db, licencia_id)


@router.get("/{licencia_id}/descargar")
def descargar_ultima(
    licencia_id: int,
    db: Session = Depends(get_db),
    _: int = Depends(get_current_user_id),
):
    archivo = archivos.obtener_ultimo_archivo(db, licencia_id)
    if not archivo:
        raise HTTPException(status_code=404, detail="No hay archivos generados para esta licencia")
    nombre = archivo["nombre_archivo"]
    return Response(
        content=archivo["contenido_firmado"],
        media_type="application/octet-stream",
        headers={"Content-Disposition": f'attachment; filename="{nombre}"'},
    )


@router.get("/{licencia_id}/archivos/{archivo_id}/descargar")
def descargar_archivo(
    licencia_id: int,
    archivo_id: int,
    db: Session = Depends(get_db),
    _: int = Depends(get_current_user_id),
):
    archivo = archivos.obtener_archivo_por_id(db, licencia_id, archivo_id)
    nombre = archivo["nombre_archivo"]
    return Response(
        content=archivo["contenido_firmado"],
        media_type="application/octet-stream",
        headers={"Content-Disposition": f'attachment; filename="{nombre}"'},
    )


# ── Payload decodificado (uso interno) ─────────────────────────────────────────

@router.get("/{licencia_id}/payload")
def ver_payload_licencia(
    licencia_id: int,
    db: Session = Depends(get_db),
    _: int = Depends(get_current_user_id),
):
    """Retorna el payload JSON decodificado del último archivo .lic generado (uso interno)."""
    import base64
    import json

    archivo = archivos.obtener_ultimo_archivo(db, licencia_id)
    if not archivo:
        raise HTTPException(status_code=404, detail="No hay archivos generados para esta licencia")

    estructura = json.loads(archivo["contenido_firmado"])
    payload_bytes = base64.b64decode(estructura["payload"])
    payload_dict = json.loads(payload_bytes.decode("utf-8"))

    return {
        "nombre_archivo": archivo["nombre_archivo"],
        "generado_en": archivo["generado_en"],
        "id_llave": estructura["id_llave"],
        "algoritmo": estructura["algoritmo"],
        "hash_archivo": archivo["hash_archivo"],
        "payload": payload_dict,
    }


@router.get("/{licencia_id}/archivos/{archivo_id}/payload")
def ver_payload_archivo(
    licencia_id: int,
    archivo_id: int,
    db: Session = Depends(get_db),
    _: int = Depends(get_current_user_id),
):
    """Retorna el payload JSON decodificado de un archivo .lic específico (uso interno)."""
    import base64
    import json

    archivo = archivos.obtener_archivo_por_id(db, licencia_id, archivo_id)

    estructura = json.loads(archivo["contenido_firmado"])
    payload_bytes = base64.b64decode(estructura["payload"])
    payload_dict = json.loads(payload_bytes.decode("utf-8"))

    return {
        "nombre_archivo": archivo["nombre_archivo"],
        "generado_en": archivo["generado_en"],
        "id_llave": estructura["id_llave"],
        "algoritmo": estructura["algoritmo"],
        "hash_archivo": archivo["hash_archivo"],
        "payload": payload_dict,
    }
