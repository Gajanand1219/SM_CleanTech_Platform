# SM Clean Tech Engineering Solutions — Full Stack Platform

Industrial B2B CleanTech marketplace based on the supplied blueprint.

## Stack

- Frontend: React + Vite + Axios + React Router
- Backend: FastAPI + SQLAlchemy + SQLite + JWT
- Email: SMTP-ready service with local console fallback
- No AI / RAG / LLM in this workflow version

## Three panels

1. Buyer
2. Vendor / Seller
3. Admin

## Registration rule

Buyer and Vendor registration is activated through email OTP.

**Admin approval is NOT required for registration.**

Admin approval is required only for technical enquiries.

## Enquiry workflow

Buyer:
Registration → OTP → Login → Create Enquiry → Domain → Problem → Technical Questionnaire → Technical Dossier → Submit

Admin:
New Enquiry → Review Dossier → Approve / Reject

If rejected:
Buyer is notified by email and the enquiry remains rejected in CRM.

If approved:
Buyer is notified → Matching engine runs → up to 10 matching vendor suggestions are created → only matched vendors are notified by email.

Vendor:
Matching Suggestions → Masked Technical Dossier → 240-hour quotation window → Submit Technical Quotation

Buyer:
Quotation received → Email notification → Accept / Reject

Two-way handshake:
Buyer accepts quotation → Vendor is notified → Vendor accepts connection → Mutual handshake → Contact details unlock.

Before mutual acceptance, buyer/vendor identity and contact information remain masked.

## Email events

- Buyer/Vendor registration OTP
- New enquiry → Admin
- Enquiry approved → Buyer
- Enquiry rejected → Buyer
- Approved matching enquiry → matched Vendor(s)
- Quotation submitted → Buyer
- Buyer quotation acceptance → Vendor
- Vendor connection acceptance/decline → Buyer
- Mutual handshake → both parties

## Matching

Matching uses the vendor's registered domains, specialization and area of work. Only active, email-verified vendors can receive matching suggestions.

The matching engine caps each approved enquiry at 10 vendor slots.

## Run backend

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate

pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload
```

## Run frontend

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://127.0.0.1:8000
- Swagger: http://127.0.0.1:8000/docs

## Local admin

Email: `admin@smcleantech.com`

Password: `Admin@12345`

Change the password and JWT secret before deployment.

## Email configuration

For local testing, leave SMTP values empty. The backend will print email events in the terminal.

For real email delivery, configure the SMTP variables in your local `.env`.

**Do not commit real SMTP passwords or API credentials to GitHub.**

The SQLite database is created automatically on first backend startup, so the deliverable intentionally does not contain a personal/test database.
