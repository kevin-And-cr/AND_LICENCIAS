from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.v1.deps import get_db, get_current_user_id
from .schemas import UsuarioCreate, UsuarioUpdate
from . import service

router = APIRouter()


@router.get("/")
def list_usuarios(db: Session = Depends(get_db), _: int = Depends(get_current_user_id)):
    return service.list_usuarios(db)


@router.get("/me")
def get_me(current_user_id: int = Depends(get_current_user_id), db: Session = Depends(get_db)):
    return service.get_usuario(db, current_user_id)


@router.get("/{usuario_id}")
def get_usuario(usuario_id: int, db: Session = Depends(get_db), _: int = Depends(get_current_user_id)):
    return service.get_usuario(db, usuario_id)


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_usuario(data: UsuarioCreate, db: Session = Depends(get_db), _: int = Depends(get_current_user_id)):
    return service.create_usuario(db, data)


@router.put("/{usuario_id}")
def update_usuario(usuario_id: int, data: UsuarioUpdate, db: Session = Depends(get_db), _: int = Depends(get_current_user_id)):
    return service.update_usuario(db, usuario_id, data)


@router.delete("/{usuario_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_usuario(usuario_id: int, db: Session = Depends(get_db), _: int = Depends(get_current_user_id)):
    service.delete_usuario(db, usuario_id)
