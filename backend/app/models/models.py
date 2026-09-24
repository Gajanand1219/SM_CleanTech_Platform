from datetime import datetime
from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.db import Base
from .enums import Role, AccountStatus, EnquiryStatus, QuotationStatus, HandshakeStatus

class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    full_name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    phone: Mapped[str] = mapped_column(String(30), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[Role] = mapped_column(String(20), nullable=False, index=True)
    status: Mapped[AccountStatus] = mapped_column(String(20), default=AccountStatus.PENDING, index=True)
    email_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    buyer_profile = relationship("BuyerProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    vendor_profile = relationship("VendorProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")

class BuyerProfile(Base):
    __tablename__ = "buyer_profiles"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    company_name: Mapped[str] = mapped_column(String(255), nullable=False)
    industry: Mapped[str] = mapped_column(String(150), nullable=False)
    registered_address: Mapped[str] = mapped_column(Text, nullable=False)
    plant_location: Mapped[str] = mapped_column(String(255), nullable=False)
    gst_number: Mapped[str] = mapped_column(String(50), nullable=False)
    website: Mapped[str | None] = mapped_column(String(255))
    head_office_contact: Mapped[str | None] = mapped_column(String(150))
    ehs_contact: Mapped[str | None] = mapped_column(String(150))
    user = relationship("User", back_populates="buyer_profile")

class VendorProfile(Base):
    __tablename__ = "vendor_profiles"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    company_name: Mapped[str] = mapped_column(String(255), nullable=False)
    industry_type: Mapped[str] = mapped_column(String(150), nullable=False)
    address: Mapped[str] = mapped_column(Text, nullable=False)
    area_of_work: Mapped[str] = mapped_column(String(255), nullable=False)
    experience_years: Mapped[int] = mapped_column(Integer, default=0)
    capacity: Mapped[str | None] = mapped_column(String(255))
    specialization: Mapped[str] = mapped_column(Text, nullable=False)
    gst_number: Mapped[str] = mapped_column(String(50), nullable=False)
    msme_number: Mapped[str | None] = mapped_column(String(80))
    website: Mapped[str | None] = mapped_column(String(255))
    domains: Mapped[list] = mapped_column(JSON, default=list)
    user = relationship("User", back_populates="vendor_profile")

class Domain(Base):
    __tablename__ = "domains"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(150), unique=True, nullable=False)
    description: Mapped[str] = mapped_column(Text, default="")
    problems = relationship("Problem", back_populates="domain", cascade="all, delete-orphan")

class Problem(Base):
    __tablename__ = "problems"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    domain_id: Mapped[int] = mapped_column(ForeignKey("domains.id", ondelete="CASCADE"))
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    sub_domain: Mapped[str] = mapped_column(String(150), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="")
    questions = relationship("Question", back_populates="problem", cascade="all, delete-orphan")
    domain = relationship("Domain", back_populates="problems")

class Question(Base):
    __tablename__ = "questions"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    problem_id: Mapped[int] = mapped_column(ForeignKey("problems.id", ondelete="CASCADE"))
    question_text: Mapped[str] = mapped_column(Text, nullable=False)
    field_key: Mapped[str] = mapped_column(String(80), nullable=False)
    required: Mapped[bool] = mapped_column(Boolean, default=True)
    problem = relationship("Problem", back_populates="questions")

class Enquiry(Base):
    __tablename__ = "enquiries"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    buyer_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    domain_id: Mapped[int] = mapped_column(ForeignKey("domains.id"), nullable=False)
    problem_id: Mapped[int] = mapped_column(ForeignKey("problems.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[EnquiryStatus] = mapped_column(String(30), default=EnquiryStatus.SUBMITTED, index=True)
    dossier: Mapped[str] = mapped_column(Text, default="")
    submitted_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    buyer = relationship("User", foreign_keys=[buyer_id])
    domain = relationship("Domain")
    problem = relationship("Problem")
    answers = relationship("QuestionAnswer", back_populates="enquiry", cascade="all, delete-orphan")
    matches = relationship("EnquiryMatch", back_populates="enquiry", cascade="all, delete-orphan")
    quotations = relationship("Quotation", back_populates="enquiry", cascade="all, delete-orphan")
    handshake = relationship("Handshake", back_populates="enquiry", uselist=False, cascade="all, delete-orphan")

class QuestionAnswer(Base):
    __tablename__ = "question_answers"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    enquiry_id: Mapped[int] = mapped_column(ForeignKey("enquiries.id", ondelete="CASCADE"))
    question_id: Mapped[int] = mapped_column(ForeignKey("questions.id"))
    answer: Mapped[str] = mapped_column(Text, nullable=False)
    enquiry = relationship("Enquiry", back_populates="answers")

class EnquiryMatch(Base):
    __tablename__ = "enquiry_matches"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    enquiry_id: Mapped[int] = mapped_column(ForeignKey("enquiries.id", ondelete="CASCADE"))
    vendor_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    match_score: Mapped[float] = mapped_column(Float, default=0)
    notified: Mapped[bool] = mapped_column(Boolean, default=False)
    enquiry = relationship("Enquiry", back_populates="matches")
    vendor = relationship("User", foreign_keys=[vendor_id])
    __table_args__ = (UniqueConstraint("enquiry_id", "vendor_id", name="uq_enquiry_vendor"),)

class Quotation(Base):
    __tablename__ = "quotations"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    enquiry_id: Mapped[int] = mapped_column(ForeignKey("enquiries.id", ondelete="CASCADE"))
    vendor_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    capex: Mapped[float] = mapped_column(Float, nullable=False)
    opex: Mapped[float | None] = mapped_column(Float)
    technology: Mapped[str] = mapped_column(String(255), nullable=False)
    implementation_time: Mapped[str] = mapped_column(String(120), nullable=False)
    warranty: Mapped[str | None] = mapped_column(String(120))
    amc: Mapped[str | None] = mapped_column(String(120))
    proposal_notes: Mapped[str | None] = mapped_column(Text)
    status: Mapped[QuotationStatus] = mapped_column(String(30), default=QuotationStatus.SUBMITTED)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    enquiry = relationship("Enquiry", back_populates="quotations")
    vendor = relationship("User", foreign_keys=[vendor_id])

class Handshake(Base):
    __tablename__ = "handshakes"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    enquiry_id: Mapped[int] = mapped_column(ForeignKey("enquiries.id", ondelete="CASCADE"), unique=True)
    quotation_id: Mapped[int] = mapped_column(ForeignKey("quotations.id"), nullable=False)
    buyer_accepted: Mapped[bool] = mapped_column(Boolean, default=False)
    vendor_accepted: Mapped[bool] = mapped_column(Boolean, default=False)
    status: Mapped[HandshakeStatus] = mapped_column(String(20), default=HandshakeStatus.PENDING)
    buyer_accepted_at: Mapped[datetime | None] = mapped_column(DateTime)
    vendor_accepted_at: Mapped[datetime | None] = mapped_column(DateTime)
    contact_unlocked_at: Mapped[datetime | None] = mapped_column(DateTime)
    enquiry = relationship("Enquiry", back_populates="handshake")
    quotation = relationship("Quotation", foreign_keys=[quotation_id])

class CRMEvent(Base):
    __tablename__ = "crm_events"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    enquiry_id: Mapped[int] = mapped_column(ForeignKey("enquiries.id", ondelete="CASCADE"))
    actor_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    event_type: Mapped[str] = mapped_column(String(80), nullable=False)
    note: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

class EmailVerification(Base):
    __tablename__ = "email_verifications"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    code: Mapped[str] = mapped_column(String(10), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    used: Mapped[bool] = mapped_column(Boolean, default=False)
