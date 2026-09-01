from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.v1.deps import get_db, get_current_user_id
from .schemas import RolCreate, RolUpdate
from . import service

router = APIRouter()


@router.get("/")
def list_roles(db: Session = Depends(get_db), _: int = Depends(get_current_user_id)):
    return service.list_roles(db)


@router.get("/{rol_id}")
def get_rol(rol_id: int, db: Session = Depends(get_db), _: int = Depends(get_current_user_id)):
    return service.get_rol(db, rol_id)


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_rol(data: RolCreate, db: Session = Depends(get_db), _: int = Depends(get_current_user_id)):
    return service.create_rol(db, data)


@router.put("/{rol_id}")
def update_rol(rol_id: int, data: RolUpdate, db: Session = Depends(get_db), _: int = Depends(get_current_user_id)):
    return service.update_rol(db, rol_id, data)


@router.delete("/{rol_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_rol(rol_id: int, db: Session = Depends(get_db), _: int = Depends(get_current_user_id)):
    service.delete_rol(db, rol_id)
