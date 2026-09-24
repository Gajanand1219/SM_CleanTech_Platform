from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app.dependencies import require_roles

from app.models import (
    User,
    EnquiryMatch,
    Enquiry,
    Quotation,
    Handshake,
    EnquiryStatus,
    QuotationStatus,
    HandshakeStatus,
    CRMEvent,
)

from app.schemas.enquiry import QuotationCreate, HandshakeAction

from app.services.email import (
    send_quotation_submitted_email,
    send_quotation_rejected_email,
    send_vendor_acceptance_email,
    send_vendor_declined_email,
    send_mutual_handshake_buyer_email,
    send_mutual_handshake_vendor_email,
)


router = APIRouter(prefix="/vendor", tags=["Vendor"])


# ============================================================
# CONSTANTS
# ============================================================

QUOTATION_WINDOW_HOURS = 240


# ============================================================
# HELPERS
# ============================================================

def _deadline(enquiry):
    if not enquiry.submitted_at:
        return None

    return enquiry.submitted_at + timedelta(
        hours=QUOTATION_WINDOW_HOURS
    )


# ============================================================
# VENDOR DASHBOARD
# ============================================================

@router.get("/dashboard")
def dashboard(
    user=Depends(require_roles("vendor")),
    db: Session = Depends(get_db),
):
    matches = (
        db.query(EnquiryMatch)
        .join(Enquiry)
        .filter(
            EnquiryMatch.vendor_id == user.id,
            Enquiry.status.in_(
                [
                    EnquiryStatus.MATCHED.value,
                    EnquiryStatus.QUOTATION.value,
                    EnquiryStatus.ACCEPTED.value,
                    EnquiryStatus.CLOSED.value,
                ]
            ),
        )
        .order_by(
            EnquiryMatch.match_score.desc(),
            Enquiry.id.desc(),
        )
        .all()
    )

    quotations = (
        db.query(Quotation)
        .filter(Quotation.vendor_id == user.id)
        .all()
    )

    return {
        "stats": {
            "matching_suggestions": len(matches),

            "quotations": len(quotations),

            "accepted": sum(
                q.status == QuotationStatus.ACCEPTED.value
                for q in quotations
            ),

            "closed": sum(
                q.enquiry.status == EnquiryStatus.CLOSED.value
                for q in quotations
            ),
        },

        "matches": [
            {
                "id": m.enquiry.id,
                "title": m.enquiry.title,
                "domain": m.enquiry.domain.name,
                "problem": m.enquiry.problem.name,
                "score": m.match_score,
                "status": m.enquiry.status,
                "submitted_at": m.enquiry.submitted_at,
                "quotation_deadline": _deadline(m.enquiry),

                "quotation_exists": any(
                    q.vendor_id == user.id
                    for q in m.enquiry.quotations
                ),
            }
            for m in matches
        ],
    }


# ============================================================
# VIEW MATCHED ENQUIRY
# ============================================================

@router.get("/enquiries/{enquiry_id}")
def view_enquiry(
    enquiry_id: int,
    user=Depends(require_roles("vendor")),
    db: Session = Depends(get_db),
):
    match = (
        db.query(EnquiryMatch)
        .filter(
            EnquiryMatch.enquiry_id == enquiry_id,
            EnquiryMatch.vendor_id == user.id,
        )
        .first()
    )

    if not match:
        raise HTTPException(
            403,
            "This enquiry is not assigned to you",
        )

    e = match.enquiry

    if e.status not in [
        EnquiryStatus.MATCHED.value,
        EnquiryStatus.QUOTATION.value,
        EnquiryStatus.ACCEPTED.value,
        EnquiryStatus.CLOSED.value,
    ]:
        raise HTTPException(
            403,
            "This enquiry is not approved for vendors",
        )

    q = (
        db.query(Quotation)
        .filter(
            Quotation.enquiry_id == e.id,
            Quotation.vendor_id == user.id,
        )
        .first()
    )

    hs = e.handshake

    unlocked = bool(
        hs
        and hs.status == HandshakeStatus.MUTUAL.value
        and q
        and hs.quotation_id == q.id
    )

    deadline = _deadline(e)

    now = datetime.utcnow()

    quotation_window_open = (
        deadline is not None
        and now <= deadline
    )

    return {
        "id": e.id,
        "title": e.title,
        "domain": e.domain.name,
        "problem": e.problem.name,
        "status": e.status,
        "dossier": e.dossier,

        "match_score": match.match_score,

        "quotation_deadline": deadline,

        "quotation_window_open": quotation_window_open,

        "buyer_masked": not unlocked,

        "quotation_exists": bool(q),

        "quotation_id": q.id if q else None,

        "quotation_status": q.status if q else None,

        "handshake": {
            "status": (
                hs.status
                if hs
                else "pending"
            ),

            "buyer_accepted": (
                hs.buyer_accepted
                if hs
                else False
            ),

            "vendor_accepted": (
                hs.vendor_accepted
                if hs
                else False
            ),
        },

        "buyer_contact": (
            {
                "name": e.buyer.full_name,
                "email": e.buyer.email,
                "phone": e.buyer.phone,
                "company": (
                    e.buyer.buyer_profile.company_name
                ),
            }
            if unlocked and e.buyer
            else None
        ),
    }


# ============================================================
# SUBMIT QUOTATION
# ============================================================

