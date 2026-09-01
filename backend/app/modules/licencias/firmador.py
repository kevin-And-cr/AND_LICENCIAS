"""
Firma el payload JSON con Ed25519 y calcula el hash del archivo .lic resultante.
"""
import base64
import hashlib
import json
from pathlib import Path

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core import crypto
from app.core.config import settings

_ID_LLAVE_DEFAULT = "principal-2026"


def _ensure_key_files_exist() -> None:
    """Genera el par de llaves Ed25519 si los archivos PEM no existen."""
    priv = Path(settings.ED25519_PRIVATE_KEY_PATH)
    pub  = Path(settings.ED25519_PUBLIC_KEY_PATH)
    if not priv.exists() or not pub.exists():
        crypto.generate_keypair()


def _ensure_key_registered(db: Session) -> str:
    """
    Asegura que la llave por defecto exista en dbo.llaves_firma.
    Retorna el id_llave activo.
    """
    _ensure_key_files_exist()
    row = db.execute(
        text("SELECT id_llave FROM dbo.llaves_firma WHERE id_llave = :id AND estado = 'activo'"),
        {"id": _ID_LLAVE_DEFAULT},
    ).fetchone()
    if not row:
        db.execute(text("""
            INSERT INTO dbo.llaves_firma (id_llave, nombre, algoritmo, ruta_llave_publica, estado)
            VALUES (:id, :nombre, 'Ed25519', :ruta, 'activo')
        """), {
            "id":     _ID_LLAVE_DEFAULT,
            "nombre": "Llave principal 2026",
            "ruta":   settings.ED25519_PUBLIC_KEY_PATH,
        })
        db.commit()
    return _ID_LLAVE_DEFAULT


def firmar_payload(db: Session, payload_dict: dict) -> tuple[dict, str]:
    """
    Serializa el payload de forma canónica (sort_keys=True), lo firma con Ed25519
    y retorna (estructura_lic_dict, contenido_json_str).

    Estructura del .lic:
      {
        "version_licencia": "1.0",
        "algoritmo":        "Ed25519",
        "id_llave":         "<id_llave>",
        "payload":          "<base64(canonical_json_bytes)>",
        "firma":            "<base64url(ed25519_signature)>"
      }
    """
    id_llave = _ensure_key_registered(db)

    payload_json  = json.dumps(payload_dict, sort_keys=True, ensure_ascii=False, default=str)
    payload_bytes = payload_json.encode("utf-8")
    payload_b64   = base64.b64encode(payload_bytes).decode("utf-8")

    firma = crypto.sign(payload_bytes)   # base64 URL-safe

    estructura = {
        "version_licencia": "1.0",
        "algoritmo":        "Ed25519",
        "id_llave":         id_llave,
        "payload":          payload_b64,
        "firma":            firma,
    }
    contenido_json = json.dumps(estructura, indent=2, ensure_ascii=False)
    return estructura, contenido_json


def calcular_hash(contenido: str) -> str:
    """SHA-256 hexadecimal del contenido del archivo."""
    return hashlib.sha256(contenido.encode("utf-8")).hexdigest()
