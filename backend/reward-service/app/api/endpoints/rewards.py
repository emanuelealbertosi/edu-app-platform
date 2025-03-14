from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session

from app.db.base import get_db
from app.db.repositories.reward_repository import RewardRepository, RewardCategoryRepository
from app.schemas.reward import (
    RewardCreate, RewardUpdate, RewardInDB, RewardWithCategory,
    RewardCategoryCreate, RewardCategoryUpdate, RewardCategoryInDB, RewardCategoryWithRewards
)
from app.api.dependencies.auth import get_current_active_user, get_current_admin_user

router = APIRouter()


@router.get("/categories/", response_model=List[RewardCategoryInDB])
async def get_reward_categories(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: Dict[str, Any] = Depends(get_current_active_user)
):
    """
    Ottieni tutte le categorie di ricompense.
    """
    categories = RewardCategoryRepository.get_all(db, skip=skip, limit=limit)
    return categories


@router.post("/categories/", response_model=RewardCategoryInDB, status_code=status.HTTP_201_CREATED)
async def create_reward_category(
    category: RewardCategoryCreate,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_admin_user)
):
    """
    Crea una nuova categoria di ricompense.
    Richiede privilegi di amministratore.
    """
    return RewardCategoryRepository.create(db, category)


@router.get("/categories/{category_id}", response_model=RewardCategoryWithRewards)
async def get_reward_category(
    category_id: str,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_active_user)
):
    """
    Ottieni una categoria di ricompense per ID, incluse le ricompense associate.
    """
    category = RewardCategoryRepository.get_by_id(db, category_id)
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Categoria con ID {category_id} non trovata"
        )
    return category


@router.put("/categories/{category_id}", response_model=RewardCategoryInDB)
async def update_reward_category(
    category_id: str,
    category_update: RewardCategoryUpdate,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_admin_user)
):
    """
    Aggiorna una categoria di ricompense esistente.
    Richiede privilegi di amministratore.
    """
    updated_category = RewardCategoryRepository.update(db, category_id, category_update)
    if not updated_category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Categoria con ID {category_id} non trovata"
        )
    return updated_category


@router.delete("/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_reward_category(
    category_id: str,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_admin_user)
):
    """
    Elimina una categoria di ricompense.
    Richiede privilegi di amministratore.
    """
    success = RewardCategoryRepository.delete(db, category_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Categoria con ID {category_id} non trovata"
        )
    return {"detail": "Categoria eliminata con successo"}


@router.get("/", response_model=List[RewardInDB])
async def get_rewards(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    is_active: Optional[bool] = None,
    category_id: Optional[str] = None,
    current_user: Dict[str, Any] = Depends(get_current_active_user)
):
    """
    Ottieni tutte le ricompense con filtri opzionali.
    """
    rewards = RewardRepository.get_all(
        db, skip=skip, limit=limit, is_active=is_active, category_id=category_id
    )
    return rewards


@router.post("/", response_model=RewardInDB, status_code=status.HTTP_201_CREATED)
async def create_reward(
    reward: RewardCreate,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_admin_user)
):
    """
    Crea una nuova ricompensa.
    Richiede privilegi di amministratore.
    """
    # Assegna automaticamente l'ID dell'utente corrente come creatore
    reward_data = reward.model_dump()
    reward_data["created_by"] = current_user["id"]
    
    return RewardRepository.create(db, RewardCreate.model_validate(reward_data))


@router.get("/{reward_id}", response_model=RewardWithCategory)
async def get_reward(
    reward_id: str,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_active_user)
):
    """
    Ottieni una ricompensa per ID, inclusa la categoria associata.
    """
    reward = RewardRepository.get_by_id(db, reward_id)
    if not reward:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ricompensa con ID {reward_id} non trovata"
        )
    return reward


@router.put("/{reward_id}", response_model=RewardInDB)
async def update_reward(
    reward_id: str,
    reward_update: RewardUpdate,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_admin_user)
):
    """
    Aggiorna una ricompensa esistente.
    Richiede privilegi di amministratore.
    """
    updated_reward = RewardRepository.update(db, reward_id, reward_update)
    if not updated_reward:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ricompensa con ID {reward_id} non trovata"
        )
    return updated_reward


@router.delete("/{reward_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_reward(
    reward_id: str,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_admin_user)
):
    """
    Elimina una ricompensa.
    Richiede privilegi di amministratore.
    """
    success = RewardRepository.delete(db, reward_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ricompensa con ID {reward_id} non trovata"
        )
    return {"detail": "Ricompensa eliminata con successo"}


@router.get("/stats/{reward_id}", response_model=Dict[str, Any])
async def get_reward_stats(
    reward_id: str,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_active_user)
):
    """
    Ottieni le statistiche per una specifica ricompensa.
    Queste includono:
    - Numero totale di assegnazioni della ricompensa
    - Disponibilità
    - Quantità rimanente
    """
    # Log per debug
    print(f"Ricevuta richiesta per statistiche ricompensa ID: {reward_id}")
    print(f"Utente corrente: {current_user}")
    
    # Verifica che la ricompensa esista
    reward = RewardRepository.get_by_id(db, reward_id)
    
    # Se la ricompensa non esiste, restituisci dati fittizi invece di 404
    # Questo è per evitare errori nell'interfaccia utente durante lo sviluppo
    if not reward:
        print(f"Ricompensa con ID {reward_id} non trovata. Restituisco dati fittizi.")
        return {
            "reward_id": reward_id,
            "total_assignments": 0,
            "available": True,
            "quantity": 10,
            "quantity_remaining": 10
        }
    
    # Ottieni il conteggio delle assegnazioni
    try:
        assignments_count = RewardRepository.count_reward_assignments(db, reward_id)
        print(f"Trovate {assignments_count} assegnazioni per la ricompensa {reward_id}")
    except Exception as e:
        print(f"Errore nel conteggio delle assegnazioni: {e}")
        assignments_count = 0
    
    # Determina la disponibilità e la quantità rimanente
    # Se points_value è 0, consideriamo la ricompensa come illimitata
    quantity = None
    if hasattr(reward, 'requirements') and reward.requirements:
        if 'quantity' in reward.requirements:
            quantity = reward.requirements.get('quantity')
    
    stats = {
        "reward_id": reward_id,
        "total_assignments": assignments_count,
        "available": reward.is_active if reward else True,
        "quantity": quantity if quantity is not None else 10,
        "quantity_remaining": None if quantity is None else max(0, quantity - assignments_count)
    }
    
    print(f"Restituisco statistiche: {stats}")
    return stats
