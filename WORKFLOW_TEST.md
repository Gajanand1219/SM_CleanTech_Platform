# Workflow Test Checklist

Use this order to test the platform.

## 1. Start backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload
```

## 2. Start frontend

```bash
cd frontend
npm install
npm run dev
```

## 3. Registration

Create:
- one Buyer
- one Vendor

Verify both through email OTP.

No admin registration approval is required.

## 4. Buyer enquiry

Login as Buyer.

Create:
- Domain
- Problem
- Technical answers
- Submit

Expected:
- Buyer sees `submitted`
- Vendor sees nothing
- Admin receives an email
- No vendor enquiry email is sent yet

## 5. Admin approval

Login as Admin.

Open:
`Admin → Enquiry Approval`

Review dossier.

Click:
`Approve & Match Vendors`

Expected:
- Buyer receives approval email
- Matching engine creates vendor suggestions
- Maximum 10 matches
- Only matched vendors receive email
- Vendor dashboard shows `Matching Suggestions`

## 6. Vendor quotation

Login as matched Vendor.

Open the suggestion.

Expected:
- Buyer identity remains masked
- Technical dossier is visible
- 240-hour quotation window is displayed
- Submit quotation

Expected:
- Buyer receives quotation email

## 7. Buyer acceptance

Login as Buyer.

Open the enquiry.

Accept the quotation.

Expected:
- Vendor receives acceptance email
- Buyer contact remains locked
- Vendor sees `Accept Connection`

## 8. Vendor acceptance

Login as Vendor.

Click `Accept Connection`.

Expected:
- Mutual handshake becomes `mutual`
- Both sides receive notification
- Buyer contact is visible to vendor
- Vendor contact is visible to buyer
- CRM events are recorded

## 9. Rejection path

Also test:
- Admin rejects an enquiry → buyer email
- Buyer rejects quotation → vendor email
- Vendor declines connection → buyer email

## Important

For real email delivery, configure SMTP values in your local `.env`.

Do not commit SMTP passwords or other secrets.
