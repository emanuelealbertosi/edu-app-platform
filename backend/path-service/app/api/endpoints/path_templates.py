from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict

from app.db.base import get_db
from app.db.models.path import PathTemplate, PathNodeTemplate, PathCategory
from app.schemas.path import (
    PathTemplate as PathTemplateSchema,
    PathTemplateSummary,
    PathTemplateCreate,
    PathTemplateUpdate,
    PathNodeTemplate as PathNodeTemplateSchema,
    PathNodeTemplateCreate,
    PathNodeTemplateUpdate,
    PathCategory as PathCategorySchema,
    PathCategoryCreate,
    PathCategoryUpdate
)
from app.db.repositories.path_template_repository import PathTemplateRepository, PathCategoryRepository
from app.api.dependencies.auth import get_current_user, get_admin_user, get_admin_or_parent_user

router = APIRouter()

# Endpoint per le categorie dei percorsi
@router.get("/categories", response_model=List[PathCategorySchema])
async def get_path_categories(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: Dict = Depends(get_current_user)
):
    """Ottiene tutte le categorie dei percorsi."""
    return PathCategoryRepository.get_all(db, skip=skip, limit=limit)

@router.post("/categories", response_model=PathCategorySchema, status_code=status.HTTP_201_CREATED)
async def create_path_category(
    category: PathCategoryCreate,
    db: Session = Depends(get_db),
    current_user: Dict = Depends(get_admin_user)
):
    """Crea una nuova categoria di percorso (solo admin)."""
    # Verifica se esiste già una categoria con lo stesso nome
    existing_category = PathCategoryRepository.get_by_name(db, name=category.name)
    if existing_category:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Categoria con nome '{category.name}' già esistente"
        )
    
    return PathCategoryRepository.create(db, name=category.name, description=category.description)

@router.put("/categories/{category_id}", response_model=PathCategorySchema)
async def update_path_category(
    category_id: int,
    category: PathCategoryUpdate,
    db: Session = Depends(get_db),
    current_user: Dict = Depends(get_admin_user)
):
    """Aggiorna una categoria di percorso (solo admin)."""
    db_category = PathCategoryRepository.get(db, category_id=category_id)
    if not db_category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Categoria con ID {category_id} non trovata"
        )
    
    # Verifica se il nuovo nome è già utilizzato da un'altra categoria
    if category.name and category.name != db_category.name:
        existing_category = PathCategoryRepository.get_by_name(db, name=category.name)
        if existing_category and existing_category.id != category_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Categoria con nome '{category.name}' già esistente"
            )
    
    return PathCategoryRepository.update(
        db, 
        category_id=category_id, 
        name=category.name, 
        description=category.description
    )

@router.delete("/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_path_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_user: Dict = Depends(get_admin_user)
):
    """Elimina una categoria di percorso (solo admin)."""
    db_category = PathCategoryRepository.get(db, category_id=category_id)
    if not db_category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Categoria con ID {category_id} non trovata"
        )
    
    success = PathCategoryRepository.delete(db, category_id=category_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Errore durante l'eliminazione della categoria"
        )
    
    return None

# Endpoint per i template dei percorsi
@router.get("/", response_model=List[PathTemplateSummary])
async def get_path_templates(
    skip: int = 0,
    limit: int = 100,
    category_id: Optional[int] = None,
    created_by: Optional[str] = None,
    is_active: Optional[bool] = True,
    is_public: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: Dict = Depends(get_current_user)
):
    """
    Ottiene tutti i template dei percorsi con filtri opzionali.
    
    Gli admin vedono tutti i template.
    I genitori vedono solo i propri template e quelli pubblici.
    Gli studenti vedono solo i template pubblici.
    """
    # Filtra in base al ruolo dell'utente
    user_role = current_user.get("role")
    user_id = current_user.get("user_id")
    
    if user_role == "admin":
        # Gli admin vedono tutto
        pass
    elif user_role == "parent":
        # I genitori vedono i propri template e quelli pubblici
        if created_by is None:
            created_by = user_id
        else:
            # Se un genitore specifica un created_by diverso dal proprio ID,
            # deve vedere solo i template pubblici di quel creatore
            if created_by != user_id:
                is_public = True
    elif user_role == "student":
        # Gli studenti vedono solo i template pubblici
        is_public = True
    
    # Ottieni i template
    templates = PathTemplateRepository.get_all(
        db, 
        skip=skip, 
        limit=limit,
        category_id=category_id,
        created_by=created_by,
        is_active=is_active,
        is_public=is_public
    )
    
    # Aggiungi il conteggio dei nodi per ciascun template
    result = []
    for template in templates:
        template_dict = PathTemplateSummary.model_validate(template).model_dump()
        template_dict["node_count"] = PathTemplateRepository.count_nodes(db, template.id)
        result.append(PathTemplateSummary(**template_dict))
    
    return result

