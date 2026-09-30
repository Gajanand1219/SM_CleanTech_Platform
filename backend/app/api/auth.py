from datetime import datetime, timedelta
import random

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.orm import Session
from app.dependencies import require_roles
from app.db import get_db
import secrets

from app.models import (
    User,
    BuyerProfile,
    VendorProfile,
    EmailVerification,
    EnquiryMatch,
    Enquiry,
    LoginEvent,
    Role,
    AccountStatus,
    EnquiryStatus,
)

from app.schemas.auth import (
    BuyerRegister,
    VendorRegister,
    LoginRequest,
    VerifyEmailRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
)

from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_password_reset_token,
    decode_password_reset_token,
)

from app.services.email import (
    send_email,
    email_template,
    send_vendor_matched_email,
)


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


# ============================================================
# CONSTANTS
# ============================================================

MAX_VENDOR_MATCHES = 10

# ///////////////////////////////////////////////////////////////////////////////


from pydantic import BaseModel, EmailStr, Field


class ProfileUpdate(BaseModel):
    # ============================================================
    # COMMON USER
    # ============================================================

    full_name: str | None = Field(default=None, min_length=2)
    phone: str | None = None

    # ============================================================
    # COMMON BUSINESS
    # ============================================================

    company_name: str | None = None
    director_email: EmailStr | None = None
    gst_number: str | None = None
    website: str | None = None

    # ============================================================
    # BUYER
    # ============================================================

    industry: str | None = None
    head_office_contact: str | None = None
    ehs_contact: str | None = None
    registered_address: str | None = None
    plant_location: str | None = None

    # ============================================================
    # VENDOR
    # ============================================================

    industry_type: str | None = None
    address: str | None = None
    area_of_work: str | None = None
    experience_years: int | None = Field(
        default=None,
        ge=0,
        le=100
    )
    capacity: str | None = None
    specialization: str | None = None
    msme_number: str | None = None
    contact_2: str | None = None

    # SERVICE DOMAINS
    domains: list[str] | None = None



# ============================================================
# EMAIL VERIFICATION
# ============================================================

def create_verification(db, user_id: int):
    db.query(EmailVerification).filter(
        EmailVerification.user_id == user_id,
        EmailVerification.used == False,
    ).update(
        {
            "used": True
        }
    )

    code = f"{random.randint(100000, 999999)}"

    db.add(
        EmailVerification(
            user_id=user_id,
            code=code,
            expires_at=datetime.utcnow() + timedelta(minutes=10),
        )
    )

    db.commit()

    return code


async def send_verification(email, name, code):

    await send_email(
        email,
        "Verify your SM Clean Tech account",
        email_template(
            "Verify your email",
            f"""
            Hello {name},<br><br>

            Your verification code is
            <b style="font-size:24px">{code}</b>.

            <br><br>

            This code expires in 10 minutes.
            """,
        ),
    )


# ============================================================
# EXISTING ENQUIRIES → NEW VENDOR MATCHING
# ============================================================

