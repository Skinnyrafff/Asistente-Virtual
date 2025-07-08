# Documentación Técnica del Backend - Asistente Virtual

## 1. Introducción

Este documento detalla la arquitectura, configuración y funcionamiento del backend para el proyecto Asistente Virtual. El backend está diseñado como una API RESTful que gestiona la lógica de negocio, la interacción con la base de datos, y la comunicación con servicios externos.

Sus responsabilidades principales incluyen:
-   Gestión de usuarios (autenticación y registro).
-   Procesamiento de conversaciones con un modelo de lenguaje (LLM).
-   Gestión de recordatorios y citas.
-   Sistema de alertas de emergencia.
-   Monitorización de datos de salud.
-   Integración con servicios externos como noticias y clima.

## 2. Tecnologías Utilizadas

-   **Lenguaje:** Python 3.9+
-   **Framework:** FastAPI para la creación de la API.
-   **Base de Datos:** (No especificado, pero gestionado a través de SQLAlchemy o similar).
-   **Validación de Datos:** Pydantic.
-   **Contenerización:** Docker y Docker Compose.
-   **Despliegue:** Preparado para Railway.

## 3. Requisitos Previos

-   Python 3.9 o superior.
-   `pip` y `venv` para la gestión de dependencias.
-   Docker y Docker Compose.
-   Un cliente de API como Postman o cURL para probar los endpoints.

## 4. Instalación y Configuración

Sigue estos pasos para configurar el entorno de desarrollo local.

1.  **Clonar el Repositorio:**
    ```bash
    git clone <URL_DEL_REPOSITORIO>
    cd Asistente-Virtual/Backend
    ```

2.  **Crear y Activar Entorno Virtual:**
    ```bash
    # Para Windows
    python -m venv .venv
    .\.venv\Scripts\activate

    # Para macOS/Linux
    python3 -m venv .venv
    source .venv/bin/activate
    ```

3.  **Instalar Dependencias:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Configurar Variables de Entorno:**
    Crea un archivo `.env` en el directorio `Backend/` a partir del siguiente ejemplo. Este archivo es crucial y debe contener las credenciales y configuraciones necesarias.

    **.env.example**
    ```env
    # Configuración de la Base de Datos
    DATABASE_URL="sqlite:///./test.db" # O la URL de tu base de datos (PostgreSQL, etc.)

    # Credenciales de la API de OpenAI (o el LLM que uses)
    OPENAI_API_KEY="tu_api_key_de_openai"

    # Credenciales de Twilio para emergencias
    TWILIO_ACCOUNT_SID="tu_account_sid"
    TWILIO_AUTH_TOKEN="tu_auth_token"
    TWILIO_PHONE_NUMBER="tu_numero_de_twilio"
    EMERGENCY_CONTACT_PHONE="numero_del_contacto_de_emergencia"

    # Clave secreta para JWT
    SECRET_KEY="una_clave_secreta_muy_segura"
    ALGORITHM="HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES=30

    # Otras APIs
    GNEWS_API_KEY="tu_api_key_de_gnews"
    OPENWEATHER_API_KEY="tu_api_key_de_openweathermap"
    ```

## 5. Estructura del Proyecto

El proyecto sigue una estructura modular para facilitar el mantenimiento y la escalabilidad.

```
Backend/
├── app/
│   ├── __init__.py
│   ├── main.py             # Punto de entrada de la aplicación FastAPI.
│   ├── config.py           # Carga y gestiona la configuración desde .env.
│   ├── api/
│   │   └── endpoints/      # Define los endpoints de la API (rutas).
│   │       ├── auth.py
│   │       ├── chat.py
│   │       └── ...
│   ├── models/             # Define los esquemas Pydantic para validación de datos.
│   │   ├── auth_schemas.py
│   │   └── ...
│   └── services/           # Contiene la lógica de negocio.
│       ├── auth_service.py
│       ├── llm_service.py
│       └── ...
├── Dockerfile              # Instrucciones para construir la imagen Docker.
├── docker-compose.yml      # Define los servicios para el entorno Docker.
├── requirements.txt        # Lista de dependencias de Python.
└── scripts/                # Scripts para pruebas y tareas auxiliares.
```

