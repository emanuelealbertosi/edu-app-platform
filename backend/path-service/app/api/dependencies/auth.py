from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import requests
from typing import Dict, Optional
import jwt
from pydantic import BaseModel

from app.core.config import settings
from app.db.base import get_db

# Modello per i dati dell'utente estratti dal token
class TokenData(BaseModel):
    user_id: str
    email: str
    role: str
    exp: int

# Security scheme per JWT
security = HTTPBearer()

def verify_token(token: str) -> Dict:
    """
    Verifica il token JWT chiamando il servizio di autenticazione.
    
    Args:
        token: Il token JWT da verificare
        
    Returns:
        Dict: Dati del token decodificati
        
    Raises:
        HTTPException: Se il token è invalido o scaduto
    """
    try:
        # Verifica il token con il servizio di autenticazione
        auth_service_url = f"{settings.AUTH_SERVICE_URL}/api/auth/verify-token"
        response = requests.post(
            auth_service_url,
            json={"token": token}
        )
        
        if response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token non valido o scaduto",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Estrai i dati del token dalla risposta
        token_data = response.json()
        return token_data
    
    except requests.RequestException:
        # In caso di errore di comunicazione con il servizio di autenticazione,
        # prova a verificare il token localmente
        try:
            payload = jwt.decode(
                token,
                settings.SECRET_KEY,
                algorithms=[settings.ALGORITHM],
            )
            return payload
        except jwt.PyJWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token non valido o scaduto",
                headers={"WWW-Authenticate": "Bearer"},
            )

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> Dict:
    """
    Ottiene l'utente corrente dal token JWT.
    
    Args:
        credentials: Le credenziali di autenticazione
        
    Returns:
        Dict: Dati dell'utente
        
    Raises:
        HTTPException: Se l'autenticazione fallisce
    """
    token = credentials.credentials
    token_data = verify_token(token)
    
    if not token_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token non valido o scaduto",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Trasforma i dati del token in un modello TokenData
    try:
        # Prova a mappare i dati del token nel modello TokenData
        user_data = TokenData(
            user_id=token_data.get("user_id"),
            email=token_data.get("email"),
            role=token_data.get("role"),
            exp=token_data.get("exp")
        )
        
        # Converti in dizionario per essere compatibile con il resto del codice
        return user_data.dict()
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token non valido o dati mancanti",
            headers={"WWW-Authenticate": "Bearer"},
        )

def get_admin_user(current_user: Dict = Depends(get_current_user)) -> Dict:
    """
    Ottiene l'utente amministratore.
    
    Args:
        current_user: L'utente corrente
        
    Returns:
        Dict: Dati dell'utente amministratore
        
    Raises:
        HTTPException: Se l'utente non è un amministratore
    """
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Ruolo di amministratore richiesto",
        )
    return current_user

def get_parent_user(current_user: Dict = Depends(get_current_user)) -> Dict:
    """
    Ottiene l'utente genitore.
    
    Args:
        current_user: L'utente corrente
        
    Returns:
        Dict: Dati dell'utente genitore
        
    Raises:
        HTTPException: Se l'utente non è un genitore
    """
    if current_user.get("role") != "parent":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Ruolo di genitore richiesto",
        )
    return current_user

def get_student_user(current_user: Dict = Depends(get_current_user)) -> Dict:
    """
    Ottiene l'utente studente.
    
    Args:
        current_user: L'utente corrente
        
    Returns:
        Dict: Dati dell'utente studente
        
    Raises:
        HTTPException: Se l'utente non è uno studente
    """
    if current_user.get("role") != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Ruolo di studente richiesto",
        )
    return current_user

def get_admin_or_parent_user(current_user: Dict = Depends(get_current_user)) -> Dict:
    """
    Ottiene l'utente amministratore o genitore.
    
    Args:
        current_user: L'utente corrente
        
    Returns:
        Dict: Dati dell'utente amministratore o genitore
        
    Raises:
        HTTPException: Se l'utente non è un amministratore o un genitore
    """
    if current_user.get("role") not in ["admin", "parent"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Ruolo di amministratore o genitore richiesto",
        )
    return current_user
