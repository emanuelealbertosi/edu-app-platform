from fastapi import APIRouter, Depends, HTTPException, Path, Body, Query, status
from typing import List, Optional, Any
from sqlalchemy.orm import Session

from app.api.dependencies.auth import get_current_user_with_role
from app.api.dependencies.database import get_db
from app.schemas.reward import RewardTemplate, RewardCreate, RewardUpdate, PendingReward
from app.db.repositories.reward_repository import RewardRepository
from app.db.models.user import User as UserModel

router = APIRouter(tags=["parent"])

@router.get("/templates", response_model=List[RewardTemplate])
async def get_parent_reward_templates(
    current_user: UserModel = Depends(get_current_user_with_role(["parent", "admin"])),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
) -> Any:
    """
    Recupera tutti i template di ricompensa disponibili per i genitori.
    Solo genitori e admin possono accedere.
    """
    return RewardRepository.get_templates(db, skip=skip, limit=limit)

@router.get("/pending", response_model=List[PendingReward])
async def get_pending_rewards(
    current_user: UserModel = Depends(get_current_user_with_role(["parent", "admin"])),
    db: Session = Depends(get_db)
) -> Any:
    """
    Recupera tutte le ricompense in attesa di approvazione per i figli del genitore.
    Solo genitori e admin possono accedere.
    """
    # In una implementazione reale, qui filtreremmo per i figli del genitore
    # Per ora restituiamo una lista vuota
    return []
