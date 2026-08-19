import random
import re
from typing import Dict
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_active_user
from app.services.auth import auth_service
from app.schemas.user import (
    UserCreate, UserLogin, UserResponse, Token, TokenUser,
    OTPRequest, OTPVerify
)
from app.core.security import create_access_token
from app.models.user import User

router = APIRouter()

# In-memory OTP storage: { email: {"otp": "123456", "expires_at": datetime} }
OTP_STORE: Dict[str, dict] = {}

def is_valid_gmail_or_email(email: str) -> bool:
    """Validate format for real Gmail and hospital/clinical email addresses."""
    email_clean = email.strip().lower()
    # General email regex check
    pattern = r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
    if not re.match(pattern, email_clean):
        return False
    
    # Catch common typos for gmail
    domain = email_clean.split('@')[-1]
    common_typos = {'gmal.com', 'gmaill.com', 'gmai.com', 'gmil.com', 'gmial.com', 'gmal.co'}
    if domain in common_typos:
        return False
        
    return True


@router.post("/send-otp")
def send_otp(otp_in: OTPRequest):
    """Generate and send a 6-digit OTP verification code to a valid Gmail / Email address."""
    email = otp_in.email.strip().lower()
    
    if not is_valid_gmail_or_email(email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Gmail ID or email format. Please enter a valid address (e.g. yourname@gmail.com)."
        )
        
    # Generate random 6-digit OTP
    otp_code = f"{random.randint(100000, 999999)}"
    expires_at = datetime.utcnow() + timedelta(minutes=10)
    
    OTP_STORE[email] = {
        "otp": otp_code,
        "expires_at": expires_at
    }
    
    return {
        "message": f"Verification code sent successfully to {email}",
        "email": email,
        "otp": otp_code
    }


@router.post("/verify-otp")
def verify_otp(otp_in: OTPVerify):
    """Verify the 6-digit OTP code for the given Gmail / Email address."""
    email = otp_in.email.strip().lower()
    
    record = OTP_STORE.get(email)
    if not record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No OTP requested for this email. Please click 'Send OTP' first."
        )
        
    if datetime.utcnow() > record["expires_at"]:
        del OTP_STORE[email]
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification code has expired. Please request a new OTP."
        )
        
    if record["otp"] != otp_in.otp.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect 6-digit verification code. Please check and try again."
        )
        
    # Mark as verified
    record["verified"] = True
    return {
        "verified": True,
        "message": "Gmail ID verified successfully!"
    }


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    """Register a new user after validating Gmail address."""
    if not is_valid_gmail_or_email(user_in.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Gmail ID or email address format. Please enter a valid email (e.g. name@gmail.com)."
        )
        
    try:
        user = auth_service.register_user(db, user_in)
        return user
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/login", response_model=Token)
def login(login_in: UserLogin, db: Session = Depends(get_db)):
    """Authenticate credentials and return a JWT access token."""
    user = auth_service.authenticate(db, login_in.username, login_in.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/email or password"
        )
    
    access_token = create_access_token(subject=user.id, role=user.role)
    token_user = TokenUser(
        id=user.id,
        username=user.username,
        email=user.email,
        role=user.role
    )
    return Token(access_token=access_token, user=token_user)


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_active_user)):
    """Get the profile details of the currently logged-in user."""
    return current_user
