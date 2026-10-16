from pydantic import BaseModel, Field

class EnquiryCreate(BaseModel):
    domain_id: int
    problem_id: int
    title: str = Field(min_length=3, max_length=255)
    answers: dict[str, str]

class QuotationCreate(BaseModel):
    enquiry_id: int
    capex: float = Field(gt=0)
    opex: float | None = Field(default=None, ge=0)
    technology: str = Field(min_length=2, max_length=255)
    implementation_time: str = Field(min_length=2, max_length=120)
    warranty: str | None = None
    amc: str | None = None
    proposal_notes: str | None = None

class HandshakeAction(BaseModel):
    quotation_id: int
    accept: bool
