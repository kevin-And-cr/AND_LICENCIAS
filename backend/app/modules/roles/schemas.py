from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class RolCreate(BaseModel):
    codigo: str
    nombre: str
    descripcion: Optional[str] = None
    estado: str = "activo"


class RolUpdate(BaseModel):
    codigo: str
    nombre: str
    descripcion: Optional[str] = None
    estado: str = "activo"


class RolResponse(BaseModel):
    id: int
    codigo: str
    nombre: str
    descripcion: Optional[str]
    estado: str
    creado_en: datetime
