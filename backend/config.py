import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./resolvex.db")
JWT_SECRET = os.getenv("JWT_SECRET", "resolvex-secret-key-change-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

SIMILARITY_THRESHOLD = 0.60

EMBEDDING_MODEL = "all-MiniLM-L6-v2"

CATEGORIES = ["technical", "billing", "account", "network", "software", "hardware"]
DEPARTMENTS = {
    "technical": "Technical Support",
    "billing": "Billing Department",
    "account": "Account Management",
    "network": "Network Operations",
    "software": "Software Development",
    "hardware": "Hardware Support",
}
PRIORITIES = ["low", "medium", "high", "critical"]

URGENCY_KEYWORDS = [
    "urgent", "asap", "immediately", "emergency", "critical",
    "down", "crashed", "broken", "not working", "outage",
    "blocked", "cannot access", "locked out", "deadline",
]
