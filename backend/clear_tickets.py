import sys
import os

# Add backend directory to sys.path to import database and models
sys.path.append(r"c:\Users\likhi\OneDrive\Desktop\ResolveX\resolveX\backend")

from database import SessionLocal
from models import Ticket

def clear_tickets():
    db = SessionLocal()
    try:
        count = db.query(Ticket).count()
        db.query(Ticket).delete()
        db.commit()
        print(f"Successfully deleted {count} tickets from the database.")
    except Exception as e:
        db.rollback()
        print(f"Error deleting tickets: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    clear_tickets()