@router.post("/", response_model=PathTemplateSchema, status_code=status.HTTP_201_CREATED)
async def create_path_template(
    template: PathTemplateCreate,
    db: Session = Depends(get_db),
    current_user: Dict = Depends(get_admin_or_parent_user)
):
    """Crea un nuovo template di percorso (admin o genitori)."""
    # Imposta l'utente corrente come creatore
    template.created_by = current_user.get("user_id")
    template.created_by_role = current_user.get("role")
    
    # Verifica che la categoria esista se è specificata
    if template.category_id:
        category = PathCategoryRepository.get(db, category_id=template.category_id)
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Categoria con ID {template.category_id} non trovata"
            )
    
    # Crea il template
    return PathTemplateRepository.create(db, template)

@router.get("/{template_id}", response_model=PathTemplateSchema)
async def get_path_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: Dict = Depends(get_current_user)
):
    """Ottiene un template di percorso per ID."""
    template = PathTemplateRepository.get(db, path_template_id=template_id)
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Template di percorso con ID {template_id} non trovato"
        )
    
    # Controlla i permessi di accesso
    user_role = current_user.get("role")
    user_id = current_user.get("user_id")
    
    if user_role == "admin":
        # Gli admin vedono tutto
        pass
    elif user_role == "parent":
        # I genitori vedono i propri template e quelli pubblici
        if template.created_by != user_id and not template.is_public:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Non hai i permessi per visualizzare questo template"
            )
    elif user_role == "student":
        # Gli studenti vedono solo i template pubblici
        if not template.is_public:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Non hai i permessi per visualizzare questo template"
            )
    
    return template

@router.put("/{template_id}", response_model=PathTemplateSchema)
async def update_path_template(
    template_id: int,
    template_update: PathTemplateUpdate,
    db: Session = Depends(get_db),
    current_user: Dict = Depends(get_admin_or_parent_user)
):
    """Aggiorna un template di percorso (admin o proprietario)."""
    db_template = PathTemplateRepository.get(db, path_template_id=template_id)
    if not db_template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Template di percorso con ID {template_id} non trovato"
        )
    
    # Verifica che l'utente sia il proprietario o un admin
    user_role = current_user.get("role")
    user_id = current_user.get("user_id")
    
    if user_role != "admin" and db_template.created_by != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Non hai i permessi per modificare questo template"
        )
    
    # Verifica che la categoria esista se è stata cambiata
    if template_update.category_id and template_update.category_id != db_template.category_id:
        category = PathCategoryRepository.get(db, category_id=template_update.category_id)
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Categoria con ID {template_update.category_id} non trovata"
            )
    
    # Aggiorna il template
    return PathTemplateRepository.update(db, db_template, template_update)

@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_path_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: Dict = Depends(get_admin_or_parent_user)
):
    """Elimina un template di percorso (admin o proprietario)."""
    db_template = PathTemplateRepository.get(db, path_template_id=template_id)
    if not db_template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Template di percorso con ID {template_id} non trovato"
        )
    
    # Verifica che l'utente sia il proprietario o un admin
    user_role = current_user.get("role")
    user_id = current_user.get("user_id")
    
    if user_role != "admin" and db_template.created_by != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Non hai i permessi per eliminare questo template"
        )
    
    success = PathTemplateRepository.delete(db, path_template_id=template_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Errore durante l'eliminazione del template"
        )
    
    return None

