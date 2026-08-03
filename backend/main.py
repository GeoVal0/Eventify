from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List

# Import our custom modules
import models
import schemas
import auth
from database import engine, get_db

# This line ensures all our database tables are created when the server starts
models.Base.metadata.create_all(bind=engine)

# Initialize the FastAPI application
app = FastAPI(
    title="Event Management and Booking API",
    description="REST API for the TED 2026 University Project",
    version="1.0.0"
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
# API Endpoints
# ==========================================

@app.get("/")
def read_root():
    """Health check endpoint."""
    return {"message": "Welcome to the Event Management API"}

# --- Authentication & Users ---

@app.post("/api/auth/login")
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
    return {"access_token": access_token, "token_type": "bearer"}


@app.post("/api/auth/register", response_model=schemas.UserResponse)
def register_user(user_data: schemas.UserCreate, role: models.UserRole, db: Session = Depends(get_db)):
    """
    Registers a new user. Expects JSON body with all required fields (AFM, address, etc.).
    Role is passed as a query parameter (e.g., ?role=ORGANIZER).
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
        role=role,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        email=user_data.email,
        phone=user_data.phone,
        address=user_data.address,
        afm=user_data.afm,
        latitude=user_data.latitude,
        longitude=user_data.longitude,
        is_approved=False  # Required: pending admin approval
    )

    # 5. Save to the database
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user

# --- Event Placeholders ---

@app.get("/api/events")
def get_events(db: Session = Depends(get_db)):
    return {"events": []}

@app.post("/api/events")
def create_event(db: Session = Depends(get_db), current_user: dict = Depends(auth.require_organizer)):
    return {"message": "Protected route: Only organizers can see this!"}