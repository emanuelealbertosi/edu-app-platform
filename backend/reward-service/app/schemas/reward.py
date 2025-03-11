from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Dict, Any, Union
from datetime import datetime
import uuid

from app.db.models.reward import RewardType, RewardRarity


class RewardCategoryBase(BaseModel):
    """Schema base per categorie di ricompense"""
    name: str
    description: Optional[str] = None
    
    @field_validator('name')
    def name_must_not_be_empty(cls, v):
        if not v or not v.strip():
            raise ValueError('Il nome della categoria non può essere vuoto')
        return v


class RewardCategoryCreate(RewardCategoryBase):
    """Schema per la creazione di categorie di ricompense"""
    pass


class RewardCategoryUpdate(BaseModel):
    """Schema per l'aggiornamento di categorie di ricompense"""
    name: Optional[str] = None
    description: Optional[str] = None


class RewardCategoryInDB(RewardCategoryBase):
    """Schema per categorie di ricompense nel database"""
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }


class RewardCategoryWithRewards(RewardCategoryInDB):
    """Schema per categorie con le ricompense associate"""
    rewards: List["RewardInDB"] = []

    model_config = {
        "from_attributes": True
    }


class RewardBase(BaseModel):
    """Schema base per ricompense"""
    name: str
    description: Optional[str] = None
    reward_type: RewardType
    rarity: RewardRarity = RewardRarity.COMMON
    icon_url: Optional[str] = None
    image_url: Optional[str] = None
    points_value: int = 0
    requirements: Optional[Dict[str, Any]] = None
    is_active: bool = True
    is_public: bool = True


class RewardCreate(RewardBase):
    """Schema per la creazione di ricompense"""
    category_id: str
    created_by: str


class RewardUpdate(BaseModel):
    """Schema per l'aggiornamento di ricompense"""
    name: Optional[str] = None
    description: Optional[str] = None
    reward_type: Optional[RewardType] = None
    rarity: Optional[RewardRarity] = None
    icon_url: Optional[str] = None
    image_url: Optional[str] = None
    points_value: Optional[int] = None
    requirements: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None
    is_public: Optional[bool] = None
    category_id: Optional[str] = None


class RewardInDB(RewardBase):
    """Schema per ricompense nel database"""
    id: str
    category_id: str
    created_by: str
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }


class RewardWithCategory(RewardInDB):
    """Schema per ricompense con la categoria associata"""
    category: RewardCategoryInDB

    model_config = {
        "from_attributes": True
    }


class UserRewardBase(BaseModel):
    """Schema base per ricompense utente"""
    user_id: str
    reward_id: str
    is_displayed: bool = True
    reward_metadata: Optional[Dict[str, Any]] = None


class UserRewardCreate(UserRewardBase):
    """Schema per la creazione di ricompense utente"""
    pass


class UserRewardUpdate(BaseModel):
    """Schema per l'aggiornamento di ricompense utente"""
    is_displayed: Optional[bool] = None
    reward_metadata: Optional[Dict[str, Any]] = None


class UserRewardInDB(UserRewardBase):
    """Schema per ricompense utente nel database"""
    id: str
    earned_at: datetime

    model_config = {
        "from_attributes": True
    }


class UserRewardWithReward(UserRewardInDB):
    """Schema per ricompense utente con i dettagli della ricompensa"""
    reward: RewardInDB

    model_config = {
        "from_attributes": True
    }


class RewardProgressBase(BaseModel):
    """Schema base per il progresso delle ricompense"""
    user_id: str
    reward_id: str
    current_progress: int = 0
    target_progress: int
    progress_metadata: Optional[Dict[str, Any]] = None


class RewardProgressCreate(RewardProgressBase):
    """Schema per la creazione del progresso delle ricompense"""
    pass


class RewardProgressUpdate(BaseModel):
    """Schema per l'aggiornamento del progresso delle ricompense"""
    current_progress: Optional[int] = None
    target_progress: Optional[int] = None
    progress_metadata: Optional[Dict[str, Any]] = None


class RewardProgressInDB(RewardProgressBase):
    """Schema per il progresso delle ricompense nel database"""
    id: str
    last_updated: datetime

    model_config = {
        "from_attributes": True
    }
