from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class CompaniaCreate(BaseModel):
    cliente_id: int
    codigo_compania: str
    nombre_compania: str
    identificacion: Optional[str] = None
    estado: str = "activo"


class CompaniaUpdate(BaseModel):
    cliente_id: int
    codigo_compania: str
    nombre_compania: str
    identificacion: Optional[str] = None
    estado: str = "activo"


class CompaniaResponse(BaseModel):
    id: int
    cliente_id: int
    nombre_cliente: str
    codigo_compania: str
    nombre_compania: str
    identificacion: Optional[str]
    estado: str
    creado_en: datetime
