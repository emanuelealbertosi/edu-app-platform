import pytest
from sqlalchemy.exc import IntegrityError
from datetime import datetime

from app.db.models.path import (
    PathCategory, PathTemplate, PathNodeTemplate, 
    Path, PathNode, PathNodeType, CompletionStatus
)


def test_path_category_model(db, test_categories):
    """Test the PathCategory model and its properties."""
    math_category = test_categories["math"]
    
    # Check if category was created correctly
    assert math_category.name == "Matematica"
    assert math_category.description == "Percorsi di matematica"
    
    # Test string representation
    assert str(math_category) == "<PathCategory Matematica>"
    
    # Test unique constraint on category name
    duplicate_category = PathCategory(name="Matematica", description="Duplicato")
    db.add(duplicate_category)
    with pytest.raises(IntegrityError):
        db.commit()
    db.rollback()


def test_path_template_model(db, test_path_templates, test_categories):
    """Test the PathTemplate model and its properties."""
    math_template = test_path_templates["math"]
    
    # Check if template was created correctly
    assert math_template.title == "Percorso di Algebra"
    assert math_template.description == "Un percorso per imparare l'algebra di base"
    assert math_template.difficulty_level == 2
    assert math_template.points == 100
    assert math_template.estimated_days == 14
    assert math_template.is_active is True
    assert math_template.is_public is False
    assert math_template.created_by == "admin-uuid"
    assert math_template.created_by_role == "admin"
    
    # Check UUID generation
    assert math_template.uuid is not None
    
    # Test relationship with category
    assert math_template.category_id == test_categories["math"].id
    assert math_template.category.name == "Matematica"
    
    # Test string representation
    assert str(math_template) == "<PathTemplate Percorso di Algebra>"


def test_path_node_template_model(db, test_path_node_templates, test_path_templates):
    """Test the PathNodeTemplate model and its properties."""
    math_node1 = test_path_node_templates["math_node1"]
    
    # Check if node template was created correctly
    assert math_node1.title == "Introduzione all'Algebra"
    assert math_node1.description == "Lezione introduttiva sui concetti base dell'algebra"
    assert math_node1.node_type == PathNodeType.CONTENT
    assert math_node1.points == 10
    assert math_node1.order == 1
    assert math_node1.estimated_time == 30
    assert math_node1.content == {"content": "Questa è un'introduzione all'algebra...", "content_type": "text"}
    
    # Check UUID generation
    assert math_node1.uuid is not None
    
    # Test relationship with path template
    assert math_node1.path_template_id == test_path_templates["math"].id
    assert math_node1.path_template.title == "Percorso di Algebra"
    
    # Test string representation
    assert str(math_node1) == "<PathNodeTemplate Introduzione all'Algebra>"
    
    # Test for node with dependencies
    math_node2 = test_path_node_templates["math_node2"]
    assert math_node2.dependencies == {"dependencies": ["#node1"]}
    assert math_node2.node_type == PathNodeType.QUIZ
    assert math_node2.content == {"quiz_template_id": "quiz-template-uuid-1"}


def test_path_model(db, test_paths, test_path_templates):
    """Test the Path model and its properties."""
    math_path = test_paths["math"]
    
    # Check if path was created correctly
    assert math_path.student_id == "student-uuid-1"
    assert math_path.assigned_by == "parent-uuid-1"
    assert math_path.status == CompletionStatus.IN_PROGRESS
    assert math_path.current_score == 10
    assert math_path.max_score == 100
    assert math_path.completion_percentage == 10.0
    assert math_path.started_at is not None
    assert math_path.completed_at is None
    assert math_path.deadline is not None
    
    # Check UUID generation
    assert math_path.uuid is not None
    
    # Test relationship with template
    assert math_path.template_id == test_path_templates["math"].id
    assert math_path.template.title == "Percorso di Algebra"
    
    # Test string representation
    assert str(math_path).startswith(f"<Path {math_path.id}")


def test_path_node_model(db, test_path_nodes, test_paths, test_path_node_templates):
    """Test the PathNode model and its properties."""
    math_node1 = test_path_nodes["math_node1"]
    
    # Check if node was created correctly
    assert math_node1.title == "Introduzione all'Algebra"
    assert math_node1.description == "Lezione introduttiva sui concetti base dell'algebra"
    assert math_node1.node_type == PathNodeType.CONTENT
    assert math_node1.points == 10
    assert math_node1.order == 1
    assert math_node1.content == {"content": "Questa è un'introduzione all'algebra...", "content_type": "text"}
    assert math_node1.status == CompletionStatus.COMPLETED
    assert math_node1.score == 10
    assert math_node1.started_at is not None
    assert math_node1.completed_at is not None
    
    # Check UUID generation
    assert math_node1.uuid is not None
    
    # Test relationship with path
    assert math_node1.path_id == test_paths["math"].id
    assert math_node1.path.student_id == "student-uuid-1"
    
    # Test relationship with template
    assert math_node1.template_id == test_path_node_templates["math_node1"].id
    assert math_node1.template.node_type == PathNodeType.CONTENT
    
    # Test dependencies for other nodes
    math_node2 = test_path_nodes["math_node2"]
    assert math_node2.dependencies is not None
    assert math_node1.uuid in math_node2.dependencies["dependencies"]


def test_cascade_delete_path_template(db, test_path_templates, test_path_node_templates):
    """Test that deleting a PathTemplate deletes its PathNodeTemplates."""
    # Get counts before deletion
    node_count_before = db.query(PathNodeTemplate).count()
    template_id = test_path_templates["math"].id
    
    # Delete path template
    db.delete(test_path_templates["math"])
    db.commit()
    
    # Check if node templates were deleted
    node_count_after = db.query(PathNodeTemplate).count()
    assert node_count_after < node_count_before
    
    # Check specifically that the math nodes are gone
    math_nodes = db.query(PathNodeTemplate).filter_by(path_template_id=template_id).all()
    assert len(math_nodes) == 0


def test_cascade_delete_path(db, test_paths, test_path_nodes):
    """Test that deleting a Path deletes its PathNodes."""
    # Get counts before deletion
    node_count_before = db.query(PathNode).count()
    path_id = test_paths["math"].id
    
    # Delete path
    db.delete(test_paths["math"])
    db.commit()
    
    # Check if nodes were deleted
    node_count_after = db.query(PathNode).count()
    assert node_count_after < node_count_before
    
    # Check specifically that the math path nodes are gone
    math_nodes = db.query(PathNode).filter_by(path_id=path_id).all()
    assert len(math_nodes) == 0


def test_path_status_transitions(db, test_paths):
    """Test path status transitions."""
    language_path = test_paths["language"]
    
    # Start the path
    language_path.status = CompletionStatus.IN_PROGRESS
    language_path.started_at = datetime.now()
    db.commit()
    db.refresh(language_path)
    
    assert language_path.status == CompletionStatus.IN_PROGRESS
    assert language_path.started_at is not None
    assert language_path.completed_at is None
    
    # Complete the path
    language_path.status = CompletionStatus.COMPLETED
    language_path.completed_at = datetime.now()
    language_path.current_score = 75
    language_path.completion_percentage = 100.0
    db.commit()
    db.refresh(language_path)
    
    assert language_path.status == CompletionStatus.COMPLETED
    assert language_path.completed_at is not None
    assert language_path.current_score == 75
    assert language_path.completion_percentage == 100.0
    
    # Try setting to failed
    language_path.status = CompletionStatus.FAILED
    db.commit()
    db.refresh(language_path)
    
    assert language_path.status == CompletionStatus.FAILED


def test_path_node_status_transitions(db, test_path_nodes):
    """Test path node status transitions."""
    lang_node1 = test_path_nodes["lang_node1"]
    
    # Start the node
    lang_node1.status = CompletionStatus.IN_PROGRESS
    lang_node1.started_at = datetime.now()
    db.commit()
    db.refresh(lang_node1)
    
    assert lang_node1.status == CompletionStatus.IN_PROGRESS
    assert lang_node1.started_at is not None
    assert lang_node1.completed_at is None
    
    # Complete the node
    lang_node1.status = CompletionStatus.COMPLETED
    lang_node1.completed_at = datetime.now()
    lang_node1.score = 8
    db.commit()
    db.refresh(lang_node1)
    
    assert lang_node1.status == CompletionStatus.COMPLETED
    assert lang_node1.completed_at is not None
    assert lang_node1.score == 8
