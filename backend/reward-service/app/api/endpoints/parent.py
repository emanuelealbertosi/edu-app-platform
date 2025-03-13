from fastapi import APIRouter, Depends, HTTPException, Path, Body, Query, status
from typing import List, Optional, Any
from sqlalchemy.orm import Session

from app.api.dependencies.auth import get_current_user_with_role
from app.api.dependencies.database import get_db
from app.schemas.reward import PendingReward
from app.db.repositories.reward_repository import RewardRepository
from app.db.models.user import User as UserModel

router = APIRouter(tags=["parent"])

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

@router.put("/approve/{reward_id}")
async def approve_reward(
    reward_id: str,
    current_user: UserModel = Depends(get_current_user_with_role(["parent", "admin"])),
    db: Session = Depends(get_db)
) -> Any:
    """
    Approva una ricompensa in attesa.
    Solo genitori e admin possono accedere.
    """
    # In una implementazione reale, qui approveremmo la ricompensa
    # Per ora restituiamo un semplice messaggio di successo
    return {"message": "Ricompensa approvata con successo", "status": "success"}

@router.put("/reject/{reward_id}")
async def reject_reward(
    reward_id: str,
    current_user: UserModel = Depends(get_current_user_with_role(["parent", "admin"])),
    db: Session = Depends(get_db)
) -> Any:
    """
    Rifiuta una ricompensa in attesa.
    Solo genitori e admin possono accedere.
    """
    # In una implementazione reale, qui rifiuteremmo la ricompensa
    # Per ora restituiamo un semplice messaggio di successo
    return {"message": "Ricompensa rifiutata con successo", "status": "success"}

@router.get("/student/{student_id}/stats")
async def get_student_reward_stats(
    student_id: str,
    current_user: UserModel = Depends(get_current_user_with_role(["parent", "admin"])),
    db: Session = Depends(get_db)
) -> Any:
    """
    Recupera le statistiche sulle ricompense di uno studente specifico.
    Solo genitori e admin possono accedere.
    """
    # In una implementazione reale, qui dovremmo verificare che lo studente sia figlio del genitore
    # Per ora restituiamo dati fittizi
    return {
        "studentId": student_id,
        "availablePoints": 100,
        "totalPointsEarned": 150,
        "totalPointsSpent": 50,
        "redeemedRewards": 2,
        "availableRewards": 5,
        "recentRedemptions": [
            {"rewardTitle": "Gioco educativo", "date": "2025-03-01", "points": 30},
            {"rewardTitle": "Tempo extra per videogiochi", "date": "2025-02-15", "points": 20}
        ],
        "pendingRewards": 1
    }
