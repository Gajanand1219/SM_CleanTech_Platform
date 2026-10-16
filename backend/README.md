# SM Clean Tech Engineering Solutions — Backend

FastAPI + SQLAlchemy + SQLite backend for the Industrial B2B CleanTech platform.

## Core workflow

1. Buyer/Vendor registers.
2. Email OTP verification activates the account. Registration does **not** require admin approval.
3. Buyer creates a technical enquiry and questionnaire/dossier.
4. The enquiry stays `submitted` and is visible to the admin only for approval workflow.
5. Admin approves or rejects the enquiry.
6. Only after approval, the backend creates up to 10 matching vendor suggestions.
7. Only matched vendors receive the enquiry email and can view the masked technical dossier.
8. Vendor submits a technical quotation within the 240-hour window.
9. Buyer receives an email and accepts/rejects the quotation.
10. If buyer accepts, vendor receives an email and must accept the connection.
11. Mutual acceptance completes the two-way handshake.
12. Contact details are unlocked only after the mutual handshake.
13. CRM events record the workflow.

## Email events

- Registration OTP
- New enquiry → Admin
- Enquiry approved → Buyer
- Enquiry rejected → Buyer
- Approved matching suggestion → matched Vendor(s)
- Quotation submitted → Buyer
- Buyer accepts quotation → Vendor
- Vendor accepts/declines connection → Buyer
- Mutual handshake → both parties

If SMTP variables are empty, email events are printed to the backend console for local testing.

## Matching

Vendor suggestions are based on the registered vendor domain, specialization, and area of work. Only active, email-verified vendors can receive suggestions. The platform caps each approved enquiry at 10 matching vendor slots.

## Run

```bash
python -m venv .venv
# Windows
.venv\Scripts\activate

pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload
```

Swagger: http://127.0.0.1:8000/docs

## Default local admin

- Email: `admin@smcleantech.com`
- Password: `Admin@12345`

Change these credentials before deployment.

## Important

Never commit a real SMTP password, JWT secret, or other credentials to GitHub.
