
import os
import sqlite3

# Ruta a la base de datos unificada
DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'app', 'database', 'seniorassist.db'))

def create_unified_database():
    # Asegurarse de que el directorio de la base de datos exista
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)

    try:
        connection = sqlite3.connect(DB_PATH)
        cursor = connection.cursor()

        # Tabla de Recordatorios (reminders)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS reminders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                text TEXT NOT NULL,
                datetime TEXT NOT NULL
            )
        """)

        # Tabla de Registros de Salud (health_records)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS health_records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                parameter TEXT NOT NULL,
                value TEXT NOT NULL,
                timestamp TEXT NOT NULL
            )
        """)

        # Tabla de Emergencias (emergencies)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS emergencies (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                tipo_emergencia TEXT NOT NULL,
                mensaje_opcional TEXT,
                timestamp TEXT NOT NULL
            )
        """)

        connection.commit()
        print(f"Base de datos unificada y tablas creadas correctamente en: {DB_PATH}")

    except sqlite3.Error as e:
        print(f"❌ Error al crear la base de datos: {e}")
    finally:
        if connection:
            connection.close()

if __name__ == "__main__":
    create_unified_database()
