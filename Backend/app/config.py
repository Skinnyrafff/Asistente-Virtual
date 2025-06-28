import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY")
    DATABASE_URL: str = os.getenv("DATABASE_URL")
    DUCKLING_URL: str = os.getenv("DUCKLING_URL", "http://localhost:8001") # Default for local development

settings = Settings()