from fastapi import APIRouter, Depends, HTTPException, status, Body
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from typing import Any, List
import uuid

from app.db.base import get_db
from app.core.config import settings
from app.core.security import create_access_token, create_refresh_token, decode_token
from app.db.repositories.user_repository import UserRepository
from app.db.repositories.role_repository import RoleRepository
from app.schemas.user import Token, RefreshToken, UserCreate, User, SystemStats, AdminActivity, UserInList
from app.api.dependencies.auth import get_current_user, get_current_admin_user

router = APIRouter()

@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
) -> Any:
    """
    Ottiene un token di accesso JWT utilizzando username/email e password.
    """
    # Autentica l'utente
    user = UserRepository.authenticate(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Username/email o password non corretti",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account disattivato",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Genera il token di accesso
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # Estrai i nomi dei ruoli
    role_names = [role.name for role in user.roles]
    
    # Crea il token di accesso
    access_token = create_access_token(
        subject=user.uuid,
        roles=role_names,
        expires_delta=access_token_expires
    )
    
    # Crea il token di refresh
    refresh_token_expires = timedelta(minutes=settings.REFRESH_TOKEN_EXPIRE_MINUTES)
    refresh_token = create_refresh_token(
        subject=user.uuid,
        expires_delta=refresh_token_expires
    )
    
    # Salva il token di refresh nel database
    token_expires_at = datetime.now(timezone.utc) + refresh_token_expires
    UserRepository.create_refresh_token(db, user.id, refresh_token, token_expires_at)
    
    # Restituisci i token
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }

@router.post("/refresh", response_model=Token)
async def refresh_token(
    refresh_token_data: RefreshToken = Body(...),
    db: Session = Depends(get_db)
) -> Any:
    """
    Ottiene un nuovo token di accesso utilizzando il token di refresh.
    """
    # Decodifica il token di refresh
    token_data = decode_token(refresh_token_data.refresh_token)
    if not token_data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token di refresh non valido",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Ottieni il token di refresh dal database
    db_token = UserRepository.get_refresh_token(db, refresh_token_data.refresh_token)
    
    if not db_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token di refresh non trovato",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    if db_token.revoked:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token di refresh revocato",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    # Controlla la scadenza del token, assicurandoci che entrambi siano timezone-aware
    now = datetime.now(timezone.utc)
    token_expires = db_token.expires_at
    
    # Se token_expires non ha timezone, convertiamolo
    if token_expires.tzinfo is None:
        token_expires = token_expires.replace(tzinfo=timezone.utc)
        
    if token_expires < now:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token di refresh scaduto",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Ottieni l'utente
    user = UserRepository.get_by_uuid(db, token_data.sub)
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Utente non trovato o disattivato",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Estrai i nomi dei ruoli
    role_names = [role.name for role in user.roles]
    
    # Crea un nuovo token di accesso
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=user.uuid,
        roles=role_names,
        expires_delta=access_token_expires
    )
    
    # Crea un nuovo token di refresh
    refresh_token_expires = timedelta(minutes=settings.REFRESH_TOKEN_EXPIRE_MINUTES)
    new_refresh_token = create_refresh_token(
        subject=user.uuid,
        expires_delta=refresh_token_expires
    )
    
    # Revoca il vecchio token di refresh
    UserRepository.revoke_refresh_token(db, refresh_token_data.refresh_token)
    
    # Salva il nuovo token di refresh nel database
    token_expires_at = datetime.now(timezone.utc) + refresh_token_expires
    UserRepository.create_refresh_token(db, user.id, new_refresh_token, token_expires_at)
    
    # Restituisci i nuovi token
    return {
        "access_token": access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer"
    }

@router.post("/logout")
async def logout(
    refresh_token_data: RefreshToken = Body(...),
    db: Session = Depends(get_db)
) -> Any:
    """
    Revoca un token di refresh.
    """
    # Revoca il token di refresh
    success = UserRepository.revoke_refresh_token(db, refresh_token_data.refresh_token)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token di refresh non valido",
        )
    
    return {"detail": "Logout effettuato con successo"}

