import pytest
import json
from fastapi import status

def test_get_path_categories(client, test_categories):
    """Test getting all path categories."""
    response = client.get("/categories/")
    assert response.status_code == status.HTTP_200_OK
    
    data = response.json()
    assert len(data) == 3
    assert data[0]["name"] == "Matematica"
    assert data[1]["name"] == "Scienze"
    assert data[2]["name"] == "Lingua"


def test_create_path_category(client):
    """Test creating a new path category."""
    category_data = {
        "name": "Storia",
        "description": "Percorsi di storia"
    }
    
    response = client.post("/categories/", json=category_data)
    assert response.status_code == status.HTTP_201_CREATED
    
    data = response.json()
    assert data["name"] == "Storia"
    assert data["description"] == "Percorsi di storia"
    assert "id" in data


def test_get_path_category(client, test_categories):
    """Test getting a single path category by ID."""
    math_id = test_categories["math"].id
    
    response = client.get(f"/categories/{math_id}")
    assert response.status_code == status.HTTP_200_OK
    
    data = response.json()
    assert data["name"] == "Matematica"
    assert data["description"] == "Percorsi di matematica"


def test_update_path_category(client, test_categories):
    """Test updating a path category."""
    math_id = test_categories["math"].id
    
    update_data = {
        "name": "Matematica Avanzata",
        "description": "Percorsi avanzati di matematica"
    }
    
    response = client.put(f"/categories/{math_id}", json=update_data)
    assert response.status_code == status.HTTP_200_OK
    
    data = response.json()
    assert data["name"] == "Matematica Avanzata"
    assert data["description"] == "Percorsi avanzati di matematica"
    
    # Test partial update with PATCH
    patch_data = {"description": "Descrizione aggiornata"}
    response = client.patch(f"/categories/{math_id}", json=patch_data)
    assert response.status_code == status.HTTP_200_OK
    
    data = response.json()
    assert data["name"] == "Matematica Avanzata"  # Unchanged
    assert data["description"] == "Descrizione aggiornata"  # Updated


def test_delete_path_category(client, test_categories):
    """Test deleting a path category."""
    science_id = test_categories["science"].id
    
    response = client.delete(f"/categories/{science_id}")
    assert response.status_code == status.HTTP_204_NO_CONTENT
    
    # Verify it's deleted
    response = client.get(f"/categories/{science_id}")
    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_get_path_templates(client, test_path_templates):
    """Test getting all path templates."""
    response = client.get("/templates/")
    assert response.status_code == status.HTTP_200_OK
    
    data = response.json()
    assert len(data) == 2
    assert data[0]["title"] == "Percorso di Algebra"
    assert data[1]["title"] == "Percorso di Grammatica"


def test_create_path_template(client, test_categories):
    """Test creating a new path template with nodes."""
    template_data = {
        "title": "Percorso di Scienze",
        "description": "Un percorso per esplorare il mondo scientifico",
        "instructions": "Segui le lezioni e completa gli esperimenti",
        "difficulty_level": 3,
        "points": 120,
        "estimated_days": 21,
        "is_active": True,
        "is_public": True,
        "category_id": test_categories["science"].id,
        "created_by": "admin-uuid-2",
        "created_by_role": "admin",
        "nodes": [
            {
                "title": "Introduzione al Metodo Scientifico",
                "description": "Impara le basi del metodo scientifico",
                "node_type": "content",
                "points": 15,
                "order": 1,
                "content": {
                    "content": "Il metodo scientifico è un processo...",
                    "content_type": "text"
                },
                "estimated_time": 30
            },
            {
                "title": "Quiz sul Metodo Scientifico",
                "description": "Verifica la comprensione del metodo scientifico",
                "node_type": "quiz",
                "points": 25,
                "order": 2,
                "content": {
                    "quiz_template_id": "quiz-template-uuid-sci"
                },
                "estimated_time": 45,
                "dependencies": {"dependencies": ["#node1"]}
            }
        ]
    }
    
    response = client.post("/templates/", json=template_data)
    assert response.status_code == status.HTTP_201_CREATED
    
    data = response.json()
    assert data["title"] == "Percorso di Scienze"
    assert data["category"]["name"] == "Scienze"
    assert len(data["nodes"]) == 2
    assert data["nodes"][0]["title"] == "Introduzione al Metodo Scientifico"
    assert data["nodes"][1]["title"] == "Quiz sul Metodo Scientifico"
    assert "uuid" in data
    assert "uuid" in data["nodes"][0]
    assert "uuid" in data["nodes"][1]


def test_get_path_template(client, test_path_templates, test_path_node_templates):
    """Test getting a single path template by ID."""
    math_id = test_path_templates["math"].id
    
    response = client.get(f"/templates/{math_id}")
    assert response.status_code == status.HTTP_200_OK
    
    data = response.json()
    assert data["title"] == "Percorso di Algebra"
    assert data["category"]["name"] == "Matematica"
    assert len(data["nodes"]) == 3
    assert data["nodes"][0]["title"] == "Introduzione all'Algebra"
    assert data["nodes"][1]["title"] == "Quiz sulle Equazioni"
    assert data["nodes"][2]["title"] == "Badge Algebra Base"


