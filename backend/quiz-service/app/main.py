from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import uvicorn

# Import API routers
from app.api.endpoints import quiz_templates, quizzes, question_templates, quiz_attempts

# Create FastAPI app
app = FastAPI(
    title="Quiz Service",
    description="Servizio di gestione quiz per l'app educativa",
    version="0.1.0",
)

# CORS configuration
origins = [
    "http://localhost:3000",  # Frontend React
    "http://localhost:8000",  # API Gateway
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
# Per gli endpoint reali (produzione)
app.include_router(quiz_templates.router, prefix="/api/quiz-templates", tags=["Quiz Templates"])
app.include_router(quizzes.router, prefix="/api/quizzes", tags=["Quizzes"])
app.include_router(question_templates.router, prefix="/api/question-templates", tags=["Question Templates"])
app.include_router(quiz_attempts.router, prefix="/api/quiz-attempts", tags=["Quiz Attempts"])

# Per compatibilità con i test
app.include_router(quiz_templates.router, prefix="/quiz-templates", tags=["Quiz Templates Test"])
app.include_router(quizzes.router, prefix="/quizzes", tags=["Quizzes Test"])
app.include_router(question_templates.router, prefix="/question-templates", tags=["Question Templates Test"])
app.include_router(quiz_attempts.router, prefix="/quiz-attempts", tags=["Quiz Attempts Test"])

# Importiamo i moduli necessari per le categorie dei quiz
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.base import get_db

from app.schemas.quiz import QuizCategory as QuizCategorySchema, QuizCategoryCreate, QuizCategoryUpdate
from app.db.repositories.quiz_template_repository import QuizCategoryRepository
from app.api.dependencies.auth import get_current_user, get_current_admin, TokenData

# Creiamo un router dedicato per le categorie dei quiz
quiz_categories_router = APIRouter()

@quiz_categories_router.get("/", response_model=List[QuizCategorySchema])
async def get_categories(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: TokenData = Depends(get_current_user)):
    categories = QuizCategoryRepository.get_all(db, skip=skip, limit=limit)
    return categories

@quiz_categories_router.post("/", response_model=QuizCategorySchema, status_code=status.HTTP_201_CREATED)
async def create_category(category: QuizCategoryCreate, db: Session = Depends(get_db), current_user: TokenData = Depends(get_current_admin)):
    # Controlla se esiste già una categoria con lo stesso nome
    db_category = QuizCategoryRepository.get_by_name(db, name=category.name)
    if db_category:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Esiste già una categoria con questo nome"
        )
    
    # Crea la nuova categoria
    db_category = QuizCategoryRepository.create(
        db=db,
        name=category.name,
        description=category.description
    )
    
    return db_category

@quiz_categories_router.get("/{category_id}", response_model=QuizCategorySchema)
async def get_category(category_id: int, db: Session = Depends(get_db), current_user: TokenData = Depends(get_current_user)):
    db_category = QuizCategoryRepository.get(db, category_id=category_id)
    if not db_category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Categoria non trovata"
        )
    return db_category

@quiz_categories_router.patch("/{category_id}", response_model=QuizCategorySchema)
async def update_category(category_id: int, category: QuizCategoryUpdate, db: Session = Depends(get_db), current_user: TokenData = Depends(get_current_admin)):
    db_category = QuizCategoryRepository.get(db, category_id=category_id)
    if not db_category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Categoria non trovata"
        )
    
    # Se viene fornito un nuovo nome, verifica che non sia già in uso
    if category.name:
        existing_category = QuizCategoryRepository.get_by_name(db, name=category.name)
        if existing_category and existing_category.id != category_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Esiste già una categoria con questo nome"
            )
    
    # Aggiorna la categoria
    updated_data = {}
    if category.name:
        updated_data["name"] = category.name
    if category.description is not None:
        updated_data["description"] = category.description
    
    updated_category = QuizCategoryRepository.update(db, category_id=category_id, **updated_data)
    return updated_category

@quiz_categories_router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(category_id: int, db: Session = Depends(get_db), current_user: TokenData = Depends(get_current_admin)):
    db_category = QuizCategoryRepository.get(db, category_id=category_id)
    if not db_category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Categoria non trovata"
        )
    
    QuizCategoryRepository.delete(db, category_id=category_id)
    return {"detail": "Categoria eliminata con successo"}

app.include_router(quiz_categories_router, prefix="/quiz-categories", tags=["Quiz Categories"])

@app.get("/")
async def health_check():
    return {"status": "ok", "service": "quiz-service"}

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8002, reload=True)
