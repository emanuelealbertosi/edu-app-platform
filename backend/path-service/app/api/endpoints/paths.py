from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict
import requests

from app.db.base import get_db
from app.db.models.path import Path, PathNode, CompletionStatus
from app.schemas.path import (
    Path as PathSchema,
    PathSummary,
    PathCreate,
    PathUpdate,
    PathNode as PathNodeSchema,
    UpdateNodeStatus
)
from app.db.repositories.path_repository import PathRepository
from app.db.repositories.path_template_repository import PathTemplateRepository
from app.api.dependencies.auth import get_current_user, get_admin_user, get_parent_user, get_student_user, get_admin_or_parent_user
from app.core.config import settings

router = APIRouter()

@router.get("/", response_model=List[PathSummary])
async def get_paths(
    skip: int = 0,
    limit: int = 100,
    student_id: Optional[str] = None,
    assigned_by: Optional[str] = None,
    template_id: Optional[int] = None,
    status: Optional[CompletionStatus] = None,
    db: Session = Depends(get_db),
    current_user: Dict = Depends(get_current_user)
):
    """
    Ottiene tutti i percorsi con filtri opzionali.
    
    Gli admin vedono tutti i percorsi.
    I genitori vedono solo i percorsi che hanno assegnato.
    Gli studenti vedono solo i propri percorsi.
    """
    # Filtra in base al ruolo dell'utente
    user_role = current_user.get("role")
    user_id = current_user.get("user_id")
    
    if user_role == "admin":
        # Gli admin vedono tutto
        pass
    elif user_role == "parent":
        # I genitori vedono i percorsi che hanno assegnato
        assigned_by = user_id
    elif user_role == "student":
        # Gli studenti vedono solo i propri percorsi
        student_id = user_id
    
    # Ottieni i percorsi
    paths = PathRepository.get_all(
        db, 
        skip=skip, 
        limit=limit,
        student_id=student_id,
        assigned_by=assigned_by,
        template_id=template_id,
        status=status
    )
    
    # Aggiungi informazioni aggiuntive per ciascun percorso
    result = []
    for path in paths:
        # Ottieni il template
        template = PathTemplateRepository.get(db, path_template_id=path.template_id)
        
        # Conta i nodi e quelli completati
        node_count = PathRepository.count_nodes(db, path.id)
        completed_nodes = PathRepository.count_completed_nodes(db, path.id)
        
        # Crea il DTO di risposta
        path_dict = PathSummary.from_orm(path).dict()
        path_dict["template_title"] = template.title if template else "Unknown Template"
        path_dict["node_count"] = node_count
        path_dict["completed_nodes"] = completed_nodes
        
        result.append(PathSummary(**path_dict))
    
    return result

@router.post("/", response_model=PathSchema, status_code=status.HTTP_201_CREATED)
async def create_path(
    path: PathCreate,
    db: Session = Depends(get_db),
    current_user: Dict = Depends(get_admin_or_parent_user)
):
    """Crea un nuovo percorso per uno studente (admin o genitori)."""
    # Verifica che il template esista
    template = PathTemplateRepository.get(db, path_template_id=path.template_id)
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Template di percorso con ID {path.template_id} non trovato"
        )
    
    # Verifica che lo studente esista (chiama il servizio di autenticazione)
    try:
        auth_service_url = f"{settings.AUTH_SERVICE_URL}/api/users/{path.student_id}"
        response = requests.get(auth_service_url)
        
        if response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Studente con ID {path.student_id} non trovato"
            )
        
        # Verifica che l'utente sia effettivamente uno studente
        user_data = response.json()
        if user_data.get("role") != "student":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"L'utente con ID {path.student_id} non è uno studente"
            )
    except requests.RequestException:
        # In caso di errore di comunicazione, assumiamo che lo studente esista
        # Questo è un approccio semplificato; in produzione sarebbe meglio gestire l'errore in modo diverso
        pass
    
    # Se l'utente è un genitore, verifica che lo studente sia suo figlio
    user_role = current_user.get("role")
    user_id = current_user.get("user_id")
    
    if user_role == "parent":
        try:
            # Verifica che lo studente sia figlio del genitore
            auth_service_url = f"{settings.AUTH_SERVICE_URL}/api/users/{user_id}/children"
            response = requests.get(auth_service_url)
            
            if response.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Errore durante la verifica della relazione genitore-figlio"
                )
            
            children = response.json()
            if path.student_id not in [child.get("id") for child in children]:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Lo studente con ID {path.student_id} non è un figlio dell'utente corrente"
                )
        except requests.RequestException:
            # In caso di errore di comunicazione, assumiamo che la relazione sia valida
            # Questo è un approccio semplificato; in produzione sarebbe meglio gestire l'errore in modo diverso
            pass
    
    # Imposta l'utente corrente come assegnatore
    if path.assigned_by is None:
        path.assigned_by = user_id
    
    # Crea il percorso
    return PathRepository.create(db, path)

