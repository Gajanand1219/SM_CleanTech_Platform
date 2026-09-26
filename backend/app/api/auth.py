from datetime import datetime, timedelta
import random

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db

from app.models import (
    User,
    BuyerProfile,
    VendorProfile,
    EmailVerification,
    EnquiryMatch,
    Enquiry,
    Role,
    AccountStatus,
    EnquiryStatus,
)

from app.schemas.auth import (
    BuyerRegister,
    VendorRegister,
    LoginRequest,
    VerifyEmailRequest,
)

from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
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

    token = create_access_token(
        user.id,
        user.role,
    )

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