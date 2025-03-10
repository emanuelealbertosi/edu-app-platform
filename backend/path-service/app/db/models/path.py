from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, DateTime, Text, JSON, Table, Enum, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum

from app.db.base import Base

# Enum per i tipi di nodi del percorso
class PathNodeType(str, enum.Enum):
    QUIZ = "quiz"  # Nodo che rappresenta un quiz da completare
    CONTENT = "content"  # Nodo che rappresenta un contenuto da studiare
    TASK = "task"  # Nodo che rappresenta un compito o attività da svolgere
    MILESTONE = "milestone"  # Nodo che rappresenta un traguardo importante
    REWARD = "reward"  # Nodo che rappresenta una ricompensa

# Enum per lo stato di completamento del nodo
class CompletionStatus(str, enum.Enum):
    NOT_STARTED = "not_started"  # Non ancora iniziato
    IN_PROGRESS = "in_progress"  # In corso
    COMPLETED = "completed"  # Completato
    FAILED = "failed"  # Fallito

# Tabella per le categorie dei percorsi
class PathCategory(Base):
    __tablename__ = "path_categories"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    description = Column(Text, nullable=True)
    
    # Relazione con i template dei percorsi
    path_templates = relationship("PathTemplate", back_populates="category")
    
    def __repr__(self):
        return f"<PathCategory {self.name}>"

# Modello per i template dei percorsi creati dagli amministratori o genitori
class PathTemplate(Base):
    __tablename__ = "path_templates"
    
    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String, unique=True, index=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, index=True)
    description = Column(Text, nullable=True)
    instructions = Column(Text, nullable=True)
    difficulty_level = Column(Integer, default=1)  # 1-5, dove 1 è facile e 5 è difficile
    points = Column(Integer, default=10)  # Punti totali assegnati al completamento
    estimated_days = Column(Integer, default=7)  # Giorni stimati per il completamento
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    is_active = Column(Boolean, default=True)
    is_public = Column(Boolean, default=False)  # Se true, disponibile a tutti i genitori
    
    # Relazione con la categoria
    category_id = Column(Integer, ForeignKey("path_categories.id"), nullable=True)
    category = relationship("PathCategory", back_populates="path_templates")
    
    # Relazione con i nodi del template
    nodes = relationship("PathNodeTemplate", back_populates="path_template", cascade="all, delete-orphan")
    
    # Relazione con i percorsi concreti creati da questo template
    paths = relationship("Path", back_populates="template")
    
    # Dati aggiuntivi in formato JSON
    additional_data = Column(JSON, nullable=True)
    
    # Creato da (ID del creator: admin o genitore)
    created_by = Column(String)  # UUID del creatore
    created_by_role = Column(String)  # Ruolo del creatore (admin o parent)
    
    def __repr__(self):
        return f"<PathTemplate {self.title}>"

# Modello per i nodi dei template dei percorsi
class PathNodeTemplate(Base):
    __tablename__ = "path_node_templates"
    
    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String, unique=True, index=True, default=lambda: str(uuid.uuid4()))
    title = Column(String)
    description = Column(Text, nullable=True)
    node_type = Column(Enum(PathNodeType))
    points = Column(Integer, default=1)  # Punti assegnati al completamento del nodo
    order = Column(Integer, default=0)  # Ordine del nodo nel percorso
    
    # Dipendenze: un nodo può dipendere dal completamento di altri nodi
    # Formato: {"dependencies": ["uuid1", "uuid2", ...]}
    dependencies = Column(JSON, nullable=True)
    
    # Contenuto specifico del nodo in base al tipo
    # Per quiz: {"quiz_template_id": "uuid"}
    # Per content: {"content": "...", "content_type": "text|video|audio|link", "url": "..."}
    # Per task: {"task_description": "...", "verification_type": "manual|auto", "verification_criteria": "..."}
    # Per milestone: {"message": "Congratulazioni!", "badge_id": "..."}
    # Per reward: {"reward_id": "...", "reward_type": "badge|points|certificate"}
    content = Column(JSON, nullable=True)
    
    # Tempo stimato per completare il nodo (in minuti)
    estimated_time = Column(Integer, default=30)
    
    # Relazione con il template del percorso
    path_template_id = Column(Integer, ForeignKey("path_templates.id"))
    path_template = relationship("PathTemplate", back_populates="nodes")
    
    # Relazione con i nodi concreti creati da questo template
    nodes = relationship("PathNode", back_populates="template")
    
    # Dati aggiuntivi in formato JSON
    additional_data = Column(JSON, nullable=True)
    
    def __repr__(self):
        return f"<PathNodeTemplate {self.title}>"

