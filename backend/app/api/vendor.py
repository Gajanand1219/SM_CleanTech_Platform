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


def _norm_status(value):
    """Normalize enum values like 'EnquiryStatus.CLOSED' to 'CLOSED'."""
    if value is None:
        return None
    return str(value).upper().split(".")[-1]


def _vendor_quotation(enquiry, vendor_id):
    """Return the vendor's quotation on this enquiry (or None)."""
    for q in enquiry.quotations:
        if q.vendor_id == vendor_id:
            return q
    return None


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
                    EnquiryStatus.APPROVED.value,
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

    # --------------------------------------------------------
    # Build matches with full detail
    # --------------------------------------------------------

    match_rows = []

    for m in matches:
        e = m.enquiry
        q = _vendor_quotation(e, user.id)

        quote_status = _norm_status(q.status) if q else None
        enquiry_status = _norm_status(e.status)

        hs = e.handshake
        handshake_status = _norm_status(hs.status) if hs else None

        buyer_accepted = bool(
            hs
            and hs.buyer_accepted
            and hs.quotation_id
            and q
            and hs.quotation_id == q.id
        )
        vendor_accepted = bool(
            hs
            and hs.vendor_accepted
            and hs.quotation_id
            and q
            and hs.quotation_id == q.id
        )
        mutual = handshake_status == "MUTUAL"

        match_rows.append({
            "id": e.id,
            "title": e.title,
            "domain": e.domain.name,
            "problem": e.problem.name,
            "score": m.match_score,
            "status": enquiry_status,
            "submitted_at": e.submitted_at,
            "quotation_deadline": _deadline(e),
            "quotation_exists": bool(q),
            "quotation_status": quote_status,
            "buyer_accepted": buyer_accepted,
            "vendor_accepted": vendor_accepted,
            "mutual": mutual,
            "outcome": getattr(e, "outcome", None),
        })

    # --------------------------------------------------------
    # Live counts
    # --------------------------------------------------------

    def count(fn):
        return sum(1 for r in match_rows if fn(r))

    stats = {
        "new": count(lambda r: not r["quotation_exists"] and r["status"] != "CLOSED"),
        "current": count(lambda r: not r["quotation_exists"] and r["status"] != "CLOSED"),
        "quoted": count(
            lambda r: r["quotation_exists"]
            and r["status"] != "CLOSED"
            and r["quotation_status"] not in ("ACCEPTED", "REJECTED")
        ),
        "accepted": count(
            lambda r: r["quotation_status"] == "ACCEPTED" or r["buyer_accepted"]
        ),
        "rejected": count(lambda r: r["quotation_status"] == "REJECTED"),
        "win": count(
            lambda r: r["status"] == "CLOSED"
            and str(r["outcome"] or "").lower() == "win"
        ),
        "loss": count(
            lambda r: r["status"] == "CLOSED"
            and str(r["outcome"] or "").lower() == "loss"
        ),
        "history": count(lambda r: r["status"] == "CLOSED"),

        # legacy keys kept for compatibility
        "matching_suggestions": len(matches),
        "quotations": len(quotations),
        "closed": sum(
            1 for q in quotations
            if _norm_status(q.enquiry.status) == "CLOSED"
        ),
    }

    return {
        "stats": stats,
        "matches": match_rows,
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
        EnquiryStatus.APPROVED.value,
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
        EnquiryStatus.APPROVED.value,
        EnquiryStatus.MATCHED.value,
        EnquiryStatus.QUOTATION.value,
    ]:
        raise HTTPException(
            400,
            "Quotation is available only for a matched enquiry."
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

    # VENDOR DECLINES
    if not payload.accept:
        hs.status = HandshakeStatus.DECLINED.value

        db.add(
            CRMEvent(
                enquiry_id=q.enquiry_id,
                actor_id=user.id,
                event_type="handshake_declined",
                note=f"Vendor declined connection for quotation #{q.id}.",
            )
        )

        db.commit()

        await send_vendor_declined_email(
            buyer=q.enquiry.buyer,
            enquiry=q.enquiry,
        )

        return {
            "message": "Connection declined",
            "mutual": False,
        }

    # VENDOR ACCEPTS
    hs.vendor_accepted = True
    hs.vendor_accepted_at = datetime.utcnow()

    mutual = False

    if hs.buyer_accepted:
        hs.status = HandshakeStatus.MUTUAL.value
        hs.contact_unlocked_at = datetime.utcnow()
        q.enquiry.status = EnquiryStatus.ACCEPTED.value
        mutual = True

        db.add(
            CRMEvent(
                enquiry_id=q.enquiry_id,
                actor_id=user.id,
                event_type="mutual_handshake",
                note="Buyer and vendor mutually accepted; contacts unlocked.",
            )
        )
    else:
        hs.status = HandshakeStatus.PENDING.value

        db.add(
            CRMEvent(
                enquiry_id=q.enquiry_id,
                actor_id=user.id,
                event_type="vendor_acceptance",
                note="Vendor accepted; waiting for buyer acceptance.",
            )
        )

    db.commit()

    if mutual:
        await send_mutual_handshake_buyer_email(
            buyer=q.enquiry.buyer,
            enquiry=q.enquiry,
        )
        await send_mutual_handshake_vendor_email(
            vendor=user,
            enquiry=q.enquiry,
        )
    else:
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