import pytest
from pydantic import ValidationError
from datetime import datetime

from app.schemas.reward import (
    RewardCategoryCreate, RewardCategoryUpdate, RewardCategoryInDB, RewardCategoryWithRewards,
    RewardCreate, RewardUpdate, RewardInDB, RewardWithCategory,
    UserRewardCreate, UserRewardUpdate, UserRewardInDB, UserRewardWithReward,
    RewardProgressCreate, RewardProgressUpdate, RewardProgressInDB
)
from app.db.models.reward import RewardType, RewardRarity


class TestRewardCategorySchemas:
    def test_reward_category_create(self):
        # Test valid category creation
        category = RewardCategoryCreate(name="Badges", description="Badge per competenze specifiche")
        assert category.name == "Badges"
        assert category.description == "Badge per competenze specifiche"
        
        # Test category creation without description
        category = RewardCategoryCreate(name="Badges")
        assert category.name == "Badges"
        assert category.description is None
        
        # Test empty name validation
        with pytest.raises(ValidationError):
            RewardCategoryCreate(name="", description="Descrizione")
    
    def test_reward_category_update(self):
        # Test partial update
        category_update = RewardCategoryUpdate(name="Updated Badges")
        assert category_update.name == "Updated Badges"
        assert category_update.description is None
        
        # Test complete update
        category_update = RewardCategoryUpdate(
            name="Updated Badges", 
            description="Descrizione aggiornata"
        )
        assert category_update.name == "Updated Badges"
        assert category_update.description == "Descrizione aggiornata"
        
        # Test empty update (valid for PATCH)
        category_update = RewardCategoryUpdate()
        assert category_update.name is None
        assert category_update.description is None
    
    def test_reward_category_response(self, test_reward_categories):
        # Test conversion from ORM model
        badges_category = test_reward_categories["badges"]
        category_response = RewardCategoryInDB.model_validate(badges_category)
        
        assert category_response.id == badges_category.id
        assert category_response.name == "Badges"
        assert category_response.description == "Badge per competenze specifiche"
        assert category_response.created_at is not None
        assert category_response.updated_at is not None
    
    def test_reward_category_with_rewards(self, test_reward_categories):
        # This would normally be populated by the API with relationship loader
        badges_category = test_reward_categories["badges"]
        category_with_rewards = RewardCategoryWithRewards.model_validate(badges_category)
        
        assert category_with_rewards.id == badges_category.id
        assert category_with_rewards.name == "Badges"
        assert isinstance(category_with_rewards.rewards, list)


class TestRewardSchemas:
    def test_reward_create(self):
        # Test valid reward creation
        reward = RewardCreate(
            name="Math Master",
            description="Completamento di tutti i percorsi di matematica",
            reward_type=RewardType.BADGE,
            rarity=RewardRarity.RARE,
            icon_url="https://example.com/icons/math_master.png",
            image_url="https://example.com/images/math_master.png",
            points_value=50,
            requirements={"completed_paths": ["math_algebra", "math_geometry", "math_arithmetic"]},
            category_id="category-uuid",
            created_by="admin-uuid"
        )
        
        assert reward.name == "Math Master"
        assert reward.reward_type == RewardType.BADGE
        assert reward.rarity == RewardRarity.RARE
        assert reward.points_value == 50
        assert reward.category_id == "category-uuid"
        assert reward.created_by == "admin-uuid"
        
        # Test default values
        reward = RewardCreate(
            name="Simple Reward",
            reward_type=RewardType.BADGE,
            category_id="category-uuid",
            created_by="admin-uuid"
        )
        
        assert reward.rarity == RewardRarity.COMMON
        assert reward.is_active is True
        assert reward.is_public is True
        assert reward.points_value == 0
    
    def test_reward_update(self):
        # Test partial update
        reward_update = RewardUpdate(name="Updated Math Master")
        assert reward_update.name == "Updated Math Master"
        assert reward_update.description is None
        assert reward_update.reward_type is None
        
        # Test complete update
        reward_update = RewardUpdate(
            name="Updated Math Master",
            description="Updated description",
            reward_type=RewardType.TROPHY,
            rarity=RewardRarity.EPIC,
            points_value=75,
            is_active=False
        )
        
        assert reward_update.name == "Updated Math Master"
        assert reward_update.reward_type == RewardType.TROPHY
        assert reward_update.rarity == RewardRarity.EPIC
        assert reward_update.points_value == 75
        assert reward_update.is_active is False
        
        # Test empty update (valid for PATCH)
        reward_update = RewardUpdate()
        assert reward_update.name is None
        assert reward_update.description is None
        assert reward_update.reward_type is None
    
    def test_reward_response(self, test_rewards):
        # Test conversion from ORM model
        math_master = test_rewards["math_master"]
        reward_response = RewardInDB.model_validate(math_master)
        
        assert reward_response.id == math_master.id
        assert reward_response.name == "Math Master"
        assert reward_response.reward_type == RewardType.BADGE
        assert reward_response.category_id == math_master.category_id
        assert reward_response.created_by == "admin-uuid-1"
        assert reward_response.created_at is not None
        assert reward_response.updated_at is not None
    
    def test_reward_with_category(self, test_rewards):
        # This would normally be populated by the API with relationship loader
        math_master = test_rewards["math_master"]
        reward_with_category = RewardWithCategory.model_validate(math_master)
        
        assert reward_with_category.id == math_master.id
        assert reward_with_category.name == "Math Master"
        assert reward_with_category.category.id == math_master.category_id
        assert reward_with_category.category.name == "Badges"


