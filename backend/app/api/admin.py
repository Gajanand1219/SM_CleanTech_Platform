from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app.dependencies import require_roles

from app.models import (
    User,
    BuyerProfile,
    VendorProfile,
    Enquiry,
    EnquiryMatch,
    Quotation,
    AccountStatus,
    Role,
    EnquiryStatus,
    CRMEvent,
)

from app.schemas.admin import (
    StatusAction,
    EnquiryApprovalAction,
)

from app.services.email import (
    send_account_status_email,
    send_enquiry_approved_email,
    send_enquiry_rejected_email,
    send_vendor_matched_email,
)

router = APIRouter(
    prefix="/admin",
    tags=["Admin"],
)


# ============================================================
# DOMAIN-BASED VENDOR MATCHING
# ============================================================

def _find_matching_vendors(
    db: Session,
    enquiry: Enquiry,
):
    """
    Match vendors ONLY by registered domain.

    Rules:
    - Vendor must be ACTIVE
    - Vendor email must be verified
    - Vendor must have a vendor profile
    - Enquiry domain must exactly match one of vendor domains
    - Maximum 10 vendors
    """

    if not enquiry.domain:
        return []

    enquiry_domain = (
        enquiry.domain.name
        .strip()
        .casefold()
    )

    vendors = (
        db.query(User)
        .join(
            VendorProfile,
            VendorProfile.user_id == User.id,
        )
        .filter(
            User.role == Role.VENDOR.value,
            User.status == AccountStatus.ACTIVE.value,
            User.email_verified.is_(True),
        )
        .order_by(User.id.asc())
        .all()
    )

    matched = []

    for vendor in vendors:

        profile = vendor.vendor_profile

        if not profile:
            continue

        vendor_domains = {
            str(domain)
            .strip()
            .casefold()
            for domain in (profile.domains or [])
            if domain
        }

        # Exact domain match
        if enquiry_domain in vendor_domains:

            matched.append(
                (
                    vendor,
                    100.0,
                )
            )

    # Maximum 10 vendor slots
    return matched[:10]


# ============================================================
# ADMIN DASHBOARD
# ============================================================

@router.get("/dashboard")
def dashboard(
    user=Depends(require_roles("admin")),
    db: Session = Depends(get_db),
):

    return {
        "stats": {

            "pending_users": (
                db.query(User)
                .filter(
                    User.status
                    == AccountStatus.PENDING.value
                )
                .count()
            ),

            "buyers": (
                db.query(User)
                .filter(
                    User.role
                    == Role.BUYER.value
                )
                .count()
            ),

            "vendors": (
                db.query(User)
                .filter(
                    User.role
                    == Role.VENDOR.value
                )
                .count()
            ),

            "enquiries": (
                db.query(Enquiry).count()
            ),

            "pending_enquiries": (
                db.query(Enquiry)
                .filter(
                    Enquiry.status
                    == EnquiryStatus.SUBMITTED.value
                )
                .count()
            ),

            "approved_enquiries": (
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
                .count()
            ),

            "quotations": (
                db.query(Quotation).count()
            ),
        }
    }


# ============================================================
# USER REGISTRATIONS
# ============================================================

@router.get("/registrations")
def registrations(
    user=Depends(require_roles("admin")),
    db: Session = Depends(get_db),
):

    users = (
        db.query(User)
        .filter(
            User.role.in_(
                [
                    Role.BUYER.value,
                    Role.VENDOR.value,
                ]
            )
        )
        .order_by(User.created_at.desc())
        .all()
    )

    result = []

    for u in users:

        profile = (
            u.buyer_profile
            or u.vendor_profile
        )

        result.append(
            {
                "id": u.id,
                "name": u.full_name,
                "email": u.email,
                "phone": u.phone,
                "role": u.role,
                "status": u.status,
                "email_verified": u.email_verified,
                "company_name": getattr(
                    profile,
                    "company_name",
                    None,
                ),
                "created_at": u.created_at,
            }
        )

    return result


# ============================================================
# UPDATE USER STATUS
# ============================================================

