from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), default="user")  # user, developer, admin
    department = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    tickets = relationship("Ticket", back_populates="creator", foreign_keys="Ticket.user_id")
    assigned_tickets = relationship("Ticket", back_populates="assignee", foreign_keys="Ticket.assigned_to")


class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(300), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(50), nullable=True)
    priority = Column(String(20), default="medium")  # low, medium, high, critical
    sentiment = Column(String(30), nullable=True)  # angry, frustrated, neutral
    status = Column(String(20), default="open")  # open, in_progress, resolved, closed
    department = Column(String(100), nullable=True)
    resolution = Column(Text, nullable=True)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    assigned_to = Column(Integer, ForeignKey("users.id"), nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    creator = relationship("User", back_populates="tickets", foreign_keys=[user_id])
    assignee = relationship("User", back_populates="assigned_tickets", foreign_keys=[assigned_to])


class SolvedTicket(Base):
    """Pre-loaded solved tickets from the dataset for similarity search."""
    __tablename__ = "solved_tickets"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(300), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(50), nullable=True)
    resolution = Column(Text, nullable=True)
