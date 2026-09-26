from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app.dependencies import require_roles

from app.models import (
    User,
    Domain,
    Problem,
    Question,
    Enquiry,
    QuestionAnswer,
    EnquiryMatch,
    Quotation,
    Handshake,
    CRMEvent,
    EnquiryStatus,
    QuotationStatus,
    HandshakeStatus,
)

from app.schemas.enquiry import (
    EnquiryCreate,
    HandshakeAction,
)

from app.services.email import (
    send_enquiry_submitted_email,
    send_quotation_rejected_email,
    send_buyer_acceptance_email,
    send_vendor_matched_email,
    send_mutual_handshake_buyer_email,
    send_mutual_handshake_vendor_email,
)

from app.core.config import settings


router = APIRouter(
    prefix="/buyer",
    tags=["Buyer"],
)


# ============================================================
# BUYER DASHBOARD
# ============================================================

@router.get("/dashboard")
def dashboard(
    user=Depends(require_roles("buyer")),
    db: Session = Depends(get_db),
):

    enquiries = (
        db.query(Enquiry)
        .filter(
            Enquiry.buyer_id == user.id
        )
        .order_by(
            Enquiry.id.desc()
        )
        .all()
    )

    approved = {
        EnquiryStatus.APPROVED.value,
        EnquiryStatus.MATCHED.value,
        EnquiryStatus.QUOTATION.value,
        EnquiryStatus.ACCEPTED.value,
        EnquiryStatus.CLOSED.value,
    }

    return {
        "stats": {
            "enquiries": len(enquiries),

            "pending_approval": sum(
                e.status
                == EnquiryStatus.SUBMITTED.value
                for e in enquiries
            ),

            "approved": sum(
                e.status in approved
                for e in enquiries
            ),

            "quotations": sum(
                len(e.quotations)
                for e in enquiries
            ),

            "closed": sum(
                e.status
                == EnquiryStatus.CLOSED.value
                for e in enquiries
            ),
        },

        "enquiries": [
            {
                "id": e.id,
                "title": e.title,
                "domain": e.domain.name,
                "problem": e.problem.name,
                "status": e.status,
                "submitted_at": e.submitted_at,
                "matches": len(e.matches),
                "quotations": len(e.quotations),
            }
            for e in enquiries
        ],
    }


# ============================================================
# CREATE ENQUIRY
# ============================================================

@router.post("/enquiries")
async def create_enquiry(
    payload: EnquiryCreate,
    user=Depends(require_roles("buyer")),
    db: Session = Depends(get_db),
):

    problem = db.get(
        Problem,
        payload.problem_id,
    )

    domain = db.get(
        Domain,
        payload.domain_id,
    )

    if (
        not problem
        or not domain
        or problem.domain_id != domain.id
    ):
        raise HTTPException(
            400,
            "Invalid domain/problem",
        )

    qs = (
        db.query(Question)
        .filter(
            Question.problem_id
            == problem.id
        )
        .all()
    )

    missing = [
        q.field_key
        for q in qs
        if q.required
        and not str(
            payload.answers.get(
                q.field_key,
                "",
            )
        ).strip()
    ]

    if missing:
        raise HTTPException(
            422,
            {
                "missing_fields": missing
            },
        )

    dossier = "\n".join(
        [
            f"{q.question_text}: "
            f"{payload.answers.get(q.field_key, '')}"
            for q in qs
        ]
    )

    # ========================================================
    # BUYER SUBMISSION
    # ========================================================
    # Buyer submission does NOT go directly to vendors.
    # It stays SUBMITTED until admin approval.

    e = Enquiry(
        buyer_id=user.id,
        domain_id=domain.id,
        problem_id=problem.id,
        title=payload.title,
        status=EnquiryStatus.SUBMITTED.value,
        dossier=dossier,
    )

    db.add(e)
    db.flush()

    # ========================================================
    # AUTOMATIC DOMAIN-BASED VENDOR MATCHING
    # ========================================================

    enquiry_domain = (
        domain.name
        .strip()
        .casefold()
    )

    vendors = (
        db.query(User)
        .filter(
            User.role == "vendor",
            User.is_active.is_(True),
            User.email_verified.is_(True),
        )
        .all()
    )

    matched_vendors = []

    for vendor in vendors:

        profile = vendor.vendor_profile

        if not profile:
            continue

        vendor_domains = {
            str(d).strip().casefold()
            for d in (profile.domains or [])
            if d
        }

        if enquiry_domain in vendor_domains:
            matched_vendors.append(vendor)

    # Maximum 10 matched vendors
    matched_vendors = matched_vendors[:10]


    # ========================================================
    # CREATE MATCH RECORDS
    # ========================================================

    for vendor in matched_vendors:

        db.add(
            EnquiryMatch(
                enquiry_id=e.id,
                vendor_id=vendor.id,
                match_score=100.0,
                notified=False,
            )
        )


    # ========================================================
    # UPDATE ENQUIRY STATUS
    # ========================================================

    if matched_vendors:
        e.status = EnquiryStatus.MATCHED.value
    else:
        e.status = EnquiryStatus.SUBMITTED.value

    # ========================================================
    # SAVE QUESTION ANSWERS
    # ========================================================

    for q in qs:

        db.add(
            QuestionAnswer(
                enquiry_id=e.id,
                question_id=q.id,
                answer=payload.answers.get(
                    q.field_key,
                    "",
                ),
            )
        )

    # ========================================================
    # CRM EVENT
    # ========================================================

    db.add(
        CRMEvent(
            enquiry_id=e.id,
            actor_id=user.id,
            event_type="enquiry_submitted",
            note=(
                 f"Technical enquiry submitted. "
                f"{len(matched_vendors)} matching vendor(s) "
                f"found automatically."
            ),
        )
    )

    db.commit()
    db.refresh(e)

    # ========================================================
    # EMAIL → ADMIN
    # ========================================================

    await send_enquiry_submitted_email(
        admin_email=settings.ADMIN_EMAIL,
        enquiry=e,
        buyer=user,
    )


    # ========================================================
    # EMAIL → MATCHED VENDORS
    # ========================================================

    for vendor in matched_vendors:

        if vendor.email:

            await send_vendor_matched_email(
                vendor=vendor,
                enquiry=e,
            )

            match = (
                db.query(EnquiryMatch)
                .filter(
                    EnquiryMatch.enquiry_id == e.id,
                    EnquiryMatch.vendor_id == vendor.id,
                )
                .first()
            )

            if match:
                match.notified = True

    db.commit()

    return {
        "message": (
            "Enquiry submitted and "
            "matched with suitable vendors."
            if matched_vendors
            else
            "Enquiry submitted. "
            "No matching vendor found yet."
        ),
        "enquiry_id": e.id,
        "status": e.status,
        "matched_vendors": len(matched_vendors),
    }


