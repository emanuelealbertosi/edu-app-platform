from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import decode_token
from app.db.base import get_db
from app.db.repositories.user_repository import UserRepository
from app.schemas.user import TokenPayload
from app.db.models.user import User

# OAuth2 scheme per la gestione del token
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login"
)

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """
    Verifica il token JWT e ottiene l'utente corrente.
    """
    try:
        # Decodifica il token
        token_data = decode_token(token)
        if token_data is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token non valido",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except (jwt.JWTError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Impossibile validare le credenziali",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Ottieni l'utente dal database
    user = UserRepository.get_by_uuid(db, token_data.sub)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utente non trovato",
        )
    
    return user

async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Verifica che l'utente corrente sia attivo.
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Utente inattivo",
        )
    
    return current_user

async def get_current_admin_user(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """
    Verifica che l'utente corrente sia un amministratore.
    """
    # Verifica se l'utente ha il ruolo admin
    if not any(role.name == "admin" for role in current_user.roles):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permessi insufficienti",
        )
    
    return current_user

async def get_current_parent_user(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """
    Verifica che l'utente corrente sia un genitore.
    """
    # Verifica se l'utente ha il ruolo parent
    if not any(role.name == "parent" for role in current_user.roles):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permessi insufficienti. È richiesto il ruolo di genitore.",
        )
    
    return current_user

async def get_current_student_user(
    current_user: User = Depends(get_current_active_user)
) -> User:
    """
    Verifica che l'utente corrente sia uno studente.
    """
    # Verifica se l'utente ha il ruolo student
    if not any(role.name == "student" for role in current_user.roles):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permessi insufficienti. È richiesto il ruolo di studente.",
        )
    
    return current_user

def get_current_user_with_role(allowed_roles: list[str]):
    """
    Factory function che restituisce una dipendenza per verificare che l'utente abbia uno dei ruoli specificati.
    Esempio: get_current_user_with_role(["admin", "parent"])
    """
    async def _get_user_with_role(
        current_user: User = Depends(get_current_active_user)
    ) -> User:
        # Verifica se l'utente ha almeno uno dei ruoli richiesti
        if not any(role.name in allowed_roles for role in current_user.roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permessi insufficienti. È richiesto uno dei seguenti ruoli: {', '.join(allowed_roles)}.",
            )
        return current_user
    
    return _get_user_with_role
