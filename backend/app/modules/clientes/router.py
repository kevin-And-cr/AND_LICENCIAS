from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.v1.deps import get_db, get_current_user_id
from .schemas import ClienteCreate, ClienteUpdate
from . import service

router = APIRouter()


@router.get("/")
def list_clientes(db: Session = Depends(get_db), _: int = Depends(get_current_user_id)):
    return service.list_clientes(db)


@router.get("/{cliente_id}")
def get_cliente(cliente_id: int, db: Session = Depends(get_db), _: int = Depends(get_current_user_id)):
    return service.get_cliente(db, cliente_id)


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_cliente(data: ClienteCreate, db: Session = Depends(get_db), _: int = Depends(get_current_user_id)):
    return service.create_cliente(db, data)


@router.put("/{cliente_id}")
def update_cliente(cliente_id: int, data: ClienteUpdate, db: Session = Depends(get_db), _: int = Depends(get_current_user_id)):
    return service.update_cliente(db, cliente_id, data)


@router.delete("/{cliente_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_cliente(cliente_id: int, db: Session = Depends(get_db), _: int = Depends(get_current_user_id)):
    service.delete_cliente(db, cliente_id)
