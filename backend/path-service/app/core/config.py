import os
from pathlib import Path
from typing import Any, Dict, List, Optional, Union
from pydantic import PostgresDsn, field_validator
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Carica le variabili d'ambiente dal file .env se presente
env_path = Path(__file__).resolve().parent.parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

class Settings(BaseSettings):
    # API settings
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "App Educativa - Path Service"
    
    # JWT settings
    SECRET_KEY: str = os.getenv("SECRET_KEY", "questa_chiave_deve_essere_cambiata_in_produzione")
    ALGORITHM: str = "HS256"
    
    # Database settings
    POSTGRES_SERVER: str = os.getenv("POSTGRES_SERVER", "localhost")
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "postgres")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "postgres")
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "edu_app_path")
    POSTGRES_PORT: str = os.getenv("POSTGRES_PORT", "5432")
    DATABASE_URI: Optional[PostgresDsn] = None
    
    @field_validator("DATABASE_URI", mode="before")
    def assemble_db_connection(cls, v: Optional[str], info) -> Any:
        values = info.data
        if isinstance(v, str):
            return v
        # Utilizzo il formato stringa per costruire manualmente l'URL PostgreSQL
        # poiché l'API di PostgresDsn.build è cambiata in Pydantic v2
        postgres_user = values.get("POSTGRES_USER")
        postgres_password = values.get("POSTGRES_PASSWORD")
        postgres_server = values.get("POSTGRES_SERVER")
        postgres_port = values.get("POSTGRES_PORT")
        postgres_db = values.get("POSTGRES_DB", "")
        
        return f"postgresql://{postgres_user}:{postgres_password}@{postgres_server}:{postgres_port}/{postgres_db}"
    
    # CORS settings
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",  # Frontend React
        "http://localhost:8000",  # API Gateway
    ]
    
    # Service URLs
    AUTH_SERVICE_URL: str = os.getenv("AUTH_SERVICE_URL", "http://localhost:8001")
    QUIZ_SERVICE_URL: str = os.getenv("QUIZ_SERVICE_URL", "http://localhost:8002")
    
    # Server settings
    SERVER_HOST: str = os.getenv("SERVER_HOST", "0.0.0.0")
    SERVER_PORT: int = int(os.getenv("SERVER_PORT", "8003"))
    
    # Aggiunta di campi mancanti che vengono utilizzati nell'applicazione
    API_GATEWAY_URL: str = os.getenv("API_GATEWAY_URL", "http://localhost:8000")
    
    model_config = {
        "case_sensitive": True,
        "env_file": ".env",
        "extra": "allow"  # Permette campi extra non dichiarati nel modello
    }

settings = Settings()
