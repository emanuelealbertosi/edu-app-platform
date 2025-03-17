from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from fastapi import HTTPException, status
from datetime import datetime

from app.db.models.reward import Reward, RewardCategory, UserReward, RewardProgress, RewardRequest, RewardRequestStatus
from app.schemas.reward import RewardCreate, RewardUpdate, RewardCategoryCreate, RewardCategoryUpdate, RewardRequestCreate, RewardRequestUpdate


class RewardCategoryRepository:
    """Repository per le operazioni sulle categorie di ricompense"""

    @staticmethod
    def get_by_id(db: Session, category_id: str) -> Optional[RewardCategory]:
        """Ottiene una categoria di ricompense per ID"""
        return db.query(RewardCategory).filter(RewardCategory.id == category_id).first()

    @staticmethod
    def get_by_name(db: Session, name: str) -> Optional[RewardCategory]:
        """Ottiene una categoria di ricompense per nome"""
        return db.query(RewardCategory).filter(RewardCategory.name == name).first()

    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 100) -> List[RewardCategory]:
        """Ottiene tutte le categorie di ricompense"""
        return db.query(RewardCategory).offset(skip).limit(limit).all()

    @staticmethod
    def create(db: Session, category_data: RewardCategoryCreate) -> RewardCategory:
        """Crea una nuova categoria di ricompense"""
        # Verifica se il nome esiste già
        existing = RewardCategoryRepository.get_by_name(db, name=category_data.name)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Categoria con nome '{category_data.name}' esiste già",
            )

        # Crea la categoria
        db_category = RewardCategory(**category_data.model_dump())
        db.add(db_category)
        db.commit()
        db.refresh(db_category)
        return db_category

    @staticmethod
    def update(db: Session, category_id: str, category_data: RewardCategoryUpdate) -> Optional[RewardCategory]:
        """Aggiorna una categoria di ricompense esistente"""
        db_category = RewardCategoryRepository.get_by_id(db, category_id)
        if not db_category:
            return None

        # Aggiorna solo i campi forniti
        update_data = category_data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_category, key, value)

        db.commit()
        db.refresh(db_category)
        return db_category

    @staticmethod
    def delete(db: Session, category_id: str) -> bool:
        """Elimina una categoria di ricompense"""
        db_category = RewardCategoryRepository.get_by_id(db, category_id)
        if not db_category:
            return False

        db.delete(db_category)
        db.commit()
        return True


class RewardRepository:
    """Repository per le operazioni sulle ricompense"""

    @staticmethod
    def get_by_id(db: Session, reward_id: str) -> Optional[Reward]:
        """Ottiene una ricompensa per ID"""
        return db.query(Reward).filter(Reward.id == reward_id).first()

    @staticmethod
    def get_all(db: Session, skip: int = 0, limit: int = 100, 
                is_active: Optional[bool] = None, category_id: Optional[str] = None) -> List[Reward]:
        """Ottiene tutte le ricompense con filtri opzionali"""
        query = db.query(Reward)
        
        if is_active is not None:
            query = query.filter(Reward.is_active == is_active)
            
        if category_id:
            query = query.filter(Reward.category_id == category_id)
            
        return query.offset(skip).limit(limit).all()
        
    @staticmethod
    def count_reward_assignments(db: Session, reward_id: str) -> int:
        """Conta quante volte una ricompensa è stata assegnata agli utenti"""
        return db.query(UserReward).filter(UserReward.reward_id == reward_id).count()

    @staticmethod
    def create(db: Session, reward_data: RewardCreate) -> Reward:
        """Crea una nuova ricompensa"""
        # Verifica se la categoria esiste
        category = RewardCategoryRepository.get_by_id(db, reward_data.category_id)
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Categoria con ID {reward_data.category_id} non trovata",
            )

        # Crea la ricompensa
        db_reward = Reward(**reward_data.model_dump())
        db.add(db_reward)
        db.commit()
        db.refresh(db_reward)
        return db_reward

    @staticmethod
    def update(db: Session, reward_id: str, reward_data: RewardUpdate) -> Optional[Reward]:
        """Aggiorna una ricompensa esistente"""
        db_reward = RewardRepository.get_by_id(db, reward_id)
        if not db_reward:
            return None

        # Aggiorna solo i campi forniti
        update_data = reward_data.model_dump(exclude_unset=True)
        
        # Verifica la categoria se fornita
        if "category_id" in update_data:
            category = RewardCategoryRepository.get_by_id(db, update_data["category_id"])
            if not category:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Categoria con ID {update_data['category_id']} non trovata",
                )
        
        for key, value in update_data.items():
            setattr(db_reward, key, value)

        db.commit()
        db.refresh(db_reward)
        return db_reward

    @staticmethod
    def delete(db: Session, reward_id: str) -> bool:
        """Elimina una ricompensa"""
        db_reward = RewardRepository.get_by_id(db, reward_id)
        if not db_reward:
            return False

        db.delete(db_reward)
        db.commit()
        return True


class UserRewardRepository:
    """Repository per le operazioni sulle ricompense degli utenti"""

    @staticmethod
    def get_by_id(db: Session, user_reward_id: str) -> Optional[UserReward]:
        """Ottiene una ricompensa utente per ID"""
        return db.query(UserReward).filter(UserReward.id == user_reward_id).first()

    @staticmethod
    def get_by_user_and_reward(db: Session, user_id: str, reward_id: str) -> Optional[UserReward]:
        """Ottiene una ricompensa utente per ID utente e ID ricompensa"""
        return db.query(UserReward).filter(
            UserReward.user_id == user_id,
            UserReward.reward_id == reward_id
        ).first()

    @staticmethod
    def get_all_by_user(db: Session, user_id: str, skip: int = 0, limit: int = 100) -> List[UserReward]:
        """Ottiene tutte le ricompense di un utente"""
        return db.query(UserReward).filter(
            UserReward.user_id == user_id
        ).offset(skip).limit(limit).all()

    @staticmethod
    def create(db: Session, user_reward_data: Dict[str, Any]) -> UserReward:
        """Crea una nuova ricompensa utente"""
        # Verifica se la ricompensa esiste
        reward = RewardRepository.get_by_id(db, user_reward_data["reward_id"])
        if not reward:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Ricompensa con ID {user_reward_data['reward_id']} non trovata",
            )

        # Verifica se l'utente ha già questa ricompensa
        existing = UserRewardRepository.get_by_user_and_reward(
            db, user_reward_data["user_id"], user_reward_data["reward_id"]
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="L'utente possiede già questa ricompensa",
            )

        # Crea la ricompensa utente
        db_user_reward = UserReward(**user_reward_data)
        db.add(db_user_reward)
        db.commit()
        db.refresh(db_user_reward)
        return db_user_reward

    @staticmethod
    def update(db: Session, user_reward_id: str, update_data: Dict[str, Any]) -> Optional[UserReward]:
        """Aggiorna una ricompensa utente esistente"""
        db_user_reward = UserRewardRepository.get_by_id(db, user_reward_id)
        if not db_user_reward:
            return None

        # Aggiorna solo i campi forniti
        for key, value in update_data.items():
            if key not in ["id", "user_id", "reward_id", "earned_at"]:  # Non permettere di modificare questi campi
                setattr(db_user_reward, key, value)

        db.commit()
        db.refresh(db_user_reward)
        return db_user_reward

    @staticmethod
    def delete(db: Session, user_reward_id: str) -> bool:
        """Elimina una ricompensa utente"""
        db_user_reward = UserRewardRepository.get_by_id(db, user_reward_id)
        if not db_user_reward:
            return False

        db.delete(db_user_reward)
        db.commit()
        return True


