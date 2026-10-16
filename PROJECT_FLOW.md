# SM Clean Tech Engineering Solutions — Implemented Workflow

## Registration

Buyer Register → Email OTP → Buyer Panel

Vendor Register → Email OTP → Vendor Panel

Admin Login → Admin Panel

**Admin registration approval is not required. Admin approval is only for technical enquiries.**

## Enquiry approval flow

Buyer Dashboard
→ Create Enquiry
→ Domain
→ Problem/Sub-domain
→ 10+ technical questionnaire points
→ Technical Dossier
→ Submit

→ **Admin Enquiry Approval**

Admin:
→ Review dossier
→ Approve / Reject

If rejected:
→ Buyer email
→ CRM event

If approved:
→ Buyer email
→ Matching engine
→ Up to 10 suitable vendor suggestions
→ Matched vendor email(s)
→ Vendor Matching Suggestions panel

## Vendor flow

Matched vendor
→ View masked dossier
→ 240-hour quotation window
→ Submit technical quotation
→ Buyer email

## Buyer quotation flow

Buyer
→ Review quotation
→ Accept / Reject

If accepted:
→ Vendor email
→ Vendor reviews connection

## Two-way handshake

Buyer accepts quotation
+
Vendor accepts connection

→ Mutual handshake
→ Contact details unlock
→ Direct buyer/vendor communication
→ CRM history

Before mutual acceptance:
- Buyer identity is masked from vendor.
- Vendor identity is masked from buyer.
- Contact details are not exposed.

## Email rule

Vendors receive enquiry emails **only after admin approval and successful matching**.

Buyers receive approval/rejection, quotation, and handshake notifications.

## No AI

This version is the core marketplace/workflow foundation and does not use AI/RAG/LLM.
