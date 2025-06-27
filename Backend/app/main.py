from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints.chat import router as chat_router
from app.api.endpoints.reminders import router as reminders_router
from app.api.endpoints.health import router as health_router
from app.api.endpoints.emergency import router as emergency_router
from app.api.endpoints.auth import router as auth_router
from app.services.database import create_tables

app = FastAPI(
    title="SeniorAssist API",
    description="Asistente virtual para adultos mayores",
    version="1.0.0",
)

@app.on_event("startup")
def startup_event():
    create_tables()

# Configuración de CORS
origins = [
    "*",  # Permitir todos los orígenes (para desarrollo)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # Permitir todos los métodos (GET, POST, etc.)
    allow_headers=["*"],  # Permitir todos los encabezados
)

app.include_router(chat_router, prefix="/chat", tags=["Conversación"])
app.include_router(reminders_router)
app.include_router(health_router)
app.include_router(emergency_router)
app.include_router(auth_router, prefix="/auth", tags=["Autenticación"])
