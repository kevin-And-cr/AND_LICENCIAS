"""
Módulo de criptografía con ED25519:
  - Generación de par de claves
  - Firma de documentos / payloads
  - Verificación de firmas
"""
import base64
from pathlib import Path

from cryptography.hazmat.primitives.asymmetric.ed25519 import (
    Ed25519PrivateKey,
    Ed25519PublicKey,
)
from cryptography.hazmat.primitives.serialization import (
    Encoding,
    NoEncryption,
    PrivateFormat,
    PublicFormat,
    load_pem_private_key,
    load_pem_public_key,
)

from app.core.config import settings


def generate_keypair(
    private_path: str | None = None,
    public_path: str | None = None,
) -> tuple[str, str]:
    """
    Genera un par de claves ED25519 y las guarda en disco en formato PEM.
    Retorna (private_pem, public_pem) como strings.
    """
    private_key = Ed25519PrivateKey.generate()
    public_key = private_key.public_key()

    private_pem = private_key.private_bytes(Encoding.PEM, PrivateFormat.PKCS8, NoEncryption()).decode()
    public_pem = public_key.public_bytes(Encoding.PEM, PublicFormat.SubjectPublicKeyInfo).decode()

    priv_path = Path(private_path or settings.ED25519_PRIVATE_KEY_PATH)
    pub_path = Path(public_path or settings.ED25519_PUBLIC_KEY_PATH)
    priv_path.parent.mkdir(parents=True, exist_ok=True)

    priv_path.write_text(private_pem)
    pub_path.write_text(public_pem)

    return private_pem, public_pem


def _load_private_key() -> Ed25519PrivateKey:
    pem = Path(settings.ED25519_PRIVATE_KEY_PATH).read_bytes()
    return load_pem_private_key(pem, password=None)  # type: ignore[return-value]


def _load_public_key() -> Ed25519PublicKey:
    pem = Path(settings.ED25519_PUBLIC_KEY_PATH).read_bytes()
    return load_pem_public_key(pem)  # type: ignore[return-value]


def sign(data: bytes) -> str:
    """Firma los datos y retorna la firma como Base64 URL-safe."""
    private_key = _load_private_key()
    signature = private_key.sign(data)
    return base64.urlsafe_b64encode(signature).decode()


def verify(data: bytes, signature_b64: str) -> bool:
    """
    Verifica una firma. Retorna True si es válida, False si no.
    No lanza excepción al usuario final.
    """
    public_key = _load_public_key()
    try:
        signature = base64.urlsafe_b64decode(signature_b64)
        public_key.verify(signature, data)
        return True
    except Exception:
        return False
