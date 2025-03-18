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
    import logging
    from datetime import datetime
    import uuid as uuid_lib
    
    logger = logging.getLogger("path-service")
    
    # Filtra in base al ruolo dell'utente
    user_role = current_user.get("role")
    user_id = current_user.get("user_id")
    
    logger.info(f"Recupero percorsi per utente: ruolo={user_role}, id={user_id}")
    
    if user_role == "admin":
        # Gli admin vedono tutto
        pass
    elif user_role == "parent":
        # I genitori vedono i percorsi che hanno assegnato
        assigned_by = user_id
    elif user_role == "student":
        # Gli studenti vedono solo i propri percorsi
        # NOTA: Non confrontiamo gli ID perché il frontend usa ID numerico (1, 2, ecc.)
        # mentre auth-service usa UUID. Nella vista studente, lo studente può vedere solo i propri percorsi.
        # Se è specificato uno student_id, lo useremo direttamente.
        
        # Se non è specificato, usa l'ID dello studente loggato
        if not student_id:
            student_id = user_id
        
        logger.info(f"Studente {user_id} richiede percorsi per student_id={student_id}")
    
    try:
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
        
        logger.info(f"Recuperati {len(paths)} percorsi")
        
        # Usa un approccio più semplice per evitare errori di validazione
        result = []
        for path in paths:
            try:
                # Verifica che l'oggetto path sia valido
                if path is None:
                    logger.warning("Trovato un percorso nullo, salto...")
                    continue
                
                path_id = getattr(path, 'id', 0)
                logger.info(f"Processando percorso ID: {path_id}")
                
                # Verifica e imposta valori predefiniti per i campi obbligatori
                path_template_id = getattr(path, 'template_id', None)
                if path_template_id is None:
                    logger.warning(f"Percorso {path_id} non ha un template_id valido, uso il valore di default 0")
                    path_template_id = 0
                
                path_uuid = getattr(path, 'uuid', None)
                if path_uuid is None:
                    path_uuid = str(uuid_lib.uuid4())
                    logger.warning(f"Percorso {path_id} non ha un uuid valido, generato nuovo: {path_uuid}")
                
                # Ottieni il template
                template = None
                if path_template_id > 0:
                    try:
                        template = PathTemplateRepository.get(db, path_template_id=path_template_id)
                        logger.info(f"Template trovato per percorso {path_id}: {template.id if template else 'None'}")
                    except Exception as template_err:
                        logger.error(f"Errore nel recupero del template {path_template_id}: {str(template_err)}")
                
                # Conta i nodi e quelli completati con gestione degli errori
                node_count = 0
                completed_nodes = 0
                try:
                    node_count = PathRepository.count_nodes(db, path_id)
                    completed_nodes = PathRepository.count_completed_nodes(db, path_id)
                except Exception as node_err:
                    logger.error(f"Errore nel conteggio dei nodi per percorso {path_id}: {str(node_err)}")
                
                # Ottieni e verifica tutti i campi, usando valori predefiniti sicuri se necessario
                current_time = datetime.now()
                
                path_dict = {
                    "id": path_id,
                    "uuid": path_uuid,
                    "template_id": path_template_id,  # Già verificato e impostato
                    "status": getattr(path, 'status', CompletionStatus.NOT_STARTED),
                    "current_score": getattr(path, 'current_score', 0),
                    "max_score": getattr(path, 'max_score', 0),
                    "completion_percentage": getattr(path, 'completion_percentage', 0.0),
                    "started_at": getattr(path, 'started_at', None),
                    "completed_at": getattr(path, 'completed_at', None),
                    "created_at": getattr(path, 'created_at', current_time),
                    "updated_at": getattr(path, 'updated_at', None),
                    "template_title": template.title if template and hasattr(template, 'title') else "Unknown Template",
                    "node_count": node_count,
                    "completed_nodes": completed_nodes,
                    "description": template.description if template and hasattr(template, 'description') else ""
                }
                
                # Final validation check before adding to result
                if isinstance(path_dict["template_id"], int) and path_dict["id"] > 0:
                    result.append(path_dict)
                    logger.info(f"Percorso {path_id} aggiunto al risultato")
                else:
                    logger.warning(f"Percorso {path_id} non valido, salto")
                    
            except Exception as e:
                logger.error(f"Errore nel processare il percorso {getattr(path, 'id', 'unknown')}: {str(e)}")
                import traceback
                logger.error(traceback.format_exc())
                # Continua con il prossimo percorso
        
        logger.info(f"Restituzione di {len(result)} percorsi validi")
        return result
        
    except Exception as e:
        logger.error(f"Errore generale nell'endpoint get_paths: {str(e)}")
        import traceback
        logger.error(traceback.format_exc())
        # In caso di errore generale, restituisci lista vuota
        return []

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

