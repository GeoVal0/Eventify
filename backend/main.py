import os
import uuid
from contextlib import asynccontextmanager
from datetime import datetime
from pathlib import Path
from fastapi import FastAPI, Depends, HTTPException, status, Query, Response, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List, Optional

# Import our custom modules
import models
import schemas
import auth
import crud
from database import engine, get_db, SessionLocal

# This line ensures all our database tables are created when the server starts
models.Base.metadata.create_all(bind=engine)


# ==========================================
# Seed the built-in Admin account (assignment requirement #3:
# "an admin user pre-installed with the application")
# ==========================================
def seed_admin_user():
    db: Session = SessionLocal()
    try:
        admin_username = os.getenv("ADMIN_USERNAME", "admin")
        existing = db.query(models.User).filter(models.User.username == admin_username).first()
        if existing:
            return
        admin_password = os.getenv("ADMIN_PASSWORD", "admin123")
        admin = models.User(
            username=admin_username,
            hashed_password=auth.get_password_hash(admin_password),
            role=models.UserRole.ADMIN,
            first_name="System",
            last_name="Administrator",
            # NOTE: avoid .local/.test/.invalid/.example TLDs here - they're
            # IANA special-use reserved domains and Pydantic's EmailStr
            # rejects them at validation time, which breaks every endpoint
            # that returns the admin's profile (learned this by actually
            # running GET /api/admin/users, not by inspection).
            email="admin@eventify.gr",
            phone="0000000000",
            address="N/A",
            afm="000000000",
            is_approved=True,
        )
        db.add(admin)
        db.commit()
        print(f"[startup] Seeded admin account -> username='{admin_username}' password='{admin_password}' (override via ADMIN_USERNAME / ADMIN_PASSWORD env vars)")
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    seed_admin_user()
    yield


# Initialize the FastAPI application
app = FastAPI(
    title="Event Management and Booking API",
    description="REST API for the TED 2026 University Project",
    version="1.0.0",
    lifespan=lifespan,
)

# ==========================================
# CORS Configuration
# ==========================================
origins = [
    "http://localhost:3000",
    "https://localhost:5173",
    "http://localhost:3001" # Added 3001 just in case React defaults to it!
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# Static file serving for uploaded event photos (DTD's optional Media/Photo)
# ==========================================
UPLOAD_DIR = Path(__file__).parent / "static" / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
ALLOWED_PHOTO_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024  # 5MB

app.mount("/static/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

# ==========================================
# API Endpoints
# ==========================================

@app.get("/")
def read_root():
    """Health check endpoint."""
    return {"message": "Welcome to the Event Management API"}

# --- Authentication & Users ---

@app.post("/api/auth/login", response_model=schemas.TokenResponse)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """
    Checks the user's credentials and returns a JWT if valid.
    """
    # 1. Find the user in the database
    user = db.query(models.User).filter(models.User.username == form_data.username).first()

    # 2. Check if user exists and password matches
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Λάθος όνομα χρήστη ή κωδικός."
        )

    # 3. Check if the admin has approved them
    # (Exempt the Admin account itself from needing approval)
    if not user.is_approved and user.role != models.UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Ο λογαριασμός σας εκκρεμεί για έγκριση από τον διαχειριστή."
        )

    # 4. Generate the JWT
    access_token = auth.create_access_token(
        data={"sub": str(user.id), "role": user.role.value}
    )

    # 5. Return the token to React
    return schemas.TokenResponse(
        access_token=access_token,
        role=user.role,
        user_id=user.id,
    )