# Endpoint per i nodi dei template
@router.get("/{template_id}/nodes", response_model=List[PathNodeTemplateSchema])
async def get_template_nodes(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: Dict = Depends(get_current_user)
):
    """Ottiene tutti i nodi di un template di percorso."""
    # Verifica che il template esista
    template = PathTemplateRepository.get(db, path_template_id=template_id)
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Template di percorso con ID {template_id} non trovato"
        )
    
    # Controlla i permessi di accesso
    user_role = current_user.get("role")
    user_id = current_user.get("user_id")
    
    if user_role == "admin":
        # Gli admin vedono tutto
        pass
    elif user_role == "parent":
        # I genitori vedono i propri template e quelli pubblici
        if template.created_by != user_id and not template.is_public:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Non hai i permessi per visualizzare questo template"
            )
    elif user_role == "student":
        # Gli studenti vedono solo i template pubblici
        if not template.is_public:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Non hai i permessi per visualizzare questo template"
            )
    
    return PathTemplateRepository.get_nodes(db, template_id)

import logging

# Configurazione logger
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@router.post("/{template_id}/nodes", response_model=PathNodeTemplateSchema, status_code=status.HTTP_201_CREATED)
async def create_template_node(
    template_id: int,
    node: PathNodeTemplateCreate,
    db: Session = Depends(get_db),
    current_user: Dict = Depends(get_admin_or_parent_user)
):
    """Aggiunge un nodo a un template di percorso (admin o proprietario)."""
    logger.info(f"Richiesta di creazione nodo per template_id: {template_id}")
    logger.info(f"Dati nodo ricevuti: {node}")
    logger.info(f"Utente corrente: {current_user}")
    
    try:
        # Verifica che il template esista
        template = PathTemplateRepository.get(db, path_template_id=template_id)
        if not template:
            logger.error(f"Template di percorso con ID {template_id} non trovato")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Template di percorso con ID {template_id} non trovato"
            )
        
        logger.info(f"Template trovato: {template.id} - {template.title}")
        
        # Verifica che l'utente sia il proprietario o un admin
        user_role = current_user.get("role")
        user_id = current_user.get("user_id")
        
        if user_role != "admin" and template.created_by != user_id:
            logger.error(f"Utente {user_id} con ruolo {user_role} non autorizzato a modificare il template {template.id}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Non hai i permessi per modificare questo template"
            )
        
        # Log prima di aggiungere il nodo
        logger.info(f"Creazione nodo in corso per template {template_id}. Tipo nodo: {node.node_type}")
        
        # Aggiunge il nodo
        result = PathTemplateRepository.add_node(db, template_id, node)
        
        # Log dopo l'aggiunta
        logger.info(f"Nodo creato con successo: ID={result.id}, UUID={result.uuid}")
        return result
    except Exception as e:
        logger.error(f"Errore durante la creazione del nodo: {str(e)}")
        raise

@router.put("/nodes/{node_id}", response_model=PathNodeTemplateSchema)
async def update_template_node(
    node_id: int,
    node_update: PathNodeTemplateUpdate,
    db: Session = Depends(get_db),
    current_user: Dict = Depends(get_admin_or_parent_user)
):
    """Aggiorna un nodo di un template di percorso (admin o proprietario)."""
    # Verifica che il nodo esista
    node = PathTemplateRepository.get_node(db, node_id=node_id)
    if not node:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Nodo con ID {node_id} non trovato"
        )
    
    # Ottieni il template associato
    template = PathTemplateRepository.get(db, path_template_id=node.path_template_id)
    
    # Verifica che l'utente sia il proprietario o un admin
    user_role = current_user.get("role")
    user_id = current_user.get("user_id")
    
    if user_role != "admin" and template.created_by != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Non hai i permessi per modificare questo nodo"
        )
    
    return PathTemplateRepository.update_node(db, node, node_update)

@router.delete("/nodes/{node_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_template_node(
    node_id: int,
    db: Session = Depends(get_db),
    current_user: Dict = Depends(get_admin_or_parent_user)
):
    """Elimina un nodo di un template di percorso (admin o proprietario)."""
    # Verifica che il nodo esista
    node = PathTemplateRepository.get_node(db, node_id=node_id)
    if not node:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Nodo con ID {node_id} non trovato"
        )
    
    # Ottieni il template associato
    template = PathTemplateRepository.get(db, path_template_id=node.path_template_id)
    
    # Verifica che l'utente sia il proprietario o un admin
    user_role = current_user.get("role")
    user_id = current_user.get("user_id")
    
    if user_role != "admin" and template.created_by != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Non hai i permessi per eliminare questo nodo"
        )
    
    success = PathTemplateRepository.delete_node(db, node_id=node_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Errore durante l'eliminazione del nodo"
        )
    
    return None
