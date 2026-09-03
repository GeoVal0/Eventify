"""
Helper functions shared by the event-related routes in main.py.
Kept separate from main.py so the route handlers stay focused on
request/response wiring while the actual business rules (ID generation,
capacity validation, serialization) live in one testable place.
"""
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, update
from fastapi import HTTPException
from typing import List, Optional
from datetime import datetime
import xml.etree.ElementTree as ET

import models
import schemas
import recommender
from database import normalize_text


# ==========================================
# ID generation
# ==========================================

def generate_event_id(db: Session) -> str:
    """Produces IDs in the EVxxxx shape used throughout the assignment (EV1024, ...)."""
    existing_ids = [row[0] for row in db.query(models.Event.event_id).all()]
    max_num = 1000
    for eid in existing_ids:
        digits = "".join(ch for ch in eid if ch.isdigit())
        if digits:
            max_num = max(max_num, int(digits))
    return f"EV{max_num + 1}"


def next_ticket_type_id(event_id: str, index: int) -> str:
    """
    ticket_type_id is a global primary key in the DB (not scoped per event),
    so we prefix it with the event id to keep it unique - e.g. 'EV1024-T1'.
    When exporting to XML/JSON against the assignment's DTD, the exporter
    can just use the local 'T1' suffix, since the DTD only requires
    uniqueness within a single Event element.
    """
    return f"{event_id}-T{index}"


def generate_booking_id(db: Session) -> str:
    """Produces IDs in the Bxxx shape used throughout the assignment (B501, ...)."""
    existing_ids = [row[0] for row in db.query(models.Booking.booking_id).all()]
    max_num = 500
    for bid in existing_ids:
        digits = "".join(ch for ch in bid if ch.isdigit())
        if digits:
            max_num = max(max_num, int(digits))
    return f"B{max_num + 1}"


# ==========================================
# Categories (many-to-many, case-insensitive de-dup)
# ==========================================

def get_or_create_categories(db: Session, names: List[str]) -> List[models.Category]:
    categories = []
    seen = set()
    for raw in names:
        name = raw.strip()
        if not name or name.lower() in seen:
            continue
        seen.add(name.lower())
        category = db.query(models.Category).filter(models.Category.name.ilike(name)).first()
        if not category:
            category = models.Category(name=name)
            db.add(category)
            db.flush()  # so it has an id available immediately if needed
        categories.append(category)
    if not categories:
        raise HTTPException(status_code=422, detail="Απαιτείται τουλάχιστον μία κατηγορία.")
    return categories


# ==========================================
# Ownership
# ==========================================

