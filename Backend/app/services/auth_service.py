from sqlalchemy.orm import Session
from passlib.context import CryptContext
from datetime import datetime, timedelta
from jose import jwt, JWTError
from app.services.database import User, get_db
from app.config import settings
from fastapi import HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def hash_pin(pin: str) -> str:
    return pwd_context.hash(pin)

def verify_pin(plain_pin: str, hashed_pin: str) -> bool:
    return pwd_context.verify(plain_pin, hashed_pin)

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception
    return user

def register_user(db: Session, username: str, pin: str, age: int, city: str) -> bool:
    if db.query(User).filter(User.username == username).first():
        return False  # User already exists
    hashed_pin = hash_pin(pin)
    db_user = User(username=username, hashed_pin=hashed_pin, age=age, city=city)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return True

def authenticate_user(db: Session, username: str, pin: str):
    user = db.query(User).filter(User.username == username).first()
    if not user:
        return None  # User not found
    if not verify_pin(pin, user.hashed_pin):
        return None  # Incorrect PIN
    return user  # Authentication successful

def update_user_profile(db: Session, username: str, age: int, city: str) -> bool:
    user = db.query(User).filter(User.username == username).first()
    if not user:
        return False # User not found
    user.age = age
    user.city = city
    db.commit()
    return True