# ============================================================
# GET BUYER ENQUIRY DETAIL
# ============================================================

@router.get("/enquiries/{enquiry_id}")
def enquiry(
    enquiry_id: int,
    user=Depends(require_roles("buyer")),
    db: Session = Depends(get_db),
):

    e = (
        db.query(Enquiry)
        .filter(
            Enquiry.id == enquiry_id,
            Enquiry.buyer_id == user.id,
        )
        .first()
    )

    if not e:
        raise HTTPException(
            404,
            "Enquiry not found",
        )

    hs = e.handshake

    unlocked = bool(
        hs
        and hs.status
        == HandshakeStatus.MUTUAL.value
    )

    approved_for_matching = (
        e.status
        in {
            EnquiryStatus.MATCHED.value,
            EnquiryStatus.QUOTATION.value,
            EnquiryStatus.ACCEPTED.value,
            EnquiryStatus.CLOSED.value,
        }
    )

    return {
        "id": e.id,
        "title": e.title,
        "domain": e.domain.name,
        "problem": e.problem.name,
        "status": e.status,

        "approval": {
            "approved": (
                e.status
                in {
                    EnquiryStatus.APPROVED.value,
                    EnquiryStatus.MATCHED.value,
                    EnquiryStatus.QUOTATION.value,
                    EnquiryStatus.ACCEPTED.value,
                    EnquiryStatus.CLOSED.value,
                }
            ),

            "matching_active":
                approved_for_matching,
        },

        "dossier": e.dossier,

        "matches": [
            {
                "id": m.id,
                "score": m.match_score,

                "vendor_name": (
                    m.vendor.vendor_profile.company_name
                    if unlocked
                    and m.vendor
                    and m.vendor.vendor_profile
                    else "Matched vendor"
                ),
            }

            for m in e.matches
        ],

        "quotations": [
            {
                "id": q.id,
                "vendor_id": q.vendor_id,

                "vendor_company": (
                    q.vendor.vendor_profile.company_name
                    if unlocked
                    and q.vendor
                    and q.vendor.vendor_profile
                    else "Matched vendor"
                ),

                "capex": q.capex,
                "opex": q.opex,
                "technology": q.technology,
                "implementation_time":
                    q.implementation_time,
                "warranty": q.warranty,
                "amc": q.amc,
                "notes": q.proposal_notes,
                "status": q.status,
            }

            for q in e.quotations
        ],

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

            "contact_unlocked":
                unlocked,
        },

        "unlocked_contact": (
            {
                "vendor_name":
                    hs.quotation.vendor.vendor_profile.company_name,

                "vendor_email":
                    hs.quotation.vendor.email,

                "vendor_phone":
                    hs.quotation.vendor.phone,
            }

            if unlocked
            and hs
            and hs.quotation
            and hs.quotation.vendor

            else None
        ),
    }