@router.put("/registrations/{user_id}")
async def update_registration(
    user_id: int,
    payload: StatusAction,
    user=Depends(require_roles("admin")),
    db: Session = Depends(get_db),
):

    target = db.get(User, user_id)

    if not target or target.role == Role.ADMIN.value:
        raise HTTPException(
            status_code=404,
            detail="Registration not found",
        )

    if payload.status not in [
        AccountStatus.ACTIVE.value,
        AccountStatus.REJECTED.value,
        AccountStatus.BLOCKED.value,
    ]:
        raise HTTPException(
            status_code=400,
            detail="Invalid status",
        )

    # Registration activation is OTP based.
    # Admin approval is NOT required for registration.

    if (
        payload.status == AccountStatus.ACTIVE.value
        and not target.email_verified
    ):
        raise HTTPException(
            status_code=400,
            detail="User must verify email before activation",
        )

    target.status = payload.status

    target.is_active = (
        payload.status
        != AccountStatus.BLOCKED.value
    )

    db.commit()

    # ========================================================
    # ACCOUNT STATUS EMAIL
    # ========================================================

    await send_account_status_email(
        to=target.email,
        name=target.full_name,
        status=payload.status,
        note=payload.note,
    )

    return {
        "message": "Account status updated"
    }



# ============================================================
# DELETE BUYER / VENDOR
# ============================================================

@router.delete("/registrations/{user_id}")
def delete_registration(
    user_id: int,
    user=Depends(require_roles("admin")),
    db: Session = Depends(get_db),
):
    target = db.get(User, user_id)

    # User not found or trying to delete admin
    if not target or target.role == Role.ADMIN.value:
        raise HTTPException(
            status_code=404,
            detail="Buyer/Vendor account not found",
        )

    # Only buyer/vendor can be deleted
    if target.role not in [
        Role.BUYER.value,
        Role.VENDOR.value,
    ]:
        raise HTTPException(
            status_code=400,
            detail="Only buyer/vendor accounts can be deleted",
        )

    role = target.role
    email = target.email

    try:
        db.delete(target)
        db.commit()

        return {
            "message": f"{role.capitalize()} account deleted successfully",
            "user_id": user_id,
            "role": role,
            "email": email,
        }

    except Exception as exc:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Unable to delete account. It may have related records.",
        )


# ============================================================
# DELETE ENQUIRY
# ============================================================

@router.delete("/enquiries/{enquiry_id}")
def delete_enquiry(
    enquiry_id: int,
    user=Depends(require_roles("admin")),
    db: Session = Depends(get_db),
):
    enquiry = db.get(Enquiry, enquiry_id)

    if not enquiry:
        raise HTTPException(
            status_code=404,
            detail="Enquiry not found",
        )

    try:
        # Delete related records first
        db.query(EnquiryMatch).filter(
            EnquiryMatch.enquiry_id == enquiry_id
        ).delete(
            synchronize_session=False
        )

        db.query(Quotation).filter(
            Quotation.enquiry_id == enquiry_id
        ).delete(
            synchronize_session=False
        )

        db.query(CRMEvent).filter(
            CRMEvent.enquiry_id == enquiry_id
        ).delete(
            synchronize_session=False
        )

        # Delete enquiry
        db.delete(enquiry)

        db.commit()

        return {
            "message": "Enquiry deleted successfully",
            "enquiry_id": enquiry_id,
        }

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Unable to delete enquiry.",
        )
    
# ============================================================
# ALL ENQUIRIES
# ============================================================

@router.get("/enquiries")
def enquiries(
    user=Depends(require_roles("admin")),
    db: Session = Depends(get_db),
):

    rows = (
        db.query(Enquiry)
        .order_by(Enquiry.id.desc())
        .all()
    )

    return [
        {
            "id": e.id,
            "title": e.title,

            "buyer": (
                e.buyer.buyer_profile.company_name
                if e.buyer
                and e.buyer.buyer_profile
                else e.buyer.full_name
                if e.buyer
                else "Unknown"
            ),

            "domain": e.domain.name,
            "problem": e.problem.name,
            "status": e.status,
            "matches": len(e.matches),
            "quotations": len(e.quotations),
            "submitted_at": e.submitted_at,
        }
        for e in rows
    ]


# ============================================================
# ENQUIRY DETAIL
# ============================================================

@router.get("/enquiries/{enquiry_id}")
def enquiry_detail(
    enquiry_id: int,
    user=Depends(require_roles("admin")),
    db: Session = Depends(get_db),
):

    e = db.get(
        Enquiry,
        enquiry_id,
    )

    if not e:
        raise HTTPException(
            status_code=404,
            detail="Enquiry not found",
        )

    return {
        "id": e.id,
        "title": e.title,

        "buyer": (
            e.buyer.buyer_profile.company_name
            if e.buyer
            and e.buyer.buyer_profile
            else e.buyer.full_name
            if e.buyer
            else "Unknown"
        ),

        "buyer_email": (
            e.buyer.email
            if e.buyer
            else None
        ),

        "domain": e.domain.name,
        "problem": e.problem.name,
        "status": e.status,
        "dossier": e.dossier,

        "matches": [
            {
                "vendor": (
                    m.vendor.vendor_profile.company_name
                    if m.vendor
                    and m.vendor.vendor_profile
                    else m.vendor.full_name
                    if m.vendor
                    else "Unknown"
                ),
                "score": m.match_score,
                "notified": m.notified,
            }
            for m in e.matches
        ],

        "quotations": len(
            e.quotations
        ),
    }


