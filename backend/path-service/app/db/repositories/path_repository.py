from typing import List, Optional, Dict, Any, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
import requests
import os

from app.db.models.path import (
    Path, PathNode, PathTemplate, PathNodeTemplate,
    CompletionStatus
)
from app.schemas.path import (
    PathCreate, PathUpdate,
    PathNodeCreate, PathNodeUpdate, UpdateNodeStatus
)
from app.core.config import settings

class PathRepository:
    """Repository per la gestione dei percorsi educativi."""
    
    @staticmethod
    def get(db: Session, path_id: int) -> Optional[Path]:
        """Ottiene un percorso dal database per ID."""
        return db.query(Path).filter(Path.id == path_id).first()
    
    @staticmethod
    def get_by_uuid(db: Session, uuid: str) -> Optional[Path]:
        """Ottiene un percorso dal database per UUID."""
        return db.query(Path).filter(Path.uuid == uuid).first()
    
    @staticmethod
    def get_all(
        db: Session, 
        skip: int = 0, 
        limit: int = 100,
        student_id: Optional[str] = None,
        assigned_by: Optional[str] = None,
        template_id: Optional[int] = None,
        status: Optional[CompletionStatus] = None
    ) -> List[Path]:
        """
        Ottiene tutti i percorsi dal database con filtri opzionali.
        
        Args:
            db: Sessione del database
            skip: Numero di record da saltare
            limit: Numero massimo di record da restituire
            student_id: Filtra per studente
            assigned_by: Filtra per chi ha assegnato il percorso
            template_id: Filtra per template di percorso
            status: Filtra per stato del percorso
        
        Returns:
            Lista di percorsi
        """
        query = db.query(Path)
        
        # Applica i filtri se specificati
        if student_id is not None:
            query = query.filter(Path.student_id == student_id)
        
        if assigned_by is not None:
            query = query.filter(Path.assigned_by == assigned_by)
        
        if template_id is not None:
            query = query.filter(Path.template_id == template_id)
        
        if status is not None:
            query = query.filter(Path.status == status)
        
        # Ordina per data di creazione (più recenti prima)
        query = query.order_by(Path.created_at.desc())
        
        return query.offset(skip).limit(limit).all()
    
    @staticmethod
    def create(db: Session, path_create: PathCreate) -> Path:
        """Crea un nuovo percorso nel database partendo da un template."""
        import logging
        logger = logging.getLogger("path-service")
        
        try:
            # Ottieni il template del percorso
            template = db.query(PathTemplate).filter(PathTemplate.id == path_create.template_id).first()
            if not template:
                error_msg = f"Template di percorso con ID {path_create.template_id} non trovato"
                logger.error(error_msg)
                raise ValueError(error_msg)
            
            # Prepara i dati del percorso
            path_data = path_create.model_dump()
            logger.debug(f"Dati percorso preparati: {path_data}")
            
            # Rimuove campi che non appartengono al modello Path
            if 'title' in path_data:
                path_data.pop('title')
            if 'description' in path_data:
                path_data.pop('description')
            
            logger.debug(f"Dati percorso filtrati: {path_data}")
            
            # Crea il percorso
            db_path = Path(**path_data, max_score=template.points)
            logger.debug("Oggetto percorso creato")
            db.add(db_path)
            logger.debug("Oggetto percorso aggiunto alla sessione")
            
            try:
                db.commit()
                logger.debug("Commit eseguito")
            except Exception as e:
                logger.error(f"Errore durante il commit: {str(e)}")
                db.rollback()
                logger.debug("Rollback eseguito")
                raise
            
            try:
                db.refresh(db_path)
                logger.debug("Refresh eseguito")
            except Exception as e:
                logger.error(f"Errore durante il refresh: {str(e)}")
                raise
        except Exception as e:
            logger.error(f"Errore durante la creazione del percorso: {str(e)}")
            import traceback
            logger.error(traceback.format_exc())
            raise
        
        # Ottieni tutti i nodi del template
        template_nodes = db.query(PathNodeTemplate).filter(
            PathNodeTemplate.path_template_id == template.id
        ).order_by(PathNodeTemplate.order).all()
        
        # Crea i nodi del percorso basati sui nodi del template
        for template_node in template_nodes:
            node_data = {
                "title": template_node.title,
                "description": template_node.description,
                "node_type": template_node.node_type,
                "points": template_node.points,
                "order": template_node.order,
                "dependencies": template_node.dependencies,
                "content": template_node.content,
                "estimated_time": template_node.estimated_time,
                "additional_data": template_node.additional_data,
                "template_id": template_node.id,
                "path_id": db_path.id,
                "status": CompletionStatus.NOT_STARTED
            }
            
            # Se il nodo è di tipo QUIZ, metti il quiz_template_id come resource_id
            if template_node.node_type.value == "quiz" and template_node.content and "quiz_template_id" in template_node.content:
                node_data["resource_id"] = template_node.content["quiz_template_id"]
            
            # Crea il nodo
            db_node = PathNode(**node_data)
            db.add(db_node)
        
        db.commit()
        db.refresh(db_path)
        
        return db_path
    
    @staticmethod
    def update(db: Session, path: Path, path_update: PathUpdate) -> Path:
        """Aggiorna un percorso esistente nel database."""
        # Aggiorna solo i campi forniti
        update_data = path_update.model_dump(exclude_unset=True)
        
        for field, value in update_data.items():
            setattr(path, field, value)
        
        db.add(path)
        db.commit()
        db.refresh(path)
        
        return path
    
    @staticmethod
    def delete(db: Session, path_id: int) -> bool:
        """Elimina un percorso dal database."""
        path = db.query(Path).filter(Path.id == path_id).first()
        if path:
            db.delete(path)
            db.commit()
            return True
        return False
    
    @staticmethod
    def count_nodes(db: Session, path_id: int) -> int:
        """Conta il numero di nodi in un percorso."""
        return db.query(func.count(PathNode.id)).filter(
            PathNode.path_id == path_id
        ).scalar() or 0
    
    @staticmethod
    def count_completed_nodes(db: Session, path_id: int) -> int:
        """Conta il numero di nodi completati in un percorso."""
        return db.query(func.count(PathNode.id)).filter(
            PathNode.path_id == path_id,
            PathNode.status == CompletionStatus.COMPLETED
        ).scalar() or 0
    
    @staticmethod
    def get_node(db: Session, node_id: int) -> Optional[PathNode]:
        """Ottiene un nodo di un percorso."""
        return db.query(PathNode).filter(PathNode.id == node_id).first()
    
    @staticmethod
    def get_node_by_uuid(db: Session, uuid: str) -> Optional[PathNode]:
        """Ottiene un nodo di un percorso per UUID."""
        return db.query(PathNode).filter(PathNode.uuid == uuid).first()
    
    @staticmethod
    def get_nodes(db: Session, path_id: int) -> List[PathNode]:
        """Ottiene tutti i nodi di un percorso."""
        return db.query(PathNode).filter(
            PathNode.path_id == path_id
        ).order_by(PathNode.order).all()
    
    @staticmethod
    def create_node(db: Session, node_create: PathNodeCreate) -> PathNode:
        """
        Crea un nuovo nodo per un percorso specifico.
        
        Args:
            db: Sessione del database
            node_create: Dati per la creazione del nodo
            
        Returns:
            Il nodo creato
        """
        import logging
        import traceback
        logger = logging.getLogger("path-service")
        
        try:
            # Log dettagliato
            logger.debug(f"Creazione nodo con dati: {node_create.model_dump_json()}")
            
            # Prepara i dati del nodo
            node_data = node_create.model_dump()
            logger.debug(f"Dati nodo preparati")
            
            # Imposta lo stato iniziale a NOT_STARTED
            node_data["status"] = CompletionStatus.NOT_STARTED
            
            # Crea il nodo
            db_node = PathNode(**node_data)
            logger.debug("Oggetto nodo creato")
            
            db.add(db_node)
            logger.debug("Oggetto nodo aggiunto alla sessione")
            
            try:
                db.commit()
                logger.debug("Commit eseguito")
            except Exception as e:
                logger.error(f"Errore durante il commit del nodo: {str(e)}")
                db.rollback()
                logger.debug("Rollback eseguito")
                raise
            
            try:
                db.refresh(db_node)
                logger.debug("Refresh eseguito")
            except Exception as e:
                logger.error(f"Errore durante il refresh del nodo: {str(e)}")
                raise
            
            return db_node
            
        except Exception as e:
            logger.error(f"Errore durante la creazione del nodo: {str(e)}")
            logger.error(traceback.format_exc())
            raise
        
    @staticmethod
    def update_node_status(db: Session, node_uuid: str, status_update: UpdateNodeStatus) -> Optional[PathNode]:
        """
        Aggiorna lo stato di un nodo di un percorso.
        
        Args:
            db: Sessione del database
            node_uuid: UUID del nodo da aggiornare
            status_update: Dati di aggiornamento dello stato
        
        Returns:
            Il nodo aggiornato se trovato, altrimenti None
        """
        import logging
        import traceback
        logger = logging.getLogger("path-service")
        
        try:
            logger.info(f"Aggiornamento stato nodo: uuid={node_uuid}")
            logger.info(f"PAYLOAD RICEVUTO: {status_update.model_dump()}")
            
            node = db.query(PathNode).filter(PathNode.uuid == node_uuid).first()
            if not node:
                logger.error(f"Nodo con UUID {node_uuid} non trovato nel database")
                return None
            
            logger.info(f"Nodo trovato: id={node.id}, path_id={node.path_id}, stato attuale={node.status}, già completato={node.completed_at is not None}")
            
            # Se il nodo è già completato e il flag already_completed è True,
            # non aggiorniamo punteggio e stato (per evitare assegnazioni multiple)
            already_completed = getattr(status_update, 'already_completed', False)
            
            if node.status == CompletionStatus.COMPLETED and node.completed_at and already_completed:
                logger.warning(f"Nodo già completato e flag already_completed=True. Non verranno assegnati nuovi punti.")
                logger.warning(f"Score ricevuto ma non accreditato: {status_update.score}")
                
                # Aggiorna solo il feedback se fornito
                if status_update.feedback is not None:
                    node.feedback = status_update.feedback
                    logger.info(f"Feedback aggiornato: {node.feedback}")
                    # Salva solo l'aggiornamento del feedback
                    db.add(node)
                    db.commit()
                    db.refresh(node)
                
                return node
            
            # Aggiorna lo stato del nodo
            old_status = node.status
            node.status = status_update.status
            logger.info(f"Stato nodo aggiornato: {old_status} -> {node.status}")
            
            # Se il nodo è stato completato, imposta la data di completamento
            if status_update.status == CompletionStatus.COMPLETED and not node.completed_at:
                node.completed_at = datetime.now()
                logger.info(f"Impostata data di completamento: {node.completed_at}")
            
            # Se il nodo è stato iniziato e non ha una data di inizio, imposta la data di inizio
            if status_update.status == CompletionStatus.IN_PROGRESS and not node.started_at:
                node.started_at = datetime.now()
                logger.info(f"Impostata data di inizio: {node.started_at}")
            
            # Aggiorna il punteggio se fornito
            if status_update.score is not None:
                old_score = node.score
                node.score = status_update.score
                logger.info(f"Punteggio aggiornato: {old_score} -> {node.score}")
            
            # Aggiorna il feedback se fornito
            if status_update.feedback is not None:
                node.feedback = status_update.feedback
                logger.info(f"Feedback aggiornato: {node.feedback}")
            
            try:
                logger.info("Salvataggio modifiche del nodo nel database...")
                db.add(node)
                db.commit()
                db.refresh(node)
                logger.info("Nodo aggiornato con successo nel database")
            except Exception as db_error:
                logger.error(f"Errore durante il salvataggio del nodo: {str(db_error)}")
                logger.error(traceback.format_exc())
                db.rollback()
                raise
            
            # Aggiorna lo stato e i punteggi del percorso
            logger.info(f"Aggiornamento stato percorso: path_id={node.path_id}")
            PathRepository._update_path_status(db, node.path_id)
            
            return node
        except Exception as e:
            logger.error(f"Errore durante l'aggiornamento dello stato del nodo: {str(e)}")
            logger.error(traceback.format_exc())
            return None
    
    @staticmethod
    def _update_path_status(db: Session, path_id: int) -> None:
        """
        Aggiorna lo stato e i punteggi di un percorso in base allo stato dei suoi nodi.
        
        Args:
            db: Sessione del database
            path_id: ID del percorso da aggiornare
        """
        import logging
        import traceback
        import requests
        import os
        from app.core.config import settings
        
        logger = logging.getLogger("path-service")
        
        path = db.query(Path).filter(Path.id == path_id).first()
        if not path:
            return
        
        # Ottieni tutti i nodi del percorso
        nodes = db.query(PathNode).filter(PathNode.path_id == path_id).all()
        total_nodes = len(nodes)
        
        if total_nodes == 0:
            return
        
        # Calcola il numero di nodi completati
        completed_nodes = sum(1 for node in nodes if node.status == CompletionStatus.COMPLETED)
        
        # Calcola il punteggio attuale
        current_score = sum(node.score for node in nodes if node.status == CompletionStatus.COMPLETED)
        
        # Calcola la percentuale di completamento
        completion_percentage = (completed_nodes / total_nodes) * 100 if total_nodes > 0 else 0
        
        # Aggiorna i dati del percorso
        path.current_score = current_score
        path.completion_percentage = completion_percentage
        
        # Verifica se il percorso è stato appena completato
        just_completed = False
        
        # Determina lo stato del percorso
        if completed_nodes == total_nodes:
            if path.status != CompletionStatus.COMPLETED:
                just_completed = True
                logger.info(f"PERCORSO COMPLETATO! ID={path.id}, student_id={path.student_id}, score={current_score}")
            
            path.status = CompletionStatus.COMPLETED
            if not path.completed_at:
                path.completed_at = datetime.now()
        elif completed_nodes > 0:
            path.status = CompletionStatus.IN_PROGRESS
            if not path.started_at:
                path.started_at = datetime.now()
        else:
            path.status = CompletionStatus.NOT_STARTED
        
        # Salva le modifiche
        db.add(path)
        db.commit()
        
        # Notifica il reward service se il percorso è stato appena completato
        if just_completed:
            try:
                # Ottieni l'URL del reward service dalle impostazioni
                reward_service_url = settings.REWARD_SERVICE_URL
                
                # Prepara i dati per il reward service
                payload = {
                    "student_id": path.student_id,
                    "path_id": path.id,
                    "points": current_score,
                    "type": "path_completion",
                    "title": f"Percorso completato: {path.title or 'Senza titolo'}",
                    "description": f"Hai completato un percorso e guadagnato {current_score} punti!"
                }
                
                # Prepara gli headers con autenticazione di servizio
                headers = {
                    "X-Service-Role": "path_service",
                    "X-Service-Token": settings.SERVICE_TOKEN,
                    "Content-Type": "application/json"
                }
                
                # URL completo dell'endpoint
                url = f"{reward_service_url}/api/rewards/assign"
                
                logger.info(f"Invio notifica al reward service: URL={url}, payload={payload}")
                
                # Invia la richiesta al reward service
                response = requests.post(url, json=payload, headers=headers, timeout=5)
                
                # Log della risposta
                if response.status_code == 200:
                    logger.info(f"Risposta dal reward service: {response.json()}")
                else:
                    logger.error(f"Errore nella risposta dal reward service: status={response.status_code}, response={response.text}")
            
            except Exception as e:
                logger.error(f"Errore durante la chiamata al reward service: {str(e)}")
                logger.error(traceback.format_exc())