async def match_existing_enquiries_for_vendor(
    db: Session,
    vendor: User,
):
    """
    When a new vendor becomes ACTIVE after OTP verification:

    1. Get vendor profile
    2. Read vendor domains
    3. Find existing approved/matched enquiries
    4. Match exact domain
    5. Create EnquiryMatch records
    6. Send email to vendor
    """

    vendor_profile = (
        db.query(VendorProfile)
        .filter(
            VendorProfile.user_id == vendor.id
        )
        .first()
    )

    if not vendor_profile:
        return 0

    vendor_domains = vendor_profile.domains or []

    if not vendor_domains:
        return 0

    # Normalize vendor domains
    vendor_domains = {
        str(domain).strip().lower()
        for domain in vendor_domains
        if domain
    }

    if not vendor_domains:
        return 0

    # --------------------------------------------------------
    # Existing approved/matched enquiries
    # --------------------------------------------------------

    enquiries = (
        db.query(Enquiry)
        .filter(
            Enquiry.status.in_(
                [  
                    EnquiryStatus.APPROVED.value,
                    EnquiryStatus.MATCHED.value,
                    EnquiryStatus.QUOTATION.value,
                    EnquiryStatus.ACCEPTED.value,
                    EnquiryStatus.CLOSED.value,
                ]
            )
        )
        .order_by(
            Enquiry.id.desc()
        )
        .all()
    )

    matched_count = 0

    for enquiry in enquiries:

        # ----------------------------------------------------
        # Maximum vendor slots per enquiry
        # ----------------------------------------------------

        existing_match_count = (
            db.query(EnquiryMatch)
            .filter(
                EnquiryMatch.enquiry_id == enquiry.id
            )
            .count()
        )

        if existing_match_count >= MAX_VENDOR_MATCHES:
            continue

        # ----------------------------------------------------
        # Exact domain matching
        # ----------------------------------------------------

        enquiry_domain_name = (
            enquiry.domain.name
            if enquiry.domain
            else None
        )

        if not enquiry_domain_name:
            continue

        enquiry_domain = (
            str(enquiry_domain_name)
            .strip()
            .lower()
        )

        if enquiry_domain not in vendor_domains:
            continue

        # ----------------------------------------------------
        # Avoid duplicate match
        # ----------------------------------------------------

        existing_match = (
            db.query(EnquiryMatch)
            .filter(
                EnquiryMatch.enquiry_id == enquiry.id,
                EnquiryMatch.vendor_id == vendor.id,
            )
            .first()
        )

        if existing_match:
            continue

        # ----------------------------------------------------
        # Create match
        # ----------------------------------------------------

        match = EnquiryMatch(
            enquiry_id=enquiry.id,
            vendor_id=vendor.id,
            match_score=100.0,
            notified=False,
        )

        db.add(match)

        # --------------------------------------------------------
        # Existing APPROVED enquiry is now MATCHED
        # --------------------------------------------------------
        if enquiry.status == EnquiryStatus.APPROVED.value:
            enquiry.status = EnquiryStatus.MATCHED.value

        matched_count += 1

        # Flush so the match exists before email processing
        db.flush()

        # ----------------------------------------------------
        # Vendor notification email
        # ----------------------------------------------------

        try:

            await send_vendor_matched_email(
                vendor=vendor,
                enquiry=enquiry,
            )

            match.notified = True

        except Exception as exc:

            print(
                f"[VENDOR MATCH EMAIL ERROR] "
                f"vendor={vendor.id} "
                f"enquiry={enquiry.id} "
                f"error={exc}"
            )

    db.commit()

    return matched_count


# ============================================================
# BUYER REGISTRATION
# ============================================================

@router.post("/register/buyer")
async def register_buyer(
    payload: BuyerRegister,
    background: BackgroundTasks,
    db: Session = Depends(get_db),
):

    # --------------------------------------------------------
    # Duplicate email
    # --------------------------------------------------------

    if db.query(User).filter(
        User.email == payload.email
    ).first():

        raise HTTPException(
            400,
            "Email already registered",
        )

    # --------------------------------------------------------
    # Create user
    # --------------------------------------------------------

    user = User(
        full_name=payload.full_name,
        email=payload.email,
        phone=payload.phone,
        password_hash=hash_password(
            payload.password
        ),
        role=Role.BUYER.value,
        status=AccountStatus.PENDING.value,
        email_verified=False,
    )

    db.add(user)

    db.flush()

    # --------------------------------------------------------
    # Buyer profile
    # --------------------------------------------------------

    db.add(
        BuyerProfile(
            user_id=user.id,
            company_name=payload.company_name,
            industry=payload.industry,
            registered_address=payload.registered_address,
            plant_location=payload.plant_location,
            gst_number=payload.gst_number,
            website=payload.website,
            head_office_contact=payload.head_office_contact,
            ehs_contact=payload.ehs_contact,
            director_email=payload.director_email,
        )
    )

    # --------------------------------------------------------
    # OTP
    # --------------------------------------------------------

    code = create_verification(
        db,
        user.id,
    )

    background.add_task(
        send_verification,
        payload.email,
        payload.full_name,
        code,
    )

    return {
        "message": (
            "Buyer registration submitted. "
            "Verify your email OTP to activate your account."
        ),
        "user_id": user.id,
    }


# ============================================================
# VENDOR REGISTRATION
# ============================================================

