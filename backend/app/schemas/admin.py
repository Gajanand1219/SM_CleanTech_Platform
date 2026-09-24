from pydantic import BaseModel, Field

class StatusAction(BaseModel):
    status: str
    note: str | None = None

class EnquiryApprovalAction(BaseModel):
    status: str = Field(pattern="^(approved|rejected)$")
    note: str | None = Field(default=None, max_length=1000)
