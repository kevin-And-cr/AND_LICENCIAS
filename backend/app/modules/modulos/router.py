from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.v1.deps import get_db, get_current_user_id
from .schemas import ModuloCreate, ModuloUpdate
from . import service

router = APIRouter()


@router.get("/")
def list_modulos(db: Session = Depends(get_db), _: int = Depends(get_current_user_id)):
    return service.list_modulos(db)


@router.get("/{modulo_id}")
def get_modulo(modulo_id: int, db: Session = Depends(get_db), _: int = Depends(get_current_user_id)):
    return service.get_modulo(db, modulo_id)


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_modulo(data: ModuloCreate, db: Session = Depends(get_db), _: int = Depends(get_current_user_id)):
    return service.create_modulo(db, data)


@router.put("/{modulo_id}")
def update_modulo(modulo_id: int, data: ModuloUpdate, db: Session = Depends(get_db), _: int = Depends(get_current_user_id)):
    return service.update_modulo(db, modulo_id, data)


@router.delete("/{modulo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_modulo(modulo_id: int, db: Session = Depends(get_db), _: int = Depends(get_current_user_id)):
    service.delete_modulo(db, modulo_id)
