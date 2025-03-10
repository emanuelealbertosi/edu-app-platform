from sqlalchemy.orm import Session

from app.db.base import Base, engine
from app.db.repositories.role_repository import RoleRepository
from app.db.repositories.user_repository import UserRepository
from app.schemas.user import UserCreate

def init_db(db: Session) -> None:
    """
    Inizializza il database creando tabelle e dati iniziali.
    """
    # Crea tutte le tabelle
    Base.metadata.create_all(bind=engine)
    
    # Crea i ruoli predefiniti
    roles = RoleRepository.get_or_create_default_roles(db)
    
    # Ottieni il ruolo admin
    admin_role = next((role for role in roles if role.name == "admin"), None)
    
    # Crea un utente admin di default se non esiste
    admin_email = "admin@edapp.com"
    admin_user = UserRepository.get_by_email(db, admin_email)
    
    if not admin_user:
        admin_user_data = UserCreate(
            email=admin_email,
            username="admin",
            password="adminpass123",
            first_name="Admin",
            last_name="User",
            is_active=True
        )
        
        admin_user = UserRepository.create(db, admin_user_data, [admin_role])
        print(f"Utente admin creato: {admin_user.username} ({admin_user.email})")
    else:
        print(f"Utente admin già esistente: {admin_user.username} ({admin_user.email})")
    
    print("Inizializzazione database completata con successo!")
