from datetime import datetime, timedelta
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
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {
        "exp": expire.timestamp(),
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
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.REFRESH_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {
        "exp": expire.timestamp(),
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
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        token_data = TokenPayload(**payload)
        return token_data
    except (jwt.JWTError, ValidationError):
        return None
