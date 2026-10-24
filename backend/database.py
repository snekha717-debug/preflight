import sqlite3
import os
import json
from typing import List, Optional, Dict, Any

DB_PATH = os.path.join(os.path.dirname(__file__), "preflight.db")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS reviews (
            id TEXT PRIMARY KEY,
            content TEXT NOT NULL,
            purpose TEXT,
            created_at TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'Needs Review',
            model_used TEXT,
            findings_json TEXT NOT NULL
        )
    """)
    conn.commit()
    conn.close()

def save_review(review_id: str, content: str, purpose: Optional[str], created_at: str, status: str, model_used: Optional[str], findings: List[Dict[str, Any]]):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO reviews (id, content, purpose, created_at, status, model_used, findings_json)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (review_id, content, purpose or "", created_at, status, model_used or "", json.dumps(findings)))
    conn.commit()
    conn.close()

def get_all_reviews() -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, content, purpose, created_at, status, model_used, findings_json
        FROM reviews
        ORDER BY created_at DESC
    """)
    rows = cursor.fetchall()
    conn.close()

    result = []
    for row in rows:
        findings = json.loads(row["findings_json"]) if row["findings_json"] else []
        content = row["content"] or ""
        result.append({
            "id": row["id"],
            "content": content,
            "content_preview": content[:140] + ("..." if len(content) > 140 else ""),
            "purpose": row["purpose"],
            "created_at": row["created_at"],
            "status": row["status"],
            "model_used": row["model_used"],
            "findings_count": len(findings),
            "findings": findings
        })
    return result

def get_review_by_id(review_id: str) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, content, purpose, created_at, status, model_used, findings_json
        FROM reviews
        WHERE id = ?
    """, (review_id,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        return None

    findings = json.loads(row["findings_json"]) if row["findings_json"] else []
    content = row["content"] or ""
    return {
        "id": row["id"],
        "content": content,
        "content_preview": content[:140] + ("..." if len(content) > 140 else ""),
        "purpose": row["purpose"],
        "created_at": row["created_at"],
        "status": row["status"],
        "model_used": row["model_used"],
        "findings_count": len(findings),
        "findings": findings
    }