@router.post("/register/vendor")
async def register_vendor(
    payload: VendorRegister,
    background: BackgroundTasks,
    db: Session = Depends(get_db),
):

    # --------------------------------------------------------
    # Duplicate email
    # --------------------------------------------------------

    if db.query(User).filter(
        User.email == payload.email
    ).first():

        raise HTTPException(
            400,
            "Email already registered",
        )

    # --------------------------------------------------------
    # Create vendor user
    # --------------------------------------------------------

    user = User(
        full_name=payload.full_name,
        email=payload.email,
        phone=payload.phone,
        password_hash=hash_password(
            payload.password
        ),
        role=Role.VENDOR.value,
        status=AccountStatus.PENDING.value,
        email_verified=False,
    )

    db.add(user)

    db.flush()

    # --------------------------------------------------------
    # Vendor profile
    # --------------------------------------------------------

    db.add(
        VendorProfile(
            user_id=user.id,
            company_name=payload.company_name,
            industry_type=payload.industry_type,
            address=payload.address,
            area_of_work=payload.area_of_work,
            experience_years=payload.experience_years,
            capacity=payload.capacity,
            specialization=payload.specialization,
            gst_number=payload.gst_number,
            msme_number=payload.msme_number,
            website=payload.website,
            domains=payload.domains,
            director_email=payload.director_email,
            contact_2=payload.contact_2,
        )
    )

    # --------------------------------------------------------
    # OTP
    # --------------------------------------------------------

    code = create_verification(
        db,
        user.id,
    )

    background.add_task(
        send_verification,
        payload.email,
        payload.full_name,
        code,
    )

    return {
        "message": (
            "Vendor registration submitted. "
            "Verify your email OTP to activate your account."
        ),
        "user_id": user.id,
    }


# ============================================================
# VERIFY EMAIL
# ============================================================

@router.post("/verify-email")
async def verify_email(
    payload: VerifyEmailRequest,
    db: Session = Depends(get_db),
):

    # --------------------------------------------------------
    # Find user
    # --------------------------------------------------------

    user = (
        db.query(User)
        .filter(
            User.email == payload.email
        )
        .first()
    )

    if not user:
        raise HTTPException(
            404,
            "Account not found",
        )

    # --------------------------------------------------------
    # Validate OTP
    # --------------------------------------------------------

    record = (
        db.query(EmailVerification)
        .filter(
            EmailVerification.user_id == user.id,
            EmailVerification.code == payload.code,
            EmailVerification.used == False,
            EmailVerification.expires_at > datetime.utcnow(),
        )
        .first()
    )

    if not record:
        raise HTTPException(
            400,
            "Invalid or expired verification code",
        )

    # --------------------------------------------------------
    # Activate account
    # --------------------------------------------------------

    record.used = True

    user.email_verified = True
    user.status = AccountStatus.ACTIVE.value

    db.commit()

    # ========================================================
    # NEW VENDOR → EXISTING ENQUIRY MATCHING
    # ========================================================

    matched_count = 0

    if user.role == Role.VENDOR.value:

        try:

            matched_count = (
                await match_existing_enquiries_for_vendor(
                    db=db,
                    vendor=user,
                )
            )

        except Exception as exc:

            db.rollback()

            print(
                f"[VENDOR EXISTING MATCH ERROR] "
                f"vendor={user.id} "
                f"error={exc}"
            )

    # --------------------------------------------------------
    # Create login token
    # --------------------------------------------------------

    token = create_access_token(
        user.id,
        user.role,
    )

    return {
        "message": "Email verified successfully.",

        "access_token": token,

        "token_type": "bearer",

        "role": user.role,

        "matched_existing_enquiries": matched_count,

        "user": {
            "id": user.id,
            "name": user.full_name,
            "email": user.email,
            "role": user.role,
        },
    }


# ============================================================
# RESEND VERIFICATION
# ============================================================

@router.post("/resend-verification")
async def resend_verification(
    email: str,
    background: BackgroundTasks,
    db: Session = Depends(get_db),
):

    user = (
        db.query(User)
        .filter(
            User.email == email
        )
        .first()
    )

    if not user:
        raise HTTPException(
            404,
            "Account not found",
        )

    code = create_verification(
        db,
        user.id,
    )

    background.add_task(
        send_verification,
        user.email,
        user.full_name,
        code,
    )

    return {
        "message": "Verification code sent"
    }


