from fastapi import APIRouter, Depends, HTTPException, Path, Body, Query, status
from typing import List, Optional, Any
from sqlalchemy.orm import Session

from app.api.dependencies.auth import get_current_user_with_role
from app.api.dependencies.database import get_db
from app.schemas.reward import PendingReward, RewardRequestWithReward
from app.db.repositories.reward_repository import RewardRepository, RewardRequestRepository
from app.db.models.user import User as UserModel

router = APIRouter(tags=["parent"])

@router.get("/pending", response_model=List[RewardRequestWithReward])
async def get_pending_rewards(
    current_user: UserModel = Depends(get_current_user_with_role(["parent", "admin"])),
    db: Session = Depends(get_db)
) -> Any:
    """
    Recupera tutte le ricompense in attesa di approvazione per i figli del genitore.
    Solo genitori e admin possono accedere.
    """
    # Per gli admin, restituiamo tutte le richieste in attesa
    if current_user.get('role') == "admin":
        # Qui potremmo implementare un filtro opzionale
        pending_requests = RewardRequestRepository.get_by_parent_id(db, parent_id=current_user.get('id'))
    else:
        # Per i genitori, restituiamo solo le loro richieste in attesa
        pending_requests = RewardRequestRepository.get_pending_by_parent_id(db, parent_id=current_user.get('id'))
    
    # Carichiamo le informazioni complete delle ricompense per ogni richiesta
    result = []
    for request in pending_requests:
        # Recuperiamo i dettagli della ricompensa
        reward = RewardRepository.get_by_id(db, request.reward_id)
        if reward:
            # Impostiamo manualmente la relazione per l'output
            request.reward = reward
            result.append(request)
    
    return result

@router.put("/approve/{request_id}")
async def approve_reward(
    request_id: str,
    current_user: UserModel = Depends(get_current_user_with_role(["parent", "admin"])),
    db: Session = Depends(get_db)
) -> Any:
    """
    Approva una richiesta di ricompensa in attesa.
    Solo genitori e admin possono accedere.
    """
    # Recupera la richiesta di ricompensa
    request = RewardRequestRepository.get_by_id(db, request_id)
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Richiesta di ricompensa non trovata"
        )
    
    # Verifica che l'utente sia il genitore associato o un admin
    if current_user.get('role') != "admin" and current_user.get('id') != request.parent_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Non hai il permesso di approvare questa richiesta"
        )
    
    # Aggiorna lo stato della richiesta
    from app.schemas.reward import RewardRequestUpdate
    from app.db.models.reward import RewardRequestStatus
    update_data = RewardRequestUpdate(status=RewardRequestStatus.APPROVED)
    updated_request = RewardRequestRepository.update(db, request_id, update_data)
    
    return {"message": "Ricompensa approvata con successo", "status": "success"}

@router.put("/reject/{request_id}")
async def reject_reward(
    request_id: str,
    notes: Optional[str] = Body(None, description="Note sul motivo del rifiuto"),
    current_user: UserModel = Depends(get_current_user_with_role(["parent", "admin"])),
    db: Session = Depends(get_db)
) -> Any:
    """
    Rifiuta una richiesta di ricompensa in attesa.
    Solo genitori e admin possono accedere.
    """
    # Recupera la richiesta di ricompensa
    request = RewardRequestRepository.get_by_id(db, request_id)
    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Richiesta di ricompensa non trovata"
        )
    
    # Verifica che l'utente sia il genitore associato o un admin
    if current_user.get('role') != "admin" and current_user.get('id') != request.parent_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Non hai il permesso di rifiutare questa richiesta"
        )
    
    # Aggiorna lo stato della richiesta
    from app.schemas.reward import RewardRequestUpdate
    from app.db.models.reward import RewardRequestStatus
    update_data = RewardRequestUpdate(status=RewardRequestStatus.REJECTED, notes=notes)
    updated_request = RewardRequestRepository.update(db, request_id, update_data)
    
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
