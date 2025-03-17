from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class StudentProfileBase(BaseModel):
    """Schema base per il profilo studente"""
    school_grade: Optional[str] = None
    points: Optional[int] = Field(default=0)
    birth_date: Optional[datetime] = None


class StudentProfileCreate(StudentProfileBase):
    """Schema per la creazione di un profilo studente"""
    user_id: Optional[int] = None  # ID dell'utente per cui creare il profilo studente
    parent_id: Optional[int] = None  # ID del profilo genitore a cui associare lo studente


class StudentProfileUpdate(StudentProfileBase):
    """Schema per l'aggiornamento di un profilo studente"""
    pass


class StudentProfile(StudentProfileBase):
    """Schema per la risposta di un profilo studente"""
    id: int
    user_id: int
    parent_id: Optional[int] = None
    
    class Config:
        from_attributes = True