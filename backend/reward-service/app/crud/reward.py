from sqlalchemy.orm import Session
from uuid import uuid4
from app.db.models.reward import Reward, RewardGift, RewardHistory
from app.schemas.reward import RewardCreate, RewardGiftCreate, RewardHistoryCreate, RewardUpdate, RewardGiftUpdate
from typing import List, Optional, Dict, Any

# =============== CRUD per Reward ===============

def create_reward(db: Session, reward: RewardCreate) -> Reward:
    """Crea una nuova ricompensa"""
    db_reward = Reward(**reward.dict())
    db.add(db_reward)
    db.commit()
    db.refresh(db_reward)
    return db_reward


def get_rewards(db: Session, skip: int = 0, limit: int = 100) -> List[Reward]:
    """Ottiene tutte le ricompense"""
    return db.query(Reward).offset(skip).limit(limit).all()


def get_reward(db: Session, reward_id: str) -> Optional[Reward]:
    """Ottiene una ricompensa per ID"""
    return db.query(Reward).filter(Reward.id == reward_id).first()


def update_reward(db: Session, reward_id: str, reward: RewardUpdate) -> Reward:
    """Aggiorna una ricompensa"""
    db_reward = get_reward(db, reward_id)
    for key, value in reward.dict(exclude_unset=True).items():
        setattr(db_reward, key, value)
    db.commit()
    db.refresh(db_reward)
    return db_reward


def delete_reward(db: Session, reward_id: str) -> None:
    """Elimina una ricompensa"""
    db_reward = get_reward(db, reward_id)
    db.delete(db_reward)
    db.commit()


# =============== CRUD per RewardGift ===============

def create_reward_gift(db: Session, reward_id: str, gift: RewardGiftCreate) -> RewardGift:
    """Crea un nuovo premio per una ricompensa"""
    db_gift = RewardGift(**gift.dict(), reward_id=reward_id)
    db.add(db_gift)
    db.commit()
    db.refresh(db_gift)
    return db_gift


def get_reward_gifts(db: Session, reward_id: str, skip: int = 0, limit: int = 100) -> List[RewardGift]:
    """Ottiene tutti i premi di una ricompensa"""
    return db.query(RewardGift).filter(RewardGift.reward_id == reward_id).offset(skip).limit(limit).all()


def get_reward_gift(db: Session, gift_id: str) -> Optional[RewardGift]:
    """Ottiene un premio per ID"""
    return db.query(RewardGift).filter(RewardGift.id == gift_id).first()


def update_reward_gift(db: Session, gift_id: str, gift: RewardGiftUpdate) -> RewardGift:
    """Aggiorna un premio"""
    db_gift = get_reward_gift(db, gift_id)
    for key, value in gift.dict(exclude_unset=True).items():
        setattr(db_gift, key, value)
    db.commit()
    db.refresh(db_gift)
    return db_gift


def delete_reward_gift(db: Session, gift_id: str) -> None:
    """Elimina un premio"""
    db_gift = get_reward_gift(db, gift_id)
    db.delete(db_gift)
    db.commit()


# =============== CRUD per RewardHistory ===============

def create_reward_history(db: Session, history: RewardHistoryCreate) -> RewardHistory:
    """Crea una nuova voce nella cronologia delle ricompense"""
    db_history = RewardHistory(**history.dict())
    db.add(db_history)
    db.commit()
    db.refresh(db_history)
    return db_history


def get_user_reward_history(db: Session, user_id: str, skip: int = 0, limit: int = 100) -> List[RewardHistory]:
    """Ottiene la cronologia delle ricompense di un utente"""
    return db.query(RewardHistory).filter(RewardHistory.user_id == user_id).order_by(RewardHistory.timestamp.desc()).offset(skip).limit(limit).all()


def get_user_total_points(db: Session, user_id: str) -> float:
    """Ottiene il totale dei punti accumulati da un utente"""
    result = db.query(db.func.sum(RewardHistory.points)).filter(RewardHistory.user_id == user_id).scalar()
    return float(result) if result is not None else 0.0 