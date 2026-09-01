from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class UsuarioCreate(BaseModel):
    nombre_usuario: str
    correo: str
    password: str
    estado: str = "activo"
    rol_ids: List[int] = []


class UsuarioUpdate(BaseModel):
    nombre_usuario: str
    correo: str
    password: Optional[str] = None
    estado: str = "activo"
    rol_ids: List[int] = []


class UsuarioResponse(BaseModel):
    id: int
    nombre_usuario: str
    correo: str
    estado: str
    creado_en: datetime
    roles: List[str] = []
    rol_ids: List[int] = []
