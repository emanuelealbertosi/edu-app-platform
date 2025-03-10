from fastapi import APIRouter, Depends, HTTPException, status, Body
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Any

from app.db.base import get_db
from app.core.config import settings
from app.core.security import create_access_token, create_refresh_token, decode_token
from app.db.repositories.user_repository import UserRepository
from app.db.repositories.role_repository import RoleRepository
from app.schemas.user import Token, RefreshToken, UserCreate, User

router = APIRouter()

@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
) -> Any:
    """
    Ottiene un token di accesso JWT utilizzando username/email e password.
    """
    # Autentica l'utente
    user = UserRepository.authenticate(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Username/email o password non corretti",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account disattivato",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Genera il token di accesso
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # Estrai i nomi dei ruoli
    role_names = [role.name for role in user.roles]
    
    # Crea il token di accesso
    access_token = create_access_token(
        subject=user.uuid,
        roles=role_names,
        expires_delta=access_token_expires
    )
    
    # Crea il token di refresh
    refresh_token_expires = timedelta(minutes=settings.REFRESH_TOKEN_EXPIRE_MINUTES)
    refresh_token = create_refresh_token(
        subject=user.uuid,
        expires_delta=refresh_token_expires
    )
    
    # Salva il token di refresh nel database
    token_expires_at = datetime.utcnow() + refresh_token_expires
    UserRepository.create_refresh_token(db, user.id, refresh_token, token_expires_at)
    
    # Restituisci i token
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }

@router.post("/refresh", response_model=Token)
async def refresh_token(
    refresh_token_data: RefreshToken = Body(...),
    db: Session = Depends(get_db)
) -> Any:
    """
    Ottiene un nuovo token di accesso utilizzando il token di refresh.
    """
    # Decodifica il token di refresh
    token_data = decode_token(refresh_token_data.refresh_token)
    if not token_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token di refresh non valido",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Ottieni il token di refresh dal database
    db_token = UserRepository.get_refresh_token(db, refresh_token_data.refresh_token)
    if not db_token or db_token.revoked or db_token.expires_at < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token di refresh scaduto o revocato",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Ottieni l'utente
    user = UserRepository.get_by_uuid(db, token_data.sub)
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Utente non trovato o disattivato",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Estrai i nomi dei ruoli
    role_names = [role.name for role in user.roles]
    
    # Crea un nuovo token di accesso
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=user.uuid,
        roles=role_names,
        expires_delta=access_token_expires
    )
    
    # Crea un nuovo token di refresh
    refresh_token_expires = timedelta(minutes=settings.REFRESH_TOKEN_EXPIRE_MINUTES)
    new_refresh_token = create_refresh_token(
        subject=user.uuid,
        expires_delta=refresh_token_expires
    )
    
    # Revoca il vecchio token di refresh
    UserRepository.revoke_refresh_token(db, refresh_token_data.refresh_token)
    
    # Salva il nuovo token di refresh nel database
    token_expires_at = datetime.utcnow() + refresh_token_expires
    UserRepository.create_refresh_token(db, user.id, new_refresh_token, token_expires_at)
    
    # Restituisci i nuovi token
    return {
        "access_token": access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer"
    }

@router.post("/logout")
async def logout(
    refresh_token_data: RefreshToken = Body(...),
    db: Session = Depends(get_db)
) -> Any:
    """
    Revoca un token di refresh.
    """
    # Revoca il token di refresh
    success = UserRepository.revoke_refresh_token(db, refresh_token_data.refresh_token)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token di refresh non valido",
        )
    
    return {"detail": "Logout effettuato con successo"}

@router.post("/register", response_model=User)
async def register(
    user_data: UserCreate = Body(...),
    db: Session = Depends(get_db)
) -> Any:
    """
    Registra un nuovo utente.
    """
    # Verifica se l'email o lo username esistono già
    if UserRepository.get_by_email(db, user_data.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email già registrata",
        )
    
    if UserRepository.get_by_username(db, user_data.username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username già utilizzato",
        )
    
    # Ottieni il ruolo studente di default
    student_role = RoleRepository.get_by_name(db, "student")
    if not student_role:
        # Se non esiste il ruolo, crea i ruoli predefiniti
        roles = RoleRepository.get_or_create_default_roles(db)
        student_role = next((role for role in roles if role.name == "student"), None)
    
    # Crea l'utente con il ruolo studente
    user = UserRepository.create(db, user_data, [student_role])
    
    return user
