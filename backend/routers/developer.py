from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone

from database import get_db
from models import User, Ticket
from routers.auth import get_current_user
from routers.tickets import _ticket_to_response

import jwt
from config import JWT_SECRET, JWT_ALGORITHM

router = APIRouter(prefix="/api/developer", tags=["Developer"])


# ---------- Helpers ----------

def extract_developer(authorization: str = Header(None), db: Session = Depends(get_db)) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.split(" ")[1]
    user = get_current_user(db, token)
    if user.role not in ("developer", "admin"):
        raise HTTPException(status_code=403, detail="Developer access required")
    return user


# ---------- Schemas ----------

class UpdateStatusRequest(BaseModel):
    status: str  # open, in_progress, resolved, closed


class ResolveRequest(BaseModel):
    resolution: str
    status: str = "resolved"


# ---------- Routes ----------

@router.get("/tickets")
def get_assigned_tickets(db: Session = Depends(get_db), dev: User = Depends(extract_developer)):
    """Get all tickets assigned to the current developer."""
    tickets = db.query(Ticket).filter(Ticket.assigned_to == dev.id).order_by(Ticket.created_at.desc()).all()
    return [_ticket_to_response(t, db) for t in tickets]


@router.put("/tickets/{ticket_id}/status")
def update_ticket_status(
    ticket_id: int,
    req: UpdateStatusRequest,
    db: Session = Depends(get_db),
    dev: User = Depends(extract_developer),
):
    """Update ticket status."""
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    if ticket.assigned_to != dev.id and dev.role != "admin":
        raise HTTPException(status_code=403, detail="Not assigned to this ticket")

    valid_statuses = ["open", "in_progress", "resolved", "closed"]
    if req.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")

    ticket.status = req.status
    ticket.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(ticket)

    return _ticket_to_response(ticket, db)


@router.put("/tickets/{ticket_id}/resolve")
def resolve_ticket(
    ticket_id: int,
    req: ResolveRequest,
    db: Session = Depends(get_db),
    dev: User = Depends(extract_developer),
):
    """Add resolution and close ticket."""
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    if ticket.assigned_to != dev.id and dev.role != "admin":
        raise HTTPException(status_code=403, detail="Not assigned to this ticket")

    ticket.resolution = req.resolution
    ticket.status = req.status
    ticket.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(ticket)

    return _ticket_to_response(ticket, db)
