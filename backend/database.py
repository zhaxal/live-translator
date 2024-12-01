import sqlite3
from pathlib import Path
from logger import setup_logger

logger = setup_logger(__name__)

DB_PATH = Path("transcription_queue.db")


def init_db():
    logger.info("Initializing database")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS queue (
            id TEXT PRIMARY KEY,
            filename TEXT NOT NULL,
            status TEXT NOT NULL
        )
    """
    )
    conn.commit()
    conn.close()
    logger.debug("Database initialized successfully")


def add_to_queue(file_id, filename):
    logger.debug(f"Adding file to queue: {filename} (ID: {file_id})")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO queue (id, filename, status) VALUES (?, ?, ?)",
        (file_id, filename, "Queued"),
    )
    conn.commit()
    conn.close()


def update_status(file_id, status):
    logger.debug(f"Updating status for file {file_id}: {status}")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("UPDATE queue SET status = ? WHERE id = ?", (status, file_id))
    conn.commit()
    conn.close()


def get_status(file_id):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT status FROM queue WHERE id = ?", (file_id,))
    result = cursor.fetchone()
    conn.close()
    return result[0] if result else "Not Found"


def get_all_statuses():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT id, filename, status FROM queue")
    results = cursor.fetchall()
    conn.close()
    return [{"id": row[0], "filename": row[1], "status": row[2]} for row in results]


def remove_from_queue(file_id):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM queue WHERE id = ?", (file_id,))
    conn.commit()
    conn.close()
