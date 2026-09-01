from fastapi import APIRouter

from app.modules.auth.router import router as auth_router
from app.modules.usuarios.router import router as usuarios_router
from app.modules.roles.router import router as roles_router
from app.modules.clientes.router import router as clientes_router
from app.modules.companias.router import router as companias_router
from app.modules.modulos.router import router as modulos_router
from app.modules.licencias.router import router as licencias_router

api_router = APIRouter()

api_router.include_router(auth_router,      prefix="/auth",      tags=["auth"])
api_router.include_router(usuarios_router,  prefix="/usuarios",  tags=["usuarios"])
api_router.include_router(roles_router,     prefix="/roles",     tags=["roles"])
api_router.include_router(clientes_router,  prefix="/clientes",  tags=["clientes"])
api_router.include_router(companias_router, prefix="/companias", tags=["companias"])
api_router.include_router(modulos_router,   prefix="/modulos",   tags=["modulos"])
api_router.include_router(licencias_router, prefix="/licencias", tags=["licencias"])
