from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ModuloCreate(BaseModel):
    codigo: str
    nombre: str
    descripcion: Optional[str] = None
    modulo_padre_id: Optional[int] = None
    tipo_modulo: str = "funcionalidad"
    ruta: Optional[str] = None
    icono: Optional[str] = None
    orden: int = 0
    requiere_jobs: bool = False
    estado: str = "activo"


class ModuloUpdate(BaseModel):
    codigo: str
    nombre: str
    descripcion: Optional[str] = None
    modulo_padre_id: Optional[int] = None
    tipo_modulo: str = "funcionalidad"
    ruta: Optional[str] = None
    icono: Optional[str] = None
    orden: int = 0
    requiere_jobs: bool = False
    estado: str = "activo"


class ModuloResponse(BaseModel):
    id: int
    codigo: str
    nombre: str
    descripcion: Optional[str]
    modulo_padre_id: Optional[int]
    nombre_padre: Optional[str]
    tipo_modulo: str
    ruta: Optional[str]
    icono: Optional[str]
    orden: int
    requiere_jobs: bool
    estado: str
    creado_en: datetime
    actualizado_en: Optional[datetime]
