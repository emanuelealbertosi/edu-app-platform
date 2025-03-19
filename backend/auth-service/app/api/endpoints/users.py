from fastapi import APIRouter, Depends, HTTPException, status, Body, Path, Query
from sqlalchemy.orm import Session
from typing import Any, List

from app.db.base import get_db
from app.api.dependencies.auth import get_current_user, get_current_active_user, get_current_admin_user
from app.db.repositories.user_repository import UserRepository
from app.db.repositories.role_repository import RoleRepository
from app.db.repositories.profile_repository import ParentProfileRepository, StudentProfileRepository
from app.schemas.user import (
    User, UserCreate, UserUpdate, 
    ParentProfile, ParentProfileCreate, ParentProfileUpdate,
    StudentProfile, StudentProfileCreate, StudentProfileUpdate,
    Role
)
from app.db.models.user import User as UserModel

router = APIRouter()

# Endpoint per gli amministratori
@router.get("/", response_model=List[User])
async def get_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    current_user: UserModel = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Ottiene tutti gli utenti (solo amministratori).
    """
    users = UserRepository.get_all(db, skip=skip, limit=limit)
    return users

@router.get("/{user_id}", response_model=User)
async def get_user(
    user_id: int = Path(..., gt=0),
    current_user: UserModel = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Ottiene un utente specifico per ID (solo amministratori).
    """
    user = UserRepository.get(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utente non trovato",
        )
    return user

@router.post("/", response_model=User)
async def create_user(
    user_data: UserCreate = Body(...),
    current_user: UserModel = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Crea un nuovo utente (solo amministratori).
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
    
    # Crea l'utente
    user = UserRepository.create(db, user_data)
    
    return user

@router.put("/{user_id}", response_model=User)
async def update_user(
    user_id: int = Path(..., gt=0),
    user_data: UserUpdate = Body(...),
    current_user: UserModel = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Aggiorna un utente esistente (solo amministratori).
    """
    # Log per debug
    print(f"Richiesta di aggiornamento utente {user_id} con dati: {user_data}")
    
    user = UserRepository.get(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utente non trovato",
        )
    
    # Verifica se l'email o lo username esistono già (se vengono modificati)
    if user_data.email and user_data.email != user.email:
        if UserRepository.get_by_email(db, user_data.email):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email già registrata",
            )
    
    if user_data.username and user_data.username != user.username:
        if UserRepository.get_by_username(db, user_data.username):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username già utilizzato",
            )
    
    # Gestione del ruolo se specificato
    role_name = user_data.role
    role_to_set = None
    
    if role_name:
        print(f"Cambio ruolo richiesto a: {role_name}")
        # Recupera il ruolo corrispondente dal database
        # RoleRepository utilizza metodi statici, non richiede inizializzazione
        role_to_set = RoleRepository.get_by_name(db, role_name)
        
        if not role_to_set:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Ruolo '{role_name}' non trovato",
            )
        
        # Rimuovi il campo role da user_data per evitare errori durante l'aggiornamento
        # poiché non è una colonna diretta del modello User
        user_data_dict = user_data.dict(exclude_unset=True)
        if "role" in user_data_dict:
            del user_data_dict["role"]
        user_data = UserUpdate(**user_data_dict)
    
    # Aggiorna l'utente
    updated_user = UserRepository.update(db, user, user_data)
    
    # Aggiorna il ruolo dell'utente se necessario
    if role_to_set:
        print(f"Aggiornamento ruolo utente a: {role_name}")
        # Rimuovi tutti i ruoli esistenti
        updated_user.roles = []
        db.add(updated_user)
        db.commit()
        
        # Aggiungi il nuovo ruolo
        updated_user.roles = [role_to_set]
        db.add(updated_user)
        db.commit()
        db.refresh(updated_user)
    
    return updated_user

@router.delete("/{user_id}")
async def delete_user(
    user_id: int = Path(..., gt=0),
    current_user: UserModel = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Elimina un utente (solo amministratori).
    """
    # Non permettere di eliminare sé stessi
    if current_user.id == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Non puoi eliminare il tuo account",
        )
    
    # Elimina l'utente
    success = UserRepository.delete(db, user_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utente non trovato",
        )
    
    return {"detail": "Utente eliminato con successo"}

# Endpoint per i ruoli
@router.post("/{user_id}/roles", response_model=User)
async def add_role_to_user(
    user_id: int = Path(..., gt=0),
    role_id: int = Body(..., embed=True),
    current_user: UserModel = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Aggiunge un ruolo a un utente (solo amministratori).
    """
    user = UserRepository.get(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utente non trovato",
        )
    
    role = RoleRepository.get(db, role_id)
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ruolo non trovato",
        )
    
    # Verifica se l'utente ha già il ruolo
    if role in user.roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"L'utente ha già il ruolo {role.name}",
        )
    
    # Aggiungi il ruolo all'utente
    updated_user = UserRepository.add_roles_to_user(db, user, [role])
    
    return updated_user

@router.delete("/{user_id}/roles/{role_id}")
async def remove_role_from_user(
    user_id: int = Path(..., gt=0),
    role_id: int = Path(..., gt=0),
    current_user: UserModel = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Rimuove un ruolo da un utente (solo amministratori).
    """
    user = UserRepository.get(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utente non trovato",
        )
    
    role = RoleRepository.get(db, role_id)
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ruolo non trovato",
        )
    
    # Verifica se l'utente ha il ruolo
    if role not in user.roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"L'utente non ha il ruolo {role.name}",
        )
    
    # Rimuovi il ruolo dall'utente
    updated_user = UserRepository.remove_roles_from_user(db, user, [role])
    
    return {"detail": f"Ruolo {role.name} rimosso con successo dall'utente"}

