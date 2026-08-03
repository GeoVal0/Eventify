from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum, Boolean
from sqlalchemy.orm import declarative_base, relationship
import enum
from datetime import datetime

Base = declarative_base()

# ==========================================
# Enums for strict status tracking
# ==========================================
class UserRole(enum.Enum):
    ADMIN = "ADMIN"
    ORGANIZER = "ORGANIZER"
    ATTENDEE = "ATTENDEE"
    GUEST = "GUEST"

class EventStatus(enum.Enum):
    DRAFT = "DRAFT"
    PUBLISHED = "PUBLISHED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"

class BookingStatus(enum.Enum):
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    CANCELLED = "CANCELLED"

# ==========================================
# Database Models (ORM)
# ==========================================

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    
    # Required registration fields based on the assignment
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    phone = Column(String, nullable=False)
    address = Column(String, nullable=False)
    afm = Column(String, nullable=False)
    
    # Geolocation (Stored as floats)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    
    # New users need admin approval
    is_approved = Column(Boolean, default=False)

    # Relationships
    organized_events = relationship("Event", back_populates="organizer")
    bookings = relationship("Booking", back_populates="attendee")


class Event(Base):
    __tablename__ = "events"

    # Using String for EventID to match the assignment's EV1024 format
    event_id = Column(String, primary_key=True, index=True)
    title = Column(String, nullable=False)
    event_type = Column(String, nullable=False)
    category = Column(String, nullable=False) # Can be normalized to a separate table later
    
    # Location
    venue = Column(String, nullable=False)
    address = Column(String, nullable=False)
    city = Column(String, nullable=False)
    country = Column(String, nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    
    # Details
    start_datetime = Column(DateTime, nullable=False)
    end_datetime = Column(DateTime, nullable=False)
    capacity = Column(Integer, nullable=False)
    status = Column(Enum(EventStatus), default=EventStatus.DRAFT)
    description = Column(String, nullable=False)
    
    # Foreign Keys
    organizer_id = Column(Integer, ForeignKey("users.id"))

    # Relationships
    organizer = relationship("User", back_populates="organized_events")
    ticket_types = relationship("TicketType", back_populates="event")
    bookings = relationship("Booking", back_populates="event")


class TicketType(Base):
    __tablename__ = "ticket_types"

    ticket_type_id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    price = Column(Float, nullable=False)
    quantity = Column(Integer, nullable=False)
    available = Column(Integer, nullable=False)
    
    # Foreign Key linking to the Event
    event_id = Column(String, ForeignKey("events.event_id"))
    
    # Relationships
    event = relationship("Event", back_populates="ticket_types")
    bookings = relationship("Booking", back_populates="ticket_type")


class Booking(Base):
    __tablename__ = "bookings"

    booking_id = Column(String, primary_key=True, index=True)
    time = Column(DateTime, default=datetime.utcnow)
    number_of_tickets = Column(Integer, nullable=False)
    total_cost = Column(Float, nullable=False)
    booking_status = Column(Enum(BookingStatus), default=BookingStatus.PENDING)
    
    # Foreign Keys
    attendee_id = Column(Integer, ForeignKey("users.id"))
    event_id = Column(String, ForeignKey("events.event_id"))
    ticket_type_id = Column(String, ForeignKey("ticket_types.ticket_type_id"))
    
    # Relationships
    attendee = relationship("User", back_populates="bookings")
    event = relationship("Event", back_populates="bookings")
    ticket_type = relationship("TicketType", back_populates="bookings")