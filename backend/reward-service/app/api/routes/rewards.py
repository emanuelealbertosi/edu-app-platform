from fastapi import APIRouter, Depends, HTTPException, status, Body, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.session import get_db
from app.schemas.reward import (
    RewardCreate, RewardResponse, RewardUpdate, 
    RewardGiftCreate, RewardGiftResponse, RewardGiftUpdate,
    RewardHistoryCreate, RewardHistoryResponse
)
from app.crud import reward as reward_crud

router = APIRouter()

# =============== Routes per la gestione delle ricompense ===============

@router.post("/", response_model=RewardResponse, status_code=status.HTTP_201_CREATED)
def create_reward(
    reward: RewardCreate,
    db: Session = Depends(get_db)
):
    """Crea una nuova ricompensa"""
    return reward_crud.create_reward(db=db, reward=reward)


@router.get("/", response_model=List[RewardResponse])
def get_rewards(
    skip: int = Query(0, description="Numero di record da saltare"),
    limit: int = Query(100, description="Numero massimo di record da restituire"),
    db: Session = Depends(get_db)
):
    """Ottiene tutte le ricompense"""
    return reward_crud.get_rewards(db=db, skip=skip, limit=limit)


@router.get("/{reward_id}", response_model=RewardResponse)
def get_reward(
    reward_id: str,
    db: Session = Depends(get_db)
):
    """Ottiene una ricompensa per ID"""
    db_reward = reward_crud.get_reward(db=db, reward_id=reward_id)
    if db_reward is None:
        raise HTTPException(status_code=404, detail="Ricompensa non trovata")
    return db_reward


@router.put("/{reward_id}", response_model=RewardResponse)
def update_reward(
    reward_id: str,
    reward: RewardUpdate,
    db: Session = Depends(get_db)
):
    """Aggiorna una ricompensa"""
    db_reward = reward_crud.get_reward(db=db, reward_id=reward_id)
    if db_reward is None:
        raise HTTPException(status_code=404, detail="Ricompensa non trovata")
    return reward_crud.update_reward(db=db, reward_id=reward_id, reward=reward)


@router.delete("/{reward_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_reward(
    reward_id: str,
    db: Session = Depends(get_db)
):
    """Elimina una ricompensa"""
    db_reward = reward_crud.get_reward(db=db, reward_id=reward_id)
    if db_reward is None:
        raise HTTPException(status_code=404, detail="Ricompensa non trovata")
    reward_crud.delete_reward(db=db, reward_id=reward_id)
    return None


# =============== Routes per la gestione dei premi ===============

@router.post("/{reward_id}/gifts", response_model=RewardGiftResponse, status_code=status.HTTP_201_CREATED)
def create_reward_gift(
    reward_id: str,
    gift: RewardGiftCreate,
    db: Session = Depends(get_db)
):
    """Crea un nuovo premio per una ricompensa"""
    db_reward = reward_crud.get_reward(db=db, reward_id=reward_id)
    if db_reward is None:
        raise HTTPException(status_code=404, detail="Ricompensa non trovata")
    return reward_crud.create_reward_gift(db=db, reward_id=reward_id, gift=gift)


@router.get("/{reward_id}/gifts", response_model=List[RewardGiftResponse])
def get_reward_gifts(
    reward_id: str,
    skip: int = Query(0, description="Numero di record da saltare"),
    limit: int = Query(100, description="Numero massimo di record da restituire"),
    db: Session = Depends(get_db)
):
    """Ottiene tutti i premi di una ricompensa"""
    db_reward = reward_crud.get_reward(db=db, reward_id=reward_id)
    if db_reward is None:
        raise HTTPException(status_code=404, detail="Ricompensa non trovata")
    return reward_crud.get_reward_gifts(db=db, reward_id=reward_id, skip=skip, limit=limit)


@router.get("/gifts/{gift_id}", response_model=RewardGiftResponse)
def get_reward_gift(
    gift_id: str,
    db: Session = Depends(get_db)
):
    """Ottiene un premio per ID"""
    db_gift = reward_crud.get_reward_gift(db=db, gift_id=gift_id)
    if db_gift is None:
        raise HTTPException(status_code=404, detail="Premio non trovato")
    return db_gift


@router.put("/gifts/{gift_id}", response_model=RewardGiftResponse)
def update_reward_gift(
    gift_id: str,
    gift: RewardGiftUpdate,
    db: Session = Depends(get_db)
):
    """Aggiorna un premio"""
    db_gift = reward_crud.get_reward_gift(db=db, gift_id=gift_id)
    if db_gift is None:
        raise HTTPException(status_code=404, detail="Premio non trovato")
    return reward_crud.update_reward_gift(db=db, gift_id=gift_id, gift=gift)


@router.delete("/gifts/{gift_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_reward_gift(
    gift_id: str,
    db: Session = Depends(get_db)
):
    """Elimina un premio"""
    db_gift = reward_crud.get_reward_gift(db=db, gift_id=gift_id)
    if db_gift is None:
        raise HTTPException(status_code=404, detail="Premio non trovato")
    reward_crud.delete_reward_gift(db=db, gift_id=gift_id)
    return None


# =============== Routes per la gestione della cronologia delle ricompense ===============

@router.post("/history", response_model=RewardHistoryResponse, status_code=status.HTTP_201_CREATED, tags=["history"])
def create_reward_history(
    history: RewardHistoryCreate,
    db: Session = Depends(get_db)
):
    """Crea una nuova voce nella cronologia delle ricompense"""
    return reward_crud.create_reward_history(db=db, history=history)


@router.get("/history/user/{user_id}", response_model=List[RewardHistoryResponse], tags=["history"])
def get_user_reward_history(
    user_id: str,
    skip: int = Query(0, description="Numero di record da saltare"),
    limit: int = Query(100, description="Numero massimo di record da restituire"),
    db: Session = Depends(get_db)
):
    """Ottiene la cronologia delle ricompense di un utente"""
    return reward_crud.get_user_reward_history(db=db, user_id=user_id, skip=skip, limit=limit)


@router.get("/points/user/{user_id}", response_model=float, tags=["history"])
def get_user_total_points(
    user_id: str,
    db: Session = Depends(get_db)
):
    """Ottiene il totale dei punti accumulati da un utente"""
    return reward_crud.get_user_total_points(db=db, user_id=user_id) 