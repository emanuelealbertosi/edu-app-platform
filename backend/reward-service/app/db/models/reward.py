from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum as SQLEnum, Text, JSON, Float
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
import uuid

from app.db.base import Base


def generate_uuid():
    """Genera un UUID casuale"""
    return str(uuid.uuid4())


class RewardType(str, enum.Enum):
    """Tipi di ricompensa disponibili"""
    BADGE = "badge"
    CERTIFICATE = "certificate"
    ACHIEVEMENT = "achievement"
    POINT = "point"
    TROPHY = "trophy"
    PRIVILEGE = "privilege"


class RewardRarity(str, enum.Enum):
    """Rarità delle ricompense"""
    COMMON = "common"
    UNCOMMON = "uncommon"
    RARE = "rare"
    EPIC = "epic"
    LEGENDARY = "legendary"


class RewardCategory(Base):
    """Modello per le categorie di ricompense"""
    __tablename__ = "reward_categories"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String(100), nullable=False, unique=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relazioni
    rewards = relationship("Reward", back_populates="category")


class Reward(Base):
    """Modello per le ricompense"""
    __tablename__ = "rewards"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    reward_type = Column(SQLEnum(RewardType), nullable=False)
    rarity = Column(SQLEnum(RewardRarity), nullable=False, default=RewardRarity.COMMON)
    icon_url = Column(String(255), nullable=True)
    image_url = Column(String(255), nullable=True)
    points_value = Column(Integer, default=0)
    requirements = Column(JSON, nullable=True)  # JSON con requisiti per ottenere la ricompensa
    is_active = Column(Boolean, default=True)
    is_public = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Chiavi esterne
    category_id = Column(String, ForeignKey("reward_categories.id"))
    created_by = Column(String, nullable=False)  # ID dell'utente che ha creato la ricompensa
    
    # Relazioni
    category = relationship("RewardCategory", back_populates="rewards")
    user_rewards = relationship("UserReward", back_populates="reward", cascade="all, delete-orphan")
    progress_records = relationship("RewardProgress", back_populates="reward", cascade="all, delete-orphan")
    gifts = relationship("RewardGift", back_populates="reward", cascade="all, delete-orphan")


class UserReward(Base):
    """Modello per le ricompense assegnate agli utenti"""
    __tablename__ = "user_rewards"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, nullable=False)  # ID dell'utente
    earned_at = Column(DateTime, default=datetime.utcnow)
    is_displayed = Column(Boolean, default=True)  # Se la ricompensa è mostrata nel profilo
    reward_metadata = Column(JSON, nullable=True)  # Dati aggiuntivi sulla ricompensa assegnata
    
    # Chiavi esterne
    reward_id = Column(String, ForeignKey("rewards.id"))
    
    # Relazioni
    reward = relationship("Reward", back_populates="user_rewards")


class RewardProgress(Base):
    """Modello per tracciare il progresso verso le ricompense"""
    __tablename__ = "reward_progress"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, nullable=False)  # ID dell'utente
    reward_id = Column(String, ForeignKey("rewards.id"))
    current_progress = Column(Integer, default=0)
    target_progress = Column(Integer, nullable=False)
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    progress_metadata = Column(JSON, nullable=True)  # Dati aggiuntivi sul progresso
    
    # Relazioni
    reward = relationship("Reward", back_populates="progress_records")


class RewardRequestStatus(str, enum.Enum):
    """Stati possibili delle richieste di ricompensa"""
    PENDING = "pending"       # In attesa di approvazione
    APPROVED = "approved"     # Approvata
    REJECTED = "rejected"     # Rifiutata
    FULFILLED = "fulfilled"   # Soddisfatta (ricompensa consegnata)


class RewardRequest(Base):
    """Modello per le richieste di ricompensa che richiedono approvazione da parte dei genitori"""
    __tablename__ = "reward_requests"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    student_id = Column(String, nullable=False)  # ID dello studente che richiede la ricompensa
    parent_id = Column(String, nullable=False)   # ID del genitore che deve approvare
    reward_id = Column(String, ForeignKey("rewards.id"))
    status = Column(SQLEnum(RewardRequestStatus), nullable=False, default=RewardRequestStatus.PENDING)
    requested_at = Column(DateTime, default=datetime.utcnow)
    processed_at = Column(DateTime, nullable=True)  # Data di approvazione o rifiuto
    notes = Column(Text, nullable=True)  # Note aggiuntive (come motivo del rifiuto)
    
    # Relazioni
    reward = relationship("Reward")


class RewardHistory(Base):
    """Modello per la cronologia delle ricompense e dei punti assegnati"""
    __tablename__ = "reward_history"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, nullable=False)  # ID dell'utente
    points = Column(Float, default=0.0)  # Punti assegnati
    activity_type = Column(String, nullable=False)  # Tipo di attività (es. path_completion, quiz_completion)
    activity_id = Column(String, nullable=True)  # ID dell'attività (es. ID del percorso, ID del quiz)
    title = Column(String, nullable=True)  # Titolo dell'attività
    description = Column(String, nullable=True)  # Descrizione dell'attività
    timestamp = Column(DateTime, default=datetime.utcnow)  # Data e ora dell'assegnazione


class RewardGift(Base):
    """Modello per i premi delle ricompense"""
    __tablename__ = "reward_gifts"

    id = Column(String, primary_key=True, default=generate_uuid)
    reward_id = Column(String, ForeignKey("rewards.id"), nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    points_required = Column(Integer, nullable=False)
    quantity = Column(Integer, nullable=True)  # None = illimitato
    enabled = Column(Boolean, default=True)
    data = Column(JSON, nullable=True)  # Dati aggiuntivi sul premio
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relazioni
    reward = relationship("Reward", back_populates="gifts")