@app.post("/api/auth/register", status_code=status.HTTP_201_CREATED)
def register_user(user_data: schemas.UserCreate, db: Session = Depends(get_db)):
    """
    Registers a new user. Role is now part of the JSON body (schemas.RegisterableRole),
    restricted to ATTENDEE / ORGANIZER - it can no longer be set to ADMIN by a client.
    Password confirmation is validated in the schema itself.
    """
    # 1. Check if username already exists (Strict Assignment Requirement)
    existing_user = db.query(models.User).filter(models.User.username == user_data.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Το όνομα χρήστη χρησιμοποιείται ήδη. Παρακαλώ επιλέξτε άλλο.")

    # 2. Check if email already exists
    existing_email = db.query(models.User).filter(models.User.email == user_data.email).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="Το email χρησιμοποιείται ήδη.")

    # 3. Hash the password securely
    hashed_pwd = auth.get_password_hash(user_data.password)

    # 4. Create the new user object
    new_user = models.User(
        username=user_data.username,
        hashed_password=hashed_pwd,
        role=models.UserRole(user_data.role.value),
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        email=user_data.email,
        phone=user_data.phone,
        address=user_data.address,
        city=user_data.city,
        country=user_data.country,
        afm=user_data.afm,
        latitude=user_data.latitude,
        longitude=user_data.longitude,
        is_approved=False  # Required: pending admin approval
    )

    # 5. Save to the database
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"message": "Registration submitted, pending admin approval."}


@app.get("/api/auth/me", response_model=schemas.UserResponse)
def get_my_profile(current_user: models.User = Depends(auth.get_current_user)):
    """Returns the logged-in user's own profile."""
    return current_user


# --- Admin: User Management ---

@app.get("/api/admin/users", response_model=List[schemas.UserResponse])
def list_users(
    status_filter: Optional[str] = Query(None, alias="status", pattern="^(pending|approved|all)?$"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_admin),
):
    query = db.query(models.User)
    if status_filter == "pending":
        query = query.filter(models.User.is_approved == False)  # noqa: E712
    elif status_filter == "approved":
        query = query.filter(models.User.is_approved == True)  # noqa: E712
    return query.order_by(models.User.created_at.desc()).all()


@app.get("/api/admin/users/{user_id}", response_model=schemas.UserResponse)
def get_user_detail(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_admin),
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    return user


@app.put("/api/admin/users/{user_id}/approve", response_model=schemas.UserResponse)
def approve_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_admin),
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    user.is_approved = True
    db.commit()
    db.refresh(user)
    return user


@app.put("/api/admin/users/{user_id}/reject", status_code=status.HTTP_204_NO_CONTENT)
def reject_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_admin),
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    if user.role == models.UserRole.ADMIN:
        raise HTTPException(status_code=400, detail="Cannot reject an admin account.")
    db.delete(user)
    db.commit()
    return None


# --- Admin Export (API_CONTRACT.md §7, assignment §12) ---

@app.get("/api/admin/events/export")
def export_events(
    export_format: str = Query(..., alias="format", pattern="^(xml|json)$"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_admin),
):
    """
    Exports every event - any status, not just PUBLISHED, since this is an
    admin data export rather than the public browse endpoint - as either
    XML matching the assignment's DTD exactly, or the equivalent JSON
    structure (same element names/nesting as the XML, not the REST API's
    own EventResponse shape).
    """
    events = db.query(models.Event).order_by(models.Event.event_id).all()
    if export_format == "xml":
        xml_bytes = crud.build_events_xml(events)
        return Response(
            content=xml_bytes,
            media_type="application/xml",
            headers={"Content-Disposition": 'attachment; filename="events_export.xml"'},
        )
    return crud.build_events_json(events)


# --- Events: Organizer Management (API_CONTRACT.md §3) ---

@app.post("/api/events", response_model=schemas.EventResponse, status_code=status.HTTP_201_CREATED)
def create_event(
    payload: schemas.EventCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_organizer),
):
    """Creates a new event in DRAFT status. Enforces that the sum of ticket
    type quantities never exceeds the event's capacity (assignment §7-a/d)."""
    total_qty = sum(t.quantity for t in payload.ticket_types)
    crud.validate_capacity(total_qty, payload.capacity)

    event_id = crud.generate_event_id(db)
    event = models.Event(
        event_id=event_id,
        title=payload.title,
        event_type=payload.event_type,
        venue=payload.venue,
        address=payload.address,
        city=payload.city,
        country=payload.country,
        latitude=payload.latitude,
        longitude=payload.longitude,
        start_datetime=payload.start_datetime,
        end_datetime=payload.end_datetime,
        capacity=payload.capacity,
        description=payload.description,
        organizer_id=current_user.id,
        status=models.EventStatus.DRAFT,
    )
    event.categories = crud.get_or_create_categories(db, payload.categories)
    db.add(event)
    db.flush()  # event_id is now valid to reference from ticket types

    for idx, tt in enumerate(payload.ticket_types, start=1):
        db.add(models.TicketType(
            ticket_type_id=crud.next_ticket_type_id(event_id, idx),
            name=tt.name,
            price=tt.price,
            quantity=tt.quantity,
            available=tt.quantity,
            event_id=event_id,
        ))

    db.commit()
    db.refresh(event)
    return crud.serialize_event(event)


