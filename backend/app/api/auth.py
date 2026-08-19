from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_active_user
from app.services.auth import auth_service
from app.schemas.user import UserCreate, UserLogin, UserResponse, Token, TokenUser
from app.core.security import create_access_token
from app.models.user import User

router = APIRouter()

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    """Register a new user in the platform."""
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
