from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from datetime import datetime
from enum import Enum

# ==========================================
# Enums (Must match models.py)
# ==========================================
class UserRole(str, Enum):
    ADMIN = "ADMIN"
    ORGANIZER = "ORGANIZER"
    ATTENDEE = "ATTENDEE"
    GUEST = "GUEST"

class EventStatus(str, Enum):
    DRAFT = "DRAFT"
    PUBLISHED = "PUBLISHED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"

# ==========================================
# User Schemas
# ==========================================
class UserCreate(BaseModel):
    """Schema for validating data when a new user registers."""
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=8)
    first_name: str
    last_name: str
    email: EmailStr
    phone: str
    address: str
    afm: str = Field(..., min_length=9, max_length=9) # AFM is typically 9 digits
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class UserResponse(BaseModel):
    """Schema for sending user data back to the frontend (NO PASSWORDS!)."""
    id: int
    username: str
    role: UserRole
    is_approved: bool

    class Config:
        orm_mode = True  # Tells Pydantic to read data even if it is an SQLAlchemy object

# ==========================================
# Ticket Type Schemas
# ==========================================
class TicketTypeCreate(BaseModel):
    name: str
    price: float = Field(..., ge=0) # Price must be greater than or equal to 0
    quantity: int = Field(..., gt=0) # Quantity must be strictly greater than 0

class TicketTypeResponse(TicketTypeCreate):
    ticket_type_id: str
    available: int

    class Config:
        orm_mode = True

# ==========================================
# Event Schemas
# ==========================================
class EventCreate(BaseModel):
    title: str
    event_type: str
    category: str
    venue: str
    address: str
    city: str
    country: str
    start_datetime: datetime
    end_datetime: datetime
    capacity: int = Field(..., gt=0)
    description: str
    ticket_types: List[TicketTypeCreate]

class EventResponse(EventCreate):
    event_id: str
    status: EventStatus
    organizer_id: int
    # ticket_types gets overridden to include the response schema (with IDs and availability)
    ticket_types: List[TicketTypeResponse] 

    class Config:
        orm_mode = True