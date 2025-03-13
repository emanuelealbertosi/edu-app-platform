import os
from typing import List, Dict, Any, Optional
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Educational App API Gateway"
    API_V1_STR: str = "/api"
    
    # Configurazioni server
    SERVER_HOST: str = os.getenv("SERVER_HOST", "0.0.0.0")
    SERVER_PORT: int = int(os.getenv("SERVER_PORT", "8000"))
    
    # Chiave segreta per JWT
    SECRET_KEY: str = os.getenv("SECRET_KEY", "chiave_segreta_per_sviluppo_da_cambiare_in_produzione")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    
    # URL dei servizi
    AUTH_SERVICE_URL: str = os.getenv("AUTH_SERVICE_URL", "http://localhost:8001")
    QUIZ_SERVICE_URL: str = os.getenv("QUIZ_SERVICE_URL", "http://localhost:8002")
    PATH_SERVICE_URL: str = os.getenv("PATH_SERVICE_URL", "http://localhost:8003")
    REWARD_SERVICE_URL: str = os.getenv("REWARD_SERVICE_URL", "http://localhost:8004")
    
    # Configurazioni CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:8000"]
    CORS_ORIGINS_REGEX: Optional[str] = None
    CORS_METHODS: List[str] = ["*"]
    CORS_HEADERS: List[str] = ["*"]
    
    # Mappatura dei servizi
    SERVICE_ROUTES: Dict[str, str] = {
        "/api/auth": AUTH_SERVICE_URL,
        "/api/quiz": QUIZ_SERVICE_URL,
        "/api/paths": PATH_SERVICE_URL,
        "/api/path-templates": PATH_SERVICE_URL,
        "/api/rewards": REWARD_SERVICE_URL,
        "/api/user-rewards": REWARD_SERVICE_URL
    }
    
    # Endpoint pubblici che non richiedono autenticazione
    PUBLIC_ENDPOINTS: List[str] = [
        "/api/auth/login",
        "/api/auth/register",
        "/api/auth/refresh",
        "/docs",
        "/redoc",
        "/openapi.json",
        "/"
    ]
    
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", case_sensitive=True, extra="ignore")


settings = Settings()