-   **`app/main.py`**: Inicializa la aplicación FastAPI y monta los routers de los diferentes endpoints.
-   **`app/config.py`**: Utiliza Pydantic Settings para cargar las variables de entorno del archivo `.env`.
-   **`app/api/endpoints/`**: Cada archivo corresponde a un conjunto de rutas relacionadas (ej: `auth.py` para `/login`, `/register`).
-   **`app/models/`**: Contiene los modelos de Pydantic (`schemas`) que definen la forma de los datos en las peticiones y respuestas de la API, garantizando la validación automática.
-   **`app/services/`**: Abstrae la lógica de negocio de los endpoints. Por ejemplo, `reminder_service.py` se encarga de crear, leer o eliminar recordatorios en la base de datos.

## 6. API Endpoints

La API está estructurada por módulos. El prefijo base para todos los endpoints es `/api/v1`.

---

### Autenticación (`/auth`)
-   **`POST /auth/register`**: Registra un nuevo usuario.
    -   **Body**: `UserCreate` (schema con email, password, nombre, etc.).
    -   **Respuesta**: `User` (schema con los datos del usuario creado).
-   **`POST /auth/login`**: Autentica un usuario y devuelve un token JWT.
    -   **Body**: `OAuth2PasswordRequestForm` (username, password).
    -   **Respuesta**: `{ "access_token": "...", "token_type": "bearer" }`.

---

### Chat (`/chat`)
-   **`POST /chat`**: Envía un mensaje del usuario al LLM y recibe una respuesta.
    -   **Body**: `{ "message": "Hola, ¿cómo estás?" }`.
    -   **Respuesta**: `{ "reply": "Estoy bien, ¿en qué puedo ayudarte?" }`.
    -   **Autenticación**: Requiere token JWT.

---

### Emergencias (`/emergency`)
-   **`POST /emergency/alert`**: Activa una alerta de emergencia. Envía una notificación (ej. SMS vía Twilio) al contacto de emergencia.
    -   **Body**: `{ "user_id": 1, "location": { "lat": ..., "lon": ... } }`.
    -   **Respuesta**: `{ "status": "Alerta enviada" }`.
    -   **Autenticación**: Requiere token JWT.

---

### Datos Externos (`/external`)
-   **`GET /external/news`**: Obtiene titulares de noticias relevantes.
    -   **Respuesta**: Lista de artículos de noticias.
-   **`GET /external/weather`**: Obtiene el pronóstico del tiempo para una ubicación.
    -   **Query Params**: `?city=Madrid`.
    -   **Respuesta**: Datos del clima.

---

### Salud (`/health`)
-   **`POST /health/vitals`**: Registra signos vitales del usuario (ej. ritmo cardíaco).
    -   **Body**: `{ "heart_rate": 80, "steps": 5000 }`.
    -   **Respuesta**: `{ "status": "Datos guardados" }`.
    -   **Autenticación**: Requiere token JWT.

---

### Recordatorios (`/reminders`)
-   **`POST /reminders`**: Crea un nuevo recordatorio.
    -   **Body**: `ReminderCreate` (schema con título, fecha, hora).
    -   **Respuesta**: `Reminder` (el recordatorio creado).
-   **`GET /reminders`**: Obtiene todos los recordatorios del usuario.
    -   **Respuesta**: Lista de `Reminder`.
-   **`DELETE /reminders/{reminder_id}`**: Elimina un recordatorio específico.
    -   **Respuesta**: `{ "status": "Recordatorio eliminado" }`.
-   **Autenticación**: Todos los endpoints requieren token JWT.

## 7. Ejecución de la Aplicación

### Modo Desarrollo (Local)
Asegúrate de tener el entorno virtual activado y el archivo `.env` configurado.

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
La API estará disponible en `http://localhost:8000`.

### Con Docker
Este método es recomendado para un entorno consistente.

```bash
docker-compose up --build
```
La API estará disponible en `http://localhost:8000` (o el puerto que hayas mapeado en `docker-compose.yml`).

## 8. Pruebas

El directorio `scripts/` contiene varios archivos para probar los endpoints de la API. Para ejecutarlos:

1.  Asegúrate de que el servidor esté en ejecución.
2.  Navega al directorio de scripts: `cd scripts`.
3.  Ejecuta el script deseado:
    ```bash
    python test_endpoints.py
    ```

**Nota:** Es posible que necesites ajustar los scripts para que utilicen un token de autenticación válido o para que apunten a la URL correcta del servidor.
