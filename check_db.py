import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))
from app.core.database import SessionLocal
from app.models.habit import Habit
from app.models.user import User

def check_db():
    db = SessionLocal()
    try:
        users = db.query(User).all()
        habits = db.query(Habit).all()
        print(f"Total Users: {len(users)}")
        print(f"Total Habits: {len(habits)}")
        
        print("\n--- Users ---")
        for u in users:
            print(f"ID: {u.id}, Email: {u.email}, Google ID: {u.google_user_id}")
            
        print("\n--- Habits (First 5) ---")
        for h in habits[:5]:
            print(f"ID: {h.id}, Name: {h.name}, User ID: {h.user_id}")
            
    finally:
        db.close()

if __name__ == "__main__":
    check_db()