# Endpoint per i profili
@router.post("/{user_id}/parent-profile", response_model=ParentProfile)
async def create_parent_profile(
    user_id: int = Path(..., gt=0),
    profile_data: ParentProfileCreate = Body(...),
    current_user: UserModel = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Crea un profilo genitore per un utente (solo amministratori).
    """
    user = UserRepository.get(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utente non trovato",
        )
    
    # Verifica se l'utente ha già un profilo genitore
    if ParentProfileRepository.get_by_user_id(db, user_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="L'utente ha già un profilo genitore",
        )
    
    # Verifica se l'utente ha il ruolo genitore
    parent_role = RoleRepository.get_by_name(db, "parent")
    if parent_role not in user.roles:
        # Aggiungi il ruolo genitore all'utente
        UserRepository.add_roles_to_user(db, user, [parent_role])
    
    # Crea il profilo genitore
    profile = ParentProfileRepository.create(db, user, profile_data)
    
    return profile

@router.post("/{user_id}/student-profile", response_model=StudentProfile)
async def create_student_profile(
    user_id: int = Path(..., gt=0),
    profile_data: StudentProfileCreate = Body(...),
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Crea un profilo studente per un utente (admin o genitore).
    """
    # Verifica se l'utente corrente è un genitore o un admin
    is_admin = any(role.name == "admin" for role in current_user.roles)
    is_parent = any(role.name == "parent" for role in current_user.roles)
    
    if not (is_admin or is_parent):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo gli amministratori e i genitori possono creare profili studente",
        )
    
    # Se è un genitore, verifica se il parent_id corrisponde al suo profilo
    if is_parent and not is_admin:
        parent_profile = ParentProfileRepository.get_by_user_id(db, current_user.id)
        if not parent_profile or parent_profile.id != profile_data.parent_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Puoi creare profili studente solo per i tuoi figli",
            )
    
    user = UserRepository.get(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utente non trovato",
        )
    
    # Verifica se l'utente ha già un profilo studente
    if StudentProfileRepository.get_by_user_id(db, user_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="L'utente ha già un profilo studente",
        )
    
    # Verifica se il parent_id è valido
    parent_profile = ParentProfileRepository.get(db, profile_data.parent_id)
    if not parent_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profilo genitore non trovato",
        )
    
    # Verifica se l'utente ha il ruolo studente
    student_role = RoleRepository.get_by_name(db, "student")
    if student_role not in user.roles:
        # Aggiungi il ruolo studente all'utente
        UserRepository.add_roles_to_user(db, user, [student_role])
    
    # Crea il profilo studente
    profile = StudentProfileRepository.create(db, user, profile_data)
    
    return profile

# Endpoint per il profilo dell'utente corrente
@router.get("/me", response_model=User)
async def get_current_user_profile(
    current_user: UserModel = Depends(get_current_active_user)
) -> Any:
    """
    Ottiene il profilo dell'utente corrente.
    """
    return current_user

@router.put("/me", response_model=User)
async def update_current_user_profile(
    user_data: UserUpdate = Body(...),
    current_user: UserModel = Depends(get_current_active_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Aggiorna il profilo dell'utente corrente.
    """
    # Verifica se l'email o lo username esistono già (se vengono modificati)
    if user_data.email and user_data.email != current_user.email:
        if UserRepository.get_by_email(db, user_data.email):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email già registrata",
            )
    
    if user_data.username and user_data.username != current_user.username:
        if UserRepository.get_by_username(db, user_data.username):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username già utilizzato",
            )
    
    # Aggiorna l'utente
    updated_user = UserRepository.update(db, current_user, user_data)
    
    return updated_user

@router.put("/{user_id}/deactivate", response_model=User)
async def deactivate_user(
    user_id: int = Path(..., gt=0),
    current_user: UserModel = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Disattiva un utente (solo amministratori).
    """
    # Non permettere di disattivare sé stessi
    if current_user.id == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Non puoi disattivare il tuo account",
        )
    
    user = UserRepository.get(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utente non trovato",
        )
    
    # Disattiva l'utente
    user.is_active = False
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return user

@router.put("/{user_id}/reset-password")
async def reset_user_password(
    user_id: int = Path(..., gt=0),
    password_data: dict = Body(...),
    current_user: UserModel = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Reimposta la password di un utente (solo amministratori).
    """
    user = UserRepository.get(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Utente non trovato",
        )
    
    # Controlla che sia stata fornita una nuova password
    new_password = password_data.get("password")
    if not new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nuova password non fornita",
        )
    
    # Utilizziamo UserUpdate per aggiornare solo la password
    user_update = UserUpdate(password=new_password)
    
    # Aggiorna la password dell'utente
    updated_user = UserRepository.update(db, user, user_update)
    
    return {"detail": "Password reimpostata con successo"}
