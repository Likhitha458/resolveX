from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone

from database import get_db
from models import User, Ticket, SolvedTicket
from routers.auth import get_current_user
from ai.ai_engine import ai_engine
from ai.llm_service import generate_response
from config import DEPARTMENTS

import jwt
from config import JWT_SECRET, JWT_ALGORITHM

router = APIRouter(prefix="/api/tickets", tags=["Tickets"])


# ---------- Helpers ----------

def extract_user(authorization: str = Header(None), db: Session = Depends(get_db)) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.split(" ")[1]
    return get_current_user(db, token)


# ---------- Schemas ----------

class CheckSimilarRequest(BaseModel):
    title: str
    description: str


class CheckSimilarResponse(BaseModel):
    found: bool
    similar_ticket: Optional[dict] = None
    ai_response: Optional[str] = None
    similarity_score: Optional[float] = None


class CreateTicketRequest(BaseModel):
    title: str
    description: str


class UpdateTicketStatusRequest(BaseModel):
    status: str


class TicketResponse(BaseModel):
    id: int
    title: str
    description: str
    category: Optional[str]
    priority: str
    sentiment: Optional[str]
    status: str
    department: Optional[str]
    resolution: Optional[str]
    user_id: int
    assigned_to: Optional[int]
    creator_name: Optional[str] = None
    assignee_name: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    class Config:
        from_attributes = True


# ---------- Routes ----------

@router.post("/check-similar", response_model=CheckSimilarResponse)
def check_similar_tickets(req: CheckSimilarRequest, db: Session = Depends(get_db), user: User = Depends(extract_user)):
    """Check for similar solved tickets and return AI-generated recommendation if found."""
    if not ai_engine.is_ready:
        raise HTTPException(status_code=503, detail="AI engine is still loading. Please try again.")

    combined_text = f"{req.title} {req.description}"
    results = ai_engine.search_similar(combined_text, top_k=1)

    if results:
        solved_ticket = db.query(SolvedTicket).filter(SolvedTicket.id == results[0]["id"]).first()
        if solved_ticket:
            ai_response = generate_response(
                user_issue=combined_text,
                solved_title=solved_ticket.title,
                solved_resolution=solved_ticket.resolution or "",
            )
            return CheckSimilarResponse(
                found=True,
                similar_ticket={
                    "id": solved_ticket.id,
                    "title": solved_ticket.title,
                    "description": solved_ticket.description,
                    "category": solved_ticket.category,
                    "resolution": solved_ticket.resolution,
                },
                ai_response=ai_response,
                similarity_score=results[0]["score"],
            )

    return CheckSimilarResponse(found=False)


@router.post("", response_model=TicketResponse)
def create_ticket(req: CreateTicketRequest, db: Session = Depends(get_db), user: User = Depends(extract_user)):
    """Create a new ticket with auto-classification, sentiment analysis, and assignment."""
    combined_text = f"{req.title} {req.description}"

    category = "technical"
    sentiment = "neutral"
    priority = "medium"
    department = DEPARTMENTS.get("technical", "Technical Support")

    if ai_engine.is_ready:
        category = ai_engine.classify_category(combined_text)
        sentiment = ai_engine.analyze_sentiment(combined_text)
        priority = ai_engine.calculate_priority(combined_text, sentiment)
        department = DEPARTMENTS.get(category, "Technical Support")

    # Find an available developer in the department
    assigned_dev = db.query(User).filter(
        User.role == "developer",
        User.department == department,
    ).first()

    # If no dev for exact department, find any developer
    if not assigned_dev:
        assigned_dev = db.query(User).filter(User.role == "developer").first()

    ticket = Ticket(
        title=req.title,
        description=req.description,
        category=category,
        priority=priority,
        sentiment=sentiment,
        status="open",
        department=department,
        user_id=user.id,
        assigned_to=assigned_dev.id if assigned_dev else None,
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)

    return _ticket_to_response(ticket, db)


@router.get("/my", response_model=list[TicketResponse])
def get_my_tickets(db: Session = Depends(get_db), user: User = Depends(extract_user)):
    """Get all tickets created by the current user."""
    tickets = db.query(Ticket).filter(Ticket.user_id == user.id).order_by(Ticket.created_at.desc()).all()
    return [_ticket_to_response(t, db) for t in tickets]


@router.get("/{ticket_id}", response_model=TicketResponse)
def get_ticket(ticket_id: int, db: Session = Depends(get_db), user: User = Depends(extract_user)):
    """Get a single ticket by ID."""
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return _ticket_to_response(ticket, db)


# ---------- Utility ----------

def _ticket_to_response(ticket: Ticket, db: Session) -> TicketResponse:
    creator = db.query(User).filter(User.id == ticket.user_id).first()
    assignee = db.query(User).filter(User.id == ticket.assigned_to).first() if ticket.assigned_to else None

    return TicketResponse(
        id=ticket.id,
        title=ticket.title,
        description=ticket.description,
        category=ticket.category,
        priority=ticket.priority,
        sentiment=ticket.sentiment,
        status=ticket.status,
        department=ticket.department,
        resolution=ticket.resolution,
        user_id=ticket.user_id,
        assigned_to=ticket.assigned_to,
        creator_name=creator.name if creator else None,
        assignee_name=assignee.name if assignee else None,
        created_at=ticket.created_at.isoformat() if ticket.created_at else None,
        updated_at=ticket.updated_at.isoformat() if ticket.updated_at else None,
    )
