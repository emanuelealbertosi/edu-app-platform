from typing import List, Optional, Dict, Any, Union
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.db.models.user import User, Role, ParentProfile, StudentProfile, RefreshToken
from app.schemas.user import UserCreate, UserUpdate
from app.core.security import get_password_hash

class UserRepository:
    """Repository per la gestione degli utenti."""
    
    @staticmethod
    def get(db: Session, user_id: int) -> Optional[User]:
        """Ottiene un utente dal database per ID."""
        return db.query(User).filter(User.id == user_id).first()
    
    @staticmethod
    def get_by_email(db: Session, email: str) -> Optional[User]:
        """Ottiene un utente dal database per email."""
        return db.query(User).filter(User.email == email).first()
    
    @staticmethod
    def get_by_username(db: Session, username: str) -> Optional[User]:
        """Ottiene un utente dal database per username."""
        return db.query(User).filter(User.username == username).first()
    
    @staticmethod
    def get_by_uuid(db: Session, uuid: str) -> Optional[User]:
        """Ottiene un utente dal database per UUID."""
        return db.query(User).filter(User.uuid == uuid).first()
    
    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 100) -> List[User]:
        """Ottiene tutti gli utenti dal database."""
        return db.query(User).offset(skip).limit(limit).all()
    
    @staticmethod
    def create(db: Session, user_create: UserCreate, roles: List[Role] = None) -> User:
        """Crea un nuovo utente nel database."""
        # Hash della password
        hashed_password = get_password_hash(user_create.password)
        
        # Creazione dell'utente con dati validati da Pydantic
        db_user = User(
            email=user_create.email,
            username=user_create.username,
            hashed_password=hashed_password,
            first_name=user_create.first_name,
            last_name=user_create.last_name,
            is_active=user_create.is_active,
        )
        
        # Aggiungi ruoli se specificati
        if roles:
            db_user.roles = roles
        
        # Salva l'utente nel database
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        
        return db_user
    
    @staticmethod
    def update(db: Session, user: User, user_update: UserUpdate) -> User:
        """Aggiorna un utente esistente nel database."""
        # Aggiorna solo i campi forniti
        update_data = user_update.dict(exclude_unset=True)
        
        # Se viene fornita una nuova password, applica l'hashing
        if "password" in update_data:
            hashed_password = get_password_hash(update_data["password"])
            del update_data["password"]
            update_data["hashed_password"] = hashed_password
        
        # Applica tutti gli aggiornamenti all'utente
        for field, value in update_data.items():
            setattr(user, field, value)
        
        # Salva le modifiche nel database
        db.add(user)
        db.commit()
        db.refresh(user)
        
        return user
    
    @staticmethod
    def delete(db: Session, user_id: int) -> bool:
        """Elimina un utente dal database."""
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            db.delete(user)
            db.commit()
            return True
        return False
    
    @staticmethod
    def get_user_statistics(db: Session) -> Dict[str, int]:
        """Ottiene statistiche sugli utenti nel sistema."""
        from app.db.models.user import User, Role
        
        # Contiamo il totale degli utenti
        total_users = db.query(User).count()
        
        # Contiamo gli utenti attivi con ruolo studente
        active_students = db.query(User).join(User.roles).filter(
            Role.name == "student",
            User.is_active == True
        ).count()
        
        # Contiamo gli utenti attivi con ruolo genitore
        active_parents = db.query(User).join(User.roles).filter(
            Role.name == "parent",
            User.is_active == True
        ).count()
        
        return {
            "total_users": total_users,
            "active_students": active_students,
            "active_parents": active_parents
        }
    
    @staticmethod
    def authenticate(db: Session, username_or_email: str, password: str) -> Optional[User]:
        """Autentica un utente controllando username/email e password."""
        from app.core.security import verify_password
        
        # Cerca l'utente per username o email
        user = db.query(User).filter(
            or_(User.username == username_or_email, User.email == username_or_email)
        ).first()
        
        # Verifica se l'utente esiste e la password è corretta
        if not user or not verify_password(password, user.hashed_password):
            return None
        
        return user
    
    @staticmethod
    def add_roles_to_user(db: Session, user: User, roles: List[Role]) -> User:
        """Aggiunge ruoli a un utente."""
        user.roles.extend(roles)
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
    
    @staticmethod
    def remove_roles_from_user(db: Session, user: User, roles: List[Role]) -> User:
        """Rimuove ruoli da un utente."""
        for role in roles:
            if role in user.roles:
                user.roles.remove(role)
        
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
    
    @staticmethod
    def create_refresh_token(db: Session, user_id: int, token: str, expires_at: Any) -> RefreshToken:
        """Crea un nuovo token di refresh nel database."""
        db_token = RefreshToken(
            user_id=user_id,
            token=token,
            expires_at=expires_at
        )
        
        db.add(db_token)
        db.commit()
        db.refresh(db_token)
        
        return db_token
    
    @staticmethod
    def get_refresh_token(db: Session, token: str) -> Optional[RefreshToken]:
        """Ottiene un token di refresh dal database."""
        return db.query(RefreshToken).filter(RefreshToken.token == token).first()
    
    @staticmethod
    def revoke_refresh_token(db: Session, token: str) -> bool:
        """Revoca un token di refresh nel database."""
        db_token = db.query(RefreshToken).filter(RefreshToken.token == token).first()
        if db_token:
            db_token.revoked = True
            db.add(db_token)
            db.commit()
            return True
        return False