@app.get("/api/events/mine", response_model=schemas.PaginatedEvents)
def list_my_events(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_organizer),
):
    """The organizer's own events, any status - draft, published, cancelled, completed."""
    query = (
        db.query(models.Event)
        .filter(models.Event.organizer_id == current_user.id)
        .order_by(models.Event.created_at.desc())
    )
    total = query.count()
    events = query.offset((page - 1) * page_size).limit(page_size).all()
    return {
        "items": [crud.serialize_event_summary(e) for e in events],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@app.put("/api/events/{event_id}", response_model=schemas.EventResponse)
def update_event(
    event_id: str,
    payload: schemas.EventUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_organizer),
):
    event = crud.get_owned_event(db, event_id, current_user)
    if event.status in (models.EventStatus.CANCELLED, models.EventStatus.COMPLETED):
        raise HTTPException(
            status_code=400,
            detail="Δεν είναι δυνατή η επεξεργασία ακυρωμένης ή ολοκληρωμένης εκδήλωσης.",
        )

    if payload.start_datetime is not None and payload.end_datetime is not None:
        if payload.end_datetime <= payload.start_datetime:
            raise HTTPException(status_code=422, detail="end_datetime must be after start_datetime.")

    simple_fields = [
        "title", "event_type", "venue", "address", "city", "country",
        "latitude", "longitude", "start_datetime", "end_datetime", "description",
    ]
    for field in simple_fields:
        value = getattr(payload, field)
        if value is not None:
            setattr(event, field, value)

    new_capacity = payload.capacity if payload.capacity is not None else event.capacity
    if payload.capacity is not None:
        event.capacity = payload.capacity

    if payload.categories is not None:
        event.categories = crud.get_or_create_categories(db, payload.categories)

    if payload.ticket_types is not None:
        crud.apply_ticket_type_updates(db, event, payload.ticket_types, new_capacity)
    else:
        # Capacity may have shrunk even without touching ticket types - re-check.
        existing_total = sum(t.quantity for t in event.ticket_types)
        crud.validate_capacity(existing_total, new_capacity)

    db.commit()
    db.refresh(event)
    return crud.serialize_event(event)


@app.delete("/api/events/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event(
    event_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_organizer),
):
    """
    Deletion is only allowed before publication, or - at the latest - before
    the first booking comes in (assignment §7-c). Published events with
    bookings must be cancelled instead.
    """
    event = crud.get_owned_event(db, event_id, current_user)
    has_bookings = db.query(models.Booking).filter(models.Booking.event_id == event_id).first() is not None
    if has_bookings:
        raise HTTPException(status_code=409, detail="Η εκδήλωση έχει ήδη κρατήσεις. Χρησιμοποιήστε ακύρωση αντί για διαγραφή.")
    if event.status not in (models.EventStatus.DRAFT, models.EventStatus.PUBLISHED):
        raise HTTPException(status_code=409, detail="Δεν είναι δυνατή η διαγραφή ακυρωμένης ή ολοκληρωμένης εκδήλωσης.")
    db.delete(event)
    db.commit()
    return None


@app.post("/api/events/{event_id}/publish", response_model=schemas.EventResponse)
def publish_event(
    event_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_organizer),
):
    event = crud.get_owned_event(db, event_id, current_user)
    if event.status != models.EventStatus.DRAFT:
        raise HTTPException(status_code=400, detail="Μόνο εκδηλώσεις σε κατάσταση DRAFT μπορούν να δημοσιευτούν.")
    if not event.ticket_types:
        raise HTTPException(status_code=400, detail="Προσθέστε τουλάχιστον έναν τύπο εισιτηρίου πριν τη δημοσίευση.")
    event.status = models.EventStatus.PUBLISHED
    db.commit()
    db.refresh(event)
    return crud.serialize_event(event)


