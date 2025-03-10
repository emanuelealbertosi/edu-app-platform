from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import uvicorn

# Import API routers
from app.api.endpoints import quiz_templates, quizzes

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
app.include_router(quiz_templates.router, prefix="/api/quiz-templates", tags=["Quiz Templates"])
app.include_router(quizzes.router, prefix="/api/quizzes", tags=["Quizzes"])

@app.get("/")
async def health_check():
    return {"status": "ok", "service": "quiz-service"}

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8002, reload=True)
