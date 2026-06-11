import sys
import os

# Add backend directory to path
sys.path.append(r"c:\Users\likhi\OneDrive\Desktop\ResolveX\resolveX\backend")

from database import SessionLocal
from models import User, SolvedTicket

db = SessionLocal()
try:
    users = db.query(User).all()
    solved = db.query(SolvedTicket).count()
    print(f"Total Users seeded: {len(users)}")
    print(f"Total Solved Tickets seeded: {solved}")
    print("\nSeeded Users details:")
    for u in users:
        print(f"  Name: {u.name}, Email: {u.email}, Role: {u.role}, Department: {u.department}")
finally:
    db.close()
