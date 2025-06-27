import aiosqlite
import os
from datetime import datetime

# Ruta a la base de datos unificada
DB_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "database", "seniorassist.db")
)


async def save_health_data(
    user_id: str, parameter: str, value: str, timestamp: str = None
) -> int:
    """Guarda un nuevo registro de salud en la base de datos."""
    if timestamp is None:
        timestamp = datetime.now().isoformat()

    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute(
            """INSERT INTO health_records (user_id, parameter, value, timestamp)
               VALUES (?, ?, ?, ?)""",
            (user_id, parameter, value, timestamp),
        )
        await db.commit()
        return cursor.lastrowid


async def get_health_data(user_id: str) -> list:
    """Obtiene todos los registros de salud de un usuario."""
    async with aiosqlite.connect(DB_PATH) as db:
        cursor = await db.execute(
            """SELECT id, parameter, value, timestamp
               FROM health_records
               WHERE user_id = ?
               ORDER BY timestamp DESC""",
            (user_id,),
        )
        rows = await cursor.fetchall()
        return [
            {"id": row[0], "parameter": row[1], "value": row[2], "timestamp": row[3]}
            for row in rows
        ]
