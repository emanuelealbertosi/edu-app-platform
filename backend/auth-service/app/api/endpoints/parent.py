from fastapi import APIRouter, Depends, HTTPException, Path, Body, Query, status
from typing import List, Optional, Any, Dict
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from app.api.dependencies.auth import get_current_user_with_role
from app.api.dependencies.database import get_db
from app.db.repositories.user_repository import UserRepository
from app.db.repositories.parent_profile_repository import ParentProfileRepository
from app.db.repositories.student_profile_repository import StudentProfileRepository
from app.db.repositories.role_repository import RoleRepository
from app.db.repositories.profile_repository import ParentProfileRepository as ParentProfileRepo
from app.db.repositories.profile_repository import StudentProfileRepository as StudentProfileRepo
from app.db.models.user import User as UserModel
from app.schemas.user import User
from app.schemas.parent_profile import ParentProfile
from app.schemas.student_profile import StudentProfile, StudentProfileCreate
from app.schemas.user import ParentProfileCreate

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
    # Se l'utente è un amministratore e si sta cercando di recuperare tutti gli studenti
    if "admin" in [role.name for role in current_user.roles]:
        # Gli admin possono vedere tutti gli studenti
        all_students = StudentProfileRepository.get_all(db)
        formatted_students = []
        
        for student in all_students:
            # Recupera l'utente associato allo studente
            user = UserRepository.get(db, student.user_id)
            formatted_students.append({
                "id": str(student.id),
                "userId": str(user.id),
                "name": f"{user.first_name or ''} {user.last_name or ''}".strip() or user.username,
                "username": user.username,
                "points": student.points or 0,
                "level": 1,  # Valore predefinito o calcolato in base ai punti
                "age": None,  # Se disponibile nel profilo
                "grade": student.school_grade or "Non specificato",
                "parentId": str(student.parent_id) if student.parent_id else None,
                "createdAt": user.created_at.isoformat() if user and user.created_at else None,
                "updatedAt": user.updated_at.isoformat() if user and user.updated_at else None,
                "pendingRewards": 0  # Questo valore andrà recuperato dal servizio reward quando implementato
            })
            
        return formatted_students
    else:
        # Se l'utente è un genitore, recupera il suo profilo
        parent_profile = ParentProfileRepository.get_by_user_id(db, current_user.id)
        
        if not parent_profile:
            # Il genitore non ha un profilo
            return []
        
        # Recupera tutti gli studenti associati al genitore
        formatted_students = []
        
        for student in parent_profile.students:
            # Recupera l'utente associato allo studente
            user = UserRepository.get(db, student.user_id)
            formatted_students.append({
                "id": str(student.id),
                "userId": str(user.id),
                "name": f"{user.first_name or ''} {user.last_name or ''}".strip() or user.username,
                "username": user.username,
                "points": student.points or 0,
                "level": 1,  # Valore predefinito o calcolato in base ai punti
                "age": None,  # Se disponibile nel profilo
                "grade": student.school_grade or "Non specificato",
                "parentId": str(student.parent_id) if student.parent_id else None,
                "createdAt": user.created_at.isoformat() if user and user.created_at else None,
                "updatedAt": user.updated_at.isoformat() if user and user.updated_at else None,
                "pendingRewards": 0  # Questo valore andrà recuperato dal servizio reward quando implementato
            })
            
        return formatted_students

@router.post("/students", response_model=StudentProfile)
async def create_parent_student(
    student_data: Dict[str, Any] = Body(...),
    current_user: UserModel = Depends(get_current_user_with_role(["parent", "admin"])),
    db: Session = Depends(get_db)
) -> Any:
    """
    Crea un nuovo utente con ruolo studente e lo associa al genitore.
    Questa API può essere utilizzata sia da genitori che da admin.
    - Un genitore può creare studenti solo per sé stesso
    - Un admin può creare studenti per qualsiasi genitore (non implementato)
    """
    # Verifica se chi fa la richiesta è un genitore
    is_parent = any(role.name == "parent" for role in current_user.roles)
    
    if not is_parent:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo i genitori possono creare studenti tramite questa API"
        )
    
    # Ottieni il profilo del genitore corrente
    parent_profile = ParentProfileRepo.get_by_user_id(db, current_user.id)
    if not parent_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profilo genitore non trovato per l'utente corrente"
        )
    
    # Crea un nuovo utente per lo studente
    try:
        # Estrai i dati necessari dal payload
        username = student_data.get("username")
        password = student_data.get("password")
        name = student_data.get("name")
        
        if not username or not password or not name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username, password e name sono campi obbligatori"
            )
        
        # Verifica se l'username è già utilizzato
        existing_user = UserRepository.get_by_username(db, username)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Username {username} già in uso"
            )
        
        # Crea il nuovo utente
        from app.schemas.user import UserCreate
        
        user_create = UserCreate(
            username=username,
            email=f"{username}@example.com", # Placeholder email, può essere aggiornata dopo
            password=password,
            is_active=True,
            first_name=name,
            last_name="",
            role="student"
        )
        
        new_user = UserRepository.create(db, user_create)
        
        # Aggiungi il ruolo studente all'utente
        student_role = RoleRepository.get_by_name(db, "student")
        UserRepository.add_roles_to_user(db, new_user, [student_role])
        
        # Crea il profilo studente
        # Usa l'alias StudentProfileRepo già importato
        
        # Crea un oggetto StudentProfileCreate con il parent_id
        profile_data = StudentProfileCreate(
            parent_id=parent_profile.id,
            school_grade="",  # Campi opzionali
            birth_date=None,
            points=0
        )
        
        # Crea il profilo studente passando l'utente e i dati del profilo
        profile = StudentProfileRepo.create(db, new_user, profile_data)
        
        return profile
    except Exception as e:
        # Rollback in caso di errore
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Errore nella creazione dello studente: {str(e)}"
        )

