import pytest
from sqlalchemy.exc import IntegrityError
from datetime import datetime

from app.db.models.reward import (
    RewardCategory, Reward, UserReward, RewardProgress,
    RewardType, RewardRarity
)


def test_reward_category_model(db, test_reward_categories):
    """Test the RewardCategory model and its properties."""
    badges_category = test_reward_categories["badges"]
    
    # Check if category was created correctly
    assert badges_category.name == "Badges"
    assert badges_category.description == "Badge per competenze specifiche"
    
    # Test unique constraint on category name
    duplicate_category = RewardCategory(name="Badges", description="Duplicato")
    db.add(duplicate_category)
    with pytest.raises(IntegrityError):
        db.commit()
    db.rollback()
    
    # Test timestamps
    assert badges_category.created_at is not None
    assert badges_category.updated_at is not None


def test_reward_model(db, test_rewards, test_reward_categories):
    """Test the Reward model and its properties."""
    math_master = test_rewards["math_master"]
    
    # Check if reward was created correctly
    assert math_master.name == "Math Master"
    assert math_master.description == "Completamento di tutti i percorsi di matematica"
    assert math_master.reward_type == RewardType.BADGE
    assert math_master.rarity == RewardRarity.RARE
    assert math_master.icon_url == "https://example.com/icons/math_master.png"
    assert math_master.image_url == "https://example.com/images/math_master.png"
    assert math_master.points_value == 50
    assert math_master.requirements == {"completed_paths": ["math_algebra", "math_geometry", "math_arithmetic"]}
    assert math_master.is_active is True
    assert math_master.is_public is True
    assert math_master.created_by == "admin-uuid-1"
    
    # Test relationship with category
    assert math_master.category_id == test_reward_categories["badges"].id
    assert math_master.category.name == "Badges"
    
    # Test timestamps
    assert math_master.created_at is not None
    assert math_master.updated_at is not None


def test_user_reward_model(db, test_user_rewards, test_rewards):
    """Test the UserReward model and its properties."""
    user1_math = test_user_rewards["user1_math"]
    
    # Check if user reward was created correctly
    assert user1_math.user_id == "student-uuid-1"
    assert user1_math.reward_id == test_rewards["math_master"].id
    assert user1_math.is_displayed is True
    assert user1_math.reward_metadata == {"earned_for": "Completamento percorso algebra avanzata"}
    
    # Test relationship with reward
    assert user1_math.reward.name == "Math Master"
    assert user1_math.reward.reward_type == RewardType.BADGE
    
    # Test timestamps
    assert user1_math.earned_at is not None


def test_reward_progress_model(db, test_reward_progress, test_rewards):
    """Test the RewardProgress model and its properties."""
    user1_reading = test_reward_progress["user1_reading"]
    
    # Check if reward progress was created correctly
    assert user1_reading.user_id == "student-uuid-1"
    assert user1_reading.reward_id == test_rewards["reading_certificate"].id
    assert user1_reading.current_progress == 12
    assert user1_reading.target_progress == 15
    assert user1_reading.progress_metadata == {"books_read": ["book1", "book2", "book3"]}
    
    # Test timestamps
    assert user1_reading.last_updated is not None


def test_cascade_delete_reward_category(db, test_reward_categories, test_rewards):
    """Test that deleting a RewardCategory cascades to its Rewards."""
    # Get counts before deletion
    badges_id = test_reward_categories["badges"].id
    rewards_before = db.query(Reward).filter_by(category_id=badges_id).count()
    assert rewards_before > 0
    
    # Delete category
    db.delete(test_reward_categories["badges"])
    db.commit()
    
    # Check if rewards were deleted
    rewards_after = db.query(Reward).filter_by(category_id=badges_id).count()
    assert rewards_after == 0


