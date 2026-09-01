from fastapi import APIRouter, Depends, status
from typing import Optional
from sqlalchemy.orm import Session

from app.api.v1.deps import get_db, get_current_user_id
from .schemas import CompaniaCreate, CompaniaUpdate
from . import service

router = APIRouter()


@router.get("/")
def list_companias(
    cliente_id: Optional[int] = None,
    db: Session = Depends(get_db),
    _: int = Depends(get_current_user_id),
):
    return service.list_companias(db, cliente_id)


@router.get("/{compania_id}")
def get_compania(compania_id: int, db: Session = Depends(get_db), _: int = Depends(get_current_user_id)):
    return service.get_compania(db, compania_id)


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_compania(data: CompaniaCreate, db: Session = Depends(get_db), _: int = Depends(get_current_user_id)):
    return service.create_compania(db, data)


@router.put("/{compania_id}")
def update_compania(compania_id: int, data: CompaniaUpdate, db: Session = Depends(get_db), _: int = Depends(get_current_user_id)):
    return service.update_compania(db, compania_id, data)


@router.delete("/{compania_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_compania(compania_id: int, db: Session = Depends(get_db), _: int = Depends(get_current_user_id)):
    service.delete_compania(db, compania_id)