def get_owned_event(db: Session, event_id: str, current_user: models.User) -> models.Event:
    event = db.query(models.Event).filter(models.Event.event_id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found.")
    if event.organizer_id != current_user.id and current_user.role != models.UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Δεν είστε ο διοργανωτής αυτής της εκδήλωσης.")
    return event


# ==========================================
# Capacity / ticket-type validation (assignment section 7-d)
# ==========================================

def validate_capacity(total_ticket_quantity: int, capacity: int):
    if total_ticket_quantity > capacity:
        raise HTTPException(
            status_code=422,
            detail=(
                f"Το άθροισμα των ποσοτήτων εισιτηρίων ({total_ticket_quantity}) "
                f"υπερβαίνει τη συνολική χωρητικότητα ({capacity})."
            ),
        )


def apply_ticket_type_updates(
    db: Session,
    event: models.Event,
    updates: List[schemas.TicketTypeUpdate],
    new_capacity: int,
):
    """
    Upserts ticket types on an existing event:
    - an update item whose ticket_type_id matches an existing type edits it
      (quantity can't drop below what's already booked for that type),
    - any other update item creates a new ticket type.
    Untouched existing types are left exactly as they are.
    Validates the *prospective* total against new_capacity before writing
    anything, so a rejected update never leaves partial changes.
    """
    existing_by_id = {t.ticket_type_id: t for t in event.ticket_types}
    touched_ids = set()
    plans = []  # (action, existing_or_None, item, booked)

    for item in updates:
        if item.ticket_type_id and item.ticket_type_id in existing_by_id:
            existing = existing_by_id[item.ticket_type_id]
            booked = existing.quantity - existing.available
            if item.quantity < booked:
                raise HTTPException(
                    status_code=422,
                    detail=(
                        f"Δεν είναι δυνατή η μείωση της ποσότητας για '{existing.name}' "
                        f"κάτω από τις ήδη δεσμευμένες θέσεις ({booked})."
                    ),
                )
            plans.append(("update", existing, item, booked))
            touched_ids.add(item.ticket_type_id)
        else:
            plans.append(("create", None, item, 0))

    prospective_total = sum(
        t.quantity for tt_id, t in existing_by_id.items() if tt_id not in touched_ids
    )
    prospective_total += sum(item.quantity for _, _, item, _ in plans)
    validate_capacity(prospective_total, new_capacity)

    next_index = len(event.ticket_types) + 1
    for action, existing, item, booked in plans:
        if action == "update":
            existing.name = item.name
            existing.price = item.price
            existing.quantity = item.quantity
            existing.available = item.quantity - booked
        else:
            new_tt = models.TicketType(
                ticket_type_id=next_ticket_type_id(event.event_id, next_index),
                name=item.name,
                price=item.price,
                quantity=item.quantity,
                available=item.quantity,
                event_id=event.event_id,
            )
            db.add(new_tt)
            next_index += 1


# ==========================================
# Bookings (assignment section 9)
# ==========================================

def create_booking(
    db: Session,
    event: models.Event,
    attendee: models.User,
    payload: schemas.BookingCreate,
) -> models.Booking:
    """
    Books tickets for an event. The three checks from the assignment are all
    enforced server-side (never trust the client to have already checked):
      - the event must be PUBLISHED and not already ended,
      - the requested quantity must be <= that ticket type's availability,
      - the decrement itself is a single conditional UPDATE (available -= N
        WHERE available >= N), so two simultaneous bookings can't both
        succeed and oversell the same seats - the DB resolves the race, not
        a read-then-write check in Python.
    Total event capacity is protected for free: ticket type quantities are
    already validated to sum to <= capacity at creation/edit time, so as
    long as each type's `available` never goes negative, the event-wide
    total booked can never exceed capacity either.
    """
    ticket_type = (
        db.query(models.TicketType)
        .filter(
            models.TicketType.ticket_type_id == payload.ticket_type_id,
            models.TicketType.event_id == event.event_id,
        )
        .first()
    )
    if not ticket_type:
        raise HTTPException(status_code=404, detail="Ο τύπος εισιτηρίου δεν βρέθηκε για αυτή την εκδήλωση.")

    if event.status != models.EventStatus.PUBLISHED:
        raise HTTPException(status_code=409, detail="Η εκδήλωση δεν δέχεται κρατήσεις αυτή τη στιγμή.")
    if event.end_datetime <= datetime.utcnow():
        raise HTTPException(status_code=409, detail="Η εκδήλωση έχει ήδη ολοκληρωθεί.")

    result = db.execute(
        update(models.TicketType)
        .where(
            models.TicketType.ticket_type_id == ticket_type.ticket_type_id,
            models.TicketType.available >= payload.number_of_tickets,
        )
        .values(available=models.TicketType.available - payload.number_of_tickets)
    )
    if result.rowcount == 0:
        raise HTTPException(status_code=409, detail="Δεν υπάρχουν αρκετές διαθέσιμες θέσεις για τον τύπο εισιτηρίου.")

    booking = models.Booking(
        booking_id=generate_booking_id(db),
        attendee_id=attendee.id,
        event_id=event.event_id,
        ticket_type_id=ticket_type.ticket_type_id,
        number_of_tickets=payload.number_of_tickets,
        total_cost=round(ticket_type.price * payload.number_of_tickets, 2),
        booking_status=models.BookingStatus.CONFIRMED,
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)
    return booking


# ==========================================
# Messaging (assignment section 10)
# ==========================================

def verify_messaging_relationship(db: Session, event_id: str, sender: models.User, recipient: models.User) -> models.Event:
    """
    Messaging is scoped to an organizer<->attendee pair that shares a booking
    on the given event - not open messaging between arbitrary users. Works
    in either direction (organizer -> attendee or attendee -> organizer).
    """
    event = db.query(models.Event).filter(models.Event.event_id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found.")

    if event.organizer_id == sender.id:
        other_is_attendee_with_booking = (
            db.query(models.Booking)
            .filter(models.Booking.event_id == event_id, models.Booking.attendee_id == recipient.id)
            .first()
            is not None
        )
        if not other_is_attendee_with_booking:
            raise HTTPException(status_code=403, detail="Ο παραλήπτης δεν έχει κράτηση σε αυτή την εκδήλωση.")
    elif event.organizer_id == recipient.id:
        sender_has_booking = (
            db.query(models.Booking)
            .filter(models.Booking.event_id == event_id, models.Booking.attendee_id == sender.id)
            .first()
            is not None
        )
        if not sender_has_booking:
            raise HTTPException(status_code=403, detail="Χρειάζεστε κράτηση σε αυτή την εκδήλωση για να επικοινωνήσετε με τον διοργανωτή.")
    else:
        raise HTTPException(status_code=403, detail="Τα μηνύματα επιτρέπονται μόνο μεταξύ διοργανωτή και συμμετέχοντα με κράτηση στην ίδια εκδήλωση.")

    return event


def serialize_message(m: models.Message) -> dict:
    return {
        "id": m.id,
        "sender_id": m.sender_id,
        "sender_username": m.sender.username,
        "recipient_id": m.recipient_id,
        "recipient_username": m.recipient.username,
        "event_id": m.event_id,
        "event_title": m.event.title if m.event_id and m.event else None,
        "subject": m.subject,
        "body": m.body,
        "sent_at": m.sent_at,
        "is_read": m.is_read,
    }


# ==========================================
# Serialization (ORM -> dict matching the response schemas)
# ==========================================

def serialize_ticket_type(t: models.TicketType) -> dict:
    return {
        "ticket_type_id": t.ticket_type_id,
        "name": t.name,
        "price": t.price,
        "quantity": t.quantity,
        "available": t.available,
    }


def serialize_event(event: models.Event) -> dict:
    return {
        "event_id": event.event_id,
        "title": event.title,
        "categories": [c.name for c in event.categories],
        "event_type": event.event_type,
        "venue": event.venue,
        "address": event.address,
        "city": event.city,
        "country": event.country,
        "latitude": event.latitude,
        "longitude": event.longitude,
        "start_datetime": event.start_datetime,
        "end_datetime": event.end_datetime,
        "capacity": event.capacity,
        # Explicit "total reserved seats" tracking (assignment §7-d requires
        # this be maintained per event, alongside capacity and per-type
        # availability) - derived from ticket types, but exposed directly
        # so the frontend doesn't have to recompute it.
        "total_booked": sum(t.quantity - t.available for t in event.ticket_types),
        "status": event.status.value,
        "description": event.description,
        "organizer_id": event.organizer_id,
        "organizer_name": event.organizer.username,
        "photos": [p.filename for p in event.photos],
        "ticket_types": [serialize_ticket_type(t) for t in event.ticket_types],
    }


def serialize_event_summary(event: models.Event) -> dict:
    prices = [t.price for t in event.ticket_types]
    return {
        "event_id": event.event_id,
        "title": event.title,
        "categories": [c.name for c in event.categories],
        "event_type": event.event_type,
        "venue": event.venue,
        "address": event.address,
        "city": event.city,
        "country": event.country,
        "start_datetime": event.start_datetime,
        "status": event.status.value,
        "min_price": min(prices) if prices else None,
        "max_price": max(prices) if prices else None,
        "cover_photo": event.photos[0].filename if event.photos else None,
    }


def serialize_booking(b: models.Booking) -> dict:
    return {
        "booking_id": b.booking_id,
        "event_id": b.event_id,
        "event_title": b.event.title,
        "attendee_id": b.attendee_id,
        "attendee_username": b.attendee.username,
        "attendee_first_name": b.attendee.first_name,
        "attendee_last_name": b.attendee.last_name,
        "attendee_email": b.attendee.email,
        "attendee_address": b.attendee.address,
        "ticket_type_id": b.ticket_type_id,
        "ticket_type_name": b.ticket_type.name,
        "number_of_tickets": b.number_of_tickets,
        "total_cost": b.total_cost,
        "booking_status": b.booking_status.value,
        "time": b.time,
    }


# ==========================================
# Public search / browse (assignment section 8, API_CONTRACT.md §5)
# ==========================================

def _like_escape(term: str) -> str:
    """Escapes SQL LIKE wildcards in user input so literal % or _ in a
    search term don't act as wildcards."""
    return term.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


def search_events(
    db: Session,
    q: Optional[str] = None,
    location: Optional[str] = None,
    categories: Optional[List[str]] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    price_min: Optional[float] = None,
    price_max: Optional[float] = None,
    page: int = 1,
    page_size: int = 20,
):
    """
    Public browse/search over PUBLISHED events. Covers every filter axis the
    assignment calls for (category, title/description free text, date range,
    ticket price, location), plus the ones already visible in the partner's
    SearchEvents.jsx UI (multi-select categories, an area checkbox list +
    free-text location box, a price slider keyed off the cheapest ticket).
    Text matching is accent/case-insensitive (see database.normalize_text)
    to mirror the frontend's own removeAccents() behavior for Greek text.
    """
    query = db.query(models.Event).filter(models.Event.status == models.EventStatus.PUBLISHED)
    needs_distinct = False

    if categories:
        query = query.join(models.Event.categories).filter(models.Category.name.in_(categories))
        needs_distinct = True

    if date_from:
        query = query.filter(models.Event.start_datetime >= date_from)
    if date_to:
        query = query.filter(models.Event.start_datetime <= date_to)

    if q:
        pattern = f"%{_like_escape(normalize_text(q))}%"
        query = query.filter(
            or_(
                func.unaccent_lower(models.Event.title).like(pattern, escape="\\"),
                func.unaccent_lower(models.Event.description).like(pattern, escape="\\"),
            )
        )

    if location:
        pattern = f"%{_like_escape(normalize_text(location))}%"
        query = query.filter(
            or_(
                func.unaccent_lower(models.Event.city).like(pattern, escape="\\"),
                func.unaccent_lower(models.Event.address).like(pattern, escape="\\"),
                func.unaccent_lower(models.Event.venue).like(pattern, escape="\\"),
            )
        )

    if price_min is not None or price_max is not None:
        # One row per event: its cheapest ticket type price. Joining on that
        # lets "price range" mean the same thing here as it does in the
        # frontend's slider (filters off the *starting* price of an event).
        min_price_subq = (
            db.query(
                models.TicketType.event_id.label("event_id"),
                func.min(models.TicketType.price).label("min_price"),
            )
            .group_by(models.TicketType.event_id)
            .subquery()
        )
        query = query.join(min_price_subq, models.Event.event_id == min_price_subq.c.event_id)
        if price_min is not None:
            query = query.filter(min_price_subq.c.min_price >= price_min)
        if price_max is not None:
            query = query.filter(min_price_subq.c.min_price <= price_max)

    if needs_distinct:
        query = query.distinct()

    total = query.count()
    events = (
        query.order_by(models.Event.start_datetime.asc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return events, total


# ==========================================
# Admin export: XML (per assignment DTD) and equivalent JSON (§7)
# ==========================================

def _fmt_dt(dt: datetime) -> str:
    """Clean 'YYYY-MM-DDTHH:MM:SS' with no fractional seconds, matching the
    style used in the assignment's own sample XML (dt.isoformat() would
    include microseconds when present, which the sample doesn't show)."""
    return dt.strftime("%Y-%m-%dT%H:%M:%S")


def _local_ticket_type_id(event_id: str, ticket_type_id: str) -> str:
    """
    Our DB primary key is globally unique ('EV1024-T1', see next_ticket_type_id)
    because ticket_type_id has no per-event scoping in the schema. The DTD
    only requires TicketTypeID to be unique *within* one Event element (its
    own sample uses bare 'T1', 'T2'), so the export strips the event-id
    prefix back down to that local form.
    """
    prefix = f"{event_id}-"
    return ticket_type_id[len(prefix):] if ticket_type_id.startswith(prefix) else ticket_type_id


def build_events_xml(events: List[models.Event]) -> bytes:
    """
    Builds an <Events> document exactly matching the DTD in the assignment
    (section 7):
      Event(Title, Category+, EventType, Venue, Address, City, Country,
            GeoLocation?, StartDateTime, EndDateTime, Capacity, TicketTypes,
            Bookings, Organizer, Status, Description, Media?)
    Element order below follows that content model precisely - DTDs are
    order-sensitive, unlike JSON/XSD-with-attributes.
    """
    root = ET.Element("Events")
    for event in events:
        event_el = ET.SubElement(root, "Event", EventID=event.event_id)
        ET.SubElement(event_el, "Title").text = event.title
        for category in event.categories:
            ET.SubElement(event_el, "Category").text = category.name
        ET.SubElement(event_el, "EventType").text = event.event_type
        ET.SubElement(event_el, "Venue").text = event.venue
        ET.SubElement(event_el, "Address").text = event.address
        ET.SubElement(event_el, "City").text = event.city
        ET.SubElement(event_el, "Country").text = event.country
        if event.latitude is not None and event.longitude is not None:
            ET.SubElement(event_el, "GeoLocation", Latitude=str(event.latitude), Longitude=str(event.longitude))
        ET.SubElement(event_el, "StartDateTime").text = _fmt_dt(event.start_datetime)
        ET.SubElement(event_el, "EndDateTime").text = _fmt_dt(event.end_datetime)
        ET.SubElement(event_el, "Capacity").text = str(event.capacity)

        ticket_types_el = ET.SubElement(event_el, "TicketTypes")
        for t in event.ticket_types:
            tt_el = ET.SubElement(
                ticket_types_el, "TicketType",
                TicketTypeID=_local_ticket_type_id(event.event_id, t.ticket_type_id),
            )
            ET.SubElement(tt_el, "Name").text = t.name
            ET.SubElement(tt_el, "Price").text = f"{t.price:.2f}"
            ET.SubElement(tt_el, "Quantity").text = str(t.quantity)
            ET.SubElement(tt_el, "Available").text = str(t.available)

        bookings_el = ET.SubElement(event_el, "Bookings")
        for b in event.bookings:
            booking_el = ET.SubElement(bookings_el, "Booking", BookingID=b.booking_id)
            ET.SubElement(booking_el, "Attendee", UserID=b.attendee.username)
            ET.SubElement(booking_el, "Time").text = _fmt_dt(b.time)
            ET.SubElement(booking_el, "TicketTypeRef").text = _local_ticket_type_id(event.event_id, b.ticket_type_id)
            ET.SubElement(booking_el, "NumberOfTickets").text = str(b.number_of_tickets)
            ET.SubElement(booking_el, "TotalCost").text = f"{b.total_cost:.2f}"
            ET.SubElement(booking_el, "BookingStatus").text = b.booking_status.value

        ET.SubElement(event_el, "Organizer", UserID=event.organizer.username)
        ET.SubElement(event_el, "Status").text = event.status.value
        ET.SubElement(event_el, "Description").text = event.description

        if event.photos:
            media_el = ET.SubElement(event_el, "Media")
            for p in event.photos:
                ET.SubElement(media_el, "Photo").text = p.filename

    ET.indent(root, space="  ")
    return ET.tostring(root, encoding="utf-8", xml_declaration=True)


def build_events_json(events: List[models.Event]) -> dict:
    """
    JSON mirror of exactly the same DTD-shaped structure build_events_xml
    produces - same element names and nesting, just JSON instead of XML
    tags/attributes. Deliberately NOT the same shape as schemas.EventResponse
    (the REST API's own contract for the frontend) - this export exists for
    interoperability against the assignment's DTD specifically, so it stays
    faithful to that structure rather than the app's internal API shape.
    """
    def event_dict(event: models.Event) -> dict:
        d = {
            "EventID": event.event_id,
            "Title": event.title,
            "Category": [c.name for c in event.categories],
            "EventType": event.event_type,
            "Venue": event.venue,
            "Address": event.address,
            "City": event.city,
            "Country": event.country,
        }
        if event.latitude is not None and event.longitude is not None:
            d["GeoLocation"] = {"Latitude": str(event.latitude), "Longitude": str(event.longitude)}
        d["StartDateTime"] = _fmt_dt(event.start_datetime)
        d["EndDateTime"] = _fmt_dt(event.end_datetime)
        d["Capacity"] = event.capacity
        d["TicketTypes"] = {
            "TicketType": [
                {
                    "TicketTypeID": _local_ticket_type_id(event.event_id, t.ticket_type_id),
                    "Name": t.name,
                    "Price": t.price,
                    "Quantity": t.quantity,
                    "Available": t.available,
                }
                for t in event.ticket_types
            ]
        }
        d["Bookings"] = {
            "Booking": [
                {
                    "BookingID": b.booking_id,
                    "Attendee": {"UserID": b.attendee.username},
                    "Time": _fmt_dt(b.time),
                    "TicketTypeRef": _local_ticket_type_id(event.event_id, b.ticket_type_id),
                    "NumberOfTickets": b.number_of_tickets,
                    "TotalCost": b.total_cost,
                    "BookingStatus": b.booking_status.value,
                }
                for b in event.bookings
            ]
        }
        d["Organizer"] = {"UserID": event.organizer.username}
        d["Status"] = event.status.value
        d["Description"] = event.description
        if event.photos:
            d["Media"] = {"Photo": [p.filename for p in event.photos]}
        return d

    return {"Events": {"Event": [event_dict(e) for e in events]}}


# ==========================================
# Recommendations (assignment section 13, API_CONTRACT.md §8)
# The actual algorithm lives in recommender.py, kept independent of the
# database so it can be tested/demonstrated on its own (see
# recommender_demo.py). Everything here is just DB <-> algorithm glue.
# ==========================================

def build_interaction_dataset(db: Session):
    """
    Converts every booking and event-view in the app into the
    (user_idx, item_idx, rating) triples the recommender trains on, using
    dense 0-based indices (not raw database ids - see recommender.py).
    A booking always wins over a view for the same (user, event) pair,
    since it's the stronger signal.
    """
    pair_rating = {}

    bookings = db.query(models.Booking.attendee_id, models.Booking.event_id).distinct().all()
    for uid, eid in bookings:
        pair_rating[(uid, eid)] = recommender.BOOKING_SIGNAL

    views = db.query(models.EventView.user_id, models.EventView.event_id).distinct().all()
    for uid, eid in views:
        key = (uid, eid)
        if key not in pair_rating:  # never downgrade an existing booking signal
            pair_rating[key] = recommender.VIEW_SIGNAL

    user_ids = sorted({uid for uid, _ in pair_rating})
    event_ids = sorted({eid for _, eid in pair_rating})
    user_id_to_idx = {uid: idx for idx, uid in enumerate(user_ids)}
    event_id_to_idx = {eid: idx for idx, eid in enumerate(event_ids)}

    interactions = [
        (user_id_to_idx[uid], event_id_to_idx[eid], rating)
        for (uid, eid), rating in pair_rating.items()
    ]
    return interactions, user_id_to_idx, event_id_to_idx


def _popularity_fallback(db: Session, candidates: List[models.Event], limit: int) -> List[models.Event]:
    """
    Non-personalized ranking used for true cold start (no interaction data
    to learn from at all, for this user or possibly for anyone yet):
    most-booked first, soonest start date as a tiebreaker.
    """
    booking_counts = dict(
        db.query(models.Booking.event_id, func.count(models.Booking.booking_id))
        .group_by(models.Booking.event_id)
        .all()
    )
    ranked = sorted(
        candidates,
        key=lambda e: (-booking_counts.get(e.event_id, 0), e.start_datetime),
    )
    return ranked[:limit]


def get_recommendations(db: Session, user: models.User, limit: int = 10):
    """
    Full pipeline for one attendee's recommendations:
      1. gather bookable candidate events (published, not yet ended, not
         already booked by this user, at least one seat free somewhere),
      2. build the interaction dataset from ALL users' bookings/views and
         train a fresh BiasedMatrixFactorization model on it,
      3. if this user has a learned embedding (they've booked or viewed
         at least one thing, and the model trained successfully), rank
         candidates by predicted score; otherwise fall back to popularity.
    Returns (ranked_events, cold_start) - cold_start is True whenever the
    ranking isn't grounded in this user's own booking history (per
    API_CONTRACT.md §8), whether that's because it fell back to their view
    history instead, or all the way to the popularity fallback.
    """
    now = datetime.utcnow()
    booked_event_ids = {
        row[0] for row in
        db.query(models.Booking.event_id).filter(models.Booking.attendee_id == user.id).distinct().all()
    }
    has_booking_history = len(booked_event_ids) > 0

    candidates = (
        db.query(models.Event)
        .filter(models.Event.status == models.EventStatus.PUBLISHED, models.Event.end_datetime > now)
        .all()
    )
    candidates = [
        e for e in candidates
        if e.event_id not in booked_event_ids and sum(t.available for t in e.ticket_types) > 0
    ]
    if not candidates:
        return [], not has_booking_history

    interactions, user_id_to_idx, event_id_to_idx = build_interaction_dataset(db)
    user_idx = user_id_to_idx.get(user.id)

    if interactions and user_idx is not None:
        # Cap latent factors relative to how much data actually exists - a
        # fixed n_factors=12 would badly overparameterize a handful of
        # interactions (harmless mathematically, but underdetermined: with
        # very few observed ratings, many different parameter settings fit
        # the training data equally well without necessarily generalizing
        # the same way - roughly one factor per 4 observed interactions is
        # a reasonable ceiling, on top of never exceeding the user/item
        # counts themselves).
        n_factors = max(1, min(12, len(user_id_to_idx), len(event_id_to_idx), len(interactions) // 4))
        model = recommender.BiasedMatrixFactorization(n_factors=n_factors)
        model.fit(interactions, n_users=len(user_id_to_idx), n_items=len(event_id_to_idx))
        preds = model.predict_for_user(user_idx)

        scored = [
            (float(preds[event_id_to_idx[e.event_id]]) if e.event_id in event_id_to_idx else float(model.mu), e)
            for e in candidates
        ]
        scored.sort(key=lambda pair: pair[0], reverse=True)
        ranked = [e for _, e in scored[:limit]]
    else:
        ranked = _popularity_fallback(db, candidates, limit)

    return ranked, not has_booking_history
