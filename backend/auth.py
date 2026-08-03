from datetime import datetime, timedelta
from typing import Optional
import jwt
import bcrypt # Using bcrypt directly to avoid passlib errors
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

# In a real application, NEVER hardcode the secret key! Store it in a .env file.
SECRET_KEY = "ted2026_super_secret_key_change_me"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

# FastAPI tool to extract the token from the "Authorization: Bearer <token>" header
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

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
        expire = datetime.utcnow() + timedelta(minutes=15)
        
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    
    return encoded_jwt

# ==========================================
# Role-Based Access Control (RBAC) Dependencies
# ==========================================

def get_current_user_token(token: str = Depends(oauth2_scheme)):
    """
    Decodes the JWT token sent by the React frontend.
    Raises a 401 Unauthorized error if the token is invalid or expired.
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

# --- Specific Role Checks ---

def require_admin(current_user: dict = Depends(get_current_user_token)):
    """Dependency to ensure only Admins can access an endpoint."""
    if current_user.get("role") != "ADMIN":
        raise HTTPException(status_code=403, detail="Not authorized. Admin role required.")
    return current_user

def require_organizer(current_user: dict = Depends(get_current_user_token)):
    """Dependency to ensure only Organizers can create/edit events."""
    if current_user.get("role") != "ORGANIZER":
        raise HTTPException(status_code=403, detail="Not authorized. Organizer role required.")
    return current_user

def require_attendee(current_user: dict = Depends(get_current_user_token)):
    """Dependency to ensure only Attendees can book tickets."""
    if current_user.get("role") != "ATTENDEE":
        raise HTTPException(status_code=403, detail="Not authorized. Attendee role required.")
    return current_user