# ============================================================
# BUYER ACCEPT / REJECT QUOTATION
# ============================================================

@router.post("/handshake")
async def buyer_handshake(
    payload: HandshakeAction,
    user=Depends(require_roles("buyer")),
    db: Session = Depends(get_db),
):

    q = db.get(
        Quotation,
        payload.quotation_id,
    )

    if not q:
        raise HTTPException(
            404,
            "Quotation not found",
        )

    e = q.enquiry

    # ========================================================
    # SECURITY CHECK
    # ========================================================

    if e.buyer_id != user.id:
        raise HTTPException(
            403,
            "Not your enquiry",
        )

    # ========================================================
    # BUYER REJECTS QUOTATION
    # ========================================================

    if not payload.accept:

        q.status = (
            QuotationStatus.REJECTED.value
        )

        db.add(
            CRMEvent(
                enquiry_id=e.id,
                actor_id=user.id,
                event_type="quotation_rejected",
                note=(
                    f"Buyer rejected "
                    f"quotation #{q.id}."
                ),
            )
        )

        db.commit()

        # ----------------------------------------------------
        # EMAIL → VENDOR
        # ----------------------------------------------------

        if q.vendor and q.vendor.email:

            await send_quotation_rejected_email(
                vendor=q.vendor,
                enquiry=e,
                quotation=q,
            )

        return {
            "message":
                "Quotation rejected",

            "mutual": False,
        }

    # ========================================================
    # BUYER ACCEPTS QUOTATION
    # ========================================================

    q.status = (
        QuotationStatus.ACCEPTED.value
    )

    hs = e.handshake

    # ========================================================
    # PREVENT DIFFERENT QUOTATION SELECTION
    # ========================================================

    if (
        hs
        and hs.quotation_id != q.id
    ):
        raise HTTPException(
            409,
            "Another quotation is already selected "
            "for this enquiry.",
        )

    # ========================================================
    # CREATE HANDSHAKE
    # ========================================================

    if not hs:

        hs = Handshake(
            enquiry_id=e.id,
            quotation_id=q.id,
        )

        db.add(hs)

    hs.quotation_id = q.id

    hs.buyer_accepted = True

    hs.buyer_accepted_at = (
        datetime.utcnow()
    )

    mutual = False

    # ========================================================
    # VENDOR ALREADY ACCEPTED
    # ========================================================

    if hs.vendor_accepted:

        hs.status = (
            HandshakeStatus.MUTUAL.value
        )

        hs.contact_unlocked_at = (
            datetime.utcnow()
        )

        e.status = (
            EnquiryStatus.ACCEPTED.value
        )

        mutual = True

        db.add(
            CRMEvent(
                enquiry_id=e.id,
                actor_id=user.id,
                event_type="mutual_handshake",
                note=(
                    "Buyer and vendor mutually "
                    "accepted; contacts unlocked."
                ),
            )
        )

    # ========================================================
    # WAITING FOR VENDOR
    # ========================================================

    else:

        hs.status = (
            HandshakeStatus.PENDING.value
        )

        db.add(
            CRMEvent(
                enquiry_id=e.id,
                actor_id=user.id,
                event_type="buyer_acceptance",
                note=(
                    f"Buyer accepted quotation "
                    f"#{q.id}; vendor confirmation pending."
                ),
            )
        )

    db.commit()

    # ========================================================
    # EMAILS
    # ========================================================

    if mutual:

        # ----------------------------------------------------
        # BUYER → CONFIRMATION
        # ----------------------------------------------------

        if user.email:

            await send_mutual_handshake_buyer_email(
                buyer=user,
                enquiry=e,
            )

        # ----------------------------------------------------
        # VENDOR → CONFIRMATION
        # ----------------------------------------------------

        if q.vendor and q.vendor.email:

            await send_mutual_handshake_vendor_email(
                vendor=q.vendor,
                enquiry=e,
            )

    else:

        # ----------------------------------------------------
        # VENDOR → BUYER ACCEPTED
        # ----------------------------------------------------

        if q.vendor and q.vendor.email:

            await send_buyer_acceptance_email(
                vendor=q.vendor,
                enquiry=e,
                quotation=q,
            )

    return {
        "message":
            "Buyer acceptance recorded",

        "mutual":
            mutual,
    }


# ============================================================
# BUYER CRM
# ============================================================

@router.get("/crm")
def crm(
    user=Depends(require_roles("buyer")),
    db: Session = Depends(get_db),
):

    rows = (
        db.query(
            CRMEvent,
            Enquiry,
        )
        .join(
            Enquiry,
            Enquiry.id
            == CRMEvent.enquiry_id,
        )
        .filter(
            Enquiry.buyer_id
            == user.id
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