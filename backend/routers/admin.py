from fastapi import APIRouter, Depends, HTTPException, Header, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from database import get_db
from models import User, Ticket
from routers.auth import get_current_user
from routers.tickets import _ticket_to_response

import jwt
from config import JWT_SECRET, JWT_ALGORITHM

router = APIRouter(prefix="/api/admin", tags=["Admin"])


# ---------- Helpers ----------

def extract_admin(authorization: str = Header(None), db: Session = Depends(get_db)) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.split(" ")[1]
    user = get_current_user(db, token)
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


# ---------- Schemas ----------

class ReassignRequest(BaseModel):
    assigned_to: int


class StatsResponse(BaseModel):
    total_tickets: int
    open_tickets: int
    in_progress_tickets: int
    resolved_tickets: int
    closed_tickets: int
    critical_tickets: int
    high_tickets: int


# ---------- Routes ----------

@router.get("/tickets")
def get_all_tickets(
    status: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    admin: User = Depends(extract_admin),
):
    """Get all tickets with optional filters."""
    query = db.query(Ticket)

    if status:
        query = query.filter(Ticket.status == status)
    if category:
        query = query.filter(Ticket.category == category)
    if priority:
        query = query.filter(Ticket.priority == priority)

    tickets = query.order_by(Ticket.created_at.desc()).all()
    return [_ticket_to_response(t, db) for t in tickets]


@router.put("/tickets/{ticket_id}/assign")
def reassign_ticket(
    ticket_id: int,
    req: ReassignRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(extract_admin),
):
    """Reassign a ticket to a different developer."""
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    dev = db.query(User).filter(User.id == req.assigned_to, User.role == "developer").first()
    if not dev:
        raise HTTPException(status_code=404, detail="Developer not found")

    ticket.assigned_to = dev.id
    db.commit()
    db.refresh(ticket)

    return _ticket_to_response(ticket, db)


@router.get("/stats", response_model=StatsResponse)
def get_stats(db: Session = Depends(get_db), admin: User = Depends(extract_admin)):
    """Get dashboard statistics."""
    total = db.query(Ticket).count()
    open_t = db.query(Ticket).filter(Ticket.status == "open").count()
    in_progress = db.query(Ticket).filter(Ticket.status == "in_progress").count()
    resolved = db.query(Ticket).filter(Ticket.status == "resolved").count()
    closed = db.query(Ticket).filter(Ticket.status == "closed").count()
    critical = db.query(Ticket).filter(Ticket.priority == "critical").count()
    high = db.query(Ticket).filter(Ticket.priority == "high").count()

    return StatsResponse(
        total_tickets=total,
        open_tickets=open_t,
        in_progress_tickets=in_progress,
        resolved_tickets=resolved,
        closed_tickets=closed,
        critical_tickets=critical,
        high_tickets=high,
    )


@router.get("/developers")
def get_developers(db: Session = Depends(get_db), admin: User = Depends(extract_admin)):
    """Get list of all developers for reassignment."""
    devs = db.query(User).filter(User.role == "developer").all()
    return [{"id": d.id, "name": d.name, "email": d.email, "department": d.department} for d in devs]