@router.post("/register", response_model=User)
async def register(
    user_data: UserCreate = Body(...),
    db: Session = Depends(get_db)
) -> Any:
    """
    Registra un nuovo utente.
    """
    # Verifica se l'email o lo username esistono già
    if UserRepository.get_by_email(db, user_data.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email già registrata",
        )
    
    if UserRepository.get_by_username(db, user_data.username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username già utilizzato",
        )
    
    # Ottieni il ruolo studente di default
    student_role = RoleRepository.get_by_name(db, "student")
    if not student_role:
        # Se non esiste il ruolo, crea i ruoli predefiniti
        roles = RoleRepository.get_or_create_default_roles(db)
        student_role = next((role for role in roles if role.name == "student"), None)
    
    # Crea l'utente con il ruolo studente
    user = UserRepository.create(db, user_data, [student_role])
    
    return user

@router.get("/stats", response_model=SystemStats)
async def get_stats(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin_user)
) -> Any:
    """
    Ottiene le statistiche del sistema. Solo per admin.
    """
    # In una implementazione reale, queste informazioni verrebbero recuperate dal database
    # e da altri microservizi, ma per ora restituiamo dati segnaposto
    
    # Otteniamo le statistiche degli utenti dal repository
    user_stats = UserRepository.get_user_statistics(db)
    
    # Per i valori che provengono da altri servizi, usiamo valori segnaposto
    # In un'implementazione reale, questi valori verrebbero recuperati dagli altri servizi
    return SystemStats(
        totalUsers=user_stats.get('total_users', 0),
        activeStudents=user_stats.get('active_students', 0),
        activeParents=user_stats.get('active_parents', 0),
        totalPaths=25,  # Dati segnaposto
        completedPaths=12,  # Dati segnaposto
        totalQuizzes=48,  # Dati segnaposto
        completedQuizzes=36,  # Dati segnaposto
        averageScore=78.5,  # Dati segnaposto
        totalRewards=15,  # Dati segnaposto
        redeemedRewards=7  # Dati segnaposto
    )

@router.get("/users", response_model=List[UserInList])
async def get_users(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin_user),
    skip: int = 0,
    limit: int = 100
) -> Any:
    """
    Ottiene la lista degli utenti. Solo per admin.
    """
    users = UserRepository.get_all(db, skip=skip, limit=limit)
    
    # Convertiamo i ruoli da oggetti Role a stringhe
    result = []
    for user in users:
        user_data = UserInList(
            id=str(user.id),
            uuid=user.uuid,
            username=user.username,
            email=user.email,
            first_name=user.first_name,
            last_name=user.last_name,
            is_active=user.is_active,
            created_at=user.created_at,
            updated_at=user.updated_at,
            roles=[role.name for role in user.roles]
        )
        result.append(user_data)
    
    return result

@router.get("/activities", response_model=List[AdminActivity])
async def get_activities(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin_user),
    skip: int = 0,
    limit: int = 20
) -> Any:
    """
    Ottiene le attività recenti del sistema. Solo per admin.
    """
    # In una implementazione reale, queste informazioni verrebbero recuperate dal database
    # ma per ora restituiamo dati segnaposto
    
    # Esempio di attività del sistema (dati statici)
    activities = [
        AdminActivity(
            id=str(uuid.uuid4()),
            action="login",
            userId=str(uuid.uuid4()),
            username="admin1",
            userRole="admin",
            timestamp=datetime.now(timezone.utc) - timedelta(hours=1),
            details={"ip": "192.168.1.1"}
        ),
        AdminActivity(
            id=str(uuid.uuid4()),
            action="create_quiz",
            userId=str(uuid.uuid4()),
            username="teacher1",
            userRole="admin",
            timestamp=datetime.now(timezone.utc) - timedelta(hours=2),
            details={"quiz_id": "abc123", "title": "Quiz di matematica"}
        ),
        AdminActivity(
            id=str(uuid.uuid4()),
            action="assign_path",
            userId=str(uuid.uuid4()),
            username="parent1",
            userRole="parent",
            timestamp=datetime.now(timezone.utc) - timedelta(hours=3),
            details={"path_id": "def456", "student_id": "student123"}
        ),
        AdminActivity(
            id=str(uuid.uuid4()),
            action="redeem_reward",
            userId=str(uuid.uuid4()),
            username="student1",
            userRole="student",
            timestamp=datetime.now(timezone.utc) - timedelta(hours=4),
            details={"reward_id": "ghi789", "points_spent": 500}
        ),
        AdminActivity(
            id=str(uuid.uuid4()),
            action="complete_quiz",
            userId=str(uuid.uuid4()),
            username="student2",
            userRole="student",
            timestamp=datetime.now(timezone.utc) - timedelta(hours=5),
            details={"quiz_id": "jkl012", "score": 85}
        )
    ]
    
    # Applica skip e limit
    return activities[skip:skip+limit]
