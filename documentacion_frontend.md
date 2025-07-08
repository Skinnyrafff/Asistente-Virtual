# Documentación Técnica del Frontend - Asistente Virtual

## 1. Introducción

Este documento describe la arquitectura, configuración y funcionamiento del frontend del Asistente Virtual. Se trata de una aplicación móvil diseñada para que los usuarios interactúen con el asistente, gestionen su perfil, configuren recordatorios y accedan a funciones de salud y emergencia.

La aplicación está construida para ser intuitiva y accesible, proporcionando una interfaz clara para todas las funcionalidades ofrecidas por el backend.

## 2. Tecnologías Utilizadas

-   **Framework:** React Native
-   **Plataforma de Desarrollo:** Expo
-   **Lenguaje:** TypeScript
-   **Navegación:** Expo Router (basado en la estructura de archivos)
-   **Gestión de Estado:** React Context API (`UserContext`)
-   **Linting:** ESLint

## 3. Requisitos Previos

-   Node.js (versión LTS recomendada)
-   npm o yarn como gestor de paquetes.
-   La aplicación Expo Go instalada en un dispositivo móvil (iOS o Android) para pruebas.
-   Opcional: Un emulador de Android (Android Studio) o un simulador de iOS (Xcode en macOS).

## 4. Instalación y Configuración

Sigue estos pasos para poner en marcha el frontend en tu entorno de desarrollo.

1.  **Navegar al Directorio:**
    ```bash
    cd Asistente-Virtual/Frontend
    ```

2.  **Instalar Dependencias:**
    ```bash
    npm install
    ```

3.  **Configurar la Conexión con el Backend:**
    La aplicación necesita saber la URL base de la API del backend. Esta configuración se encuentra probablemente en `constants/Api.ts`.

    Abre el archivo `Frontend/constants/Api.ts` y asegúrate de que la URL apunte a tu servidor de backend. Si estás ejecutando el backend localmente, la URL debería ser algo como:

    ```typescript
    // En constants/Api.ts
    export const API_BASE_URL = 'http://192.168.1.100:8000/api/v1'; // Usa la IP de tu máquina, no localhost
    ```
    **Importante:** Cuando ejecutas la app en un dispositivo físico, no puedes usar `localhost`. Debes usar la dirección IP de tu máquina en la red local.

## 5. Estructura del Proyecto

El proyecto utiliza la estructura de enrutamiento de Expo, donde la organización de los archivos en el directorio `app/` define la navegación de la aplicación.

```
Frontend/
├── app/
│   ├── _layout.tsx           # Layout principal de la aplicación.
│   ├── (auth)/               # Grupo de rutas para autenticación.
│   │   ├── _layout.tsx
│   │   └── index.tsx         # Pantalla de Login/Registro.
│   ├── (tabs)/               # Grupo de rutas para la navegación principal (con tabs).
│   │   ├── _layout.tsx       # Define la estructura de las pestañas.
│   │   ├── home.tsx          # Pantalla de inicio.
│   │   ├── chat.tsx
│   │   └── ...
│   ├── onboarding/           # Flujo de configuración inicial.
│   └── profile.tsx           # Pantalla de perfil de usuario.
├── assets/                   # Imágenes, fuentes y otros recursos estáticos.
├── constants/                # Configuraciones globales como colores y URL de la API.
│   ├── Api.ts
│   └── Colors.ts
├── context/                  # Lógica de estado global.
│   └── UserContext.tsx       # Gestiona el estado del usuario (token, datos de perfil).
├── hooks/                    # Hooks de React reutilizables.
└── package.json              # Dependencias y scripts del proyecto.
```

-   **`app/`**: Directorio principal que contiene todas las pantallas y define la navegación.
    -   Los directorios con paréntesis `(nombre)` son "grupos de rutas" que no afectan la URL pero permiten organizar la lógica y los layouts.
    -   `_layout.tsx` es un archivo especial que define un layout compartido para todas las rutas en el mismo nivel.
-   **`constants/`**: Almacena valores que no cambian, como la paleta de colores de la app y la URL base de la API.
-   **`context/UserContext.tsx`**: Un componente clave que provee información del usuario (si está logueado, su token, etc.) a toda la aplicación. Esto evita pasar `props` a través de múltiples niveles de componentes.

## 6. Flujo de Datos y Estado

-   **Autenticación:** El flujo de autenticación es gestionado por el grupo de rutas `(auth)`. Cuando un usuario inicia sesión correctamente, el `UserContext` se actualiza con el token JWT y los datos del usuario. La aplicación redirige al usuario a las pantallas principales `(tabs)`.
-   **Estado Global:** El `UserContext` actúa como la "fuente de verdad" para el estado de autenticación. Los componentes que necesitan saber si el usuario está logueado o acceder a su token consumen este contexto.
-   **Comunicación con la API:** Las llamadas a la API del backend se realizan utilizando `fetch` o una librería como `axios`. La URL base se importa desde `constants/Api.ts`, y el token de autenticación (cuando es necesario) se obtiene del `UserContext`.

## 7. Ejecución y Scripts

Para iniciar la aplicación en modo de desarrollo, ejecuta el siguiente comando desde el directorio `Frontend/`:

```bash
npm start
```

Esto iniciará el servidor de desarrollo de Expo y mostrará un código QR en la terminal. Puedes:

-   **Escanear el código QR** con la aplicación Expo Go en tu teléfono para abrir la app.
-   **Presionar `a`** en la terminal para intentar abrirla en un emulador de Android.
-   **Presionar `i`** para intentar abrirla en un simulador de iOS (solo en macOS).
-   **Presionar `w`** para abrir una versión web en tu navegador.

### Scripts Disponibles en `package.json`

-   `npm start`: Inicia el servidor de desarrollo.
-   `npm run android`: Inicia la app en un emulador/dispositivo Android conectado.
-   `npm run ios`: Inicia la app en un simulador/dispositivo iOS conectado.
-   `npm run web`: Inicia la versión web de la aplicación.
-   `npm run lint`: (Asumido) Ejecuta el linter para verificar la calidad del código.