@router.post("/quotations")
async def quotation(
    payload: QuotationCreate,
    user=Depends(require_roles("vendor")),
    db: Session = Depends(get_db),
):
    match = (
        db.query(EnquiryMatch)
        .filter(
            EnquiryMatch.enquiry_id == payload.enquiry_id,
            EnquiryMatch.vendor_id == user.id,
        )
        .first()
    )

    if not match:
        raise HTTPException(
            403,
            "You are not matched to this enquiry",
        )

    e = match.enquiry

    if e.status not in [
        EnquiryStatus.MATCHED.value,
        EnquiryStatus.QUOTATION.value,
    ]:
        raise HTTPException(
            400,
            "Quotation is available only for an admin-approved matched enquiry.",
        )

    deadline = _deadline(e)

    if deadline and datetime.utcnow() > deadline:
        raise HTTPException(
            400,
            "The 240-hour quotation window has expired.",
        )

    existing = (
        db.query(Quotation)
        .filter(
            Quotation.enquiry_id == payload.enquiry_id,
            Quotation.vendor_id == user.id,
        )
        .first()
    )

    if existing:
        raise HTTPException(
            400,
            "Quotation already submitted",
        )

    q = Quotation(
        vendor_id=user.id,
        **payload.model_dump(),
    )

    db.add(q)
    db.flush()

    e.status = EnquiryStatus.QUOTATION.value

    db.add(
        CRMEvent(
            enquiry_id=e.id,
            actor_id=user.id,
            event_type="quotation_submitted",
            note=f"Quotation #{q.id} submitted.",
        )
    )

    db.commit()
    db.refresh(q)

    # ========================================================
    # EMAIL → BUYER
    # ========================================================

    await send_quotation_submitted_email(
        buyer=e.buyer,
        enquiry=e,
        quotation=q,
    )

    return {
        "message": "Quotation submitted",
        "quotation_id": q.id,
        "quotation_deadline": deadline,
    }


# ============================================================
# VENDOR HANDSHAKE
# ============================================================

@router.post("/handshake")
async def vendor_handshake(
    payload: HandshakeAction,
    user=Depends(require_roles("vendor")),
    db: Session = Depends(get_db),
):
    q = db.get(
        Quotation,
        payload.quotation_id,
    )

    if not q or q.vendor_id != user.id:
        raise HTTPException(
            404,
            "Quotation not found",
        )

    hs = q.enquiry.handshake

    if not hs or hs.quotation_id != q.id:
        raise HTTPException(
            400,
            "Buyer has not selected this quotation yet.",
        )

    # ========================================================
    # VENDOR DECLINES
    # ========================================================

    if not payload.accept:

        hs.status = HandshakeStatus.DECLINED.value

        db.add(
            CRMEvent(
                enquiry_id=q.enquiry_id,
                actor_id=user.id,
                event_type="handshake_declined",
                note=(
                    f"Vendor declined connection "
                    f"for quotation #{q.id}."
                ),
            )
        )

        db.commit()

        # EMAIL → BUYER
        await send_vendor_declined_email(
            buyer=q.enquiry.buyer,
            enquiry=q.enquiry,
        )

        return {
            "message": "Connection declined",
            "mutual": False,
        }

    # ========================================================
    # VENDOR ACCEPTS
    # ========================================================

    hs.vendor_accepted = True
    hs.vendor_accepted_at = datetime.utcnow()

    mutual = False

    # ========================================================
    # MUTUAL HANDSHAKE
    # ========================================================

    if hs.buyer_accepted:

        hs.status = HandshakeStatus.MUTUAL.value

        hs.contact_unlocked_at = datetime.utcnow()

        q.enquiry.status = (
            EnquiryStatus.ACCEPTED.value
        )

        mutual = True

        db.add(
            CRMEvent(
                enquiry_id=q.enquiry_id,
                actor_id=user.id,
                event_type="mutual_handshake",
                note=(
                    "Buyer and vendor mutually accepted; "
                    "contacts unlocked."
                ),
            )
        )

    # ========================================================
    # WAITING FOR BUYER
    # ========================================================

    else:

        hs.status = HandshakeStatus.PENDING.value

        db.add(
            CRMEvent(
                enquiry_id=q.enquiry_id,
                actor_id=user.id,
                event_type="vendor_acceptance",
                note=(
                    "Vendor accepted; "
                    "waiting for buyer acceptance."
                ),
            )
        )

    db.commit()

    # ========================================================
    # EMAILS
    # ========================================================

    if mutual:

        # Buyer notification
        await send_mutual_handshake_buyer_email(
            buyer=q.enquiry.buyer,
            enquiry=q.enquiry,
        )

        # Vendor notification
        await send_mutual_handshake_vendor_email(
            vendor=user,
            enquiry=q.enquiry,
        )

    else:

        # Buyer notification
        await send_vendor_acceptance_email(
            buyer=q.enquiry.buyer,
            enquiry=q.enquiry,
        )

    return {
        "message": "Vendor acceptance recorded",
        "mutual": mutual,
    }


# ============================================================
# VENDOR CRM
# ============================================================

@router.get("/crm")
def crm(
    user=Depends(require_roles("vendor")),
    db: Session = Depends(get_db),
):
    rows = (
        db.query(CRMEvent, Enquiry)
        .join(
            Enquiry,
            Enquiry.id == CRMEvent.enquiry_id,
        )
        .join(
            EnquiryMatch,
            EnquiryMatch.enquiry_id == Enquiry.id,
        )
        .filter(
            EnquiryMatch.vendor_id == user.id
        )
        .order_by(
            CRMEvent.created_at.desc()
        )
        .all()
    )

    return [
        {
            "enquiry_id": e.id,
            "title": e.title,
            "event": ev.event_type,
            "note": ev.note,
            "created_at": ev.created_at,
        }
        for ev, e in rows
    ]