from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db import Base, engine, SessionLocal
from app.api import auth, public, buyer, vendor, admin
from app.services.seed import seed_database
from app.models import Enquiry, EnquiryStatus

app = FastAPI(
    title=settings.APP_NAME,
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL,
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)


def migrate_workflow():
    """
    Compatibility migration for databases created by the previous version.

    The previous version matched vendors immediately at buyer submission.
    The new workflow requires admin approval first. Legacy matched enquiries
    with zero match rows are returned to submitted for admin review.
    """
    with SessionLocal() as db:
        legacy = (
            db.query(Enquiry)
            .filter(Enquiry.status == EnquiryStatus.MATCHED.value)
            .all()
        )

        changed = False

        for enquiry in legacy:
            if not enquiry.matches:
                enquiry.status = EnquiryStatus.SUBMITTED.value
                changed = True

        if changed:
            db.commit()


migrate_workflow()

with SessionLocal() as db:
    seed_database(db)

app.include_router(auth.router, prefix="/api")
app.include_router(public.router, prefix="/api")
app.include_router(buyer.router, prefix="/api")
app.include_router(vendor.router, prefix="/api")
app.include_router(admin.router, prefix="/api")


@app.get("/")
def root():
    return {
        "name": settings.APP_NAME,
        "status": "running",
        "workflow": "admin-approved-enquiry-matching",
    }


@app.get("/health")
def health():
    return {"status": "ok"}
