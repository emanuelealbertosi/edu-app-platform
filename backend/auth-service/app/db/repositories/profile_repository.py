from typing import List, Optional
from sqlalchemy.orm import Session

from app.db.models.user import ParentProfile, StudentProfile, User
from app.schemas.user import ParentProfileCreate, ParentProfileUpdate, StudentProfileCreate, StudentProfileUpdate

class ParentProfileRepository:
    """Repository per la gestione dei profili dei genitori."""
    
    @staticmethod
    def get(db: Session, profile_id: int) -> Optional[ParentProfile]:
        """Ottiene un profilo genitore dal database per ID."""
        return db.query(ParentProfile).filter(ParentProfile.id == profile_id).first()
    
    @staticmethod
    def get_by_user_id(db: Session, user_id: int) -> Optional[ParentProfile]:
        """Ottiene un profilo genitore dal database per ID utente."""
        return db.query(ParentProfile).filter(ParentProfile.user_id == user_id).first()
    
    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 100) -> List[ParentProfile]:
        """Ottiene tutti i profili genitore dal database."""
        return db.query(ParentProfile).offset(skip).limit(limit).all()
    
    @staticmethod
    def create(db: Session, user: User, profile_create: ParentProfileCreate) -> ParentProfile:
        """Crea un nuovo profilo genitore nel database."""
        db_profile = ParentProfile(
            user_id=user.id,
            phone_number=profile_create.phone_number,
            address=profile_create.address,
        )
        
        db.add(db_profile)
        db.commit()
        db.refresh(db_profile)
        
        return db_profile
    
    @staticmethod
    def update(db: Session, profile: ParentProfile, profile_update: ParentProfileUpdate) -> ParentProfile:
        """Aggiorna un profilo genitore esistente nel database."""
        update_data = profile_update.dict(exclude_unset=True)
        
        for field, value in update_data.items():
            setattr(profile, field, value)
        
        db.add(profile)
        db.commit()
        db.refresh(profile)
        
        return profile
    
    @staticmethod
    def delete(db: Session, profile_id: int) -> bool:
        """Elimina un profilo genitore dal database."""
        profile = db.query(ParentProfile).filter(ParentProfile.id == profile_id).first()
        if profile:
            db.delete(profile)
            db.commit()
            return True
        return False
    
    @staticmethod
    def get_students(db: Session, parent_id: int) -> List[StudentProfile]:
        """Ottiene tutti gli studenti associati a un genitore."""
        return db.query(StudentProfile).filter(StudentProfile.parent_id == parent_id).all()


class StudentProfileRepository:
    """Repository per la gestione dei profili degli studenti."""
    
    @staticmethod
    def get(db: Session, profile_id: int) -> Optional[StudentProfile]:
        """Ottiene un profilo studente dal database per ID."""
        return db.query(StudentProfile).filter(StudentProfile.id == profile_id).first()
    
    @staticmethod
    def get_by_user_id(db: Session, user_id: int) -> Optional[StudentProfile]:
        """Ottiene un profilo studente dal database per ID utente."""
        return db.query(StudentProfile).filter(StudentProfile.user_id == user_id).first()
    
    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 100) -> List[StudentProfile]:
        """Ottiene tutti i profili studente dal database."""
        return db.query(StudentProfile).offset(skip).limit(limit).all()
    
    @staticmethod
    def get_by_parent(db: Session, parent_id: int, skip: int = 0, limit: int = 100) -> List[StudentProfile]:
        """Ottiene tutti i profili studente associati a un genitore."""
        return db.query(StudentProfile).filter(
            StudentProfile.parent_id == parent_id
        ).offset(skip).limit(limit).all()
    
    @staticmethod
    def create(db: Session, user: User, profile_create: StudentProfileCreate) -> StudentProfile:
        """Crea un nuovo profilo studente nel database."""
        db_profile = StudentProfile(
            user_id=user.id,
            parent_id=profile_create.parent_id,
            school_grade=profile_create.school_grade,
            birth_date=profile_create.birth_date,
            points=profile_create.points,
        )
        
        db.add(db_profile)
        db.commit()
        db.refresh(db_profile)
        
        return db_profile
    
    @staticmethod
    def update(db: Session, profile: StudentProfile, profile_update: StudentProfileUpdate) -> StudentProfile:
        """Aggiorna un profilo studente esistente nel database."""
        update_data = profile_update.dict(exclude_unset=True)
        
        for field, value in update_data.items():
            setattr(profile, field, value)
        
        db.add(profile)
        db.commit()
        db.refresh(profile)
        
        return profile
    
    @staticmethod
    def delete(db: Session, profile_id: int) -> bool:
        """Elimina un profilo studente dal database."""
        profile = db.query(StudentProfile).filter(StudentProfile.id == profile_id).first()
        if profile:
            db.delete(profile)
            db.commit()
            return True
        return False
    
    @staticmethod
    def add_points(db: Session, profile_id: int, points: int) -> Optional[StudentProfile]:
        """Aggiunge punti a un profilo studente."""
        profile = db.query(StudentProfile).filter(StudentProfile.id == profile_id).first()
        if profile:
            profile.points += points
            db.add(profile)
            db.commit()
            db.refresh(profile)
            return profile
        return None
    
    @staticmethod
    def subtract_points(db: Session, profile_id: int, points: int) -> Optional[StudentProfile]:
        """Sottrae punti da un profilo studente."""
        profile = db.query(StudentProfile).filter(StudentProfile.id == profile_id).first()
        if profile:
            if profile.points >= points:
                profile.points -= points
                db.add(profile)
                db.commit()
                db.refresh(profile)
                return profile
            else:
                return None  # Punti insufficienti
        return None
