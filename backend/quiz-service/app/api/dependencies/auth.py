from typing import Optional, List
from fastapi import Depends, HTTPException, status, Header
from fastapi.security import OAuth2PasswordBearer
import requests
import json
from pydantic import BaseModel

from app.core.config import settings

# Modello per le risposte dell'auth service
class TokenData(BaseModel):
    user_id: str
    role: str
    username: Optional[str] = None
    is_active: bool = True

# Definizione del sistema di autenticazione OAuth2
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.AUTH_SERVICE_URL}/api/auth/login")

# Funzione per verificare il token JWT tramite l'auth service
async def get_current_user(authorization: str = Header(None)) -> TokenData:
    """
    Verifica il token JWT con l'auth service e restituisce i dati dell'utente.
    Solleva un'eccezione se il token non è valido.
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Non sei autenticato",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Ottieni il token dal header Authorization
    token = authorization.replace("Bearer ", "") if authorization.startswith("Bearer ") else authorization
    
    try:
        # Verifica il token con l'auth service
        response = requests.get(
            f"{settings.AUTH_SERVICE_URL}/api/auth/verify",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        if response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token non valido o scaduto",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Estrai i dati dell'utente dalla risposta
        user_data = response.json()
        return TokenData(**user_data)
    
    except requests.RequestException:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Impossibile connettersi al servizio di autenticazione",
        )

# Funzione per verificare che l'utente sia attivo
async def get_current_active_user(
    current_user: TokenData = Depends(get_current_user),
) -> TokenData:
    """
    Verifica che l'utente sia attivo.
    Solleva un'eccezione se l'utente non è attivo.
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Utente disattivato",
        )
    return current_user

# Funzione per verificare che l'utente abbia il ruolo di amministratore
async def get_current_admin(
    current_user: TokenData = Depends(get_current_active_user),
) -> TokenData:
    """
    Verifica che l'utente abbia il ruolo di amministratore.
    Solleva un'eccezione se l'utente non è un amministratore.
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permessi insufficienti",
        )
    return current_user

# Funzione per verificare che l'utente abbia il ruolo di genitore
async def get_current_parent(
    current_user: TokenData = Depends(get_current_active_user),
) -> TokenData:
    """
    Verifica che l'utente abbia il ruolo di genitore.
    Solleva un'eccezione se l'utente non è un genitore.
    """
    if current_user.role != "parent" and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permessi insufficienti",
        )
    return current_user

# Funzione per verificare che l'utente abbia il ruolo di studente
async def get_current_student(
    current_user: TokenData = Depends(get_current_active_user),
) -> TokenData:
    """
    Verifica che l'utente abbia il ruolo di studente.
    Solleva un'eccezione se l'utente non è uno studente.
    """
    if current_user.role != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permessi insufficienti",
        )
    return current_user

# Funzione per verificare che l'utente abbia uno dei ruoli specificati
async def get_current_user_with_roles(
    required_roles: List[str],
    current_user: TokenData = Depends(get_current_active_user),
) -> TokenData:
    """
    Verifica che l'utente abbia uno dei ruoli specificati.
    Solleva un'eccezione se l'utente non ha nessuno dei ruoli richiesti.
    """
    if current_user.role not in required_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permessi insufficienti",
        )
    return current_user