def test_update_path_template(client, test_path_templates):
    """Test updating a path template."""
    math_id = test_path_templates["math"].id
    
    update_data = {
        "title": "Percorso di Algebra Aggiornato",
        "description": "Descrizione aggiornata",
        "is_active": False
    }
    
    response = client.patch(f"/templates/{math_id}", json=update_data)
    assert response.status_code == status.HTTP_200_OK
    
    data = response.json()
    assert data["title"] == "Percorso di Algebra Aggiornato"
    assert data["description"] == "Descrizione aggiornata"
    assert data["is_active"] is False


def test_delete_path_template(client, test_path_templates):
    """Test deleting a path template."""
    language_id = test_path_templates["language"].id
    
    response = client.delete(f"/templates/{language_id}")
    assert response.status_code == status.HTTP_204_NO_CONTENT
    
    # Verify it's deleted
    response = client.get(f"/templates/{language_id}")
    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_get_paths_by_student(client, test_paths):
    """Test getting all paths for a specific student."""
    student_id = "student-uuid-1"
    
    response = client.get(f"/paths/student/{student_id}")
    assert response.status_code == status.HTTP_200_OK
    
    data = response.json()
    assert len(data) == 1
    assert data[0]["student_id"] == student_id
    assert data[0]["status"] == "in_progress"


def test_create_path(client, test_path_templates):
    """Test creating a new path for a student."""
    path_data = {
        "template_id": test_path_templates["math"].id,
        "student_id": "student-uuid-3",
        "assigned_by": "parent-uuid-3"
    }
    
    response = client.post("/paths/", json=path_data)
    assert response.status_code == status.HTTP_201_CREATED
    
    data = response.json()
    assert data["template_id"] == test_path_templates["math"].id
    assert data["student_id"] == "student-uuid-3"
    assert data["assigned_by"] == "parent-uuid-3"
    assert data["status"] == "not_started"
    assert len(data["nodes"]) == 3  # Should match the number of nodes in the template


def test_get_path(client, test_paths, test_path_nodes):
    """Test getting a single path by ID."""
    math_path_id = test_paths["math"].id
    
    response = client.get(f"/paths/{math_path_id}")
    assert response.status_code == status.HTTP_200_OK
    
    data = response.json()
    assert data["template_id"] == test_paths["math"].template_id
    assert data["student_id"] == "student-uuid-1"
    assert data["status"] == "in_progress"
    assert len(data["nodes"]) == 3
    assert data["nodes"][0]["status"] == "completed"
    assert data["nodes"][1]["status"] == "in_progress"
    assert data["nodes"][2]["status"] == "not_started"


def test_update_path(client, test_paths):
    """Test updating a path."""
    language_path_id = test_paths["language"].id
    
    update_data = {
        "status": "in_progress",
        "deadline": "2023-12-31T23:59:59"
    }
    
    response = client.patch(f"/paths/{language_path_id}", json=update_data)
    assert response.status_code == status.HTTP_200_OK
    
    data = response.json()
    assert data["status"] == "in_progress"
    assert "2023-12-31" in data["deadline"]


def test_delete_path(client, test_paths):
    """Test deleting a path."""
    language_path_id = test_paths["language"].id
    
    response = client.delete(f"/paths/{language_path_id}")
    assert response.status_code == status.HTTP_204_NO_CONTENT
    
    # Verify it's deleted
    response = client.get(f"/paths/{language_path_id}")
    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_update_node_status(client, test_paths, test_path_nodes):
    """Test updating the status of a path node."""
    node = test_path_nodes["lang_node1"]
    path_id = test_paths["language"].id
    
    update_data = {
        "node_uuid": node.uuid,
        "status": "completed",
        "score": 8,
        "feedback": "Ottimo lavoro!"
    }
    
    response = client.post(f"/paths/{path_id}/update-node", json=update_data)
    assert response.status_code == status.HTTP_200_OK
    
    data = response.json()
    assert data["nodes"][0]["status"] == "completed"
    assert data["nodes"][0]["score"] == 8
    assert data["status"] == "in_progress"  # Path status should be updated
    assert data["current_score"] == 8  # Path score should be updated


def test_get_path_templates_by_category(client, test_path_templates, test_categories):
    """Test getting path templates by category."""
    math_id = test_categories["math"].id
    
    response = client.get(f"/templates/category/{math_id}")
    assert response.status_code == status.HTTP_200_OK
    
    data = response.json()
    assert len(data) == 1
    assert data[0]["title"] == "Percorso di Algebra"
    assert data[0]["category"]["id"] == math_id


def test_search_path_templates(client, test_path_templates):
    """Test searching path templates."""
    # Search by title
    response = client.get("/templates/search", params={"query": "Algebra"})
    assert response.status_code == status.HTTP_200_OK
    
    data = response.json()
    assert len(data) == 1
    assert data[0]["title"] == "Percorso di Algebra"
    
    # Search by description
    response = client.get("/templates/search", params={"query": "grammatica"})
    assert response.status_code == status.HTTP_200_OK
    
    data = response.json()
    assert len(data) == 1
    assert data[0]["title"] == "Percorso di Grammatica"


def test_get_public_path_templates(client, test_path_templates):
    """Test getting public path templates."""
    # Update one template to be public
    math_id = test_path_templates["math"].id
    update_data = {"is_public": True}
    client.patch(f"/templates/{math_id}", json=update_data)
    
    response = client.get("/templates/public")
    assert response.status_code == status.HTTP_200_OK
    
    data = response.json()
    assert len(data) == 1
    assert data[0]["title"] == "Percorso di Algebra"
    assert data[0]["is_public"] is True