@app.post("/api/events/{event_id}/cancel", response_model=schemas.EventResponse)
def cancel_event(
    event_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_organizer),
):
    """
    Cancels a published event: status -> CANCELLED, no deletion of stored
    data, existing bookings stay for historical/traceability purposes, and
    no new bookings will be accepted from this point (enforced in step 5's
    booking endpoint by checking status == PUBLISHED).
    Sending the cancellation notice to attendees is wired up in step 6
    (messaging) via POST /api/events/{id}/notify-cancellation.
    """
    event = crud.get_owned_event(db, event_id, current_user)
    if event.status != models.EventStatus.PUBLISHED:
        raise HTTPException(status_code=400, detail="Μόνο δημοσιευμένες εκδηλώσεις μπορούν να ακυρωθούν.")
    event.status = models.EventStatus.CANCELLED
    db.commit()
    db.refresh(event)
    return crud.serialize_event(event)


@app.get("/api/events/{event_id}/bookings", response_model=List[schemas.BookingResponse])
def get_event_bookings(
    event_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_organizer),
):
    """Lets an organizer review the bookings placed for one of their own events."""
    crud.get_owned_event(db, event_id, current_user)  # ownership check, raises 404/403
    bookings = db.query(models.Booking).filter(models.Booking.event_id == event_id).all()
    return [crud.serialize_booking(b) for b in bookings]


# --- Event Photos (DTD's optional Media/Photo) ---

@app.post("/api/events/{event_id}/photos", response_model=schemas.EventResponse, status_code=status.HTTP_201_CREATED)
async def upload_event_photo(
    event_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_organizer),
):
    """
    Uploads one photo for an event. Stored on local disk under
    static/uploads and served back from the /static/uploads mount; only
    the generated filename is stored in the DB (Photo.filename), matching
    the DTD's <Media><Photo>filename.jpg</Photo></Media> shape - the
    export in crud.build_events_xml/json already reads straight from that
    field. A fresh uuid-based filename avoids collisions and path-traversal
    issues from the client-supplied original filename.
    """
    event = crud.get_owned_event(db, event_id, current_user)
    if file.content_type not in ALLOWED_PHOTO_TYPES:
        raise HTTPException(status_code=422, detail="Μόνο εικόνες (JPEG, PNG, WEBP, GIF) επιτρέπονται.")
    contents = await file.read()
    if len(contents) > MAX_PHOTO_SIZE_BYTES:
        raise HTTPException(status_code=422, detail="Η εικόνα υπερβαίνει το μέγιστο μέγεθος των 5MB.")

    extension = Path(file.filename or "").suffix.lower() or ".jpg"
    stored_filename = f"{uuid.uuid4().hex}{extension}"
    (UPLOAD_DIR / stored_filename).write_bytes(contents)

    db.add(models.Photo(event_id=event.event_id, filename=stored_filename))
    db.commit()
    db.refresh(event)
    return crud.serialize_event(event)


@app.delete("/api/events/{event_id}/photos/{photo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event_photo(
    event_id: str,
    photo_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_organizer),
):
    event = crud.get_owned_event(db, event_id, current_user)
    photo = db.query(models.Photo).filter(
        models.Photo.id == photo_id, models.Photo.event_id == event.event_id
    ).first()
    if not photo:
        raise HTTPException(status_code=404, detail="Photo not found.")
    file_path = UPLOAD_DIR / photo.filename
    if file_path.exists():
        file_path.unlink()
    db.delete(photo)
    db.commit()
    return None


# --- Bookings (API_CONTRACT.md §4, assignment §9) ---

