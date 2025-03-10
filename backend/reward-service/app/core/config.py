from pydantic_settings import BaseSettings, SettingsConfigDict
import os
from typing import Optional, Dict, Any, List


class Settings(BaseSettings):
    """
    Configurazioni dell'applicazione da variabili di ambiente
    o file .env
    """
    # Configurazione server
    SERVER_HOST: str = "0.0.0.0"
    SERVER_PORT: int = 8004

    # Configurazione database
    POSTGRES_SERVER: str
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str
    POSTGRES_PORT: str
    
    # Configurazione sicurezza
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # URL dei servizi
    AUTH_SERVICE_URL: str
    
    @property
    def SQLALCHEMY_DATABASE_URI(self) -> str:
        """
        Costruisce la stringa di connessione al database
        """
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)


settings = Settings()
