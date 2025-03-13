from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from app.db.models.user import User, StudentProfile
from app.schemas.user import UserCreate


class StudentProfileRepository:
    """Repository per gestire i profili degli studenti"""

    def __init__(self, db: Session):
        self.db = db

    def get_by_user_id(self, user_id: int) -> Optional[StudentProfile]:
        """Recupera il profilo studente per l'ID utente specificato"""
        return self.db.query(StudentProfile).filter(StudentProfile.user_id == user_id).first()
    
    def create(self, user_id: int, grade: Optional[str] = None, age: Optional[int] = None) -> StudentProfile:
        """Crea un nuovo profilo studente"""
        profile = StudentProfile(
            user_id=user_id,
            grade=grade,
            age=age
        )
        self.db.add(profile)
        self.db.commit()
        self.db.refresh(profile)
        return profile
    
    def update(self, profile: StudentProfile) -> StudentProfile:
        """Aggiorna un profilo studente esistente"""
        self.db.add(profile)
        self.db.commit()
        self.db.refresh(profile)
        return profile
        
    def get_by_parent_id(self, parent_id: int) -> List[StudentProfile]:
        """Recupera tutti gli studenti associati a un genitore specifico"""
        # Questa funzione dovrà essere implementata con la relazione many-to-many
        # tra genitori e studenti quando sarà definita la tabella di relazione
        return []