# ============================================================
# APPROVE / REJECT ENQUIRY
# ============================================================

@router.post(
    "/enquiries/{enquiry_id}/approval"
)
async def approve_enquiry(
    enquiry_id: int,
    payload: EnquiryApprovalAction,
    user=Depends(require_roles("admin")),
    db: Session = Depends(get_db),
):

    e = db.get(
        Enquiry,
        enquiry_id,
    )

    if not e:
        raise HTTPException(
            status_code=404,
            detail="Enquiry not found",
        )

    # --------------------------------------------------------
    # Only submitted/rejected enquiries can be reviewed
    # --------------------------------------------------------

    if e.status not in [
        EnquiryStatus.SUBMITTED.value,
        EnquiryStatus.REJECTED.value,
    ]:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Enquiry is already {e.status} "
                f"and cannot be approved again."
            ),
        )

    # ========================================================
    # REJECT
    # ========================================================

    if payload.status == EnquiryStatus.REJECTED.value:

        e.status = (
            EnquiryStatus.REJECTED.value
        )

        db.add(
            CRMEvent(
                enquiry_id=e.id,
                actor_id=user.id,
                event_type="enquiry_rejected",
                note=(
                    payload.note
                    or "Enquiry rejected by platform admin."
                ),
            )
        )

        db.commit()

        # ----------------------------------------------------
        # EMAIL BUYER - ENQUIRY REJECTED
        # ----------------------------------------------------

        if e.buyer and e.buyer.email:

            await send_enquiry_rejected_email(
                buyer=e.buyer,
                enquiry=e,
                reason=payload.note,
            )

        return {
            "message": "Enquiry rejected",
            "status": e.status,
            "matched_vendors": 0,
        }

    # ========================================================
    # APPROVE
    # ========================================================

    # Existing matches
    existing_vendor_ids = {
        match.vendor_id
        for match in (
            db.query(EnquiryMatch)
            .filter(
                EnquiryMatch.enquiry_id
                == e.id
            )
            .all()
        )
    }

    # --------------------------------------------------------
    # DOMAIN-BASED MATCHING
    # --------------------------------------------------------

    matched_vendors = _find_matching_vendors(
        db,
        e,
    )

    created_matches = []

    for vendor, score in matched_vendors:

        # Prevent duplicate match
        if vendor.id in existing_vendor_ids:
            continue

        match = EnquiryMatch(
            enquiry_id=e.id,
            vendor_id=vendor.id,
            match_score=score,
            notified=False,
        )

        db.add(match)

        created_matches.append(
            (
                match,
                vendor,
                score,
            )
        )

    # --------------------------------------------------------
    # Enquiry status
    # --------------------------------------------------------

    if matched_vendors or existing_vendor_ids:

        e.status = (
            EnquiryStatus.MATCHED.value
        )

    else:

        e.status = (
            EnquiryStatus.APPROVED.value
        )

    # --------------------------------------------------------
    # CRM event
    # --------------------------------------------------------

    db.add(
        CRMEvent(
            enquiry_id=e.id,
            actor_id=user.id,
            event_type="enquiry_approved",
            note=(
                "Enquiry approved by admin. "
                f"{len(matched_vendors)} "
                "domain-matched vendor "
                "suggestion(s) created."
            ),
        )
    )

    db.commit()

    # ========================================================
    # EMAIL BUYER - ENQUIRY APPROVED
    # ========================================================

    if e.buyer and e.buyer.email:

        await send_enquiry_approved_email(
            buyer=e.buyer,
            enquiry=e,
            matched_count=len(matched_vendors),
        )

    # ========================================================
    # EMAIL MATCHED VENDORS
    # ========================================================

    for (
        match,
        vendor,
        score,
    ) in created_matches:

        if not vendor.email:
            continue

        await send_vendor_matched_email(
            vendor=vendor,
            enquiry=e,
        )

        match.notified = True

    db.commit()

    # ========================================================
    # RESPONSE
    # ========================================================

    return {
        "message": (
            "Enquiry approved and "
            "domain-matched vendor "
            "suggestions created"
        ),
        "status": e.status,
        "matched_vendors": len(
            matched_vendors
        ),
    }