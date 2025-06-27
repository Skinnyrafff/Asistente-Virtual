from pydantic import BaseModel
from typing import Optional

class UserCreate(BaseModel):
    username: str
    pin: str
    age: int
    city: str

class UserLogin(BaseModel):
    username: str
    pin: str

class UserProfileUpdate(BaseModel):
    age: Optional[int] = None
    city: Optional[str] = None
