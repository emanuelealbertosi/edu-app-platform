from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session

from app.db.base import get_db
from app.db.repositories.reward_repository import UserRewardRepository, RewardRepository, RewardProgressRepository
from app.schemas.reward import (
    UserRewardCreate, UserRewardUpdate, UserRewardInDB, UserRewardWithReward,
    RewardProgressCreate, RewardProgressUpdate, RewardProgressInDB
)
from app.api.dependencies.auth import (
    get_current_active_user, get_current_admin_user, get_current_parent_or_admin_user
)

router = APIRouter()


@router.get("/", response_model=List[UserRewardWithReward])
async def get_user_rewards(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    user_id: Optional[str] = None,
    current_user: Dict[str, Any] = Depends(get_current_active_user)
):
    """
    Ottieni tutte le ricompense assegnate a un utente.
    Se user_id non è specificato, restituisce le ricompense dell'utente corrente.
    Se l'utente è un amministratore o un genitore, può visualizzare le ricompense di qualsiasi utente.
    """
    # Se non è specificato user_id, usa l'ID dell'utente corrente
    target_user_id = user_id if user_id else current_user["id"]
    
    # Se l'utente richiede di vedere le ricompense di un altro utente,
    # verifica che abbia i permessi necessari
    if target_user_id != current_user["id"] and current_user["role"] not in ["admin", "parent"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Non hai i permessi per visualizzare le ricompense di questo utente"
        )
    
    # Per i genitori, verifica che l'utente richiesto sia un figlio
    if current_user["role"] == "parent" and target_user_id != current_user["id"]:
        # Qui dovresti verificare che l'utente target sia un figlio del genitore
        # Per ora, lasciamo passare e assumiamo che il controllo sia fatto dal servizio di autenticazione
        pass
    
    user_rewards = UserRewardRepository.get_all_by_user(db, target_user_id, skip=skip, limit=limit)
    return user_rewards


@router.post("/", response_model=UserRewardInDB, status_code=status.HTTP_201_CREATED)
async def assign_reward_to_user(
    user_reward: UserRewardCreate,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_parent_or_admin_user)
):
    """
    Assegna una ricompensa a un utente.
    Richiede privilegi di amministratore o genitore.
    """
    # Verifica che l'utente abbia i permessi per assegnare la ricompensa
    if current_user["role"] != "admin" and user_reward.user_id != current_user["id"]:
        # Per i genitori, verifica che l'utente target sia un figlio
        # Per ora, lasciamo passare e assumiamo che il controllo sia fatto dal servizio di autenticazione
        pass
    
    try:
        user_reward_data = user_reward.model_dump()
        new_user_reward = UserRewardRepository.create(db, user_reward_data)
        return new_user_reward
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Si è verificato un errore durante l'assegnazione della ricompensa: {str(e)}"
        )


@router.get("/{user_reward_id}", response_model=UserRewardWithReward)
async def get_user_reward(
    user_reward_id: str,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_active_user)
):
    """
    Ottieni una ricompensa utente per ID.
    Gli utenti possono vedere solo le proprie ricompense, a meno che non siano amministratori o genitori.
    """
    user_reward = UserRewardRepository.get_by_id(db, user_reward_id)
    if not user_reward:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ricompensa utente con ID {user_reward_id} non trovata"
        )
    
    # Verifica che l'utente abbia i permessi per visualizzare questa ricompensa
    if user_reward.user_id != current_user["id"] and current_user["role"] not in ["admin", "parent"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Non hai i permessi per visualizzare questa ricompensa"
        )
    
    # Per i genitori, verifica che l'utente della ricompensa sia un figlio
    if current_user["role"] == "parent" and user_reward.user_id != current_user["id"]:
        # Qui dovresti verificare che l'utente target sia un figlio del genitore
        # Per ora, lasciamo passare e assumiamo che il controllo sia fatto dal servizio di autenticazione
        pass
    
    return user_reward


@router.put("/{user_reward_id}", response_model=UserRewardInDB)
async def update_user_reward(
    user_reward_id: str,
    user_reward_update: UserRewardUpdate,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_parent_or_admin_user)
):
    """
    Aggiorna una ricompensa utente esistente.
    Richiede privilegi di amministratore o genitore.
    """
    # Ottieni la ricompensa utente esistente
    user_reward = UserRewardRepository.get_by_id(db, user_reward_id)
    if not user_reward:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ricompensa utente con ID {user_reward_id} non trovata"
        )
    
    # Verifica che l'utente abbia i permessi per aggiornare questa ricompensa
    if current_user["role"] != "admin" and user_reward.user_id != current_user["id"]:
        # Per i genitori, verifica che l'utente della ricompensa sia un figlio
        # Per ora, lasciamo passare e assumiamo che il controllo sia fatto dal servizio di autenticazione
        pass
    
    update_data = user_reward_update.model_dump(exclude_unset=True)
    updated_user_reward = UserRewardRepository.update(db, user_reward_id, update_data)
    return updated_user_reward


@router.delete("/{user_reward_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user_reward(
    user_reward_id: str,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_admin_user)
):
    """
    Elimina una ricompensa utente.
    Richiede privilegi di amministratore.
    """
    success = UserRewardRepository.delete(db, user_reward_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Ricompensa utente con ID {user_reward_id} non trovata"
        )
    return {"detail": "Ricompensa utente eliminata con successo"}


