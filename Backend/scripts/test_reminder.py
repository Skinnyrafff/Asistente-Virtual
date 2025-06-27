import os
import sqlite3
import json
from datetime import datetime

# RUTA CORREGIDA a la base de datos
DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'app', 'database', 'reminders.db'))

def create_reminder(user_id, message, date, full_json):
    connection = sqlite3.connect(DB_PATH)
    cursor = connection.cursor()

    cursor.execute(
        "INSERT INTO reminders (user_id, message, date, full_json) VALUES (?, ?, ?, ?)",
        (user_id, message, date, json.dumps(full_json))
    )
    connection.commit()
    reminder_id = cursor.lastrowid
    connection.close()
    return reminder_id

def get_reminders(user_id):
    connection = sqlite3.connect(DB_PATH)
    cursor = connection.cursor()

    cursor.execute(
        "SELECT id, message, date FROM reminders WHERE user_id = ?",
        (user_id,)
    )
    results = cursor.fetchall()
    connection.close()
    return results

def update_reminder(reminder_id, new_message, new_date):
    connection = sqlite3.connect(DB_PATH)
    cursor = connection.cursor()

    cursor.execute(
        "UPDATE reminders SET message = ?, date = ? WHERE id = ?",
        (new_message, new_date, reminder_id)
    )
    connection.commit()
    connection.close()

def delete_reminder(reminder_id):
    connection = sqlite3.connect(DB_PATH)
    cursor = connection.cursor()

    cursor.execute("DELETE FROM reminders WHERE id = ?", (reminder_id,))
    connection.commit()
    connection.close()

if __name__ == "__main__":
    user_id = "default"
    message = "Recordar cita médica"
    date = str(datetime.now())
    full_json = {"original_text": message, "datetime": date}

    print("🔄 Creando recordatorio...")
    reminder_id = create_reminder(user_id, message, date, full_json)
    print(f"✅ Recordatorio creado con ID: {reminder_id}")

    print("\n📋 Recordatorios actuales:")
    print(get_reminders(user_id))

    print("\n✏️ Actualizando recordatorio...")
    update_reminder(reminder_id, "Nueva cita con el doctor", "2025-06-20T10:00:00")
    print(get_reminders(user_id))

    print("\n🗑️ Eliminando recordatorio...")
    delete_reminder(reminder_id)
    print(get_reminders(user_id))
