"""
ResolveX — AI-Powered IT Helpdesk System
FastAPI Backend Entry Point
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import threading

from database import engine, SessionLocal, Base
from models import User, Ticket, SolvedTicket
from ai.ai_engine import ai_engine
from ai.dataset import SOLVED_TICKETS
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def seed_database():
    """Seed the database with solved tickets and default users."""
    db = SessionLocal()
    try:
        # Seed solved tickets (for FAISS index)
        if db.query(SolvedTicket).count() == 0:
            print("[SEED] Loading solved tickets dataset...")
            for ticket_data in SOLVED_TICKETS:
                st = SolvedTicket(**ticket_data)
                db.add(st)
            db.commit()
            print(f"[SEED] Loaded {len(SOLVED_TICKETS)} solved tickets.")

        # Seed default users
        if db.query(User).count() == 0:
            print("[SEED] Creating default users...")
            default_users = [
                User(name="Admin User", email="admin@resolvex.com", password_hash=pwd_context.hash("admin123"), role="admin"),
                User(name="John Developer", email="dev@resolvex.com", password_hash=pwd_context.hash("dev123"), role="developer", department="Technical Support"),
                User(name="Sarah Support", email="support@resolvex.com", password_hash=pwd_context.hash("support123"), role="developer", department="Software Development"),
                User(name="Mike Network", email="network@resolvex.com", password_hash=pwd_context.hash("network123"), role="developer", department="Network Operations"),
                User(name="Lisa Billing", email="billing@resolvex.com", password_hash=pwd_context.hash("billing123"), role="developer", department="Billing Department"),
                User(name="Test User", email="user@resolvex.com", password_hash=pwd_context.hash("user123"), role="user"),
            ]
            for user in default_users:
                db.add(user)
            db.commit()
            print("[SEED] Default users created.")
    finally:
        db.close()


def load_ai_models():
    """Load AI models and build FAISS index (runs in background thread)."""
    try:
        ai_engine.initialize()

        # Build FAISS index from solved tickets
        db = SessionLocal()
        try:
            solved = db.query(SolvedTicket).all()
            if solved:
                ids = [s.id for s in solved]
                texts = [f"{s.title} {s.description}" for s in solved]
                ai_engine.build_faiss_index(ids, texts)
        finally:
            db.close()
    except Exception as e:
        print(f"[AI] Error loading models: {e}")
        import traceback
        traceback.print_exc()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("[ResolveX] Starting up...")
    Base.metadata.create_all(bind=engine)
    seed_database()

    # Load AI models in background thread to not block startup
    ai_thread = threading.Thread(target=load_ai_models, daemon=True)
    ai_thread.start()
    print("[ResolveX] AI models loading in background...")

    yield

    # Shutdown
    print("[ResolveX] Shutting down...")


app = FastAPI(
    title="ResolveX API",
    description="AI-Powered IT Helpdesk System",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
from routers.auth import router as auth_router
from routers.tickets import router as tickets_router
from routers.admin import router as admin_router
from routers.developer import router as developer_router

app.include_router(auth_router)
app.include_router(tickets_router)
app.include_router(admin_router)
app.include_router(developer_router)


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "ai_ready": ai_engine.is_ready,
    }
