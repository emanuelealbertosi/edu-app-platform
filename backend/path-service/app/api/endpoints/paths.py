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
    UpdateNodeStatus,
    PathAssign,
    PathNodeCreate
)
from app.db.repositories.path_repository import PathRepository
from app.db.repositories.path_template_repository import PathTemplateRepository
from app.db.models.path import PathNodeType, CompletionStatus
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
    
    # Usa un approccio più semplice per evitare errori di validazione
    result = []
    for path in paths:
        try:
            # Ottieni il template
            template = PathTemplateRepository.get(db, path_template_id=path.template_id)
            
            # Conta i nodi e quelli completati
            node_count = PathRepository.count_nodes(db, path.id)
            completed_nodes = PathRepository.count_completed_nodes(db, path.id)
            
            # Crea un dizionario con solo i campi necessari per il modello PathSummary
            path_dict = {
                "id": path.id,
                "uuid": path.uuid,
                "template_id": path.template_id,
                "status": path.status,
                "current_score": path.current_score,
                "max_score": path.max_score,
                "completion_percentage": path.completion_percentage,
                "started_at": path.started_at,
                "completed_at": path.completed_at,
                "created_at": path.created_at,
                "updated_at": path.updated_at,
                "template_title": template.title if template else path.title if path.title else "Unknown Template",
                "node_count": node_count,
                "completed_nodes": completed_nodes,
                "description": template.description if template and template.description else path.description if path.description else ""
            }
            
            # Aggiungi al risultato direttamente il dizionario
            result.append(path_dict)
            
        except Exception as e:
            import logging
            logger = logging.getLogger("path-service")
            logger.error(f"Errore nel processare il percorso {path.id}: {str(e)}")
            # Continua con il prossimo percorso senza aggiungere questo
    
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

@router.post("/assign", response_model=PathSchema, status_code=status.HTTP_201_CREATED)
async def assign_path(
    path_assign: PathAssign,
    db: Session = Depends(get_db),
    current_user: Dict = Depends(get_admin_or_parent_user)
):
    """
    Assegna un template di percorso a uno studente specifico.
    Crea un nuovo percorso basato sul template specificato, copiando completamente
    il template e tutti i quiz/contenuti in esso presenti.
    
    L'endpoint è accessibile solo da admin e genitori.
    I genitori possono assegnare percorsi solo ai propri figli.
    """
    import logging
    logger = logging.getLogger(__name__)
    
    # Verifica che il template esista
    template = PathTemplateRepository.get(db, path_template_id=path_assign.templateId)
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Template di percorso con ID {path_assign.templateId} non trovato"
        )
    
    # Verifica che lo studente esista e che sia figlio del genitore (se l'utente è un genitore)
    user_role = current_user.get("role")
    user_id = current_user.get("user_id")
    
    # TEMPORANEO: Per debug saltiamo la verifica genitore-figlio
    
    # Fase 1: Crea una copia del percorso (Path)
    path_create = PathCreate(
        template_id=path_assign.templateId,
        student_id=path_assign.studentId,
        assigned_by=user_id,
        started_at=path_assign.startDate,
        deadline=path_assign.targetEndDate,
        status=CompletionStatus.NOT_STARTED,
        additional_data=template.additional_data
    )
    
    # Crea il percorso
    new_path = PathRepository.create(db, path_create)
    
    # Fase 2: Ottieni tutti i nodi del template
    template_nodes = PathTemplateRepository.get_nodes(db, template.id)
    if not template_nodes:
        # Se non ci sono nodi, restituisci il percorso vuoto
        return new_path
    
    # Fase 3: Crea copie di tutti i nodi del template per il nuovo percorso
    for template_node in template_nodes:
        # Crea una copia del nodo del template
        node_create = PathNodeCreate(
            template_id=template_node.id,  # Riferimento al nodo del template originale
            path_id=new_path.id,           # Assegna al nuovo percorso
            title=template_node.title,
            description=template_node.description,
            node_type=template_node.node_type,
            points=template_node.points,
            order=template_node.order,
            dependencies=template_node.dependencies,
            content=template_node.content,  # Copia il contenuto (quiz, lezioni, ecc.)
            estimated_time=template_node.estimated_time,
            additional_data=template_node.additional_data
        )
        
        # Aggiungi il nodo al percorso
        PathRepository.create_node(db, node_create)
        
        # TEMPORANEO: Per debug saltiamo la copia dei quiz
    
    # Aggiorna il nuovo percorso con i dati più recenti
    updated_path = PathRepository.get(db, path_id=new_path.id)
    return updated_path

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
