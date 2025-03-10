from pydantic import BaseModel, EmailStr, validator, Field
from typing import List, Optional
from datetime import datetime

# Schema base per il ruolo
class RoleBase(BaseModel):
    name: str
    description: Optional[str] = None

class RoleCreate(RoleBase):
    pass

class RoleUpdate(RoleBase):
    name: Optional[str] = None

class RoleInDBBase(RoleBase):
    id: int

    class Config:
        orm_mode = True

class Role(RoleInDBBase):
    pass

# Schema base per l'utente
class UserBase(BaseModel):
    email: EmailStr
    username: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    is_active: bool = True

class UserCreate(UserBase):
    password: str
    
    @validator('password')
    def password_min_length(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        return v
    
    @validator('username')
    def username_alphanumeric(cls, v):
        if not v.isalnum():
            raise ValueError('Username must be alphanumeric')
        return v

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None

class UserInDBBase(UserBase):
    id: int
    uuid: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    roles: List[Role] = []

    class Config:
        orm_mode = True

class User(UserInDBBase):
    pass

class UserWithPassword(UserInDBBase):
    hashed_password: str

# Schema per il profilo del genitore
class ParentProfileBase(BaseModel):
    phone_number: Optional[str] = None
    address: Optional[str] = None

class ParentProfileCreate(ParentProfileBase):
    pass

class ParentProfileUpdate(ParentProfileBase):
    pass

class ParentProfileInDBBase(ParentProfileBase):
    id: int
    user_id: int

    class Config:
        orm_mode = True

class ParentProfile(ParentProfileInDBBase):
    user: User

# Schema per il profilo dello studente
class StudentProfileBase(BaseModel):
    school_grade: Optional[str] = None
    birth_date: Optional[datetime] = None
    points: int = 0

class StudentProfileCreate(StudentProfileBase):
    parent_id: int

class StudentProfileUpdate(StudentProfileBase):
    parent_id: Optional[int] = None

class StudentProfileInDBBase(StudentProfileBase):
    id: int
    user_id: int
    parent_id: int

    class Config:
        orm_mode = True

class StudentProfile(StudentProfileInDBBase):
    user: User
    
# Schema per l'autenticazione
class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str

class TokenPayload(BaseModel):
    sub: str
    exp: int
    roles: List[str]

class RefreshToken(BaseModel):
    refresh_token: str
