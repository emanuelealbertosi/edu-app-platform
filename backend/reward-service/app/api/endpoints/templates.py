from fastapi import APIRouter, Depends, HTTPException, Path, Body, Query, status, Request
import logging

# Configurazione logger per debug
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
from typing import List, Optional, Any, Dict
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.api.dependencies.auth import get_current_user_with_role
from app.api.dependencies.database import get_db
from app.schemas.reward import RewardTemplate, RewardCreate, RewardUpdate
from app.db.repositories.reward_repository import RewardRepository
from app.db.models.user import User as UserModel
from app.db.models.reward import RewardType, RewardRarity

# Schema semplificato per adattarsi al frontend
class TemplateCreateRequest(BaseModel):
    title: str  # Il frontend utilizza 'title' invece di 'name' 
    description: Optional[str] = None
    points_value: Optional[int] = 10
    image_url: Optional[str] = None
    icon_url: Optional[str] = None

# Non impostiamo un prefisso qui perché viene aggiunto da app.include_router() in main.py
router = APIRouter(tags=["reward_templates"])

@router.get("/", response_model=List[RewardTemplate])
async def get_reward_templates(
    current_user: Dict = Depends(get_current_user_with_role(["parent", "admin", "student"])),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
) -> Any:
    """
    Recupera tutti i template di ricompensa disponibili.
    Tutti gli utenti autenticati possono visualizzare i template.
    """
    return RewardRepository.get_all(db, skip=skip, limit=limit, is_active=True)

@router.post("/", response_model=RewardTemplate, status_code=status.HTTP_201_CREATED)
async def create_reward_template(
    request: Request,
    template_data: TemplateCreateRequest,
    current_user: Dict = Depends(get_current_user_with_role(["parent", "admin"])),
    db: Session = Depends(get_db)
) -> Any:
    # Log per debug
    logger.info(f"POST /api/templates/ chiamato. URL: {request.url}, Method: {request.method}")
    """
    Crea un nuovo template di ricompensa.
    Solo genitori e admin possono creare template.
    """
    # Log per debug
    logger.info(f"POST /api/templates/ chiamato. URL: {request.url}, Method: {request.method}")
    
    # Converti il formato frontend nel formato atteso dal backend
    reward_data = {
        "name": template_data.title, # Converti 'title' in 'name'
        "description": template_data.description,
        "points_value": template_data.points_value or 10,
        "image_url": template_data.image_url,
        "icon_url": template_data.icon_url,
        "reward_type": RewardType.BADGE, # Utilizziamo BADGE come tipo predefinito per i template
        "rarity": RewardRarity.COMMON, # Imposta la rarità predefinita
        "created_by": current_user["id"], # Utilizziamo l'ID dell'utente corrente
        "category_id": "f7e228cd-c6c7-424b-8129-eff04af1ab4f", # ID valido per la categoria Badge
        "is_active": True,
        "is_public": True
    }
    
    # Crea il template di ricompensa
    template = RewardRepository.create(db, RewardCreate.model_validate(reward_data))
    return template

@router.get("/{template_id}", response_model=RewardTemplate)
async def get_reward_template(
    template_id: str,
    current_user: Dict = Depends(get_current_user_with_role(["parent", "admin", "student"])),
    db: Session = Depends(get_db)
) -> Any:
    """
    Recupera un template di ricompensa specifico per ID.
    Tutti gli utenti autenticati possono visualizzare i template.
    """
    template = RewardRepository.get_by_id(db, template_id)
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Template di ricompensa con ID {template_id} non trovato"
        )
    return template

@router.put("/{template_id}", response_model=RewardTemplate)
async def update_reward_template(
    template_id: str,
    template_data: RewardUpdate,
    current_user: Dict = Depends(get_current_user_with_role(["parent", "admin"])),
    db: Session = Depends(get_db)
) -> Any:
    """
    Aggiorna un template di ricompensa esistente.
    Solo i creatori del template o gli admin possono modificarlo.
    """
    # Verifica che il template esista
    existing_template = RewardRepository.get_by_id(db, template_id)
    if not existing_template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Template di ricompensa con ID {template_id} non trovato"
        )
    
    # Solo il creatore o un admin può modificare il template
    user_roles = [role["name"] for role in current_user.get("roles", [])]
    if str(existing_template.created_by) != str(current_user["id"]) and "admin" not in user_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Non hai il permesso di modificare questo template"
        )
    
    # Aggiorna il template
    updated_template = RewardRepository.update(db, template_id, template_data)
    return updated_template

@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT, response_model=None)
async def delete_reward_template(
    template_id: str,
    current_user: Dict = Depends(get_current_user_with_role(["parent", "admin"])),
    db: Session = Depends(get_db)
) -> None:
    """
    Elimina un template di ricompensa.
    Solo i creatori del template o gli admin possono eliminarlo.
    """
    # Verifica che il template esista
    existing_template = RewardRepository.get_by_id(db, template_id)
    if not existing_template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Template di ricompensa con ID {template_id} non trovato"
        )
    
    # Solo il creatore o un admin può eliminare il template
    user_roles = [role["name"] for role in current_user.get("roles", [])]
    if str(existing_template.created_by) != str(current_user["id"]) and "admin" not in user_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Non hai il permesso di eliminare questo template"
        )
    
    # Elimina il template
    success = RewardRepository.delete(db, template_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Si è verificato un errore durante l'eliminazione del template"
        )
    
    # Con status code 204 NO_CONTENT non dobbiamo ritornare alcun contenuto
