from datetime import datetime, timedelta
from typing import Optional
import os
import jwt
import bcrypt # Using bcrypt directly to avoid passlib errors
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

import models
from database import get_db

# In a real application, NEVER hardcode the secret key! Store it in a .env file.
# Reading from an env var here so it's at least overridable without editing code.
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "ted2026_super_secret_key_change_me")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# FastAPI tool to extract the token from the "Authorization: Bearer <token>" header
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")
# Same, but doesn't error out when there's no token - for endpoints that are
# public but behave differently when the caller happens to be logged in
# (e.g. event detail pages: owners can see their own DRAFT events, and a
# logged-in view gets logged for the recommender).
optional_oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

# ==========================================
# Password Utilities (Updated for direct bcrypt)
# ==========================================

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Checks if the provided password matches the hash in the database."""
    # bcrypt requires bytes, so we encode the strings
    password_bytes = plain_password.encode('utf-8')
    hash_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(password_bytes, hash_bytes)

def get_password_hash(password: str) -> str:
    """Hashes a password so it can be securely stored in the database."""
    # Generate a salt and hash the password (converted to bytes)
    password_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed_bytes = bcrypt.hashpw(password_bytes, salt)
    
    # Return it as a normal string to store in the database
    return hashed_bytes.decode('utf-8')

# ==========================================
# JWT Utilities
# ==========================================

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Generates a JSON Web Token containing the user's ID and Role."""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    
    return encoded_jwt

# ==========================================
# Role-Based Access Control (RBAC) Dependencies
# ==========================================

def get_current_user_token(token: str = Depends(oauth2_scheme)) -> dict:
    """
    Decodes the JWT token sent by the React frontend.
    Raises a 401 Unauthorized error if the token is invalid or expired.
    Kept around (lightweight, no DB hit) for any endpoint that only needs
    the id/role and not the full profile.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        role: str = payload.get("role")

        if user_id is None or role is None:
            raise credentials_exception

        return {"user_id": user_id, "role": role}

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.PyJWTError:
        raise credentials_exception


def get_current_user(
    token_data: dict = Depends(get_current_user_token),
    db: Session = Depends(get_db),
) -> models.User:
    """
    Same as get_current_user_token, but resolves the full User row from the
    database. Use this whenever an endpoint needs more than id/role - e.g.
    checking event ownership, or returning the caller's own profile.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        user_id = int(token_data["user_id"])
    except (KeyError, ValueError):
        raise credentials_exception

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None:
        raise credentials_exception
    return user


def get_current_approved_user(
    current_user: models.User = Depends(get_current_user),
) -> models.User:
    """Extra guard for endpoints that must reject not-yet-approved accounts
    even if their token is technically valid (e.g. it hasn't expired yet
    but an admin rejected them after login)."""
    if not current_user.is_approved and current_user.role != models.UserRole.ADMIN:
        raise HTTPException(
            status_code=403,
            detail="Ο λογαριασμός σας εκκρεμεί για έγκριση από τον διαχειριστή.",
        )
    return current_user


def get_optional_current_user(
    token: Optional[str] = Depends(optional_oauth2_scheme),
    db: Session = Depends(get_db),
) -> Optional[models.User]:
    """Like get_current_user, but returns None instead of raising when
    there's no token or it's invalid/expired - for genuinely public
    endpoints that only need to know *if* someone happens to be logged in."""
    if not token:
        return None
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            return None
        return db.query(models.User).filter(models.User.id == int(user_id)).first()
    except (jwt.PyJWTError, ValueError):
        return None


# --- Role Checks ---
# require_role(...) is the single source of truth; the three names below
# are kept so existing imports (e.g. in main.py) don't break.

def require_role(*allowed_roles: str):
    """Factory for a dependency that only lets the given roles through.
    Usage: current_user: models.User = Depends(require_role("ADMIN", "ORGANIZER"))
    """
    def checker(
        current_user: models.User = Depends(get_current_approved_user),
    ) -> models.User:
        if current_user.role.value not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail=f"Not authorized. Required role(s): {', '.join(allowed_roles)}.",
            )
        return current_user
    return checker


require_admin = require_role("ADMIN")
require_organizer = require_role("ORGANIZER")
require_attendee = require_role("ATTENDEE")
# Any authenticated, approved user - used by endpoints like messaging that
# any registered role (attendee/organizer/admin) can hit.
require_authenticated = require_role("ADMIN", "ORGANIZER", "ATTENDEE")