import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field

class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50, description="Unique username")
    email: EmailStr = Field(..., description="Valid contact email address")
    is_active: Optional[bool] = True

class UserCreate(UserBase):
    password: str = Field(..., min_length=6, max_length=100, description="Plaintext password")
    role: str = Field(default="CareCoordinator", description="User role: Admin, Doctor, or CareCoordinator")

class UserUpdate(BaseModel):
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    email: Optional[EmailStr] = None
    password: Optional[str] = Field(None, min_length=6, max_length=100)
    role: Optional[str] = None
    is_active: Optional[bool] = None

class UserResponse(BaseModel):
    id: uuid.UUID
    username: str
    email: EmailStr
    role: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }

class UserLogin(BaseModel):
    username: str = Field(..., description="Username or email")
    password: str = Field(..., description="Plaintext password")

class TokenUser(BaseModel):
    id: uuid.UUID
    username: str
    email: EmailStr
    role: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: TokenUser

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    role: Optional[str] = None

class OTPRequest(BaseModel):
    email: str = Field(..., description="Gmail ID or email to send OTP")

class OTPVerify(BaseModel):
    email: str = Field(..., description="Gmail ID or email")
    otp: str = Field(..., min_length=6, max_length=6, description="6-digit verification code")
