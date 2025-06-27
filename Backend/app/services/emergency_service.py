import aiosqlite
import os
from datetime import datetime

# Ruta a la base de datos unificada
DB_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "database", "seniorassist.db")
)


async def registrar_emergencia(
    user_id: str, tipo_emergencia: str, mensaje_opcional: str = ""
) -> int:
    """Registra una nueva emergencia en la base de datos."""
    timestamp = datetime.now().isoformat()
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute(
            """INSERT INTO emergencies (user_id, tipo_emergencia, mensaje_opcional, timestamp)
               VALUES (?, ?, ?, ?)""",
            (user_id, tipo_emergencia, mensaje_opcional, timestamp),
        )
        await db.commit()
        return cursor.lastrowid


async def obtener_emergencias(user_id: str) -> list:
    """Obtiene todas las emergencias de un usuario."""
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute(
            """SELECT id, tipo_emergencia, mensaje_opcional, timestamp
               FROM emergencies WHERE user_id = ?
               ORDER BY timestamp DESC""",
            (user_id,),
        )
        rows = await cursor.fetchall()
        return [
            {
                "id": row[0],
                "tipo_emergencia": row[1],
                "mensaje_opcional": row[2],
                "timestamp": row[3],
            }
            for row in rows
        ]
