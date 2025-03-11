import os
from pathlib import Path
from typing import Any, Dict, List, Optional, Union
from pydantic import PostgresDsn, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from dotenv import load_dotenv

# Carica le variabili d'ambiente dal file .env se presente
env_path = Path(__file__).resolve().parent.parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env', env_file_encoding='utf-8', extra='ignore', case_sensitive=True)
    # API settings
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "App Educativa - Quiz Service"
    
    # JWT settings
    SECRET_KEY: str = os.getenv("SECRET_KEY", "questa_chiave_deve_essere_cambiata_in_produzione")
    ALGORITHM: str = "HS256"
    
    # Database settings
    POSTGRES_SERVER: str = os.getenv("POSTGRES_SERVER", "localhost")
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "postgres")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "postgres")
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "edu_app_quiz")
    POSTGRES_PORT: str = os.getenv("POSTGRES_PORT", "5432")
    DATABASE_URI: Optional[PostgresDsn] = None
    
    @field_validator("DATABASE_URI", mode="before")
    def assemble_db_connection(cls, v: Optional[str], info) -> Any:
        if isinstance(v, str):
            return v
            
        # In Pydantic V2, dobbiamo accedere ai valori dal contesto di validazione in modo diverso
        data = info.data
        
        # In Pydantic V2, la sintassi di build è cambiata
        postgres_user = data.get("POSTGRES_USER", "")
        postgres_password = data.get("POSTGRES_PASSWORD", "")
        postgres_server = data.get("POSTGRES_SERVER", "")
        postgres_port = data.get("POSTGRES_PORT", "")
        postgres_db = data.get("POSTGRES_DB", "")
        
        # Costruisce l'URL manualmente
        return f"postgresql://{postgres_user}:{postgres_password}@{postgres_server}:{postgres_port}/{postgres_db}"
    
    # CORS settings
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",  # Frontend React
        "http://localhost:8000",  # API Gateway
    ]
    
    # Service URLs
    AUTH_SERVICE_URL: str = os.getenv("AUTH_SERVICE_URL", "http://localhost:8001")
    
    # Le impostazioni sono state migrate a model_config

settings = Settings()
