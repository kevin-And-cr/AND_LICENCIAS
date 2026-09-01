"""
Dependencias reutilizables de FastAPI:
  - Obtener usuario autenticado desde el JWT
  - Re-exporta get_db para que los routers usen una sola importación
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError

from app.core.security import decode_token
from app.db.session import get_db  # noqa: F401  (re-exportado)
from sqlalchemy.orm import Session

bearer_scheme = HTTPBearer()


def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> int:
    """
    Extrae y valida el token JWT del header Authorization: Bearer <token>.
    Retorna el ID del usuario (sub del token).
    """
    try:
        payload = decode_token(credentials.credentials)
        user_id: str | None = payload.get("sub")
        if user_id is None:
            raise ValueError("sin sub")
        return int(user_id)
    except (JWTError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )
