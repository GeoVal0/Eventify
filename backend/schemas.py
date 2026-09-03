from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator
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

class RegisterableRole(str, Enum):
    """
    Subset of UserRole that a person is allowed to self-select at sign-up.
    ADMIN is deliberately excluded here - it's a seeded account only, never
    something a client can request. GUEST isn't a real account either
    (unauthenticated visitors are guests by default).
    """
    ORGANIZER = "ORGANIZER"
    ATTENDEE = "ATTENDEE"

class EventStatus(str, Enum):
    DRAFT = "DRAFT"
    PUBLISHED = "PUBLISHED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"

class BookingStatus(str, Enum):
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    CANCELLED = "CANCELLED"

# ==========================================
# User / Auth Schemas
# ==========================================
class UserCreate(BaseModel):
    """Schema for validating data when a new user registers."""
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=8)
    confirm_password: str
    role: RegisterableRole
    first_name: str
    last_name: str
    email: EmailStr
    phone: str
    address: str
    city: Optional[str] = None
    country: Optional[str] = None
    afm: str = Field(..., min_length=9, max_length=9)  # AFM is typically 9 digits
    latitude: Optional[float] = None
    longitude: Optional[float] = None

    @field_validator("confirm_password")
    @classmethod
    def passwords_match(cls, v, info):
        if "password" in info.data and v != info.data["password"]:
            raise ValueError("Passwords do not match.")
        return v

    @field_validator("afm")
    @classmethod
    def afm_must_be_numeric(cls, v):
        if not v.isdigit():
            raise ValueError("ΑΦΜ must contain only digits.")
        return v

class UserResponse(BaseModel):
    """Schema for sending user data back to the frontend (NO PASSWORDS!)."""
    id: int
    username: str
    role: UserRole
    is_approved: bool
    first_name: str
    last_name: str
    email: EmailStr
    phone: str
    address: str
    city: Optional[str] = None
    country: Optional[str] = None
    afm: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class TokenResponse(BaseModel):
    """Schema for the login response."""
    access_token: str
    token_type: str = "bearer"
    role: UserRole
    user_id: int

# ==========================================
# Ticket Type Schemas
# ==========================================
class TicketTypeCreate(BaseModel):
    name: str
    price: float = Field(..., ge=0)  # Price must be greater than or equal to 0
    quantity: int = Field(..., gt=0)  # Quantity must be strictly greater than 0

class TicketTypeUpdate(BaseModel):
    """
    One entry per ticket type in a PUT /api/events/{id} body.
    - ticket_type_id present & matches an existing type  -> that type is edited.
    - ticket_type_id omitted (or unrecognized)            -> a new type is created.
    There's deliberately no "delete" here: a ticket type can already have
    bookings pointing at it via foreign key, so removing one isn't safe in
    general. Set quantity down instead (bounded below by tickets already sold).
    """
    ticket_type_id: Optional[str] = None
    name: str
    price: float = Field(..., ge=0)
    quantity: int = Field(..., gt=0)

class TicketTypeResponse(BaseModel):
    ticket_type_id: str
    name: str
    price: float
    quantity: int
    available: int

    model_config = ConfigDict(from_attributes=True)

# ==========================================
# Event Schemas
# ==========================================
class EventCreate(BaseModel):
    title: str
    event_type: str
    categories: List[str] = Field(..., min_length=1)
    venue: str
    address: str
    city: str
    country: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    start_datetime: datetime
    end_datetime: datetime
    capacity: int = Field(..., gt=0)
    description: str
    ticket_types: List[TicketTypeCreate] = Field(..., min_length=1)

    @field_validator("end_datetime")
    @classmethod
    def end_after_start(cls, v, info):
        start = info.data.get("start_datetime")
        if start and v <= start:
            raise ValueError("end_datetime must be after start_datetime.")
        return v

class EventUpdate(BaseModel):
    """All fields optional - only what's provided gets changed.
    ticket_types, if provided, is applied via the upsert rule described
    on TicketTypeUpdate; if omitted entirely, existing ticket types are untouched."""
    title: Optional[str] = None
    event_type: Optional[str] = None
    categories: Optional[List[str]] = Field(None, min_length=1)
    venue: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    start_datetime: Optional[datetime] = None
    end_datetime: Optional[datetime] = None
    capacity: Optional[int] = Field(None, gt=0)
    description: Optional[str] = None
    ticket_types: Optional[List[TicketTypeUpdate]] = None

class EventSummary(BaseModel):
    """Lighter shape for list/search results (API_CONTRACT.md §5)."""
    event_id: str
    title: str
    categories: List[str]
    event_type: str
    venue: str
    address: str
    city: str
    country: str
    start_datetime: datetime
    status: EventStatus
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    cover_photo: Optional[str] = None

class EventResponse(BaseModel):
    event_id: str
    title: str
    categories: List[str]
    event_type: str
    venue: str
    address: str
    city: str
    country: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    start_datetime: datetime
    end_datetime: datetime
    capacity: int
    total_booked: int
    status: EventStatus
    description: str
    organizer_id: int
    organizer_name: str
    photos: List[str] = []
    ticket_types: List[TicketTypeResponse]

class PaginatedEvents(BaseModel):
    items: List[EventSummary]
    total: int
    page: int
    page_size: int

# ==========================================
# Booking Schemas
# ==========================================
class BookingCreate(BaseModel):
    ticket_type_id: str
    number_of_tickets: int = Field(..., gt=0)

class BookingResponse(BaseModel):
    booking_id: str
    event_id: str
    event_title: str
    attendee_id: int
    attendee_username: str
    attendee_first_name: Optional[str] = None
    attendee_last_name: Optional[str] = None
    attendee_email: Optional[str] = None
    attendee_address: Optional[str] = None
    ticket_type_id: str
    ticket_type_name: str
    number_of_tickets: int
    total_cost: float
    booking_status: BookingStatus
    time: datetime

# ==========================================
# Messaging Schemas (assignment §10, API_CONTRACT.md §6)
# ==========================================
class MessageCreate(BaseModel):
    """
    event_id is required (not optional): messaging in this app is scoped to
    an organizer<->attendee relationship formed by a booking (per the
    assignment's own framing - "after a booking is made"), not open
    user-to-user chat. The backend checks that relationship on send.
    """
    recipient_id: int
    event_id: str
    subject: Optional[str] = None
    body: str = Field(..., min_length=1)

class MessageResponse(BaseModel):
    id: int
    sender_id: int
    sender_username: str
    recipient_id: int
    recipient_username: str
    event_id: Optional[str] = None
    event_title: Optional[str] = None
    subject: Optional[str] = None
    body: str
    sent_at: datetime
    is_read: bool

class PaginatedMessages(BaseModel):
    items: List[MessageResponse]
    total: int
    page: int
    page_size: int

# ==========================================
# Recommendations Schema (assignment §13, API_CONTRACT.md §8)
# ==========================================
class RecommendationsResponse(BaseModel):
    events: List[EventSummary]
    cold_start: bool