@router.get("/progress/", response_model=List[RewardProgressInDB])
async def get_user_reward_progress(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    user_id: Optional[str] = None,
    current_user: Dict[str, Any] = Depends(get_current_active_user)
):
    """
    Ottieni il progresso delle ricompense di un utente.
    Se user_id non è specificato, restituisce il progresso dell'utente corrente.
    """
    # Se non è specificato user_id, usa l'ID dell'utente corrente
    target_user_id = user_id if user_id else current_user["id"]
    
    # Verifica che l'utente abbia i permessi per visualizzare questo progresso
    if target_user_id != current_user["id"] and current_user["role"] not in ["admin", "parent"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Non hai i permessi per visualizzare il progresso di questo utente"
        )
    
    # Per i genitori, verifica che l'utente target sia un figlio
    if current_user["role"] == "parent" and target_user_id != current_user["id"]:
        # Qui dovresti verificare che l'utente target sia un figlio del genitore
        # Per ora, lasciamo passare e assumiamo che il controllo sia fatto dal servizio di autenticazione
        pass
    
    progress_list = RewardProgressRepository.get_all_by_user(db, target_user_id, skip=skip, limit=limit)
    return progress_list


@router.post("/progress/", response_model=RewardProgressInDB, status_code=status.HTTP_201_CREATED)
async def create_or_update_progress(
    progress: RewardProgressCreate,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_parent_or_admin_user)
):
    """
    Crea o aggiorna il progresso di una ricompensa per un utente.
    Richiede privilegi di amministratore o genitore.
    """
    # Verifica che l'utente abbia i permessi per aggiornare questo progresso
    if current_user["role"] != "admin" and progress.user_id != current_user["id"]:
        # Per i genitori, verifica che l'utente target sia un figlio
        # Per ora, lasciamo passare e assumiamo che il controllo sia fatto dal servizio di autenticazione
        pass
    
    try:
        progress_data = progress.model_dump()
        updated_progress = RewardProgressRepository.create_or_update(db, progress_data)
        
        # Verifica se il progresso è stato completato
        if updated_progress.current_progress >= updated_progress.target_progress:
            # Assegna automaticamente la ricompensa all'utente se ha raggiunto l'obiettivo
            existing_reward = UserRewardRepository.get_by_user_and_reward(
                db, updated_progress.user_id, updated_progress.reward_id
            )
            
            if not existing_reward:
                UserRewardRepository.create(db, {
                    "user_id": updated_progress.user_id,
                    "reward_id": updated_progress.reward_id,
                })
        
        return updated_progress
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Si è verificato un errore durante l'aggiornamento del progresso: {str(e)}"
        )


@router.put("/progress/increment/{reward_id}", response_model=RewardProgressInDB)
async def increment_user_progress(
    reward_id: str,
    increment: int = Query(1, ge=1),
    user_id: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Dict[str, Any] = Depends(get_current_parent_or_admin_user)
):
    """
    Incrementa il progresso di una ricompensa per un utente.
    Richiede privilegi di amministratore o genitore.
    """
    # Se non è specificato user_id, usa l'ID dell'utente corrente
    target_user_id = user_id if user_id else current_user["id"]
    
    # Verifica che l'utente abbia i permessi per aggiornare questo progresso
    if current_user["role"] != "admin" and target_user_id != current_user["id"]:
        # Per i genitori, verifica che l'utente target sia un figlio
        # Per ora, lasciamo passare e assumiamo che il controllo sia fatto dal servizio di autenticazione
        pass
    
    # Verifica se esiste già un progresso per questa ricompensa
    progress = RewardProgressRepository.get_by_user_and_reward(db, target_user_id, reward_id)
    
    if not progress:
        # Se non esiste un progresso, verifica prima se la ricompensa esiste
        reward = RewardRepository.get_by_id(db, reward_id)
        if not reward:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Ricompensa con ID {reward_id} non trovata"
            )
        
        # Crea un nuovo progresso con un obiettivo predefinito (basato sulla rarità della ricompensa)
        target = 1  # Valore predefinito
        if hasattr(reward, "requirements") and reward.requirements:
            # Se la ricompensa ha requisiti specifici, usali per il target
            if isinstance(reward.requirements, dict) and "target" in reward.requirements:
                target = reward.requirements["target"]
        
        progress_data = {
            "user_id": target_user_id,
            "reward_id": reward_id,
            "current_progress": increment,
            "target_progress": target
        }
        
        return RewardProgressRepository.create_or_update(db, progress_data)
    
    # Incrementa il progresso esistente
    updated_progress = RewardProgressRepository.increment_progress(db, target_user_id, reward_id, increment)
    
    # Verifica se il progresso è stato completato
    if updated_progress.current_progress >= updated_progress.target_progress:
        # Assegna automaticamente la ricompensa all'utente se ha raggiunto l'obiettivo
        existing_reward = UserRewardRepository.get_by_user_and_reward(
            db, target_user_id, reward_id
        )
        
        if not existing_reward:
            UserRewardRepository.create(db, {
                "user_id": target_user_id,
                "reward_id": reward_id,
            })
    
    return updated_progress
