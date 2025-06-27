from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
from app.models.auth_schemas import UserCreate, UserLogin, UserProfileUpdate
from app.services import auth_service
from app.services.database import get_db

router = APIRouter()

@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(user: UserCreate, db: Session = Depends(get_db)):
    success = auth_service.register_user(db, user.username, user.pin, user.age, user.city)
    if not success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already registered")
    return {"message": "User registered successfully"}

@router.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    authenticated_user = auth_service.authenticate_user(db, user.username, user.pin)
    if not authenticated_user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect username or PIN")
    return {"message": "Login successful", "username": authenticated_user.username, "age": authenticated_user.age, "city": authenticated_user.city}

@router.put("/profile/{username}")
def update_profile(username: str, profile_update: UserProfileUpdate, db: Session = Depends(get_db)):
    success = auth_service.update_user_profile(db, username, profile_update.age, profile_update.city)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return {"message": "Profile updated successfully"}