class RewardProgressRepository:
    """Repository per le operazioni sul progresso delle ricompense"""

    @staticmethod
    def get_by_id(db: Session, progress_id: str) -> Optional[RewardProgress]:
        """Ottiene un progresso per ID"""
        return db.query(RewardProgress).filter(RewardProgress.id == progress_id).first()

    @staticmethod
    def get_by_user_and_reward(db: Session, user_id: str, reward_id: str) -> Optional[RewardProgress]:
        """Ottiene un progresso per ID utente e ID ricompensa"""
        return db.query(RewardProgress).filter(
            RewardProgress.user_id == user_id,
            RewardProgress.reward_id == reward_id
        ).first()

    @staticmethod
    def get_all_by_user(db: Session, user_id: str, skip: int = 0, limit: int = 100) -> List[RewardProgress]:
        """Ottiene tutti i progressi di un utente"""
        return db.query(RewardProgress).filter(
            RewardProgress.user_id == user_id
        ).offset(skip).limit(limit).all()

    @staticmethod
    def create_or_update(db: Session, progress_data: Dict[str, Any]) -> RewardProgress:
        """Crea un nuovo progresso o aggiorna uno esistente"""
        # Verifica se la ricompensa esiste
        reward = RewardRepository.get_by_id(db, progress_data["reward_id"])
        if not reward:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Ricompensa con ID {progress_data['reward_id']} non trovata",
            )

        # Cerca un progresso esistente
        existing = RewardProgressRepository.get_by_user_and_reward(
            db, progress_data["user_id"], progress_data["reward_id"]
        )
        
        if existing:
            # Aggiorna il progresso esistente
            for key, value in progress_data.items():
                if key not in ["id", "user_id", "reward_id"]:  # Non permettere di modificare questi campi
                    setattr(existing, key, value)
            db.commit()
            db.refresh(existing)
            return existing
        else:
            # Crea un nuovo progresso
            db_progress = RewardProgress(**progress_data)
            db.add(db_progress)
            db.commit()
            db.refresh(db_progress)
            return db_progress

    @staticmethod
    def increment_progress(db: Session, user_id: str, reward_id: str, 
                           increment: int = 1) -> Optional[RewardProgress]:
        """Incrementa il progresso di una ricompensa"""
        progress = RewardProgressRepository.get_by_user_and_reward(db, user_id, reward_id)
        if not progress:
            return None
            
        progress.current_progress += increment
        db.commit()
        db.refresh(progress)
        return progress

    @staticmethod
    def delete(db: Session, progress_id: str) -> bool:
        """Elimina un progresso"""
        db_progress = RewardProgressRepository.get_by_id(db, progress_id)
        if not db_progress:
            return False

        db.delete(db_progress)
        db.commit()
        return True


class RewardRequestRepository:
    """Repository per le operazioni sulle richieste di ricompensa"""

    @staticmethod
    def get_by_id(db: Session, request_id: str) -> Optional[RewardRequest]:
        """Ottiene una richiesta di ricompensa per ID"""
        return db.query(RewardRequest).filter(RewardRequest.id == request_id).first()

    @staticmethod
    def get_by_parent_id(db: Session, parent_id: str, status: Optional[RewardRequestStatus] = None) -> List[RewardRequest]:
        """Ottiene tutte le richieste di ricompensa per ID genitore con filtro opzionale per stato"""
        query = db.query(RewardRequest).filter(RewardRequest.parent_id == parent_id)
        if status:
            query = query.filter(RewardRequest.status == status)
        return query.all()

    @staticmethod
    def get_by_student_id(db: Session, student_id: str, status: Optional[RewardRequestStatus] = None) -> List[RewardRequest]:
        """Ottiene tutte le richieste di ricompensa per ID studente con filtro opzionale per stato"""
        query = db.query(RewardRequest).filter(RewardRequest.student_id == student_id)
        if status:
            query = query.filter(RewardRequest.status == status)
        return query.all()

    @staticmethod
    def get_pending_by_parent_id(db: Session, parent_id: str) -> List[RewardRequest]:
        """Ottiene tutte le richieste di ricompensa in attesa per un dato genitore"""
        return db.query(RewardRequest).\
                filter(RewardRequest.parent_id == parent_id).\
                filter(RewardRequest.status == RewardRequestStatus.PENDING).\
                all()

    @staticmethod
    def create(db: Session, request_data: RewardRequestCreate) -> RewardRequest:
        """Crea una nuova richiesta di ricompensa"""
        db_request = RewardRequest(**request_data.model_dump(), status=RewardRequestStatus.PENDING)
        db.add(db_request)
        db.commit()
        db.refresh(db_request)
        return db_request

    @staticmethod
    def update(db: Session, request_id: str, request_data: RewardRequestUpdate) -> Optional[RewardRequest]:
        """Aggiorna una richiesta di ricompensa esistente"""
        db_request = RewardRequestRepository.get_by_id(db, request_id)
        if not db_request:
            return None

        # Aggiorna solo i campi forniti
        update_data = request_data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_request, key, value)

        # Se lo stato è cambiato, aggiorna la data di elaborazione
        if 'status' in update_data and update_data['status'] != RewardRequestStatus.PENDING:
            db_request.processed_at = datetime.utcnow()

        db.commit()
        db.refresh(db_request)
        return db_request

    @staticmethod
    def delete(db: Session, request_id: str) -> bool:
        """Elimina una richiesta di ricompensa"""
        db_request = RewardRequestRepository.get_by_id(db, request_id)
        if not db_request:
            return False

        db.delete(db_request)
        db.commit()
        return True
