from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Dict, Any, Union, Set
from datetime import datetime
from enum import Enum

# Enum per i tipi di nodi del percorso
class PathNodeType(str, Enum):
    QUIZ = "quiz"
    CONTENT = "content"
    TASK = "task"
    MILESTONE = "milestone"
    REWARD = "reward"

# Enum per lo stato di completamento del nodo
class CompletionStatus(str, Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"

# Schemas per le categorie dei percorsi
class PathCategoryBase(BaseModel):
    name: str
    description: Optional[str] = None

class PathCategoryCreate(PathCategoryBase):
    @field_validator('name')
    def name_must_not_be_empty(cls, v):
        if not v or not v.strip():
            raise ValueError('name must not be empty')
        return v

class PathCategoryUpdate(PathCategoryBase):
    name: Optional[str] = None

class PathCategoryInDBBase(PathCategoryBase):
    id: int

    model_config = {
        "from_attributes": True
    }

class PathCategory(PathCategoryInDBBase):
    pass

# Schemas per i nodi dei template dei percorsi
class PathNodeTemplateBase(BaseModel):
    title: str
    description: Optional[str] = None
    node_type: PathNodeType
    points: int = 1
    order: int = 0
    dependencies: Optional[Dict[str, List[str]]] = None
    content: Optional[Dict[str, Any]] = None
    estimated_time: int = 30
    additional_data: Optional[Dict[str, Any]] = None

class PathNodeTemplateCreate(PathNodeTemplateBase):
    @field_validator('content')
    def validate_content(cls, v, info):
        node_type = info.data.get('node_type')
        if not v:
            raise ValueError(f"Il contenuto è obbligatorio per il nodo di tipo {node_type}")
        
        if node_type == PathNodeType.QUIZ:
            if 'quiz_template_id' not in v:
                raise ValueError("Per i nodi di tipo QUIZ è necessario specificare quiz_template_id")
        
        elif node_type == PathNodeType.CONTENT:
            if 'content' not in v or 'content_type' not in v:
                raise ValueError("Per i nodi di tipo CONTENT è necessario specificare content e content_type")
            
            content_type = v.get('content_type')
            if content_type not in ['text', 'video', 'audio', 'link']:
                raise ValueError("content_type deve essere uno tra: text, video, audio, link")
            
            if content_type in ['video', 'audio', 'link'] and 'url' not in v:
                raise ValueError(f"Per i contenuti di tipo {content_type} è necessario specificare l'URL")
        
        elif node_type == PathNodeType.TASK:
            if 'task_description' not in v:
                raise ValueError("Per i nodi di tipo TASK è necessario specificare task_description")
            
            if 'verification_type' in v:
                verification_type = v.get('verification_type')
                if verification_type not in ['manual', 'auto']:
                    raise ValueError("verification_type deve essere uno tra: manual, auto")
        
        elif node_type == PathNodeType.REWARD:
            if 'reward_id' not in v or 'reward_type' not in v:
                raise ValueError("Per i nodi di tipo REWARD è necessario specificare reward_id e reward_type")
            
            reward_type = v.get('reward_type')
            if reward_type not in ['badge', 'points', 'certificate']:
                raise ValueError("reward_type deve essere uno tra: badge, points, certificate")
        
        return v

class PathNodeTemplateUpdate(PathNodeTemplateBase):
    title: Optional[str] = None
    description: Optional[str] = None
    node_type: Optional[PathNodeType] = None
    points: Optional[int] = None
    order: Optional[int] = None
    dependencies: Optional[Dict[str, List[str]]] = None
    content: Optional[Dict[str, Any]] = None
    estimated_time: Optional[int] = None
    additional_data: Optional[Dict[str, Any]] = None

class PathNodeTemplateInDBBase(PathNodeTemplateBase):
    id: int
    uuid: str
    path_template_id: int

    model_config = {
        "from_attributes": True
    }

class PathNodeTemplate(PathNodeTemplateInDBBase):
    pass

# Schemas per i template dei percorsi
class PathTemplateBase(BaseModel):
    title: str
    description: Optional[str] = None
    instructions: Optional[str] = None
    difficulty_level: int = Field(1, ge=1, le=5)
    points: int = 10
    estimated_days: int = 7
    is_active: bool = True
    is_public: bool = False
    additional_data: Optional[Dict[str, Any]] = None
    category_id: Optional[int] = None

class PathTemplateCreate(PathTemplateBase):
    nodes: List[PathNodeTemplateCreate] = []
    created_by: str  # UUID del creatore
    created_by_role: str  # Ruolo del creatore (admin o parent)

    @field_validator('created_by_role')
    def validate_created_by_role(cls, v):
        if v not in ['admin', 'parent']:
            raise ValueError("created_by_role deve essere 'admin' o 'parent'")
        return v

class PathTemplateUpdate(PathTemplateBase):
    title: Optional[str] = None
    description: Optional[str] = None
    instructions: Optional[str] = None
    difficulty_level: Optional[int] = None
    points: Optional[int] = None
    estimated_days: Optional[int] = None
    is_active: Optional[bool] = None
    is_public: Optional[bool] = None
    additional_data: Optional[Dict[str, Any]] = None
    category_id: Optional[int] = None

class PathTemplateInDBBase(PathTemplateBase):
    id: int
    uuid: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    created_by: str
    created_by_role: str

    model_config = {
        "from_attributes": True
    }

class PathTemplateSummary(PathTemplateInDBBase):
    category: Optional[PathCategory] = None
    node_count: int = 0

class PathTemplate(PathTemplateInDBBase):
    category: Optional[PathCategory] = None
    nodes: List[PathNodeTemplate] = []

# Schemas per i nodi concreti dei percorsi
class PathNodeBase(BaseModel):
    title: str
    description: Optional[str] = None
    node_type: PathNodeType
    points: int = 1
    order: int = 0
    dependencies: Optional[Dict[str, List[str]]] = None
    content: Optional[Dict[str, Any]] = None
    resource_id: Optional[str] = None
    estimated_time: int = 30
    additional_data: Optional[Dict[str, Any]] = None

class PathNodeCreate(PathNodeBase):
    template_id: int
    path_id: int

class PathNodeUpdate(PathNodeBase):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[CompletionStatus] = None
    score: Optional[int] = None
    feedback: Optional[str] = None
    additional_data: Optional[Dict[str, Any]] = None

class PathNodeInDBBase(PathNodeBase):
    id: int
    uuid: str
    path_id: int
    template_id: int
    status: CompletionStatus
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    score: int = 0
    feedback: Optional[str] = None

    model_config = {
        "from_attributes": True
    }

class PathNode(PathNodeInDBBase):
    pass

# Schemas per i percorsi concreti
class PathBase(BaseModel):
    student_id: str
    assigned_by: str
    deadline: Optional[datetime] = None
    additional_data: Optional[Dict[str, Any]] = None

class PathCreate(PathBase):
    template_id: int

class PathUpdate(PathBase):
    student_id: Optional[str] = None
    assigned_by: Optional[str] = None
    status: Optional[CompletionStatus] = None
    deadline: Optional[datetime] = None
    additional_data: Optional[Dict[str, Any]] = None

class PathInDBBase(PathBase):
    id: int
    uuid: str
    template_id: int
    status: CompletionStatus
    current_score: int = 0
    max_score: int = 0
    completion_percentage: float = 0.0
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {
        "from_attributes": True
    }

class PathSummary(BaseModel):
    template_title: str
    node_count: int = 0
    completed_nodes: int = 0
    created_at: Optional[datetime] = None
    
    model_config = {
        "from_attributes": True
    }

class Path(PathInDBBase):
    nodes: List[PathNode] = []

# Schema per l'aggiornamento dello stato di un nodo
class UpdateNodeStatus(BaseModel):
    node_uuid: str
    status: CompletionStatus
    score: Optional[int] = None
    feedback: Optional[str] = None
