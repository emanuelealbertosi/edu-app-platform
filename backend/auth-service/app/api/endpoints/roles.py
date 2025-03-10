from fastapi import APIRouter, Depends, HTTPException, status, Body, Path, Query
from sqlalchemy.orm import Session
from typing import Any, List

from app.db.base import get_db
from app.api.dependencies.auth import get_current_admin_user
from app.db.repositories.role_repository import RoleRepository
from app.schemas.user import Role, RoleCreate, RoleUpdate
from app.db.models.user import User as UserModel

router = APIRouter()

@router.get("/", response_model=List[Role])
async def get_roles(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    current_user: UserModel = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Ottiene tutti i ruoli (solo amministratori).
    """
    roles = RoleRepository.get_all(db, skip=skip, limit=limit)
    return roles

@router.get("/{role_id}", response_model=Role)
async def get_role(
    role_id: int = Path(..., gt=0),
    current_user: UserModel = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Ottiene un ruolo specifico per ID (solo amministratori).
    """
    role = RoleRepository.get(db, role_id)
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ruolo non trovato",
        )
    return role

@router.post("/", response_model=Role)
async def create_role(
    role_data: RoleCreate = Body(...),
    current_user: UserModel = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Crea un nuovo ruolo (solo amministratori).
    """
    # Verifica se il nome del ruolo esiste già
    if RoleRepository.get_by_name(db, role_data.name):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nome ruolo già esistente",
        )
    
    # Crea il ruolo
    role = RoleRepository.create(db, role_data)
    
    return role

@router.put("/{role_id}", response_model=Role)
async def update_role(
    role_id: int = Path(..., gt=0),
    role_data: RoleUpdate = Body(...),
    current_user: UserModel = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Aggiorna un ruolo esistente (solo amministratori).
    """
    role = RoleRepository.get(db, role_id)
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ruolo non trovato",
        )
    
    # Verifica se si tratta di un ruolo di sistema
    if role.name in ["admin", "parent", "student"] and role_data.name and role_data.name != role.name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Non puoi modificare il nome di un ruolo di sistema",
        )
    
    # Verifica se il nuovo nome del ruolo esiste già
    if role_data.name and role_data.name != role.name:
        if RoleRepository.get_by_name(db, role_data.name):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Nome ruolo già esistente",
            )
    
    # Aggiorna il ruolo
    updated_role = RoleRepository.update(db, role, role_data)
    
    return updated_role

@router.delete("/{role_id}")
async def delete_role(
    role_id: int = Path(..., gt=0),
    current_user: UserModel = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
) -> Any:
    """
    Elimina un ruolo (solo amministratori).
    """
    role = RoleRepository.get(db, role_id)
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ruolo non trovato",
        )
    
    # Verifica se si tratta di un ruolo di sistema
    if role.name in ["admin", "parent", "student"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Non puoi eliminare un ruolo di sistema",
        )
    
    # Elimina il ruolo
    success = RoleRepository.delete(db, role_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ruolo non trovato",
        )
    
    return {"detail": "Ruolo eliminato con successo"}