class TestUserRewardSchemas:
    def test_user_reward_create(self):
        # Test valid user reward creation
        user_reward = UserRewardCreate(
            user_id="student-uuid",
            reward_id="reward-uuid",
            is_displayed=True,
            reward_metadata={"earned_for": "Completamento percorso"}
        )
        
        assert user_reward.user_id == "student-uuid"
        assert user_reward.reward_id == "reward-uuid"
        assert user_reward.is_displayed is True
        assert user_reward.reward_metadata == {"earned_for": "Completamento percorso"}
        
        # Test default values
        user_reward = UserRewardCreate(
            user_id="student-uuid",
            reward_id="reward-uuid"
        )
        
        assert user_reward.is_displayed is True
        assert user_reward.reward_metadata is None
    
    def test_user_reward_update(self):
        # Test partial update
        user_reward_update = UserRewardUpdate(is_displayed=False)
        assert user_reward_update.is_displayed is False
        assert user_reward_update.reward_metadata is None
        
        # Test complete update
        user_reward_update = UserRewardUpdate(
            is_displayed=False,
            reward_metadata={"note": "Updated note"}
        )
        
        assert user_reward_update.is_displayed is False
        assert user_reward_update.reward_metadata == {"note": "Updated note"}
        
        # Test empty update (valid for PATCH)
        user_reward_update = UserRewardUpdate()
        assert user_reward_update.is_displayed is None
        assert user_reward_update.reward_metadata is None
    
    def test_user_reward_response(self, test_user_rewards):
        # Test conversion from ORM model
        user1_math = test_user_rewards["user1_math"]
        user_reward_response = UserRewardInDB.model_validate(user1_math)
        
        assert user_reward_response.id == user1_math.id
        assert user_reward_response.user_id == "student-uuid-1"
        assert user_reward_response.reward_id == user1_math.reward_id
        assert user_reward_response.is_displayed is True
        assert user_reward_response.earned_at is not None
    
    def test_user_reward_with_reward(self, test_user_rewards):
        # This would normally be populated by the API with relationship loader
        user1_math = test_user_rewards["user1_math"]
        user_reward_with_reward = UserRewardWithReward.model_validate(user1_math)
        
        assert user_reward_with_reward.id == user1_math.id
        assert user_reward_with_reward.user_id == "student-uuid-1"
        assert user_reward_with_reward.reward.id == user1_math.reward_id
        assert user_reward_with_reward.reward.name == "Math Master"


class TestRewardProgressSchemas:
    def test_reward_progress_create(self):
        # Test valid reward progress creation
        reward_progress = RewardProgressCreate(
            user_id="student-uuid",
            reward_id="reward-uuid",
            current_progress=5,
            target_progress=10,
            progress_metadata={"steps_completed": ["step1", "step2"]}
        )
        
        assert reward_progress.user_id == "student-uuid"
        assert reward_progress.reward_id == "reward-uuid"
        assert reward_progress.current_progress == 5
        assert reward_progress.target_progress == 10
        assert reward_progress.progress_metadata == {"steps_completed": ["step1", "step2"]}
        
        # Test default values
        reward_progress = RewardProgressCreate(
            user_id="student-uuid",
            reward_id="reward-uuid",
            target_progress=10
        )
        
        assert reward_progress.current_progress == 0
        assert reward_progress.progress_metadata is None
    
    def test_reward_progress_update(self):
        # Test partial update
        progress_update = RewardProgressUpdate(current_progress=7)
        assert progress_update.current_progress == 7
        assert progress_update.target_progress is None
        assert progress_update.progress_metadata is None
        
        # Test complete update
        progress_update = RewardProgressUpdate(
            current_progress=7,
            target_progress=12,
            progress_metadata={"steps_completed": ["step1", "step2", "step3"]}
        )
        
        assert progress_update.current_progress == 7
        assert progress_update.target_progress == 12
        assert progress_update.progress_metadata["steps_completed"] == ["step1", "step2", "step3"]
        
        # Test empty update (valid for PATCH)
        progress_update = RewardProgressUpdate()
        assert progress_update.current_progress is None
        assert progress_update.target_progress is None
        assert progress_update.progress_metadata is None
    
    def test_reward_progress_response(self, test_reward_progress):
        # Test conversion from ORM model
        user1_reading = test_reward_progress["user1_reading"]
        progress_response = RewardProgressInDB.model_validate(user1_reading)
        
        assert progress_response.id == user1_reading.id
        assert progress_response.user_id == "student-uuid-1"
        assert progress_response.reward_id == user1_reading.reward_id
        assert progress_response.current_progress == 12
        assert progress_response.target_progress == 15
        assert progress_response.last_updated is not None
