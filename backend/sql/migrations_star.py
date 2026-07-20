import sqlite3
import os

db_path = "backend/news.db"
if os.path.exists(db_path):
    try:
        conn = sqlite3.connect(db_path)
        cur = conn.cursor()
        
        # Check if is_starred column already exists
        columns = [info[1] for info in cur.execute("PRAGMA table_info(news)").fetchall()]
        if "is_starred" not in columns:
            cur.execute("ALTER TABLE news ADD COLUMN is_starred BOOLEAN DEFAULT 0")
            conn.commit()
            print("Successfully added is_starred column to SQLite news table.")
        else:
            print("is_starred column already exists.")
        conn.close()
    except Exception as e:
        print(f"Migration error: {e}")
else:
    print("Database file does not exist yet. It will be created with correct schema on startup.")