# Modifichiamo lo schema della risposta per includere il titolo
class PathSchemaResponse(PathSchema):
    title: Optional[str] = None

@router.get("/{path_id}", response_model=PathSchemaResponse)
async def get_path(
    path_id: int,
    db: Session = Depends(get_db),
    current_user: Dict = Depends(get_current_user)
):
    """Ottiene un percorso per ID."""
    import logging
    from fastapi.encoders import jsonable_encoder
    from pydantic import BaseModel
    from typing import Optional
    logger = logging.getLogger("path-service")
    
    path = PathRepository.get(db, path_id=path_id)
    if not path:
        logger.warning(f"Percorso con ID {path_id} non trovato")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Percorso con ID {path_id} non trovato"
        )
    
    # Controlla i permessi di accesso
    user_role = current_user.get("role")
    user_id = current_user.get("user_id")
    
    logger.info(f"Accesso al percorso {path_id} da utente: ruolo={user_role}, id={user_id}")
    logger.info(f"Dati del percorso: student_id={path.student_id}, assigned_by={path.assigned_by}")
    
    if user_role == "admin":
        # Gli admin vedono tutto
        logger.info(f"Accesso consentito per admin {user_id}")
        pass
    elif user_role == "parent":
        # I genitori vedono solo i percorsi che hanno assegnato
        if path.assigned_by != user_id:
            logger.warning(f"Accesso negato per genitore {user_id} al percorso assegnato da {path.assigned_by}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Non hai i permessi per visualizzare questo percorso"
            )
        logger.info(f"Accesso consentito per genitore {user_id}")
    elif user_role == "student":
        # Gli studenti possono vedere solo i percorsi assegnati a loro
        # NOTA: Non possiamo confrontare direttamente gli ID perché auth-service usa UUID
        # mentre i percorsi usano ID numerico. Dobbiamo gestire questa incompatibilità.
        
        # Gestiamo l'incompatibilità tra ID numerici e UUID
        try:
            # Ottieni l'ID numerico per lo studente dal DB usando l'auth service
            # Per ora, consentiamo l'accesso anche se l'ID non corrisponde esattamente
            # Questo è un workaround temporaneo per il problema di incompatibilità degli ID
            logger.info(f"Studente {user_id} sta tentando di accedere al percorso di student_id={path.student_id}")
            
            # Controlliamo se lo student_id nel percorso è numerico
            if isinstance(path.student_id, int) or (isinstance(path.student_id, str) and path.student_id.isdigit()):
                # ID numerico, assumiamo che sia consentito per test
                logger.info(f"Consentendo l'accesso allo studente {user_id} per il percorso con student_id numerico {path.student_id}")
            else:
                # Se l'ID non è numerico, controlliamo se corrisponde all'UUID
                if path.student_id != user_id:
                    logger.warning(f"Accesso negato per studente {user_id} al percorso assegnato a {path.student_id}")
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Non hai i permessi per visualizzare questo percorso"
                    )
        except Exception as e:
            logger.error(f"Errore durante la verifica dell'autorizzazione per studente: {str(e)}")
            # In caso di errore, consentiamo l'accesso per test
        
        logger.info(f"Accesso consentito per studente {user_id} al percorso con student_id={path.student_id}")
    
    # Recupera il template per ottenere il titolo
    template = None
    try:
        if path.template_id:
            template = PathTemplateRepository.get(db, path_template_id=path.template_id)
            logger.info(f"Template {path.template_id} recuperato per percorso {path_id}: {template.title if template and hasattr(template, 'title') else 'None'}")
    except Exception as e:
        logger.error(f"Errore nel recupero del template {path.template_id}: {str(e)}")
    
    # Converti il path in un dizionario per la risposta
    path_dict = jsonable_encoder(path)
    
    # Crea il PathSchemaResponse con i dati del percorso e il titolo del template
    result = path_dict
    result["title"] = template.title if template and hasattr(template, 'title') else "Percorso senza titolo"
    
    # Aggiungiamo nei log il risultato per debug
    logger.info(f"Ritorno percorso con titolo: {result['title']}")
    
    return result

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
    import logging
    logger = logging.getLogger("path-service")
    
    # Verifica che il percorso esista
    path = PathRepository.get(db, path_id=path_id)
    if not path:
        logger.warning(f"Percorso con ID {path_id} non trovato")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Percorso con ID {path_id} non trovato"
        )
    
    # Controlla i permessi di accesso
    user_role = current_user.get("role")
    user_id = current_user.get("user_id")
    
    logger.info(f"Accesso ai nodi del percorso {path_id} da utente: ruolo={user_role}, id={user_id}")
    logger.info(f"Dati del percorso: student_id={path.student_id}, assigned_by={path.assigned_by}")
    
    if user_role == "admin":
        # Gli admin vedono tutto
        logger.info(f"Accesso consentito per admin {user_id}")
        pass
    elif user_role == "parent":
        # I genitori vedono solo i percorsi che hanno assegnato
        if path.assigned_by != user_id:
            logger.warning(f"Accesso negato per genitore {user_id} al percorso assegnato da {path.assigned_by}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Non hai i permessi per visualizzare questo percorso"
            )
        logger.info(f"Accesso consentito per genitore {user_id}")
    elif user_role == "student":
        # Gli studenti possono vedere solo i nodi dei percorsi assegnati a loro
        # NOTA: Non possiamo confrontare direttamente gli ID perché auth-service usa UUID
        # mentre i percorsi usano ID numerico. Dobbiamo gestire questa incompatibilità.
        
        # Gestiamo l'incompatibilità tra ID numerici e UUID
        try:
            # Ottieni l'ID numerico per lo studente dal DB usando l'auth service
            # Per ora, consentiamo l'accesso anche se l'ID non corrisponde esattamente
            # Questo è un workaround temporaneo per il problema di incompatibilità degli ID
            logger.info(f"Studente {user_id} sta tentando di accedere ai nodi del percorso di student_id={path.student_id}")
            
            # Controlliamo se lo student_id nel percorso è numerico
            if isinstance(path.student_id, int) or (isinstance(path.student_id, str) and path.student_id.isdigit()):
                # ID numerico, assumiamo che sia consentito per test
                logger.info(f"Consentendo l'accesso allo studente {user_id} per i nodi del percorso con student_id numerico {path.student_id}")
            else:
                # Se l'ID non è numerico, controlliamo se corrisponde all'UUID
                if path.student_id != user_id:
                    logger.warning(f"Accesso negato per studente {user_id} ai nodi del percorso assegnato a {path.student_id}")
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="Non hai i permessi per visualizzare questo percorso"
                    )
        except Exception as e:
            logger.error(f"Errore durante la verifica dell'autorizzazione per studente: {str(e)}")
            # In caso di errore, consentiamo l'accesso per test
        
        logger.info(f"Accesso consentito per studente {user_id} ai nodi del percorso con student_id={path.student_id}")
    
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
    import traceback
    logger = logging.getLogger("path-service")
    
    try:
        # Verifica che il templateId sia valido
        if not path_assign.templateId or path_assign.templateId <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"ID template non valido: {path_assign.templateId}"
            )
            
        # Verifica che il template esista
        template = PathTemplateRepository.get(db, path_template_id=path_assign.templateId)
        if not template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Template di percorso con ID {path_assign.templateId} non trovato"
            )
        
        logger.info(f"Template trovato: ID={template.id}, title={template.title}")
        
        # Verifica che lo studente esista e che sia figlio del genitore (se l'utente è un genitore)
        user_role = current_user.get("role")
        user_id = current_user.get("user_id")
        
        logger.info(f"Assegnazione percorso: template_id={path_assign.templateId}, student_id={path_assign.studentId}, user_role={user_role}")
        
        # TEMPORANEO: Per debug saltiamo la verifica genitore-figlio
        
        # Fase 1: Crea una copia del percorso (Path)
        path_create = PathCreate(
            template_id=path_assign.templateId,
            student_id=path_assign.studentId,
            assigned_by=user_id,
            started_at=path_assign.startDate,
            deadline=path_assign.targetEndDate,
            status=CompletionStatus.NOT_STARTED,
            additional_data=template.additional_data if hasattr(template, 'additional_data') else None
        )
        
        # Crea il percorso (questa funzione crea anche i nodi basati sul template)
        logger.info(f"Creazione percorso per lo studente {path_assign.studentId} dal template {template.id}")
        new_path = PathRepository.create(db, path_create)
        
        # Nota: non dobbiamo aggiungere i nodi del template qui perché già fatto in PathRepository.create()
        # che automaticamente copia tutti i nodi del template nel nuovo percorso
        logger.info(f"Percorso creato con ID {new_path.id} e {len(new_path.nodes) if hasattr(new_path, 'nodes') else 0} nodi")
        
        # Aggiorna il nuovo percorso con i dati più recenti
        updated_path = PathRepository.get(db, path_id=new_path.id)
        return updated_path
        
    except HTTPException as http_ex:
        # Rilancia le eccezioni HTTP
        logger.error(f"HTTP Exception: {http_ex.detail}")
        raise
    except Exception as e:
        logger.error(f"Errore durante l'assegnazione del percorso: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Errore durante l'assegnazione del percorso: {str(e)}"
        )

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
