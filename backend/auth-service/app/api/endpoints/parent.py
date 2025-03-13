from fastapi import APIRouter, Depends, HTTPException, Path, Body, Query, status
from typing import List, Optional, Any, Dict
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from app.api.dependencies.auth import get_current_user_with_role
from app.api.dependencies.database import get_db
from app.db.repositories.user_repository import UserRepository
from app.db.repositories.parent_profile_repository import ParentProfileRepository
from app.db.repositories.student_profile_repository import StudentProfileRepository
from app.db.models.user import User as UserModel
from app.schemas.user import User
from app.schemas.parent_profile import ParentProfile
from app.schemas.student_profile import StudentProfile

router = APIRouter(tags=["parent"])

class StudentActivity:
    """Classe di esempio per le attività degli studenti"""
    id: str
    studentId: str
    studentName: str
    activityType: str
    activityName: str
    completedAt: datetime
    score: Optional[int] = None
    
@router.get("/activities", response_model=List[Dict[str, Any]])
async def get_parent_activities(
    current_user: UserModel = Depends(get_current_user_with_role(["parent", "admin"])),
    db: Session = Depends(get_db),
    days: int = Query(7, description="Numero di giorni passati da considerare")
) -> Any:
    """
    Recupera le attività recenti degli studenti associati al genitore.
    Solo genitori e admin possono accedere.
    """
    # In una implementazione reale, qui recupereremmo le attività degli studenti
    # associate al genitore autenticato
    
    # Per ora, restituiamo dati di esempio
    sample_activities = [
        {
            "id": "1",
            "studentId": "1",
            "studentName": "Mario Rossi",
            "activityType": "quiz",
            "activityName": "Quiz di matematica",
            "completedAt": datetime.now() - timedelta(days=1),
            "score": 85
        },
        {
            "id": "2",
            "studentId": "1",
            "studentName": "Mario Rossi",
            "activityType": "path",
            "activityName": "Percorso di scienze",
            "completedAt": datetime.now() - timedelta(days=2),
            "progress": 60
        },
        {
            "id": "3",
            "studentId": "2",
            "studentName": "Laura Bianchi",
            "activityType": "quiz",
            "activityName": "Quiz di italiano",
            "completedAt": datetime.now() - timedelta(hours=5),
            "score": 92
        }
    ]
    
    return sample_activities

@router.get("/students", response_model=List[Dict[str, Any]])
async def get_parent_students(
    current_user: UserModel = Depends(get_current_user_with_role(["parent", "admin"])),
    db: Session = Depends(get_db)
) -> Any:
    """
    Recupera gli studenti associati al genitore.
    Solo genitori e admin possono accedere.
    """
    # In un'implementazione reale, qui recupereremmo gli studenti associati al genitore
    # dalla tabella di relazione parent_student o simile
    
    # Per ora, restituiamo dati di esempio
    sample_students = [
        {
            "id": "1",
            "name": "Mario Rossi",
            "age": 10,
            "grade": "5ª Elementare",
            "avatarUrl": "/avatars/student1.png"
        },
        {
            "id": "2",
            "name": "Laura Bianchi",
            "age": 8,
            "grade": "3ª Elementare",
            "avatarUrl": "/avatars/student2.png"
        }
    ]
    
    return sample_students
