import pytest
from pydantic import ValidationError
from datetime import datetime

from app.schemas.path import (
    PathCategoryCreate, PathCategoryUpdate, PathCategory,
    PathTemplateCreate, PathTemplateUpdate, PathTemplate, PathTemplateSummary,
    PathNodeTemplateCreate, PathNodeTemplate, PathNodeType,
    PathCreate, PathUpdate, Path, PathSummary,
    PathNodeCreate, PathNode, CompletionStatus,
    UpdateNodeStatus
)


class TestPathCategorySchemas:
    def test_path_category_create(self):
        # Test valid category creation
        category = PathCategoryCreate(name="Matematica", description="Percorsi di matematica")
        assert category.name == "Matematica"
        assert category.description == "Percorsi di matematica"
        
        # Test category creation without description
        category = PathCategoryCreate(name="Matematica")
        assert category.name == "Matematica"
        assert category.description is None
        
        # Test empty name validation
        with pytest.raises(ValidationError):
            PathCategoryCreate(name="", description="Percorsi di matematica")
    
    def test_path_category_update(self):
        # Test partial update
        category_update = PathCategoryUpdate(name="Matematica Avanzata")
        assert category_update.name == "Matematica Avanzata"
        assert category_update.description is None
        
        # Test complete update
        category_update = PathCategoryUpdate(
            name="Matematica Avanzata", 
            description="Percorsi avanzati di matematica"
        )
        assert category_update.name == "Matematica Avanzata"
        assert category_update.description == "Percorsi avanzati di matematica"
        
        # Test empty update (valid for PATCH)
        category_update = PathCategoryUpdate()
        assert category_update.name is None
        assert category_update.description is None
    
    def test_path_category_response(self, test_categories):
        # Test conversion from ORM model
        math_category = test_categories["math"]
        category_response = PathCategory.from_orm(math_category)
        
        assert category_response.id == math_category.id
        assert category_response.name == "Matematica"
        assert category_response.description == "Percorsi di matematica"


class TestPathNodeTemplateSchemas:
    def test_path_node_template_create_content(self):
        # Test valid content node template creation
        node = PathNodeTemplateCreate(
            title="Introduzione all'Algebra",
            description="Lezione introduttiva sui concetti base dell'algebra",
            node_type=PathNodeType.CONTENT,
            points=10,
            order=1,
            content={
                "content": "Questa è un'introduzione all'algebra...",
                "content_type": "text"
            },
            estimated_time=30
        )
        assert node.title == "Introduzione all'Algebra"
        assert node.node_type == PathNodeType.CONTENT
        assert node.content["content_type"] == "text"
        
        # Test validation for content node with missing required fields
        with pytest.raises(ValidationError):
            PathNodeTemplateCreate(
                title="Introduzione all'Algebra",
                node_type=PathNodeType.CONTENT,
                content={}  # Missing required fields
            )
        
        # Test validation for content node with invalid content_type
        with pytest.raises(ValidationError):
            PathNodeTemplateCreate(
                title="Introduzione all'Algebra",
                node_type=PathNodeType.CONTENT,
                content={
                    "content": "Contenuto",
                    "content_type": "invalid_type"  # Invalid content_type
                }
            )
        
        # Test validation for video content without URL
        with pytest.raises(ValidationError):
            PathNodeTemplateCreate(
                title="Video sull'Algebra",
                node_type=PathNodeType.CONTENT,
                content={
                    "content": "Descrizione del video",
                    "content_type": "video"
                    # Missing URL
                }
            )
    
    def test_path_node_template_create_quiz(self):
        # Test valid quiz node template creation
        node = PathNodeTemplateCreate(
            title="Quiz sulle Equazioni",
            description="Quiz per testare la comprensione delle equazioni",
            node_type=PathNodeType.QUIZ,
            points=20,
            content={
                "quiz_template_id": "quiz-template-uuid"
            }
        )
        assert node.title == "Quiz sulle Equazioni"
        assert node.node_type == PathNodeType.QUIZ
        assert node.content["quiz_template_id"] == "quiz-template-uuid"
        
        # Test validation for quiz node with missing quiz_template_id
        with pytest.raises(ValidationError):
            PathNodeTemplateCreate(
                title="Quiz sulle Equazioni",
                node_type=PathNodeType.QUIZ,
                content={}  # Missing quiz_template_id
            )
    
    def test_path_node_template_create_task(self):
        # Test valid task node template creation
        node = PathNodeTemplateCreate(
            title="Esercizio sui Verbi",
            description="Esercizio pratico sulla coniugazione dei verbi",
            node_type=PathNodeType.TASK,
            points=15,
            content={
                "task_description": "Coniuga i seguenti verbi al presente indicativo...",
                "verification_type": "manual"
            }
        )
        assert node.title == "Esercizio sui Verbi"
        assert node.node_type == PathNodeType.TASK
        assert node.content["verification_type"] == "manual"
        
        # Test validation for task node with missing task_description
        with pytest.raises(ValidationError):
            PathNodeTemplateCreate(
                title="Esercizio sui Verbi",
                node_type=PathNodeType.TASK,
                content={}  # Missing task_description
            )
        
        # Test validation for task node with invalid verification_type
        with pytest.raises(ValidationError):
            PathNodeTemplateCreate(
                title="Esercizio sui Verbi",
                node_type=PathNodeType.TASK,
                content={
                    "task_description": "Descrizione",
                    "verification_type": "invalid"  # Invalid verification_type
                }
            )
    
    def test_path_node_template_create_reward(self):
        # Test valid reward node template creation
        node = PathNodeTemplateCreate(
            title="Badge Matematica",
            description="Badge per il completamento del modulo di matematica",
            node_type=PathNodeType.REWARD,
            points=5,
            content={
                "reward_id": "reward-uuid",
                "reward_type": "badge"
            }
        )
        assert node.title == "Badge Matematica"
        assert node.node_type == PathNodeType.REWARD
        assert node.content["reward_type"] == "badge"
        
        # Test validation for reward node with missing fields
        with pytest.raises(ValidationError):
            PathNodeTemplateCreate(
                title="Badge Matematica",
                node_type=PathNodeType.REWARD,
                content={
                    "reward_id": "reward-uuid"
                    # Missing reward_type
                }
            )
        
        # Test validation for reward node with invalid reward_type
        with pytest.raises(ValidationError):
            PathNodeTemplateCreate(
                title="Badge Matematica",
                node_type=PathNodeType.REWARD,
                content={
                    "reward_id": "reward-uuid",
                    "reward_type": "invalid_type"  # Invalid reward_type
                }
            )
    
    def test_path_node_template_response(self, test_path_node_templates):
        # Test conversion from ORM model
        math_node1 = test_path_node_templates["math_node1"]
        node_response = PathNodeTemplate.from_orm(math_node1)
        
        assert node_response.id == math_node1.id
        assert node_response.uuid == math_node1.uuid
        assert node_response.title == "Introduzione all'Algebra"
        assert node_response.node_type == PathNodeType.CONTENT
        assert node_response.path_template_id == math_node1.path_template_id


