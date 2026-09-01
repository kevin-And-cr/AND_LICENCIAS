"""Lógica de autenticación."""
from fastapi import HTTPException, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.security import (
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.modules.auth.schemas import TokenResponse


def authenticate_user(db: Session, username: str, password: str) -> TokenResponse:
    row = db.execute(
        text("""
            SELECT id, password_hash, estado
            FROM dbo.usuarios
            WHERE nombre_usuario = :username
        """),
        {"username": username},
    ).fetchone()

    if not row:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas",
        )

    user_id, password_hash, estado = row

    if estado != "activo":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario inactivo o bloqueado",
        )

    if not verify_password(password, password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas",
        )

    return TokenResponse(
        access_token=create_access_token(user_id),
        refresh_token=create_refresh_token(user_id),
    )


def refresh_tokens(refresh_token: str) -> TokenResponse:
    payload = decode_token(refresh_token)
    if payload.get("type") != "refresh":
        raise ValueError("Token de refresco inválido")
    user_id = payload["sub"]
    return TokenResponse(
        access_token=create_access_token(user_id),
        refresh_token=create_refresh_token(user_id),
    )
