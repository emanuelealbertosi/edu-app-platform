from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.models.path import (
    PathTemplate, PathNodeTemplate, PathCategory
)
from app.schemas.path import (
    PathTemplateCreate, PathTemplateUpdate,
    PathNodeTemplateCreate, PathNodeTemplateUpdate
)

class PathTemplateRepository:
    """Repository per la gestione dei template dei percorsi."""
    
    @staticmethod
    def get(db: Session, path_template_id: int) -> Optional[PathTemplate]:
        """Ottiene un template di percorso dal database per ID."""
        return db.query(PathTemplate).filter(PathTemplate.id == path_template_id).first()
    
    @staticmethod
    def get_by_uuid(db: Session, uuid: str) -> Optional[PathTemplate]:
        """Ottiene un template di percorso dal database per UUID."""
        return db.query(PathTemplate).filter(PathTemplate.uuid == uuid).first()
    
    @staticmethod
    def get_all(
        db: Session, 
        skip: int = 0, 
        limit: int = 100,
        category_id: Optional[int] = None,
        created_by: Optional[str] = None,
        created_by_role: Optional[str] = None,
        is_active: Optional[bool] = None,
        is_public: Optional[bool] = None
    ) -> List[PathTemplate]:
        """
        Ottiene tutti i template di percorso dal database con filtri opzionali.
        
        Args:
            db: Sessione del database
            skip: Numero di record da saltare
            limit: Numero massimo di record da restituire
            category_id: Filtra per categoria
            created_by: Filtra per creatore
            created_by_role: Filtra per ruolo del creatore
            is_active: Filtra per stato attivo/inattivo
            is_public: Filtra per visibilità pubblica/privata
        
        Returns:
            Lista di template di percorso
        """
        query = db.query(PathTemplate)
        
        # Applica i filtri se specificati
        if category_id is not None:
            query = query.filter(PathTemplate.category_id == category_id)
        
        if created_by is not None:
            query = query.filter(PathTemplate.created_by == created_by)
        
        if created_by_role is not None:
            query = query.filter(PathTemplate.created_by_role == created_by_role)
        
        if is_active is not None:
            query = query.filter(PathTemplate.is_active == is_active)
        
        if is_public is not None:
            query = query.filter(PathTemplate.is_public == is_public)
        
        # Ordina per data di creazione (più recenti prima)
        query = query.order_by(PathTemplate.created_at.desc())
        
        return query.offset(skip).limit(limit).all()
    
    @staticmethod
    def create(db: Session, path_template_create: PathTemplateCreate) -> PathTemplate:
        """Crea un nuovo template di percorso nel database."""
        # Estrai i nodi dal DTO di creazione
        nodes_data = path_template_create.nodes
        path_template_data = path_template_create.model_dump(exclude={"nodes"})
        
        # Crea il template del percorso
        db_path_template = PathTemplate(**path_template_data)
        db.add(db_path_template)
        db.commit()
        db.refresh(db_path_template)
        
        # Crea i nodi associati al template
        for node_data in nodes_data:
            node_data_dict = node_data.model_dump()
            
            # Crea il nodo
            db_node = PathNodeTemplate(**node_data_dict, path_template_id=db_path_template.id)
            db.add(db_node)
        
        db.commit()
        db.refresh(db_path_template)
        
        return db_path_template
    
    @staticmethod
    def update(db: Session, path_template: PathTemplate, path_template_update: PathTemplateUpdate) -> PathTemplate:
        """Aggiorna un template di percorso esistente nel database."""
        # Aggiorna solo i campi forniti
        update_data = path_template_update.model_dump(exclude_unset=True)
        
        for field, value in update_data.items():
            setattr(path_template, field, value)
        
        db.add(path_template)
        db.commit()
        db.refresh(path_template)
        
        return path_template
    
    @staticmethod
    def delete(db: Session, path_template_id: int) -> bool:
        """Elimina un template di percorso dal database."""
        path_template = db.query(PathTemplate).filter(PathTemplate.id == path_template_id).first()
        if path_template:
            db.delete(path_template)
            db.commit()
            return True
        return False
    
    @staticmethod
    def count_nodes(db: Session, path_template_id: int) -> int:
        """Conta il numero di nodi in un template di percorso."""
        return db.query(func.count(PathNodeTemplate.id)).filter(
            PathNodeTemplate.path_template_id == path_template_id
        ).scalar() or 0
    
    @staticmethod
    def add_node(db: Session, path_template_id: int, node_create: PathNodeTemplateCreate) -> PathNodeTemplate:
        """Aggiunge un nodo a un template di percorso."""
        node_data = node_create.dict()
        
        # Crea il nodo
        db_node = PathNodeTemplate(**node_data, path_template_id=path_template_id)
        db.add(db_node)
        db.commit()
        db.refresh(db_node)
        
        return db_node
    
    @staticmethod
    def update_node(db: Session, node: PathNodeTemplate, node_update: PathNodeTemplateUpdate) -> PathNodeTemplate:
        """Aggiorna un nodo di un template di percorso."""
        # Aggiorna solo i campi forniti
        update_data = node_update.dict(exclude_unset=True)
        
        for field, value in update_data.items():
            setattr(node, field, value)
        
        db.add(node)
        db.commit()
        db.refresh(node)
        
        return node
    
    @staticmethod
    def delete_node(db: Session, node_id: int) -> bool:
        """Elimina un nodo di un template di percorso."""
        node = db.query(PathNodeTemplate).filter(PathNodeTemplate.id == node_id).first()
        if node:
            db.delete(node)
            db.commit()
            return True
        return False
    
    @staticmethod
    def get_node(db: Session, node_id: int) -> Optional[PathNodeTemplate]:
        """Ottiene un nodo di un template di percorso."""
        return db.query(PathNodeTemplate).filter(PathNodeTemplate.id == node_id).first()
    
    @staticmethod
    def get_node_by_uuid(db: Session, uuid: str) -> Optional[PathNodeTemplate]:
        """Ottiene un nodo di un template di percorso per UUID."""
        return db.query(PathNodeTemplate).filter(PathNodeTemplate.uuid == uuid).first()
    
    @staticmethod
    def get_nodes(db: Session, path_template_id: int) -> List[PathNodeTemplate]:
        """Ottiene tutti i nodi di un template di percorso."""
        return db.query(PathNodeTemplate).filter(
            PathNodeTemplate.path_template_id == path_template_id
        ).order_by(PathNodeTemplate.order).all()

