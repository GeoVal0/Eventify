from sqlalchemy import (
    Column, Integer, String, Float, DateTime, ForeignKey, Enum, Boolean, Text, Table
)
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
# Association table: Event <-> Category (many-to-many)
# The DTD allows an event to belong to more than one <Category>
# ==========================================
event_categories = Table(
    "event_categories",
    Base.metadata,
    Column("event_id", String, ForeignKey("events.event_id"), primary_key=True),
    Column("category_id", Integer, ForeignKey("categories.id"), primary_key=True),
)

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
    city = Column(String, nullable=True)
    country = Column(String, nullable=True)
    afm = Column(String, nullable=False)

    # Geolocation (Stored as floats)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    # New users need admin approval
    is_approved = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    organized_events = relationship("Event", back_populates="organizer")
    bookings = relationship("Booking", back_populates="attendee")
    event_views = relationship("EventView", back_populates="user")
    sent_messages = relationship(
        "Message", foreign_keys="Message.sender_id", back_populates="sender"
    )
    received_messages = relationship(
        "Message", foreign_keys="Message.recipient_id", back_populates="recipient"
    )


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)

    events = relationship("Event", secondary=event_categories, back_populates="categories")


class Event(Base):
    __tablename__ = "events"

    # Using String for EventID to match the assignment's EV1024 format
    event_id = Column(String, primary_key=True, index=True)
    title = Column(String, nullable=False)
    event_type = Column(String, nullable=False)

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
    status = Column(Enum(EventStatus), default=EventStatus.DRAFT, nullable=False)
    description = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Foreign Keys
    organizer_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Relationships
    organizer = relationship("User", back_populates="organized_events")
    categories = relationship("Category", secondary=event_categories, back_populates="events")
    ticket_types = relationship("TicketType", back_populates="event", cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="event")
    photos = relationship("Photo", back_populates="event", cascade="all, delete-orphan")
    views = relationship("EventView", back_populates="event", cascade="all, delete-orphan")


class Photo(Base):
    """Optional media attached to an event (<Media><Photo>...)."""
    __tablename__ = "photos"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(String, ForeignKey("events.event_id"), nullable=False)
    filename = Column(String, nullable=False)  # stored filename / URL

    event = relationship("Event", back_populates="photos")


class TicketType(Base):
    __tablename__ = "ticket_types"

    ticket_type_id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    price = Column(Float, nullable=False)
    quantity = Column(Integer, nullable=False)
    available = Column(Integer, nullable=False)

    # Foreign Key linking to the Event
    event_id = Column(String, ForeignKey("events.event_id"), nullable=False)

    # Relationships
    event = relationship("Event", back_populates="ticket_types")
    bookings = relationship("Booking", back_populates="ticket_type")


class Booking(Base):
    __tablename__ = "bookings"

    booking_id = Column(String, primary_key=True, index=True)
    time = Column(DateTime, default=datetime.utcnow)
    number_of_tickets = Column(Integer, nullable=False)
    total_cost = Column(Float, nullable=False)
    booking_status = Column(Enum(BookingStatus), default=BookingStatus.CONFIRMED, nullable=False)

    # Foreign Keys
    attendee_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    event_id = Column(String, ForeignKey("events.event_id"), nullable=False)
    ticket_type_id = Column(String, ForeignKey("ticket_types.ticket_type_id"), nullable=False)

    # Relationships
    attendee = relationship("User", back_populates="bookings")
    event = relationship("Event", back_populates="bookings")
    ticket_type = relationship("TicketType", back_populates="bookings")


class EventView(Base):
    """
    Implicit feedback signal: records that a user viewed an event's detail page.
    Used by the recommender (section 13) when a user has no booking history yet.
    """
    __tablename__ = "event_views"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    event_id = Column(String, ForeignKey("events.event_id"), nullable=False)
    viewed_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="event_views")
    event = relationship("Event", back_populates="views")


class Message(Base):
    """
    Organizer <-> attendee messaging (section 10). One row per message;
    inbox/sent are just queries filtered by recipient_id / sender_id.
    Soft-deleted independently per side so deleting from your inbox
    doesn't remove the message from the other person's sent folder.
    """
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    recipient_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    event_id = Column(String, ForeignKey("events.event_id"), nullable=True)  # context, e.g. cancellation notice
    subject = Column(String, nullable=True)
    body = Column(Text, nullable=False)
    sent_at = Column(DateTime, default=datetime.utcnow)
    is_read = Column(Boolean, default=False)
    deleted_by_sender = Column(Boolean, default=False)
    deleted_by_recipient = Column(Boolean, default=False)

    sender = relationship("User", foreign_keys=[sender_id], back_populates="sent_messages")
    recipient = relationship("User", foreign_keys=[recipient_id], back_populates="received_messages")
    event = relationship("Event")
