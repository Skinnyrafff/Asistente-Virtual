from sqlalchemy import create_engine, Column, Integer, String, Text, Index
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from .config import settings

engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

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

# Define the HealthRecord model
class HealthRecord(Base):
    __tablename__ = "health_records"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, index=True)
    parameter = Column(String, nullable=False)
    value = Column(String, nullable=False)
    timestamp = Column(String, nullable=False)

# Create an index for the user_id column in the reminders table
Index('idx_reminders_user_id', Reminder.user_id)

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