class TestPathTemplateSchemas:
    def test_path_template_create(self):
        # Test valid template creation with minimum fields
        template = PathTemplateCreate(
            title="Percorso di Algebra",
            created_by="admin-uuid",
            created_by_role="admin"
        )
        assert template.title == "Percorso di Algebra"
        assert template.created_by == "admin-uuid"
        assert template.created_by_role == "admin"
        assert template.difficulty_level == 1  # Default value
        assert template.nodes == []
        
        # Test valid template creation with all fields
        node = PathNodeTemplateCreate(
            title="Introduzione all'Algebra",
            node_type=PathNodeType.CONTENT,
            content={
                "content": "Contenuto",
                "content_type": "text"
            }
        )
        
        template = PathTemplateCreate(
            title="Percorso di Algebra",
            description="Un percorso per imparare l'algebra",
            instructions="Segui le lezioni e completa i quiz",
            difficulty_level=2,
            points=100,
            estimated_days=14,
            is_active=True,
            is_public=False,
            category_id=1,
            created_by="admin-uuid",
            created_by_role="admin",
            nodes=[node]
        )
        assert template.title == "Percorso di Algebra"
        assert template.difficulty_level == 2
        assert len(template.nodes) == 1
        
        # Test difficulty level validation
        with pytest.raises(ValidationError):
            PathTemplateCreate(
                title="Percorso invalido",
                difficulty_level=6,  # Should be between 1 and 5
                created_by="admin-uuid",
                created_by_role="admin"
            )
        
        # Test created_by_role validation
        with pytest.raises(ValidationError):
            PathTemplateCreate(
                title="Percorso invalido",
                created_by="admin-uuid",
                created_by_role="invalid_role"  # Should be 'admin' or 'parent'
            )
    
    def test_path_template_update(self):
        # Test partial update
        template_update = PathTemplateUpdate(title="Percorso di Algebra aggiornato")
        assert template_update.title == "Percorso di Algebra aggiornato"
        assert template_update.description is None
        assert template_update.difficulty_level is None
        
        # Test complete update
        template_update = PathTemplateUpdate(
            title="Percorso di Algebra aggiornato",
            description="Descrizione aggiornata",
            instructions="Istruzioni aggiornate",
            difficulty_level=3,
            points=120,
            estimated_days=21,
            is_active=False,
            is_public=True,
            category_id=2
        )
        assert template_update.title == "Percorso di Algebra aggiornato"
        assert template_update.difficulty_level == 3
        assert template_update.is_active is False
        assert template_update.is_public is True
        
        # Test empty update (valid for PATCH)
        template_update = PathTemplateUpdate()
        assert template_update.title is None
        assert template_update.description is None
    
    def test_path_template_response(self, test_path_templates):
        # Test conversion from ORM model
        math_template = test_path_templates["math"]
        template_response = PathTemplate.from_orm(math_template)
        
        assert template_response.id == math_template.id
        assert template_response.uuid == math_template.uuid
        assert template_response.title == "Percorso di Algebra"
        assert template_response.difficulty_level == 2
        assert template_response.points == 100
        assert template_response.created_by == "admin-uuid"
        assert template_response.created_by_role == "admin"
        
        # Test PathTemplateSummary
        template_summary = PathTemplateSummary.from_orm(math_template)
        template_summary.node_count = 3  # This would be set by the API
        
        assert template_summary.id == math_template.id
        assert template_summary.title == "Percorso di Algebra"
        assert template_summary.node_count == 3