class PathCategoryRepository:
    """Repository per la gestione delle categorie dei percorsi."""
    
    @staticmethod
    def get(db: Session, category_id: int) -> Optional[PathCategory]:
        """Ottiene una categoria di percorso dal database per ID."""
        return db.query(PathCategory).filter(PathCategory.id == category_id).first()
    
    @staticmethod
    def get_by_name(db: Session, name: str) -> Optional[PathCategory]:
        """Ottiene una categoria di percorso dal database per nome."""
        return db.query(PathCategory).filter(PathCategory.name == name).first()
    
    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 100) -> List[PathCategory]:
        """Ottiene tutte le categorie di percorso dal database."""
        return db.query(PathCategory).offset(skip).limit(limit).all()
    
    @staticmethod
    def create(db: Session, name: str, description: Optional[str] = None) -> PathCategory:
        """Crea una nuova categoria di percorso nel database."""
        db_category = PathCategory(name=name, description=description)
        db.add(db_category)
        db.commit()
        db.refresh(db_category)
        return db_category
    
    @staticmethod
    def update(db: Session, category_id: int, name: Optional[str] = None, description: Optional[str] = None) -> Optional[PathCategory]:
        """Aggiorna una categoria di percorso esistente nel database."""
        db_category = db.query(PathCategory).filter(PathCategory.id == category_id).first()
        if db_category:
            if name is not None:
                db_category.name = name
            if description is not None:
                db_category.description = description
                
            db.add(db_category)
            db.commit()
            db.refresh(db_category)
            return db_category
        return None
    
    @staticmethod
    def delete(db: Session, category_id: int) -> bool:
        """Elimina una categoria di percorso dal database."""
        db_category = db.query(PathCategory).filter(PathCategory.id == category_id).first()
        if db_category:
            db.delete(db_category)
            db.commit()
            return True
        return False
