# Asistente Virtual - Aplicación Full-Stack

Este repositorio contiene el código fuente de un Asistente Virtual completo, diseñado para ofrecer soporte y monitorización a usuarios, con un enfoque especial en el cuidado de adultos mayores. La solución se compone de un **backend** (API REST) y un **frontend** (aplicación móvil).

---

## 🌟 Características Principales

-   **🤖 Chat Interactivo:** Conversación fluida con un modelo de lenguaje para responder preguntas y realizar tareas.
-   **📅 Gestión de Recordatorios:** Permite a los usuarios y cuidadores configurar recordatorios para medicamentos, citas médicas y otras actividades.
-   **❤️ Monitor de Salud:** Registro y seguimiento de signos vitales básicos.
-   **🚨 Alerta de Emergencia:** Un botón de pánico que notifica a un contacto predefinido en caso de emergencia.
-   **📰 Servicios Externos:** Integración con APIs de noticias y clima para mantener al usuario informado.
-   **🔒 Autenticación Segura:** Sistema de registro e inicio de sesión basado en tokens JWT.

---

## 🛠️ Tecnologías Utilizadas

El proyecto está dividido en dos componentes principales:

| Componente | Tecnología         | Descripción                                      |
| :--------- | :----------------- | :----------------------------------------------- |
| **Backend**  | **Python**         | Lenguaje principal para la lógica del servidor.  |
|            | **FastAPI**        | Framework de alta velocidad para construir APIs. |
|            | **Docker**         | Para la contenerización y despliegue.            |
|            | **Pydantic**       | Para la validación de datos.                     |
| **Frontend** | **React Native**   | Framework para construir la app móvil nativa.    |
|            | **Expo**           | Plataforma para facilitar el desarrollo y build. |
|            | **TypeScript**     | Para un código más robusto y mantenible.         |
|            | **Expo Router**    | Sistema de navegación basado en archivos.        |

---

## 🚀 Puesta en Marcha

Sigue estos pasos para configurar y ejecutar el proyecto en tu entorno local.

### Requisitos Previos

-   Git
-   Python 3.9+
-   Node.js (LTS)
-   Docker y Docker Compose
-   (Opcional) App Expo Go en tu móvil para probar el frontend.

### 1. Clonar el Repositorio

```bash
git clone https://github.com/tu-usuario/Asistente-Virtual.git
cd Asistente-Virtual
```

### 2. Configurar y Ejecutar el Backend

Se recomienda usar Docker para una configuración más sencilla.

```bash
# Navega al directorio del backend
cd Backend

# Crea tu archivo de variables de entorno basándote en el ejemplo
# (Asegúrate de llenar las credenciales necesarias)
# cp .env.example .env

# Levanta los servicios con Docker Compose
docker-compose up --build
```

El servidor del backend estará disponible en `http://localhost:8000`.

> Para una configuración manual sin Docker, consulta la [documentación del backend](documentacion_backend.md).

### 3. Configurar y Ejecutar el Frontend

Una vez que el backend esté en ejecución:

```bash
# Navega al directorio del frontend
cd ../Frontend

# Instala las dependencias
npm install
```

Antes de iniciar, **configura la conexión con el backend**: 
1.  Abre el archivo `constants/Api.ts`.
2.  Modifica la variable `API_BASE_URL` para que apunte a la dirección IP de tu máquina en la red local (no uses `localhost` si vas a probar en un dispositivo físico).
    ```typescript
    export const API_BASE_URL = 'http://192.168.1.100:8000/api/v1';
    ```

Finalmente, inicia la aplicación:

```bash
npm start
```

Escanea el código QR con la app Expo Go o ejecuta la aplicación en un emulador.

---

## 📚 Documentación Detallada

Para una comprensión más profunda de cada parte del proyecto, consulta los siguientes documentos:

-   **[📄 Documentación del Backend](documentacion_backend.md)**
-   **[📄 Documentación del Frontend](documentacion_frontend.md)**

---

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Si deseas mejorar este proyecto, por favor, abre un *issue* para discutir los cambios o envía un *pull request*.

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Consulta el archivo `LICENSE` para más detalles.
