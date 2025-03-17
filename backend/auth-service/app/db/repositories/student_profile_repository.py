from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from app.db.models.user import User, StudentProfile
from app.schemas.user import UserCreate


class StudentProfileRepository:
    """Repository per gestire i profili degli studenti"""

    @staticmethod
    def get_by_user_id(db: Session, user_id: int) -> Optional[StudentProfile]:
        """Recupera il profilo studente per l'ID utente specificato"""
        return db.query(StudentProfile).filter(StudentProfile.user_id == user_id).first()
    
    @staticmethod
    def create(db: Session, user_id: int, grade: Optional[str] = None, age: Optional[int] = None) -> StudentProfile:
        """Crea un nuovo profilo studente"""
        profile = StudentProfile(
            user_id=user_id,
            grade=grade,
            age=age
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
        return profile
    
    @staticmethod
    def update(db: Session, profile: StudentProfile) -> StudentProfile:
        """Aggiorna un profilo studente esistente"""
        db.add(profile)
        db.commit()
        db.refresh(profile)
        return profile
        
    @staticmethod
    def get_by_parent_id(db: Session, parent_id: int) -> List[StudentProfile]:
        """Recupera tutti gli studenti associati a un genitore specifico"""
        return db.query(StudentProfile).filter(StudentProfile.parent_id == parent_id).all()
    
    @staticmethod
    def get_all(db: Session) -> List[StudentProfile]:
        """Recupera tutti i profili studente nel sistema"""
        return db.query(StudentProfile).all()