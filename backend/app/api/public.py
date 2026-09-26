from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db import get_db
from app.models import Domain, Problem, Question
from pydantic import BaseModel, EmailStr
from app.services.email import send_contact_form_email
from app.models import Domain, Problem, Question, User, BuyerProfile, VendorProfile
# from app.enums import Role, AccountStatus

router = APIRouter(prefix="/public", tags=["Public"])


# ============================================================
# CONTACT FORM
# ============================================================

class ContactRequest(BaseModel):
    name: str
    mobile: str
    email: EmailStr
    message: str



# ============================================================
# WEBSITE CONTACT FORM
# ============================================================

@router.post("/contact")
async def submit_contact_form(data: ContactRequest):

    name = data.name.strip()
    mobile = data.mobile.strip()
    email = str(data.email).strip()
    message = data.message.strip()

    if not name:
        raise HTTPException(
            status_code=400,
            detail="Name is required."
        )

    if not mobile:
        raise HTTPException(
            status_code=400,
            detail="Mobile number is required."
        )

    if not message:
        raise HTTPException(
            status_code=400,
            detail="Message is required."
        )

    sent = await send_contact_form_email(
        name=name,
        mobile=mobile,
        email=email,
        message=message,
    )

    if not sent:
        raise HTTPException(
            status_code=500,
            detail="Unable to send enquiry email."
        )

    return {
        "success": True,
        "message": "Your enquiry has been sent successfully."
    }


@router.get("/domains")
def domains(db: Session = Depends(get_db)):
    return [{"id":d.id,"name":d.name,"description":d.description} for d in db.query(Domain).all()]

@router.get("/domains/{domain_id}/problems")
def problems(domain_id: int, db: Session = Depends(get_db)):
    return [{"id":p.id,"name":p.name,"sub_domain":p.sub_domain,"description":p.description} for p in db.query(Problem).filter(Problem.domain_id==domain_id).all()]

@router.get("/problems/{problem_id}/questions")
def questions(problem_id: int, db: Session = Depends(get_db)):
    return [{"id":q.id,"question_text":q.question_text,"field_key":q.field_key,"required":q.required} for q in db.query(Question).filter(Question.problem_id==problem_id).all()]



# ============================================================
# VERIFIED BUYERS + APPROVED VENDORS
# ============================================================
@router.get("/network-companies")
def network_companies(db: Session = Depends(get_db)):

    buyers = (
        db.query(BuyerProfile)
        .join(User, BuyerProfile.user_id == User.id)
        .filter(
            User.role == "buyer",
            User.is_active == True,
            User.email_verified == True,
            BuyerProfile.website.isnot(None),
            BuyerProfile.website != "",
        )
        .all()
    )

    vendors = (
        db.query(VendorProfile)
        .join(User, VendorProfile.user_id == User.id)
        .filter(
            User.role == "vendor",
            User.is_active == True,
            User.email_verified == True,
            VendorProfile.website.isnot(None),
            VendorProfile.website != "",
        )
        .all()
    )

    def make_company(profile):

        website = profile.website.strip()

        domain = (
            website
            .replace("https://", "")
            .replace("http://", "")
            .replace("www.", "")
            .split("/")[0]
        )

        logo = f"https://www.google.com/s2/favicons?domain={domain}&sz=128"

        return {
            "id": profile.id,
            "company_name": profile.company_name,
            "website": website,
            "logo": logo,
        }

    return {
        "buyers": [make_company(buyer) for buyer in buyers],
        "vendors": [make_company(vendor) for vendor in vendors],
    }