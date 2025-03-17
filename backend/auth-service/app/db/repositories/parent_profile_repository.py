from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

from app.db.models.user import User, ParentProfile
from app.schemas.user import UserCreate


class ParentProfileRepository:
    """Repository per gestire i profili dei genitori"""

    @staticmethod
    def get_by_user_id(db: Session, user_id: int) -> Optional[ParentProfile]:
        """Recupera il profilo genitore per l'ID utente specificato"""
        return db.query(ParentProfile).filter(ParentProfile.user_id == user_id).first()
    
    @staticmethod
    def create(db: Session, user_id: int) -> ParentProfile:
        """Crea un nuovo profilo genitore"""
        profile = ParentProfile(user_id=user_id)
        db.add(profile)
        db.commit()
        db.refresh(profile)
        return profile
    
    @staticmethod
    def update(db: Session, profile: ParentProfile) -> ParentProfile:
        """Aggiorna un profilo genitore esistente"""
        db.add(profile)
        db.commit()
        db.refresh(profile)
        return profile
        
    @staticmethod
    def link_student(db: Session, parent_id: int, student_id: int) -> bool:
        """Collega uno studente a un genitore"""
        try:
            # Recupera lo studente dal database e collega al genitore
            from app.db.models.user import StudentProfile
            student = db.query(StudentProfile).filter(StudentProfile.id == student_id).first()
            if student:
                student.parent_id = parent_id
                db.add(student)
                db.commit()
                return True
            return False
        except SQLAlchemyError:
            db.rollback()
            return False