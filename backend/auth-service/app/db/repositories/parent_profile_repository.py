from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from app.db.models.user import User, ParentProfile
from app.schemas.user import UserCreate


class ParentProfileRepository:
    """Repository per gestire i profili dei genitori"""

    def __init__(self, db: Session):
        self.db = db

    def get_by_user_id(self, user_id: int) -> Optional[ParentProfile]:
        """Recupera il profilo genitore per l'ID utente specificato"""
        return self.db.query(ParentProfile).filter(ParentProfile.user_id == user_id).first()
    
    def create(self, user_id: int) -> ParentProfile:
        """Crea un nuovo profilo genitore"""
        profile = ParentProfile(user_id=user_id)
        self.db.add(profile)
        self.db.commit()
        self.db.refresh(profile)
        return profile
    
    def update(self, profile: ParentProfile) -> ParentProfile:
        """Aggiorna un profilo genitore esistente"""
        self.db.add(profile)
        self.db.commit()
        self.db.refresh(profile)
        return profile
        
    def link_student(self, parent_id: int, student_id: int) -> bool:
        """Collega uno studente a un genitore"""
        try:
            # Questa funzione dovrà essere implementata con la relazione many-to-many
            # tra genitori e studenti quando sarà definita la tabella di relazione
            return True
        except SQLAlchemyError:
            self.db.rollback()
            return False