# Modello per i percorsi concreti assegnati agli studenti
class Path(Base):
    __tablename__ = "paths"
    
    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String, unique=True, index=True, default=lambda: str(uuid.uuid4()))
    
    # Relazione con il template del percorso
    template_id = Column(Integer, ForeignKey("path_templates.id"))
    template = relationship("PathTemplate", back_populates="paths")
    
    # Relazione con i nodi del percorso
    nodes = relationship("PathNode", back_populates="path", cascade="all, delete-orphan")
    
    # Studente a cui è assegnato il percorso
    student_id = Column(String)  # UUID dello studente
    
    # Genitore che ha assegnato il percorso
    assigned_by = Column(String)  # UUID del genitore
    
    # Date di inizio e fine del percorso
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    deadline = Column(DateTime(timezone=True), nullable=True)  # Scadenza opzionale
    
    # Stato del percorso
    status = Column(Enum(CompletionStatus), default=CompletionStatus.NOT_STARTED)
    
    # Punteggio attuale e massimo possibile
    current_score = Column(Integer, default=0)
    max_score = Column(Integer, default=0)
    
    # Percentuale di completamento
    completion_percentage = Column(Float, default=0.0)
    
    # Data di creazione e aggiornamento
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Dati aggiuntivi in formato JSON
    additional_data = Column(JSON, nullable=True)
    
    def __repr__(self):
        return f"<Path {self.id} - template: {self.template_id}, student: {self.student_id}>"

# Modello per i nodi concreti dei percorsi
class PathNode(Base):
    __tablename__ = "path_nodes"
    
    id = Column(Integer, primary_key=True, index=True)
    uuid = Column(String, unique=True, index=True, default=lambda: str(uuid.uuid4()))
    title = Column(String)
    description = Column(Text, nullable=True)
    node_type = Column(Enum(PathNodeType))
    points = Column(Integer, default=1)
    order = Column(Integer, default=0)
    
    # Dipendenze: un nodo può dipendere dal completamento di altri nodi
    dependencies = Column(JSON, nullable=True)
    
    # Contenuto specifico del nodo
    content = Column(JSON, nullable=True)
    
    # Risorse esterne collegate al nodo (es. ID quiz, ID ricompensa)
    resource_id = Column(String, nullable=True)  # UUID della risorsa esterna
    
    # Tempo stimato per completare il nodo (in minuti)
    estimated_time = Column(Integer, default=30)
    
    # Relazione con il percorso
    path_id = Column(Integer, ForeignKey("paths.id"))
    path = relationship("Path", back_populates="nodes")
    
    # Relazione con il template del nodo
    template_id = Column(Integer, ForeignKey("path_node_templates.id"))
    template = relationship("PathNodeTemplate", back_populates="nodes")
    
    # Stato di completamento del nodo
    status = Column(Enum(CompletionStatus), default=CompletionStatus.NOT_STARTED)
    
    # Date di inizio e completamento
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Punteggio ottenuto (se applicabile)
    score = Column(Integer, default=0)
    
    # Feedback del genitore o sistema (se applicabile)
    feedback = Column(Text, nullable=True)
    
    # Dati aggiuntivi in formato JSON
    additional_data = Column(JSON, nullable=True)
    
    def __repr__(self):
        return f"<PathNode {self.title} - {self.status}>"
