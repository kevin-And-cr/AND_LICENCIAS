from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.v1.deps import get_db
from app.modules.auth import schemas, service

router = APIRouter()


@router.post("/login", response_model=schemas.TokenResponse)
def login(credentials: schemas.LoginRequest, db: Session = Depends(get_db)):
    return service.authenticate_user(db, credentials.username, credentials.password)


@router.post("/refresh", response_model=schemas.TokenResponse)
def refresh(body: schemas.RefreshRequest):
    return service.refresh_tokens(body.refresh_token)
