from pydantic import BaseModel, EmailStr, Field, ConfigDict

class RegisterBase(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    phone: str = Field(min_length=8, max_length=30)
    password: str = Field(min_length=8, max_length=100)

class BuyerRegister(RegisterBase):
    company_name: str = Field(min_length=2, max_length=255)
    industry: str = Field(min_length=2, max_length=150)
    registered_address: str = Field(min_length=5)
    plant_location: str = Field(min_length=2)
    gst_number: str = Field(min_length=5, max_length=50)
    website: str | None = None
    head_office_contact: str | None = None
    ehs_contact: str | None = None

class VendorRegister(RegisterBase):
    company_name: str = Field(min_length=2, max_length=255)
    industry_type: str = Field(min_length=2, max_length=150)
    address: str = Field(min_length=5)
    area_of_work: str = Field(min_length=2)
    experience_years: int = Field(ge=0, le=100)
    capacity: str | None = None
    specialization: str = Field(min_length=5)
    gst_number: str = Field(min_length=5, max_length=50)
    msme_number: str | None = None
    website: str | None = None
    domains: list[str] = Field(min_length=1)

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class VerifyEmailRequest(BaseModel):
    email: EmailStr
    code: str = Field(min_length=6, max_length=6)

class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    full_name: str
    email: EmailStr
    phone: str
    role: str
    status: str
    email_verified: bool
