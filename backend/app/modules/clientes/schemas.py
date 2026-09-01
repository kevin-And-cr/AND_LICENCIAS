from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ClienteCreate(BaseModel):
    nombre: str
    identificacion: Optional[str] = None
    correo_contacto: Optional[str] = None
    telefono_contacto: Optional[str] = None
    estado: str = "activo"


class ClienteUpdate(BaseModel):
    nombre: str
    identificacion: Optional[str] = None
    correo_contacto: Optional[str] = None
    telefono_contacto: Optional[str] = None
    estado: str = "activo"


class ClienteResponse(BaseModel):
    id: int
    nombre: str
    identificacion: Optional[str]
    correo_contacto: Optional[str]
    telefono_contacto: Optional[str]
    estado: str
    creado_en: datetime
