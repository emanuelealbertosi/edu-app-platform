from typing import Optional, List
from datetime import datetime
from enum import Enum
from pydantic import BaseModel


class UserRole(str, Enum):
    ADMIN = "admin"
    PARENT = "parent"
    STUDENT = "student"


class User:
    """
    Modello mock per l'utente nel servizio reward.
    
    Questo è un modello semplificato che replica le proprietà essenziali
    del modello User nel auth-service per compatibilità.
    """
    def __init__(
        self,
        id: str,
        email: str,
        full_name: Optional[str] = None,
        roles: List[str] = None,
        is_active: bool = True,
        created_at: datetime = None,
        updated_at: datetime = None
    ):
        self.id = id
        self.email = email
        self.full_name = full_name
        self.roles = roles or []
        self.is_active = is_active
        self.created_at = created_at or datetime.now()
        self.updated_at = updated_at or datetime.now()
    
    def has_role(self, role: str) -> bool:
        """Verifica se l'utente ha un ruolo specifico"""
        return role in self.roles