@app.post("/api/events/{event_id}/bookings", response_model=schemas.BookingResponse, status_code=status.HTTP_201_CREATED)
def book_tickets(
    event_id: str,
    payload: schemas.BookingCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_attendee),
):
    """
    Books tickets for a published, still-running event. All the real
    validation (status, timing, availability) happens server-side in
    crud.create_booking - the client confirming beforehand is a UX nicety,
    not something the backend can rely on. There's deliberately no
    cancel/undo endpoint here: once submitted a booking is final, per the
    assignment (§9 - "δεν θα είναι δυνατή η αναίρεσή της μετά την οριστική
    υποβολή της").
    """
    event = db.query(models.Event).filter(models.Event.event_id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found.")
    booking = crud.create_booking(db, event, current_user, payload)
    return crud.serialize_booking(booking)


@app.get("/api/bookings/mine", response_model=List[schemas.BookingResponse])
def list_my_bookings(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_attendee),
):
    """The current attendee's full booking history, most recent first."""
    bookings = (
        db.query(models.Booking)
        .filter(models.Booking.attendee_id == current_user.id)
        .order_by(models.Booking.time.desc())
        .all()
    )
    return [crud.serialize_booking(b) for b in bookings]


# --- Recommendations (API_CONTRACT.md §8, assignment §13) ---

@app.get("/api/recommendations", response_model=schemas.RecommendationsResponse)
def get_recommendations(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_attendee),
):
    """
    Personalized event recommendations via Biased Matrix Factorization
    (recommender.py), trained fresh on every request from the app's full
    booking + view history. See crud.get_recommendations for the pipeline
    and recommender.py for the algorithm itself.
    """
    events, cold_start = crud.get_recommendations(db, current_user, limit=limit)
    return {
        "events": [crud.serialize_event_summary(e) for e in events],
        "cold_start": cold_start,
    }


# --- Messaging (API_CONTRACT.md §6, assignment §10) ---

@app.get("/api/messages/inbox", response_model=schemas.PaginatedMessages)
def get_inbox(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_authenticated),
):
    query = (
        db.query(models.Message)
        .filter(models.Message.recipient_id == current_user.id, models.Message.deleted_by_recipient == False)  # noqa: E712
        .order_by(models.Message.sent_at.desc())
    )
    total = query.count()
    messages = query.offset((page - 1) * page_size).limit(page_size).all()
    return {
        "items": [crud.serialize_message(m) for m in messages],
        "total": total, "page": page, "page_size": page_size,
    }


@app.get("/api/messages/sent", response_model=schemas.PaginatedMessages)
def get_sent(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_authenticated),
):
    query = (
        db.query(models.Message)
        .filter(models.Message.sender_id == current_user.id, models.Message.deleted_by_sender == False)  # noqa: E712
        .order_by(models.Message.sent_at.desc())
    )
    total = query.count()
    messages = query.offset((page - 1) * page_size).limit(page_size).all()
    return {
        "items": [crud.serialize_message(m) for m in messages],
        "total": total, "page": page, "page_size": page_size,
    }


@app.get("/api/messages/unread-count")
def get_unread_count(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_authenticated),
):
    """Powers the nav-bar 'new messages' badge (assignment §10 - the
    indicator must be visible from wherever the user is navigating, not
    just inside the messaging page itself)."""
    count = (
        db.query(models.Message)
        .filter(
            models.Message.recipient_id == current_user.id,
            models.Message.is_read == False,  # noqa: E712
            models.Message.deleted_by_recipient == False,  # noqa: E712
        )
        .count()
    )
    return {"unread": count}


@app.post("/api/messages", response_model=schemas.MessageResponse, status_code=status.HTTP_201_CREATED)
def send_message(
    payload: schemas.MessageCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_authenticated),
):
    recipient = db.query(models.User).filter(models.User.id == payload.recipient_id).first()
    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient not found.")
    if recipient.id == current_user.id:
        raise HTTPException(status_code=422, detail="Δεν μπορείτε να στείλετε μήνυμα στον εαυτό σας.")

    crud.verify_messaging_relationship(db, payload.event_id, current_user, recipient)

    message = models.Message(
        sender_id=current_user.id,
        recipient_id=recipient.id,
        event_id=payload.event_id,
        subject=payload.subject,
        body=payload.body,
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    return crud.serialize_message(message)


@app.put("/api/messages/{message_id}/read", response_model=schemas.MessageResponse)
def mark_message_read(
    message_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_authenticated),
):
    message = db.query(models.Message).filter(models.Message.id == message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found.")
    if message.recipient_id != current_user.id:
        raise HTTPException(status_code=403, detail="Μόνο ο παραλήπτης μπορεί να σημειώσει το μήνυμα ως αναγνωσμένο.")
    message.is_read = True
    db.commit()
    db.refresh(message)
    return crud.serialize_message(message)


@app.delete("/api/messages/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_message(
    message_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_authenticated),
):
    """Soft-deletes on the caller's side only - deleting from your inbox
    doesn't remove it from the other person's sent folder. Once both sides
    have deleted it, the row is actually removed."""
    message = db.query(models.Message).filter(models.Message.id == message_id).first()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found.")

    if message.sender_id == current_user.id:
        message.deleted_by_sender = True
    elif message.recipient_id == current_user.id:
        message.deleted_by_recipient = True
    else:
        raise HTTPException(status_code=403, detail="Δεν είστε αποστολέας ή παραλήπτης αυτού του μηνύματος.")

    if message.deleted_by_sender and message.deleted_by_recipient:
        db.delete(message)
    db.commit()
    return None


