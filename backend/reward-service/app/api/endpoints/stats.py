from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session

from app.db.base import get_db
from app.db.repositories.reward_repository import RewardRepository
from app.api.dependencies.auth import get_current_active_user

router = APIRouter()

@router.get("/{reward_id}", response_model=Dict[str, Any])
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
    # Verifica che la ricompensa esista
    reward = RewardRepository.get_by_id(db, reward_id)
    if not reward:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ricompensa con ID {reward_id} non trovata"
        )
    
    # Ottieni il conteggio delle assegnazioni
    assignments_count = RewardRepository.count_reward_assignments(db, reward_id)
    
    # Determina la disponibilità e la quantità rimanente
    # Se points_value è 0, consideriamo la ricompensa come illimitata
    quantity = None
    if hasattr(reward, 'requirements') and reward.requirements:
        if 'quantity' in reward.requirements:
            quantity = reward.requirements.get('quantity')
    
    stats = {
        "reward_id": reward_id,
        "total_assignments": assignments_count,
        "available": reward.is_active,
        "quantity": quantity,
        "quantity_remaining": None if quantity is None else max(0, quantity - assignments_count)
    }
    
    return stats
