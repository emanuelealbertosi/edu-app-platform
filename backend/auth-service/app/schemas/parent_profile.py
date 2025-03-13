from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List


class ParentProfileBase(BaseModel):
    """Schema base per il profilo genitore"""
    phone_number: Optional[str] = None
    address: Optional[str] = None


class ParentProfileCreate(ParentProfileBase):
    """Schema per la creazione di un profilo genitore"""
    pass


class ParentProfileUpdate(ParentProfileBase):
    """Schema per l'aggiornamento di un profilo genitore"""
    pass


class ParentProfile(ParentProfileBase):
    """Schema per la risposta di un profilo genitore"""
    id: int
    user_id: int
    
    class Config:
        from_attributes = True


class ParentProfileWithStudents(ParentProfile):
    """Schema per la risposta di un profilo genitore con studenti associati"""
    # Questo campo verrà popolato con l'elenco degli studenti associati
    # La classe StudentProfile viene importata dinamicamente per evitare
    # riferimenti circolari
    student_ids: List[int] = []
    
    class Config:
        from_attributes = True