@app.post("/api/events/{event_id}/notify-cancellation")
def notify_cancellation(
    event_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.require_organizer),
):
    """Sends a system message from the organizer to every distinct attendee
    who has a booking on this (now-cancelled) event."""
    event = crud.get_owned_event(db, event_id, current_user)
    if event.status != models.EventStatus.CANCELLED:
        raise HTTPException(status_code=400, detail="Η ενημέρωση ακύρωσης αποστέλλεται μόνο για ακυρωμένες εκδηλώσεις.")

    attendee_ids = {
        row[0] for row in
        db.query(models.Booking.attendee_id).filter(models.Booking.event_id == event_id).distinct().all()
    }

    for attendee_id in attendee_ids:
        db.add(models.Message(
            sender_id=current_user.id,
            recipient_id=attendee_id,
            event_id=event.event_id,
            subject=f"Ακύρωση εκδήλωσης: {event.title}",
            body=(
                f"Η εκδήλωση \"{event.title}\" ({event.venue}, {event.start_datetime.isoformat()}) "
                f"για την οποία έχετε κάνει κράτηση έχει ακυρωθεί από τον διοργανωτή."
            ),
        ))
    db.commit()
    return {"notified": len(attendee_ids)}


# --- Events: Public Search / Browse (assignment §8, API_CONTRACT.md §5) ---
# Registered before /api/events/{event_id} would be irrelevant here since this
# is the bare /api/events path - no collision either way, but keeping it next
# to the other public event routes for readability.

@app.get("/api/events", response_model=schemas.PaginatedEvents)
def search_events(
    q: Optional[str] = Query(None, description="Free text over title + description"),
    location: Optional[str] = Query(None, description="Free text over city, address, venue"),
    categories: Optional[List[str]] = Query(None, description="Repeat for multiple, e.g. ?categories=Music&categories=Jazz"),
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    price_min: Optional[float] = Query(None, ge=0),
    price_max: Optional[float] = Query(None, ge=0),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """Public browse/search - only PUBLISHED events are returned here."""
    events, total = crud.search_events(
        db, q=q, location=location, categories=categories,
        date_from=date_from, date_to=date_to,
        price_min=price_min, price_max=price_max,
        page=page, page_size=page_size,
    )
    return {
        "items": [crud.serialize_event_summary(e) for e in events],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


# --- Events: Public detail (API_CONTRACT.md §5) ---
# NOTE: single-event detail page, plus the /mine-adjacent list from step 3.

@app.get("/api/events/{event_id}", response_model=schemas.EventResponse)
def get_event_detail(
    event_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(auth.get_optional_current_user),
):
    event = db.query(models.Event).filter(models.Event.event_id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found.")

    is_owner_or_admin = current_user is not None and (
        current_user.id == event.organizer_id or current_user.role == models.UserRole.ADMIN
    )
    if event.status == models.EventStatus.DRAFT and not is_owner_or_admin:
        # Guests/other users shouldn't even learn a draft event exists.
        raise HTTPException(status_code=404, detail="Event not found.")

    if current_user is not None:
        db.add(models.EventView(user_id=current_user.id, event_id=event.event_id))
        db.commit()

    return crud.serialize_event(event)