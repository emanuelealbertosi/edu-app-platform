from datetime import datetime, timedelta, timezone
from typing import Any, List, Optional, Union

from jose import jwt
from passlib.context import CryptContext
from pydantic import ValidationError

from app.core.config import settings
from app.schemas.user import TokenPayload

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica che la password in chiaro corrisponda a quella hashata."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Genera l'hash della password."""
    return pwd_context.hash(password)

def create_access_token(subject: Union[str, Any], roles: List[str], expires_delta: timedelta = None) -> str:
    """
    Crea un token di accesso JWT.
    
    Args:
        subject: ID dell'utente
        roles: Lista dei ruoli dell'utente
        expires_delta: Durata di validità del token
    
    Returns:
        Token JWT codificato
    """
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {
        "exp": int(expire.timestamp()),  # Conversione esplicita in intero per compatibilità standard JWT
        "sub": str(subject),
        "roles": roles
    }
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def create_refresh_token(subject: Union[str, Any], expires_delta: timedelta = None) -> str:
    """
    Crea un token di refresh JWT.
    
    Args:
        subject: ID dell'utente
        expires_delta: Durata di validità del token
    
    Returns:
        Token JWT codificato
    """
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.REFRESH_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {
        "exp": int(expire.timestamp()),  # Conversione esplicita in intero per compatibilità standard JWT
        "sub": str(subject),
        "type": "refresh"
    }
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def decode_token(token: str) -> Optional[TokenPayload]:
    """
    Decodifica un token JWT.
    
    Args:
        token: Token JWT da decodificare
    
    Returns:
        TokenPayload decodificato o None in caso di errore
    """
    try:
        # Prima decodifico raw il token senza validazione
        # per diagnosticare potenziali problemi
        try:
            # Solo per debug
            import base64
            import json
            parts = token.split('.')
            if len(parts) >= 2:
                payload_b64 = parts[1]
                padding = 4 - (len(payload_b64) % 4) if len(payload_b64) % 4 else 0
                payload_b64 = payload_b64 + ('=' * padding)
                payload_json = base64.b64decode(payload_b64.translate(str.maketrans('-_', '+/'))).decode('utf-8')
                raw_payload = json.loads(payload_json)
                print(f"DEBUG: Token raw payload: {raw_payload}")
        except Exception as e:
            print(f"DEBUG: Error inspecting token: {e}")
            
        # Decodifica il token usando la libreria jose
        # Decodifica il token usando la libreria jose senza verifica della scadenza
        # per gestirla manualmente con più controllo
        payload = jwt.decode(
            token, 
            settings.SECRET_KEY, 
            algorithms=[settings.ALGORITHM],
            options={"verify_exp": False}  # Disabilitiamo temporaneamente per gestire manualmente
        )
        
        # Verifica manuale della scadenza con tolleranza di 10 secondi
        if "exp" in payload:
            exp_timestamp = payload["exp"]
            current_time = int(datetime.now(timezone.utc).timestamp())
            
            # Verifica se il token è scaduto con una tolleranza di 10 secondi
            if current_time > exp_timestamp + 10:  # Tolleranza di 10 secondi
                print(f"DEBUG: Token scaduto. Current time: {current_time}, exp: {exp_timestamp}")
                raise jwt.JWTError("Token expired")
        
        # Creazione del TokenPayload con gestione esplicita dei tipi
        # Assicuriamoci che tutti i campi siano nel formato corretto
        cleaned_payload = {
            'sub': str(payload.get('sub', '')),
            'exp': payload.get('exp'),  # Può essere int o float grazie alla modifica in TokenPayload
            'roles': payload.get('roles', [])
        }
        
        token_data = TokenPayload(**cleaned_payload)
        return token_data
    except Exception as e:
        print(f"DEBUG: Token validation error: {str(e)}")
        return None
