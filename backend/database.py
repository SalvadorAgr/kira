import sqlite3
from typing import List, Dict, Any
import json
import os
from datetime import datetime

DB_PATH = "psykira.db"

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    c = conn.cursor()
    
    # Chat History Table
    c.execute('''
        CREATE TABLE IF NOT EXISTS projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    try:
        c.execute('ALTER TABLE chat_history ADD COLUMN project_id INTEGER DEFAULT 1')
    except sqlite3.OperationalError:
        pass # Column likely exists

    c.execute('''
        CREATE TABLE IF NOT EXISTS chat_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER DEFAULT 1,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            metadata TEXT,
            FOREIGN KEY(project_id) REFERENCES projects(id)
        )
    ''')
    
    # Create default project
    c.execute("INSERT OR IGNORE INTO projects (id, name) VALUES (1, 'General')")
    
    # Task/Memory Table (Simple Key-Value for now)
    c.execute('''
        CREATE TABLE IF NOT EXISTS memory (
            key TEXT PRIMARY KEY,
            value TEXT,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    conn.close()

def save_message(role: str, content: str, metadata: Dict[str, Any] = None, project_id: int = 1):
    conn = get_db_connection()
    c = conn.cursor()
    meta_json = json.dumps(metadata) if metadata else None
    c.execute('INSERT INTO chat_history (role, content, metadata, project_id) VALUES (?, ?, ?, ?)',
              (role, content, meta_json, project_id))
    conn.commit()
    conn.close()

def get_chat_history(limit: int = 50, project_id: int = 1) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    c = conn.cursor()
    c.execute('SELECT * FROM chat_history WHERE project_id = ? ORDER BY id DESC LIMIT ?', (project_id, limit,))
    rows = c.fetchall()
    conn.close()
    
    history = []
    for row in rows:
        history.append({
            "id": row["id"],
            "role": row["role"],
            "content": row["content"],
            "timestamp": row["timestamp"],
            "metadata": json.loads(row["metadata"]) if row["metadata"] else {}
        })
    return history[::-1] # Return in chronological order

def save_memory(key: str, value: Any):
    conn = get_db_connection()
    c = conn.cursor()
    val_str = json.dumps(value)
    c.execute('''
        INSERT INTO memory (key, value, updated_at) 
        VALUES (?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=CURRENT_TIMESTAMP
    ''', (key, val_str))
    conn.commit()
    conn.close()

def get_memory(key: str) -> Any:
    conn = get_db_connection()
    c = conn.cursor()
    c.execute('SELECT value FROM memory WHERE key = ?', (key,))
    row = c.fetchone()
    conn.close()
    if row:
        return json.loads(row["value"])
    return None

def get_projects() -> List[Dict[str, Any]]:
    conn = get_db_connection()
    c = conn.cursor()
    c.execute('SELECT * FROM projects ORDER BY created_at DESC')
    rows = c.fetchall()
    conn.close()
    return [{"id": row["id"], "name": row["name"]} for row in rows]

def create_project(name: str) -> Dict[str, Any]:
    conn = get_db_connection()
    c = conn.cursor()
    try:
        c.execute('INSERT INTO projects (name) VALUES (?)', (name,))
        new_id = c.lastrowid
        conn.commit()
        return {"id": new_id, "name": name}
    except sqlite3.IntegrityError:
        return None
    finally:
        conn.close()

if __name__ == "__main__":
    init_db()
    print("Database initialized.")
