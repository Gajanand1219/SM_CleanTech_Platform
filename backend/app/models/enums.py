from enum import Enum

class Role(str, Enum):
    ADMIN = "admin"
    BUYER = "buyer"
    VENDOR = "vendor"

class AccountStatus(str, Enum):
    PENDING = "pending"
    ACTIVE = "active"
    REJECTED = "rejected"
    BLOCKED = "blocked"

class EnquiryStatus(str, Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    APPROVED = "approved"
    MATCHED = "matched"
    QUOTATION = "quotation"
    ACCEPTED = "accepted"
    CLOSED = "closed"
    REJECTED = "rejected"
    CANCELLED = "cancelled"

class QuotationStatus(str, Enum):
    SUBMITTED = "submitted"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    EXPIRED = "expired"

class HandshakeStatus(str, Enum):
    PENDING = "pending"
    MUTUAL = "mutual"
    DECLINED = "declined"