@router.post("/student-association", response_model=StudentProfile)
async def associate_student_to_parent(
    student_data: StudentProfileCreate = Body(...),
    current_user: UserModel = Depends(get_current_user_with_role(["parent", "admin"])),
    db: Session = Depends(get_db)
) -> Any:
    """
    Associa uno studente a un genitore. Se lo studente non esiste, lo crea.
    Questa API può essere utilizzata sia da genitori che da admin.
    - Un genitore può associare solo a sé stesso
    - Un admin può associare uno studente a qualsiasi genitore
    """
    # Verifica se chi fa la richiesta è un admin o un genitore
    is_admin = any(role.name == "admin" for role in current_user.roles)
    is_parent = any(role.name == "parent" for role in current_user.roles)
    
    # Ottieni il profilo del genitore target (a cui associare lo studente)
    parent_profile = None
    
    # Se il parent_id è specificato nei dati dello studente
    if student_data.parent_id:
        # Solo gli admin possono specificare un parent_id diverso dal proprio
        if not is_admin and is_parent:
            # Se è un genitore, verifica che stia provando ad associare a sé stesso
            own_parent_profile = ParentProfileRepo.get_by_user_id(db, current_user.id)
            if not own_parent_profile or own_parent_profile.id != student_data.parent_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Un genitore può associare studenti solo al proprio profilo"
                )
        
        # Verifica che il parent_id esista
        parent_profile = ParentProfileRepo.get(db, student_data.parent_id)
        if not parent_profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Profilo genitore con ID {student_data.parent_id} non trovato"
            )
    else:
        # Se non è specificato il parent_id, usa quello del genitore corrente
        if not is_parent:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Devi specificare un parent_id o essere un genitore"
            )
        
        # Ottieni il profilo del genitore corrente
        parent_profile = ParentProfileRepo.get_by_user_id(db, current_user.id)
        if not parent_profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Profilo genitore non trovato per l'utente corrente"
            )
        
        # Aggiorna i dati dello studente con il parent_id
        student_data.parent_id = parent_profile.id
    
    # Cerca l'utente studente per ID se fornito
    target_user = None
    if hasattr(student_data, 'user_id') and student_data.user_id:
        target_user = UserRepository.get(db, student_data.user_id)
        if not target_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Utente con ID {student_data.user_id} non trovato"
            )
            
        # Verifica se l'utente ha già un profilo studente
        existing_profile = StudentProfileRepo.get_by_user_id(db, target_user.id)
        if existing_profile:
            # Se il profilo esiste già, aggiorniamo il parent_id
            existing_profile.parent_id = student_data.parent_id
            db.add(existing_profile)
            db.commit()
            db.refresh(existing_profile)
            return existing_profile
    else:
        # Se non è specificato un user_id, dobbiamo creare un nuovo utente
        # Questo richiederebbe dati aggiuntivi come email, password, ecc.
        # che non sono inclusi in StudentProfileCreate
        # È una semplificazione pensare che lo studente esista già
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="È necessario specificare un user_id esistente per creare un'associazione"
        )
    
    # Verifica che l'utente abbia il ruolo studente
    student_role = RoleRepository.get_by_name(db, "student")
    if student_role not in target_user.roles:
        # Aggiungi il ruolo studente all'utente
        UserRepository.add_roles_to_user(db, target_user, [student_role])
    
    # Crea il profilo studente e associalo al genitore
    profile = StudentProfileRepo.create(db, target_user, student_data)
    
    return profile

@router.post("/profile", response_model=Dict[str, Any])
async def create_or_get_parent_profile(
    profile_data: ParentProfileCreate = Body(None),
    current_user: UserModel = Depends(get_current_user_with_role(["parent"])),
    db: Session = Depends(get_db)
) -> Any:
    """
    Crea un profilo genitore per l'utente corrente se non esiste già,
    oppure restituisce il profilo esistente.
    
    Questa API è utile per garantire che ogni utente con ruolo 'parent' abbia un profilo associato.
    """
    # Cerca un profilo genitore esistente
    existing_profile = ParentProfileRepo.get_by_user_id(db, current_user.id)
    
    if existing_profile:
        return {
            "status": "existing",
            "message": "Profilo genitore già esistente",
            "profile": {
                "id": existing_profile.id,
                "user_id": existing_profile.user_id,
                "phone_number": existing_profile.phone_number,
                "address": existing_profile.address
            }
        }
    
    # Se non esiste, crea un nuovo profilo genitore
    try:
        # Se non sono stati forniti dati, usa valori predefiniti
        if not profile_data:
            profile_data = ParentProfileCreate(
                phone_number="",
                address=""
            )
        
        # Crea il profilo genitore
        new_profile = ParentProfileRepo.create(db, current_user, profile_data)
        
        return {
            "status": "created",
            "message": "Profilo genitore creato con successo",
            "profile": {
                "id": new_profile.id,
                "user_id": new_profile.user_id,
                "phone_number": new_profile.phone_number,
                "address": new_profile.address
            }
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Errore nella creazione del profilo genitore: {str(e)}"
        )
