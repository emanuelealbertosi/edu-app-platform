from fastapi import Depends, HTTPException, status, Header
from typing import Optional, Dict, Any
import requests
import json
from app.core.config import settings


async def get_current_user(
    authorization: Optional[str] = Header(None)
) -> Dict[str, Any]:
    """
    Verifica il token JWT e restituisce le informazioni dell'utente.
    Fa una richiesta al servizio di autenticazione per verificare il token.
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token di autenticazione mancante",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Rimuovi "Bearer " se presente
    token = authorization.replace("Bearer ", "") if authorization.startswith("Bearer ") else authorization

    try:
        # Chiama il servizio di autenticazione per verificare il token
        response = requests.post(
            f"{settings.AUTH_SERVICE_URL}/api/debug/verify-token",
            json={"token": token}
        )

        if response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token non valido o scaduto",
                headers={"WWW-Authenticate": "Bearer"},
            )

        user_data = response.json()
        return user_data

    except requests.RequestException as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Errore di comunicazione con il servizio di autenticazione: {str(e)}",
        )


async def get_current_active_user(
    current_user: Dict[str, Any] = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Verifica che l'utente sia attivo.
    """
    if not current_user.get("is_active", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Utente disattivato",
        )
    return current_user


async def get_current_admin_user(
    current_user: Dict[str, Any] = Depends(get_current_active_user),
) -> Dict[str, Any]:
    """
    Verifica che l'utente sia un amministratore.
    """
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operazione riservata agli amministratori",
        )
    return current_user


async def get_current_parent_or_admin_user(
    current_user: Dict[str, Any] = Depends(get_current_active_user),
) -> Dict[str, Any]:
    """
    Verifica che l'utente sia un genitore o un amministratore.
    """
    if current_user.get("role") not in ["parent", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operazione riservata ai genitori o agli amministratori",
        )
    return current_user