class TestPathSchemas:
    def test_path_create(self):
        # Test valid path creation
        path = PathCreate(
            template_id=1,
            student_id="student-uuid",
            assigned_by="parent-uuid"
        )
        assert path.template_id == 1
        assert path.student_id == "student-uuid"
        assert path.assigned_by == "parent-uuid"
        
        # Test path creation with deadline
        path = PathCreate(
            template_id=1,
            student_id="student-uuid",
            assigned_by="parent-uuid",
            deadline=datetime.now()
        )
        assert path.template_id == 1
        assert path.deadline is not None
    
    def test_path_update(self):
        # Test partial update
        path_update = PathUpdate(status=CompletionStatus.IN_PROGRESS)
        assert path_update.status == CompletionStatus.IN_PROGRESS
        assert path_update.student_id is None
        assert path_update.assigned_by is None
        
        # Test complete update
        path_update = PathUpdate(
            student_id="new-student-uuid",
            assigned_by="new-parent-uuid",
            status=CompletionStatus.COMPLETED,
            deadline=datetime.now()
        )
        assert path_update.student_id == "new-student-uuid"
        assert path_update.assigned_by == "new-parent-uuid"
        assert path_update.status == CompletionStatus.COMPLETED
        assert path_update.deadline is not None
    
    def test_path_response(self, test_paths):
        # Test conversion from ORM model
        math_path = test_paths["math"]
        path_response = Path.from_orm(math_path)
        
        assert path_response.id == math_path.id
        assert path_response.uuid == math_path.uuid
        assert path_response.template_id == math_path.template_id
        assert path_response.student_id == "student-uuid-1"
        assert path_response.status == CompletionStatus.IN_PROGRESS
        assert path_response.current_score == 10
        assert path_response.max_score == 100
        assert path_response.completion_percentage == 10.0
        
        # Test PathSummary
        path_summary = PathSummary(
            template_title="Percorso di Algebra",
            node_count=3,
            completed_nodes=1,
            created_at=datetime.now()
        )
        assert path_summary.template_title == "Percorso di Algebra"
        assert path_summary.node_count == 3
        assert path_summary.completed_nodes == 1


class TestUpdateNodeStatusSchema:
    def test_update_node_status(self):
        # Test valid status update
        update = UpdateNodeStatus(
            node_uuid="node-uuid",
            status=CompletionStatus.COMPLETED,
            score=10,
            feedback="Ben fatto!"
        )
        assert update.node_uuid == "node-uuid"
        assert update.status == CompletionStatus.COMPLETED
        assert update.score == 10
        assert update.feedback == "Ben fatto!"
        
        # Test status update without optional fields
        update = UpdateNodeStatus(
            node_uuid="node-uuid",
            status=CompletionStatus.IN_PROGRESS
        )
        assert update.node_uuid == "node-uuid"
        assert update.status == CompletionStatus.IN_PROGRESS
        assert update.score is None
        assert update.feedback is None
        
        # Test status validation
        with pytest.raises(ValidationError):
            UpdateNodeStatus(
                node_uuid="node-uuid",
                status="invalid_status"  # Invalid status
            )
