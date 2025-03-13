from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from typing import List, Optional, Any, Dict

from app.core.config import settings

# OAuth2 scheme per la gestione del token
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/auth/login",
    auto_error=False
)

# Funzioni di autenticazione proxy che delegano al servizio di autenticazione
# Queste sono placeholder - il controllo reale avviene nell'API Gateway

async def get_current_active_user(token: str = Depends(oauth2_scheme)) -> Dict[str, Any]:
    """
    Restituisce l'utente corrente.
    Questa è una versione mock che simula un utente autenticato.
    La verifica reale è fatta dall'API gateway.
    """
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Non autenticato",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return {"is_active": True, "roles": []}

async def get_current_admin_user(token: str = Depends(oauth2_scheme)) -> Dict[str, Any]:
    """
    Restituisce l'utente amministratore corrente.
    Questa è una versione mock che simula un utente con ruolo admin.
    La verifica reale è fatta dall'API gateway.
    """
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Non autenticato",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return {"is_active": True, "roles": [{"name": "admin"}]}

async def get_current_parent_user(token: str = Depends(oauth2_scheme)) -> Dict[str, Any]:
    """
    Restituisce l'utente genitore corrente.
    Questa è una versione mock che simula un utente con ruolo parent.
    La verifica reale è fatta dall'API gateway.
    """
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Non autenticato",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return {"is_active": True, "roles": [{"name": "parent"}]}

async def get_current_student_user(token: str = Depends(oauth2_scheme)) -> Dict[str, Any]:
    """
    Restituisce l'utente studente corrente.
    Questa è una versione mock che simula un utente con ruolo student.
    La verifica reale è fatta dall'API gateway.
    """
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Non autenticato",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return {"is_active": True, "roles": [{"name": "student"}]}

async def get_current_parent_or_admin_user(token: str = Depends(oauth2_scheme)) -> Dict[str, Any]:
    """
    Restituisce l'utente genitore o amministratore corrente.
    Questa è una versione mock che simula un utente con ruolo parent o admin.
    La verifica reale è fatta dall'API gateway.
    """
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Non autenticato",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return {"is_active": True, "roles": [{"name": "parent"}, {"name": "admin"}]}

def get_current_user_with_role(allowed_roles: list[str]):
    """
    Factory function che restituisce una dipendenza per verificare che l'utente abbia uno dei ruoli specificati.
    Questa funzione è un placeholder - la verifica reale è gestita dall'API gateway.
    """
    async def _get_user_with_role(token: str = Depends(oauth2_scheme)) -> Dict[str, Any]:
        if not token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Non autenticato",
                headers={"WWW-Authenticate": "Bearer"},
            )
        # Restituiamo un utente fittizio con i ruoli richiesti
        # La verifica reale è gestita dall'API gateway
        return {
            "is_active": True,
            "roles": [{"name": role} for role in allowed_roles]
        }
    
    return _get_user_with_role
