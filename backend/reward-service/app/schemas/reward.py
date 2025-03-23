from pydantic import BaseModel, Field, field_validator, computed_field
from typing import Optional, List, Dict, Any, Union
from datetime import datetime
import uuid
from enum import Enum

from app.db.models.reward import RewardType, RewardRarity, RewardRequestStatus


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


class RewardType(str, Enum):
    """Enum per i tipi di ricompensa"""
    POINTS = "points"  # Punti
    BADGE = "badge"    # Badge
    COUPON = "coupon"  # Coupon/Voucher


class RewardBase(BaseModel):
    """Schema base per le ricompense"""
    name: str
    description: Optional[str] = None
    type: RewardType
    enabled: bool = True
    data: Optional[Dict[str, Any]] = None


class RewardCreate(RewardBase):
    """Schema per la creazione delle ricompense"""
    pass


class RewardUpdate(BaseModel):
    """Schema per l'aggiornamento delle ricompense"""
    name: Optional[str] = None
    description: Optional[str] = None
    type: Optional[RewardType] = None
    enabled: Optional[bool] = None
    data: Optional[Dict[str, Any]] = None

    class Config:
        orm_mode = True


class RewardInDB(RewardBase):
    """Schema per ricompense nel database"""
    id: str
    category_id: str
    created_by: str
    created_at: datetime
    updated_at: datetime
    
    # Campo alias per compatibilità con il frontend
    @computed_field
    @property
    def title(self) -> str:
        """Alias per il campo name per compatibilità con il frontend"""
        return self.name

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
    
    # Campo calcolato per compatibilità con il frontend che si aspetta 'title'
    @computed_field
    @property
    def title(self) -> str:
        """Alias per il campo name della ricompensa associata"""
        return self.reward.name if self.reward else ""
    
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

class RewardTemplate(RewardBase):
    """Schema per i template di ricompensa disponibili per i genitori"""
    id: str
    category_id: str
    created_by: str
    created_at: datetime
    updated_at: datetime
    
    # Campo alias per compatibilità con il frontend
    @computed_field
    @property
    def title(self) -> str:
        """Alias per il campo name per compatibilità con il frontend"""
        return self.name
    
    model_config = {
        "from_attributes": True
    }


class RewardRequestBase(BaseModel):
    """Schema base per le richieste di ricompensa"""
    student_id: str
    parent_id: str
    reward_id: str
    notes: Optional[str] = None


class RewardRequestCreate(RewardRequestBase):
    """Schema per la creazione di una richiesta di ricompensa"""
    pass


class RewardRequestUpdate(BaseModel):
    """Schema per l'aggiornamento di una richiesta di ricompensa"""
    status: RewardRequestStatus
    notes: Optional[str] = None


class RewardRequestInDB(RewardRequestBase):
    """Schema per le richieste di ricompensa nel database"""
    id: str
    status: RewardRequestStatus
    requested_at: datetime
    processed_at: Optional[datetime] = None
    
    model_config = {
        "from_attributes": True
    }


class RewardRequestWithReward(RewardRequestInDB):
    """Schema per le richieste di ricompensa con i dettagli della ricompensa"""
    reward: RewardInDB
    
    model_config = {
        "from_attributes": True
    }


class PendingReward(BaseModel):
    """Schema per le ricompense in attesa di approvazione (per compatibilità)"""
    id: str
    reward_id: str
    student_id: str
    parent_id: str
    requested_at: datetime
    status: RewardRequestStatus = RewardRequestStatus.PENDING
    notes: Optional[str] = None
    reward: Optional[RewardInDB] = None
    
    model_config = {
        "from_attributes": True
    }


class Config:
    orm_mode = True


class RewardHistoryBase(BaseModel):
    """Schema base per la cronologia delle ricompense"""
    user_id: str
    points: float = 0.0
    activity_type: str
    activity_id: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None


class RewardHistoryCreate(RewardHistoryBase):
    """Schema per la creazione della cronologia delle ricompense"""
    pass


class RewardHistoryResponse(RewardHistoryBase):
    """Schema per la risposta della cronologia delle ricompense"""
    id: str
    timestamp: datetime

    class Config:
        orm_mode = True


class RewardGiftBase(BaseModel):
    """Schema base per i premi delle ricompense"""
    name: str
    description: Optional[str] = None
    points_required: int
    quantity: Optional[int] = None  # None = illimitato
    enabled: bool = True
    data: Optional[Dict[str, Any]] = None


class RewardGiftCreate(RewardGiftBase):
    """Schema per la creazione dei premi delle ricompense"""
    pass


class RewardGiftUpdate(BaseModel):
    """Schema per l'aggiornamento dei premi delle ricompense"""
    name: Optional[str] = None
    description: Optional[str] = None
    points_required: Optional[int] = None
    quantity: Optional[int] = None
    enabled: Optional[bool] = None
    data: Optional[Dict[str, Any]] = None

    class Config:
        orm_mode = True


class RewardGiftResponse(RewardGiftBase):
    """Schema per la risposta dei premi delle ricompense"""
    id: str
    reward_id: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True


class RewardResponse(RewardBase):
    """Schema per la risposta delle ricompense"""
    id: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    gifts: List[RewardGiftResponse] = []

    class Config:
        orm_mode = True
