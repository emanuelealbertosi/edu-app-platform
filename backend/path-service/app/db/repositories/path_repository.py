from typing import List, Optional, Dict, Any, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime

from app.db.models.path import (
    Path, PathNode, PathTemplate, PathNodeTemplate,
    CompletionStatus
)
from app.schemas.path import (
    PathCreate, PathUpdate,
    PathNodeCreate, PathNodeUpdate, UpdateNodeStatus
)

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
        # Ottieni il template del percorso
        template = db.query(PathTemplate).filter(PathTemplate.id == path_create.template_id).first()
        if not template:
            raise ValueError(f"Template di percorso con ID {path_create.template_id} non trovato")
        
        # Prepara i dati del percorso
        path_data = path_create.model_dump()
        
        # Crea il percorso
        db_path = Path(**path_data, max_score=template.points)
        db.add(db_path)
        db.commit()
        db.refresh(db_path)
        
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
        node = db.query(PathNode).filter(PathNode.uuid == node_uuid).first()
        if not node:
            return None
        
        # Aggiorna lo stato del nodo
        node.status = status_update.status
        
        # Se il nodo è stato completato, imposta la data di completamento
        if status_update.status == CompletionStatus.COMPLETED and not node.completed_at:
            node.completed_at = datetime.now()
        
        # Se il nodo è stato iniziato e non ha una data di inizio, imposta la data di inizio
        if status_update.status == CompletionStatus.IN_PROGRESS and not node.started_at:
            node.started_at = datetime.now()
        
        # Aggiorna il punteggio se fornito
        if status_update.score is not None:
            node.score = status_update.score
        
        # Aggiorna il feedback se fornito
        if status_update.feedback is not None:
            node.feedback = status_update.feedback
        
        db.add(node)
        db.commit()
        db.refresh(node)
        
        # Aggiorna lo stato e i punteggi del percorso
        PathRepository._update_path_status(db, node.path_id)
        
        return node
    
    @staticmethod
    def _update_path_status(db: Session, path_id: int) -> None:
        """
        Aggiorna lo stato e i punteggi di un percorso in base allo stato dei suoi nodi.
        
        Args:
            db: Sessione del database
            path_id: ID del percorso da aggiornare
        """
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
        
        # Determina lo stato del percorso
        if completed_nodes == total_nodes:
            path.status = CompletionStatus.COMPLETED
            path.completed_at = datetime.now()
        elif completed_nodes > 0:
            path.status = CompletionStatus.IN_PROGRESS
            if not path.started_at:
                path.started_at = datetime.now()
        else:
            path.status = CompletionStatus.NOT_STARTED
        
        db.add(path)
        db.commit()
