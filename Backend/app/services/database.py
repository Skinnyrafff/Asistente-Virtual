from sqlalchemy import create_engine, Column, Integer, String, Text, Index, DateTime
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from app.config import settings
from datetime import datetime

engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class Base(DeclarativeBase):
    pass

# Define the User model
class User(Base):
    __tablename__ = "users"
    username = Column(String, primary_key=True, index=True)
    hashed_pin = Column(String, nullable=False)
    age = Column(Integer)
    city = Column(String)

# Define the Reminder model
class Reminder(Base):
    __tablename__ = "reminders"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True)
    text = Column(Text, nullable=False)
    datetime = Column(String, nullable=False)

    __table_args__ = (
        Index('idx_reminders_user_id', user_id),
    )

# Define the HealthRecord model
class HealthRecord(Base):
    __tablename__ = "health_records"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True)
    parameter = Column(String, nullable=False)
    value = Column(String, nullable=False)
    timestamp = Column(String, nullable=False)

# Define the Emergency model
class Emergency(Base):
    __tablename__ = "emergencies"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True)
    tipo_emergencia = Column(String, nullable=False)
    mensaje_opcional = Column(Text)
    timestamp = Column(String, nullable=False)

# Define the EmergencyContact model
class EmergencyContact(Base):
    __tablename__ = "emergency_contacts"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True)
    name = Column(String, nullable=False)
    phone_number = Column(String, nullable=False)
    relationship = Column(String, nullable=True)

    __table_args__ = (
        Index('idx_emergency_contacts_user_id', user_id),
    )

# Define the ConversationHistory model
class ConversationHistory(Base):
    __tablename__ = "conversation_history"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True)
    role = Column(String, nullable=False) # 'user' or 'assistant'
    content = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)

# Function to create all tables
def create_tables():
    Base.metadata.create_all(bind=engine)

# Dependency to get a DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()