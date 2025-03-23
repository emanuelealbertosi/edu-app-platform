from typing import Optional, List
from datetime import datetime
from enum import Enum
from sqlalchemy import Column, String, Boolean, DateTime, Integer, Float
from app.db.base import Base
import uuid

def generate_uuid():
    """Genera un UUID casuale"""
    return str(uuid.uuid4())

class UserRole(str, Enum):
    ADMIN = "admin"
    PARENT = "parent"
    STUDENT = "student"

class User(Base):
    """
    Modello per l'utente nel servizio reward.
    
    Questo è un modello semplificato che replica le proprietà essenziali
    del modello User nel auth-service per compatibilità.
    """
    __tablename__ = "users"
    
    id = Column(String, primary_key=True)
    email = Column(String, nullable=True)
    full_name = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    points = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def has_role(self, role: str) -> bool:
        """Verifica se l'utente ha un ruolo specifico"""
        # Questo metodo è mantenuto per compatibilità ma qui non gestiamo i ruoli
        return False