@router.get("/{path_id}", response_model=PathSchema)
async def get_path(
    path_id: int,
    db: Session = Depends(get_db),
    current_user: Dict = Depends(get_current_user)
):
    """Ottiene un percorso per ID."""
    path = PathRepository.get(db, path_id=path_id)
    if not path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Percorso con ID {path_id} non trovato"
        )
    
    # Controlla i permessi di accesso
    user_role = current_user.get("role")
    user_id = current_user.get("user_id")
    
    if user_role == "admin":
        # Gli admin vedono tutto
        pass
    elif user_role == "parent":
        # I genitori vedono solo i percorsi che hanno assegnato
        if path.assigned_by != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Non hai i permessi per visualizzare questo percorso"
            )
    elif user_role == "student":
        # Gli studenti vedono solo i propri percorsi
        if path.student_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Non hai i permessi per visualizzare questo percorso"
            )
    
    return path

@router.put("/{path_id}", response_model=PathSchema)
async def update_path(
    path_id: int,
    path_update: PathUpdate,
    db: Session = Depends(get_db),
    current_user: Dict = Depends(get_admin_or_parent_user)
):
    """Aggiorna un percorso (admin o genitore che ha assegnato il percorso)."""
    db_path = PathRepository.get(db, path_id=path_id)
    if not db_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Percorso con ID {path_id} non trovato"
        )
    
    # Verifica che l'utente sia chi ha assegnato il percorso o un admin
    user_role = current_user.get("role")
    user_id = current_user.get("user_id")
    
    if user_role != "admin" and db_path.assigned_by != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Non hai i permessi per modificare questo percorso"
        )
    
    # Aggiorna il percorso
    return PathRepository.update(db, db_path, path_update)

@router.delete("/{path_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_path(
    path_id: int,
    db: Session = Depends(get_db),
    current_user: Dict = Depends(get_admin_or_parent_user)
):
    """Elimina un percorso (admin o genitore che ha assegnato il percorso)."""
    db_path = PathRepository.get(db, path_id=path_id)
    if not db_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Percorso con ID {path_id} non trovato"
        )
    
    # Verifica che l'utente sia chi ha assegnato il percorso o un admin
    user_role = current_user.get("role")
    user_id = current_user.get("user_id")
    
    if user_role != "admin" and db_path.assigned_by != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Non hai i permessi per eliminare questo percorso"
        )
    
    success = PathRepository.delete(db, path_id=path_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Errore durante l'eliminazione del percorso"
        )
    
    return None

@router.get("/{path_id}/nodes", response_model=List[PathNodeSchema])
async def get_path_nodes(
    path_id: int,
    db: Session = Depends(get_db),
    current_user: Dict = Depends(get_current_user)
):
    """Ottiene tutti i nodi di un percorso."""
    # Verifica che il percorso esista
    path = PathRepository.get(db, path_id=path_id)
    if not path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Percorso con ID {path_id} non trovato"
        )
    
    # Controlla i permessi di accesso
    user_role = current_user.get("role")
    user_id = current_user.get("user_id")
    
    if user_role == "admin":
        # Gli admin vedono tutto
        pass
    elif user_role == "parent":
        # I genitori vedono solo i percorsi che hanno assegnato
        if path.assigned_by != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Non hai i permessi per visualizzare questo percorso"
            )
    elif user_role == "student":
        # Gli studenti vedono solo i propri percorsi
        if path.student_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Non hai i permessi per visualizzare questo percorso"
            )
    
    return PathRepository.get_nodes(db, path_id)

@router.post("/nodes/status", response_model=PathNodeSchema)
async def update_node_status(
    status_update: UpdateNodeStatus,
    db: Session = Depends(get_db),
    current_user: Dict = Depends(get_current_user)
):
    """
    Aggiorna lo stato di un nodo di un percorso.
    
    Gli admin e i genitori possono aggiornare lo stato di qualsiasi nodo.
    Gli studenti possono aggiornare solo lo stato dei nodi dei propri percorsi e
    solo per metterli in stato IN_PROGRESS (richiedono verifica).
    """
    # Verifica che il nodo esista
    node = PathRepository.get_node_by_uuid(db, status_update.node_uuid)
    if not node:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Nodo con UUID {status_update.node_uuid} non trovato"
        )
    
    # Ottieni il percorso associato
    path = PathRepository.get(db, path_id=node.path_id)
    
    # Controlla i permessi di accesso
    user_role = current_user.get("role")
    user_id = current_user.get("user_id")
    
    if user_role == "admin":
        # Gli admin possono aggiornare qualsiasi nodo in qualsiasi stato
        pass
    elif user_role == "parent":
        # I genitori possono aggiornare solo i nodi dei percorsi che hanno assegnato
        if path.assigned_by != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Non hai i permessi per aggiornare questo nodo"
            )
    elif user_role == "student":
        # Gli studenti possono aggiornare solo i nodi dei propri percorsi
        # e solo per metterli in stato IN_PROGRESS
        if path.student_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Non hai i permessi per aggiornare questo nodo"
            )
        
        if status_update.status != CompletionStatus.IN_PROGRESS:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Gli studenti possono solo mettere i nodi in stato 'in progress'"
            )
    
    # Aggiorna lo stato del nodo
    updated_node = PathRepository.update_node_status(db, status_update.node_uuid, status_update)
    if not updated_node:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Errore durante l'aggiornamento dello stato del nodo"
        )
    
    return updated_node