# ============================================================
# FORGOT PASSWORD
# ============================================================
@router.post("/forgot-password")
async def forgot_password(
    payload: ForgotPasswordRequest,
    background: BackgroundTasks,
    db: Session = Depends(get_db),
):
    user = (
        db.query(User)
        .filter(User.email == payload.email)
        .first()
    )

    if not user:
        return {
            "message": "If this email is registered, a password reset link has been sent."
        }

    token = create_password_reset_token(user.id)

    reset_url = (
        "http://localhost:5173/reset-password"
        f"?token={token}"
    )

    html = email_template(
        "Reset your password",
        f"""
        Hello {user.full_name},<br><br>

        We received a request to reset your SM Clean Tech
        account password.<br><br>

        Click the button below to create a new password:

        <br><br>

        <div style="text-align:center;">
            <a
                href="{reset_url}"
                style="
                    display:inline-block;
                    padding:12px 24px;
                    background:#16a34a;
                    color:#ffffff;
                    text-decoration:none;
                    border-radius:8px;
                    font-weight:700;
                "
            >
                Reset Password
            </a>
        </div>

        <br><br>

        This password reset link will expire in 30 minutes.

        <br><br>

        If you did not request this password reset,
        you can safely ignore this email.

        <br><br>

        Regards,<br>
        <strong>SM Clean Tech Engineering Solutions</strong>
        """,
    )

    background.add_task(
        send_email,
        user.email,
        "Reset your SM Clean Tech password",
        html,
    )

    return {
        "message": "If this email is registered, a password reset link has been sent."
    }


# ============================================================
# RESET PASSWORD
# ============================================================

@router.post("/reset-password")
def reset_password(
    payload: ResetPasswordRequest,
    db: Session = Depends(get_db),
):
    decoded = decode_password_reset_token(
        payload.token
    )

    if not decoded:
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired password reset link.",
        )

    user_id = decoded.get("sub")

    if not user_id:
        raise HTTPException(
            status_code=400,
            detail="Invalid password reset token.",
        )

    user = db.get(User, int(user_id))

    if not user:
        raise HTTPException(
            status_code=404,
            detail="Account not found.",
        )

    # --------------------------------------------------------
    # UPDATE PASSWORD
    # --------------------------------------------------------

    user.password_hash = hash_password(
        payload.password
    )

    db.commit()

    return {
        "message": "Password reset successfully. You can now login."
    }


# ============================================================
# LOGIN
# ============================================================
@router.post("/login")
def login(
    payload: LoginRequest,
    db: Session = Depends(get_db),
):

    user = (
        db.query(User)
        .filter(
            User.email == payload.email
        )
        .first()
    )

    if not user or not verify_password(
        payload.password,
        user.password_hash,
    ):
        raise HTTPException(
            401,
            "Invalid email or password",
        )

    if (
        not user.email_verified
        and user.role != Role.ADMIN.value
    ):
        raise HTTPException(
            403,
            "Please verify your email first",
        )

    if user.status != AccountStatus.ACTIVE.value:
        raise HTTPException(
            403,
            f"Account is {user.status}. "
            "Please verify your email first.",
        )

    # Create JWT token
    token = create_access_token(
        user.id,
        user.role,
    )

    # -----------------------------------------
    # LOGIN CRM - Record successful login
    # -----------------------------------------
    login_event = LoginEvent(
        user_id=user.id,
        role=user.role,
    )

    db.add(login_event)
    db.commit()

    return {
        "access_token": token,
        "token_type": "bearer",
        "role": user.role,

        "user": {
            "id": user.id,
            "name": user.full_name,
            "email": user.email,
        },
    }



# ============================================================
# GET MY PROFILE
# ============================================================

