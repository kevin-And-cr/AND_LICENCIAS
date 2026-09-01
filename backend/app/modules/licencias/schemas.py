from datetime import date
from typing import List, Optional

from pydantic import BaseModel


class LicenciaCreate(BaseModel):
    cliente_id: int
    numero_licencia: str
    tipo_licencia: str = "offline"       # offline / hibrida / online
    ambiente: str = "produccion"          # desarrollo / pruebas / produccion
    cantidad_maxima_usuarios: int = 1
    permite_jobs_segundo_plano: bool = False
    permite_api: bool = False
    observaciones: Optional[str] = None


class LicenciaUpdate(BaseModel):
    numero_licencia: str
    tipo_licencia: str
    ambiente: str
    cantidad_maxima_usuarios: int
    permite_jobs_segundo_plano: bool
    permite_api: bool
    observaciones: Optional[str] = None


class CambiarEstadoRequest(BaseModel):
    estado: str   # borrador / activa / revocada / expirada / inactiva


class AgregarModuloRequest(BaseModel):
    modulo_id: int
    cantidad_maxima_companias: int


class CompaniaModuloItem(BaseModel):
    compania_id: int
    fecha_vencimiento: date


class AsignarCompaniasRequest(BaseModel):
    companias: List[CompaniaModuloItem]
