from typing import List, Optional
from sqlalchemy.orm import Session

from app.db.models.user import Role
from app.schemas.user import RoleCreate, RoleUpdate

class RoleRepository:
    """Repository per la gestione dei ruoli."""
    
    @staticmethod
    def get(db: Session, role_id: int) -> Optional[Role]:
        """Ottiene un ruolo dal database per ID."""
        return db.query(Role).filter(Role.id == role_id).first()
    
    @staticmethod
    def get_by_name(db: Session, name: str) -> Optional[Role]:
        """Ottiene un ruolo dal database per nome."""
        return db.query(Role).filter(Role.name == name).first()
    
    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 100) -> List[Role]:
        """Ottiene tutti i ruoli dal database."""
        return db.query(Role).offset(skip).limit(limit).all()
    
    @staticmethod
    def create(db: Session, role_create: RoleCreate) -> Role:
        """Crea un nuovo ruolo nel database."""
        db_role = Role(
            name=role_create.name,
            description=role_create.description,
        )
        
        db.add(db_role)
        db.commit()
        db.refresh(db_role)
        
        return db_role
    
    @staticmethod
    def update(db: Session, role: Role, role_update: RoleUpdate) -> Role:
        """Aggiorna un ruolo esistente nel database."""
        update_data = role_update.dict(exclude_unset=True)
        
        for field, value in update_data.items():
            setattr(role, field, value)
        
        db.add(role)
        db.commit()
        db.refresh(role)
        
        return role
    
    @staticmethod
    def delete(db: Session, role_id: int) -> bool:
        """Elimina un ruolo dal database."""
        role = db.query(Role).filter(Role.id == role_id).first()
        if role:
            db.delete(role)
            db.commit()
            return True
        return False
    
    @staticmethod
    def get_or_create_default_roles(db: Session) -> List[Role]:
        """
        Ottiene o crea i ruoli predefiniti per l'applicazione.
        
        I ruoli predefiniti sono:
        - admin: Amministratori dell'applicazione
        - parent: Genitori
        - student: Studenti
        
        Returns:
            Lista di ruoli predefiniti
        """
        default_roles = []
        
        # Definizione dei ruoli predefiniti
        roles_data = [
            {"name": "admin", "description": "Amministratori dell'applicazione"},
            {"name": "parent", "description": "Genitori degli studenti"},
            {"name": "student", "description": "Studenti"},
        ]
        
        # Per ogni ruolo, controlla se esiste già o crealo
        for role_data in roles_data:
            role = db.query(Role).filter(Role.name == role_data["name"]).first()
            if not role:
                role = Role(**role_data)
                db.add(role)
                db.commit()
                db.refresh(role)
            
            default_roles.append(role)
        
        return default_roles