@router.get("/profile")
def get_my_profile(
    user=Depends(require_roles("buyer", "vendor", "admin")),
    db: Session = Depends(get_db),
):
    # --------------------------------------------------------
    # COMMON USER INFORMATION
    # --------------------------------------------------------

    response = {
        "id": user.id,
        "role": user.role,
        "full_name": user.full_name,
        "email": user.email,
        "phone": user.phone,
    }

    # --------------------------------------------------------
    # BUYER PROFILE
    # --------------------------------------------------------

    if user.role == Role.BUYER.value:

        profile = (
            db.query(BuyerProfile)
            .filter(
                BuyerProfile.user_id == user.id
            )
            .first()
        )

        if not profile:
            raise HTTPException(
                status_code=404,
                detail="Buyer profile not found",
            )

        response.update({
            "company_name": profile.company_name,
            "director_email": profile.director_email,
            "industry": profile.industry,
            "gst_number": profile.gst_number,
            "website": profile.website,
            "head_office_contact": profile.head_office_contact,
            "ehs_contact": profile.ehs_contact,
            "registered_address": profile.registered_address,
            "plant_location": profile.plant_location,
        })

    # --------------------------------------------------------
    # VENDOR PROFILE
    # --------------------------------------------------------

    elif user.role == Role.VENDOR.value:

        profile = (
            db.query(VendorProfile)
            .filter(
                VendorProfile.user_id == user.id
            )
            .first()
        )

        if not profile:
            raise HTTPException(
                status_code=404,
                detail="Vendor profile not found",
            )

        response.update({
            "company_name": profile.company_name,
            "industry_type": profile.industry_type,
            "address": profile.address,
            "area_of_work": profile.area_of_work,
            "experience_years": profile.experience_years,
            "capacity": profile.capacity,
            "specialization": profile.specialization,
            "gst_number": profile.gst_number,
            "msme_number": profile.msme_number,
            "website": profile.website,
            "contact_2": profile.contact_2,
            "director_email": profile.director_email,

            # Service Domains
            "domains": profile.domains or [],
        })

    # --------------------------------------------------------
    # ADMIN
    # --------------------------------------------------------

    elif user.role == Role.ADMIN.value:

        response.update({
            "admin": True,
        })

    return response



# ============================================================
# UPDATE MY PROFILE
# ============================================================

@router.put("/profile")
def update_my_profile(
    payload: ProfileUpdate,
    user=Depends(require_roles("buyer", "vendor", "admin")),
    db: Session = Depends(get_db),
):
    data = payload.model_dump(exclude_unset=True)

    # --------------------------------------------------------
    # USER FIELDS
    # --------------------------------------------------------

    user_fields = {
        "full_name",
        "phone",
    }

    # --------------------------------------------------------
    # BUYER FIELDS
    # --------------------------------------------------------

    buyer_fields = {
        "company_name",
        "director_email",
        "industry",
        "gst_number",
        "website",
        "head_office_contact",
        "ehs_contact",
        "registered_address",
        "plant_location",
    }

    # --------------------------------------------------------
    # VENDOR FIELDS
    # --------------------------------------------------------

    vendor_fields = {
        "company_name",
        "industry_type",
        "address",
        "area_of_work",
        "experience_years",
        "capacity",
        "specialization",
        "gst_number",
        "msme_number",
        "website",
        "contact_2",
        "director_email",

        # Service Domains
        "domains",
    }

    try:

        # ----------------------------------------------------
        # UPDATE USER TABLE
        # ----------------------------------------------------

        for key in user_fields & data.keys():

            if data[key] is not None:
                setattr(
                    user,
                    key,
                    data[key]
                )

        # ----------------------------------------------------
        # GET PROFILE
        # ----------------------------------------------------

        if user.role == Role.BUYER.value:

            profile = (
                db.query(BuyerProfile)
                .filter(
                    BuyerProfile.user_id == user.id
                )
                .first()
            )

            allowed_fields = buyer_fields

        elif user.role == Role.VENDOR.value:

            profile = (
                db.query(VendorProfile)
                .filter(
                    VendorProfile.user_id == user.id
                )
                .first()
            )

            allowed_fields = vendor_fields

        else:

            profile = None
            allowed_fields = set()

        # ----------------------------------------------------
        # PROFILE NOT FOUND
        # ----------------------------------------------------

        if (
            user.role != Role.ADMIN.value
            and not profile
        ):
            raise HTTPException(
                status_code=404,
                detail="Profile not found",
            )

        # ----------------------------------------------------
        # UPDATE PROFILE
        # ----------------------------------------------------

        if profile:

            for key in allowed_fields & data.keys():

                value = data[key]

                if value is not None:

                    # Service Domains
                    if key == "domains":

                        profile.domains = [
                            str(domain).strip()
                            for domain in value
                            if str(domain).strip()
                        ]

                    else:

                        setattr(
                            profile,
                            key,
                            value
                        )

        # ----------------------------------------------------
        # SAVE
        # ----------------------------------------------------

        db.commit()

        return {
            "message": "Profile updated successfully",
        }

    except HTTPException:
        db.rollback()
        raise

    except Exception as exc:
        db.rollback()

        print(
            f"[PROFILE UPDATE ERROR] "
            f"user={user.id} "
            f"error={exc}"
        )

        raise HTTPException(
            status_code=500,
            detail="Failed to update profile",
        )


    
