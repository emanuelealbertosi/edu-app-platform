from fastapi import APIRouter, Depends, HTTPException, status, Header, Request, Body
from typing import Any, Dict, List
from jose import jwt
from pydantic import ValidationError
import traceback
from sqlalchemy.orm import Session

from app.api.dependencies.auth import get_current_user, get_current_admin_user
from app.db.base import get_db
from app.db.models.user import User

from app.core.config import settings
from app.core.security import decode_token
from app.schemas.user import TokenPayload
from app.db.repositories.user_repository import UserRepository

router = APIRouter()

@router.post("/verify-token")
async def verify_token(
    token_data: Dict[str, str] = Body(...),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Verifica un token JWT per servizi esterni.
    """
    token = token_data.get("token")
    if not token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token mancante",
        )
    
    # Log per debug
    print(f"DEBUG: Ricevuta richiesta di verifica token: {token[:20]}...")
    
    # Decodifica il token
    decoded_token = decode_token(token)
    if not decoded_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token non valido o decodifica fallita",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Ottieni l'utente
    user = UserRepository.get_by_uuid(db, decoded_token.sub)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Utente {decoded_token.sub} non trovato",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Utente disattivato",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Estrai i nomi dei ruoli
    role_names = [role.name for role in user.roles]
    
    # Restituisci i dati dell'utente in formato compatibile con tutti i servizi
    result = {
        "user_id": user.uuid,
        "email": user.email,
        "username": user.username,
        "is_active": user.is_active,
        "role": role_names[0] if role_names else "student",  # Default role
        "roles": role_names,
        "exp": decoded_token.exp
    }
    
    print(f"DEBUG: Verifica token completata: {result}")
    return result

@router.get("/token-debug")
async def debug_token(request: Request) -> Dict[str, Any]:
    """
    Endpoint di debug che analizza l'header di autorizzazione e mostra informazioni sul token.
    Solo per scopi di debug - da rimuovere in produzione.
    """
    result = {
        "status": "unknown",
        "token_received": False,
        "token_format_valid": False,
        "token_parsed": False,
        "token_payload": None,
        "errors": []
    }
    
    # Estrai il token dall'header Authorization
    authorization = request.headers.get("Authorization")
    if not authorization:
        result["status"] = "error"
        result["errors"].append("Header Authorization mancante")
        return result
    
    result["token_received"] = True
    
    # Verifica il formato del token (Bearer + token)
    if not authorization.startswith("Bearer "):
        result["status"] = "error"
        result["errors"].append("Formato header errato. Deve iniziare con 'Bearer '")
        return result
    
    token = authorization.replace("Bearer ", "")
    result["token_format_valid"] = True
    
    # Prova a decodificare il token
    try:
        # Decodifica manuale senza validazione
        parts = token.split(".")
        if len(parts) != 3:
            result["status"] = "error"
            result["errors"].append("Token JWT non valido: deve avere 3 parti")
            return result
        
        # Prova a decodificare il token con la funzione di sicurezza
        token_data = decode_token(token)
        if token_data is None:
            result["status"] = "error"
            result["errors"].append("Decodifica token fallita")
            # Prova a capire perché è fallita
            try:
                payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
                result["token_parsed"] = True
                result["token_payload"] = payload
                result["errors"].append("Token decodificato ma non validato come TokenPayload")
            except Exception as e:
                result["errors"].append(f"Errore JWT: {str(e)}")
            return result
        
        # Successo: token decodificato
        result["status"] = "success"
        result["token_parsed"] = True
        result["token_payload"] = {
            "sub": token_data.sub,
            "exp": token_data.exp,
            "roles": token_data.roles if hasattr(token_data, 'roles') else []
        }
        
    except Exception as e:
        result["status"] = "error"
        result["errors"].append(f"Errore non gestito: {str(e)}")
        result["errors"].append(traceback.format_exc())
    
    return result
