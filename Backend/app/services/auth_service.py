from sqlalchemy.orm import Session
from passlib.context import CryptContext
from app.services.database import User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_pin(pin: str) -> str:
    return pwd_context.hash(pin)

def verify_pin(plain_pin: str, hashed_pin: str) -> bool:
    return pwd_context.verify(plain_pin, hashed_pin)

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