def test_cascade_delete_reward(db, test_rewards, test_user_rewards, test_reward_progress):
    """Test that deleting a Reward cascades to its UserRewards and RewardProgress."""
    # Get counts before deletion
    math_master_id = test_rewards["math_master"].id
    user_rewards_before = db.query(UserReward).filter_by(reward_id=math_master_id).count()
    progress_before = db.query(RewardProgress).filter_by(reward_id=math_master_id).count()
    
    assert user_rewards_before > 0
    assert progress_before > 0 if math_master_id == test_reward_progress["user2_math"].reward_id else True
    
    # Delete reward
    db.delete(test_rewards["math_master"])
    db.commit()
    
    # Check if related records were deleted
    user_rewards_after = db.query(UserReward).filter_by(reward_id=math_master_id).count()
    progress_after = db.query(RewardProgress).filter_by(reward_id=math_master_id).count()
    
    assert user_rewards_after == 0
    assert progress_after == 0


def test_reward_types_enum(db):
    """Test the RewardType enum values."""
    assert RewardType.BADGE.value == "badge"
    assert RewardType.CERTIFICATE.value == "certificate"
    assert RewardType.ACHIEVEMENT.value == "achievement"
    assert RewardType.POINT.value == "point"
    assert RewardType.TROPHY.value == "trophy"
    assert RewardType.PRIVILEGE.value == "privilege"


def test_reward_rarity_enum(db):
    """Test the RewardRarity enum values."""
    assert RewardRarity.COMMON.value == "common"
    assert RewardRarity.UNCOMMON.value == "uncommon"
    assert RewardRarity.RARE.value == "rare"
    assert RewardRarity.EPIC.value == "epic"
    assert RewardRarity.LEGENDARY.value == "legendary"


def test_update_reward_category(db, test_reward_categories):
    """Test updating a RewardCategory."""
    achievements = test_reward_categories["achievements"]
    
    # Update category
    achievements.name = "Advanced Achievements"
    achievements.description = "Traguardi di livello avanzato"
    db.commit()
    db.refresh(achievements)
    
    # Check if updated correctly
    assert achievements.name == "Advanced Achievements"
    assert achievements.description == "Traguardi di livello avanzato"
    assert achievements.updated_at is not None


def test_update_reward(db, test_rewards):
    """Test updating a Reward."""
    first_quiz = test_rewards["first_quiz"]
    
    # Update reward
    first_quiz.name = "First Quiz Completed"
    first_quiz.description = "Descrizione aggiornata"
    first_quiz.points_value = 15
    first_quiz.rarity = RewardRarity.UNCOMMON
    db.commit()
    db.refresh(first_quiz)
    
    # Check if updated correctly
    assert first_quiz.name == "First Quiz Completed"
    assert first_quiz.description == "Descrizione aggiornata"
    assert first_quiz.points_value == 15
    assert first_quiz.rarity == RewardRarity.UNCOMMON
    assert first_quiz.updated_at is not None


def test_update_user_reward(db, test_user_rewards):
    """Test updating a UserReward."""
    user1_math = test_user_rewards["user1_math"]
    
    # Update user reward
    user1_math.is_displayed = False
    user1_math.reward_metadata = {"earned_for": "Completamento percorso algebra avanzata", "note": "Eccellente"}
    db.commit()
    db.refresh(user1_math)
    
    # Check if updated correctly
    assert user1_math.is_displayed is False
    assert user1_math.reward_metadata["note"] == "Eccellente"


def test_update_reward_progress(db, test_reward_progress):
    """Test updating a RewardProgress."""
    user1_reading = test_reward_progress["user1_reading"]
    
    # Update progress
    old_last_updated = user1_reading.last_updated
    user1_reading.current_progress = 14
    user1_reading.progress_metadata = {"books_read": ["book1", "book2", "book3", "book4"]}
    db.commit()
    db.refresh(user1_reading)
    
    # Check if updated correctly
    assert user1_reading.current_progress == 14
    assert len(user1_reading.progress_metadata["books_read"]) == 4
    assert user1_reading.last_updated >= old_last_updated  # Should be updated automatically
