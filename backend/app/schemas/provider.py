import uuid
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field

class ProviderBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Provider full name")
    specialty: str = Field(..., min_length=1, max_length=100, description="Medical specialty (e.g. Cardiology)")
    npi: str = Field(..., min_length=10, max_length=10, description="10-digit National Provider Identifier")
    phone: str = Field(..., max_length=20)
    email: EmailStr

class ProviderCreate(ProviderBase):
    pass

class ProviderResponse(ProviderBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }
