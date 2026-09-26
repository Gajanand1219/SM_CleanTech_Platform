import asyncio
import smtplib
from html import escape
from email.message import EmailMessage

from app.core.config import settings


# ============================================================
# LOW-LEVEL EMAIL SENDER
# ============================================================

async def send_email(to: str, subject: str, html: str) -> bool:
    """
    Central email sender.

    All application emails should use this function.
    """

    if not to:
        print(f"[EMAIL SKIPPED] No recipient for subject: {subject}")
        return False

    # Development mode
    if (
        not settings.SMTP_HOST
        or not settings.SMTP_USERNAME
        or not settings.SMTP_PASSWORD
        or not settings.SMTP_FROM_EMAIL
    ):
        print(
            f"\n[DEV EMAIL]\n"
            f"TO: {to}\n"
            f"SUBJECT: {subject}\n"
            f"HTML:\n{html}\n"
        )
        return True

    def _send():
        msg = EmailMessage()

        msg["Subject"] = subject
        msg["From"] = (
            f"{settings.SMTP_FROM_NAME} "
            f"<{settings.SMTP_FROM_EMAIL}>"
        )
        msg["To"] = to

        msg.set_content(
            "Please view this message in an HTML-capable email client."
        )

        msg.add_alternative(
            html,
            subtype="html",
        )

        with smtplib.SMTP(
            settings.SMTP_HOST,
            settings.SMTP_PORT,
            timeout=20,
        ) as server:

            server.starttls()

            server.login(
                settings.SMTP_USERNAME,
                settings.SMTP_PASSWORD,
            )

            server.send_message(msg)

    try:
        await asyncio.to_thread(_send)
        return True

    except Exception as exc:
        print(f"[EMAIL ERROR] {exc}")
        return False


# ============================================================
# COMMON HTML TEMPLATE
# ============================================================

def email_template(
    title: str,
    body: str,
    status: str | None = None,
) -> str:

    status_html = ""

    if status:
        status_html = f"""
        <div style="
            margin:20px 0;
            padding:12px 16px;
            background:#eef7f0;
            border-left:4px solid #1f7a3f;
            border-radius:6px;
            font-weight:600;
        ">
            Status: {escape(str(status))}
        </div>
        """

    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport"
              content="width=device-width, initial-scale=1.0">
        <title>{escape(title)}</title>
    </head>

    <body style="
        margin:0;
        padding:0;
        background:#f4f7f5;
        font-family:Arial,Helvetica,sans-serif;
        color:#17351f;
    ">

        <div style="
            max-width:650px;
            margin:30px auto;
            background:#ffffff;
            border-radius:12px;
            overflow:hidden;
            box-shadow:0 3px 15px rgba(0,0,0,0.08);
        ">

            <!-- Header -->
            <div style="
                background:#17351f;
                padding:22px 28px;
                color:white;
            ">
                <h2 style="
                    margin:0;
                    font-size:22px;
                ">
                    SM Clean Tech
                </h2>

                <p style="
                    margin:6px 0 0;
                    font-size:13px;
                    opacity:0.85;
                ">
                    Engineering Solutions
                </p>
            </div>

            <!-- Content -->
            <div style="
                padding:30px;
                line-height:1.7;
            ">

                <h2 style="
                    margin-top:0;
                    color:#17351f;
                ">
                    {escape(title)}
                </h2>

                {status_html}

                <div>
                    {body}
                </div>

            </div>

            <!-- Footer -->
            <div style="
                padding:20px 30px;
                background:#f4f7f5;
                border-top:1px solid #e2e8e4;
                font-size:12px;
                color:#66736a;
            ">

                <strong>
                    SM Clean Tech Engineering Solutions
                </strong>

                <br>

                This is an automated notification.
                Please do not reply directly to this email.

            </div>

        </div>

    </body>
    </html>
    """


# ============================================================
# 1. OTP EMAIL
# ============================================================

async def send_otp_email(
    to: str,
    otp: str,
) -> bool:

    subject = "Verify your SM Clean Tech account"

    body = f"""
        <p>Hello,</p>

        <p>
            Thank you for registering with
            <strong>SM Clean Tech Engineering Solutions</strong>.
        </p>

        <p>
            Use the following OTP to verify your email address:
        </p>

        <div style="
            text-align:center;
            margin:25px 0;
        ">
            <span style="
                display:inline-block;
                padding:14px 28px;
                background:#eef7f0;
                border-radius:8px;
                font-size:28px;
                letter-spacing:6px;
                font-weight:bold;
                color:#17351f;
            ">
                {escape(str(otp))}
            </span>
        </div>

        <p>
            Please do not share this OTP with anyone.
        </p>

        <p>
            If you did not create this account, you can safely ignore
            this email.
        </p>
    """

    return await send_email(
        to,
        subject,
        email_template(
            "Email Verification",
            body,
        ),
    )


# ============================================================
# 2. ACCOUNT STATUS
# ============================================================

async def send_account_status_email(
    to: str,
    name: str,
    status: str,
    note: str | None = None,
) -> bool:

    subject = f"Your SM Clean Tech account is {status}"

    body = f"""
        <p>Hello <strong>{escape(name)}</strong>,</p>

        <p>
            Your SM Clean Tech account status has been updated.
        </p>

        <p>
            <strong>Account Status:</strong>
            {escape(status)}
        </p>
    """

    if note:
        body += f"""
        <p>
            <strong>Note:</strong><br>
            {escape(note)}
        </p>
        """

    return await send_email(
        to,
        subject,
        email_template(
            "Account Status Update",
            body,
            status,
        ),
    )


# ============================================================
# 3. NEW ENQUIRY → ADMIN
# ============================================================

async def send_enquiry_submitted_email(
    admin_email: str,
    enquiry,
    buyer,
) -> bool:

    subject = (
        f"New enquiry #{enquiry.id} "
        f"requires admin approval"
    )

    body = f"""
        <p>Hello Admin,</p>

        <p>
            A new technical enquiry has been submitted and
            requires your review.
        </p>

        <div style="
            background:#f7faf8;
            padding:18px;
            border-radius:8px;
        ">

            <strong>Enquiry ID:</strong>
            #{enquiry.id}<br>

            <strong>Buyer:</strong>
            {escape(buyer.full_name)}<br>

            <strong>Buyer Email:</strong>
            {escape(buyer.email)}<br>

            <strong>Domain:</strong>
            {escape(enquiry.domain.name)}<br>

            <strong>Problem:</strong>
            {escape(enquiry.problem.name)}<br>

            <strong>Title:</strong>
            {escape(enquiry.title)}

        </div>

        <p>
            Please review the technical dossier from the Admin Panel.
        </p>

        <p>
            Vendors will be notified only after admin approval.
        </p>
    """

    return await send_email(
        admin_email,
        subject,
        email_template(
            "New Enquiry Awaiting Approval",
            body,
            "SUBMITTED",
        ),
    )


# ============================================================
# 4. ENQUIRY APPROVED → BUYER
# ============================================================

async def send_enquiry_approved_email(
    buyer,
    enquiry,
    matched_count: int,
) -> bool:

    subject = f"Enquiry #{enquiry.id} approved"

    body = f"""
        <p>
            Hello <strong>{escape(buyer.full_name)}</strong>,
        </p>

        <p>
            Your technical enquiry has been reviewed and
            <strong>approved</strong> by the SM Clean Tech admin team.
        </p>

        <div style="
            background:#f7faf8;
            padding:18px;
            border-radius:8px;
        ">

            <strong>Enquiry ID:</strong>
            #{enquiry.id}<br>

            <strong>Domain:</strong>
            {escape(enquiry.domain.name)}<br>

            <strong>Problem:</strong>
            {escape(enquiry.problem.name)}<br>

            <strong>Matched Vendors:</strong>
            {matched_count}

        </div>

        <p>
            Domain-matched vendors can now review the technical
            dossier and submit quotations.
        </p>

        <p>
            Log in to your dashboard to track quotation activity.
        </p>
    """

    return await send_email(
        buyer.email,
        subject,
        email_template(
            "Enquiry Approved",
            body,
            "APPROVED",
        ),
    )


# ============================================================
# 5. ENQUIRY REJECTED → BUYER
# ============================================================

async def send_enquiry_rejected_email(
    buyer,
    enquiry,
    reason: str | None = None,
) -> bool:

    subject = (
        f"Enquiry #{enquiry.id} "
        f"was not approved"
    )

    reason_text = (
        reason
        or "Please contact platform support for more details."
    )

    body = f"""
        <p>
            Hello <strong>{escape(buyer.full_name)}</strong>,
        </p>

        <p>
            Your technical enquiry
            <strong>#{enquiry.id}</strong>
            was not approved at this time.
        </p>

        <div style="
            background:#fff7f7;
            padding:18px;
            border-left:4px solid #b42318;
            border-radius:6px;
        ">

            <strong>Reason:</strong><br>
            {escape(reason_text)}

        </div>

        <p>
            You can review your enquiry history from your dashboard.
        </p>
    """

    return await send_email(
        buyer.email,
        subject,
        email_template(
            "Enquiry Review Update",
            body,
            "REJECTED",
        ),
    )


# ============================================================
# 6. VENDOR MATCHED → VENDOR
# ============================================================

async def send_vendor_matched_email(
    vendor,
    enquiry,
) -> bool:

    subject = (
        f"New approved CleanTech enquiry "
        f"#{enquiry.id}"
    )

    body = f"""
        <p>
            Hello <strong>{escape(vendor.full_name)}</strong>,
        </p>

        <p>
            A newly approved technical enquiry matches
            one of your registered domains.
        </p>

        <div style="
            background:#f7faf8;
            padding:18px;
            border-radius:8px;
        ">

            <strong>Enquiry ID:</strong>
            #{enquiry.id}<br>

            <strong>Domain:</strong>
            {escape(enquiry.domain.name)}<br>

            <strong>Problem:</strong>
            {escape(enquiry.problem.name)}

        </div>

        <p>
            The buyer's identity remains masked until a
            mutual two-way handshake is completed.
        </p>

        <p>
            Log in to view the technical dossier and submit
            your quotation.
        </p>
    """

    return await send_email(
        vendor.email,
        subject,
        email_template(
            "New Domain-Matched Enquiry",
            body,
            "MATCHED",
        ),
    )


# ============================================================
# 7. QUOTATION SUBMITTED → BUYER
# ============================================================

async def send_quotation_submitted_email(
    buyer,
    enquiry,
    quotation,
) -> bool:

    subject = (
        f"New quotation received "
        f"for enquiry #{enquiry.id}"
    )

    body = f"""
        <p>
            Hello <strong>{escape(buyer.full_name)}</strong>,
        </p>

        <p>
            A matched vendor has submitted a quotation
            for your approved technical enquiry.
        </p>

        <div style="
            background:#f7faf8;
            padding:18px;
            border-radius:8px;
        ">

            <strong>Enquiry ID:</strong>
            #{enquiry.id}<br>

            <strong>Quotation ID:</strong>
            #{quotation.id}<br>

            <strong>CAPEX:</strong>
            {quotation.capex}<br>

            <strong>OPEX:</strong>
            {quotation.opex}<br>

            <strong>Technology:</strong>
            {escape(quotation.technology or "N/A")}<br>

            <strong>Implementation:</strong>
            {escape(quotation.implementation_time or "N/A")}<br>

            <strong>Warranty:</strong>
            {escape(quotation.warranty or "N/A")}<br>

            <strong>AMC:</strong>
            {escape(quotation.amc or "N/A")}

        </div>

        <p>
            Log in to review the quotation and accept or reject it.
        </p>
    """

    return await send_email(
        buyer.email,
        subject,
        email_template(
            "New Technical Quotation",
            body,
            "QUOTATION RECEIVED",
        ),
    )


# ============================================================
# 8. QUOTATION ACCEPTED → VENDOR
# ============================================================

async def send_quotation_accepted_email(
    vendor,
    enquiry,
    quotation,
) -> bool:

    subject = (
        f"Buyer accepted quotation #{quotation.id}"
    )

    body = f"""
        <p>
            Hello <strong>{escape(vendor.full_name)}</strong>,
        </p>

        <p>
            The buyer has accepted your quotation
            for enquiry <strong>#{enquiry.id}</strong>.
        </p>

        <div style="
            background:#f7faf8;
            padding:18px;
            border-radius:8px;
        ">

            <strong>Quotation ID:</strong>
            #{quotation.id}<br>

            <strong>Enquiry ID:</strong>
            #{enquiry.id}

        </div>

        <p>
            Please log in and accept the connection to complete
            the two-way handshake.
        </p>
    """

    return await send_email(
        vendor.email,
        subject,
        email_template(
            "Buyer Accepted Your Quotation",
            body,
            "BUYER ACCEPTED",
        ),
    )


# ============================================================
# 9. QUOTATION REJECTED → VENDOR
# ============================================================

async def send_quotation_rejected_email(
    vendor,
    enquiry,
    quotation,
) -> bool:

    subject = (
        f"Quotation #{quotation.id} was rejected"
    )

    body = f"""
        <p>
            Hello <strong>{escape(vendor.full_name)}</strong>,
        </p>

        <p>
            The buyer has rejected your quotation
            <strong>#{quotation.id}</strong>
            for enquiry <strong>#{enquiry.id}</strong>.
        </p>

        <p>
            The enquiry remains available in your CRM history.
        </p>
    """

    return await send_email(
        vendor.email,
        subject,
        email_template(
            "Quotation Rejected",
            body,
            "REJECTED",
        ),
    )


# ============================================================
# 10. BUYER ACCEPTANCE → VENDOR
# ============================================================

async def send_buyer_acceptance_email(
    vendor,
    enquiry,
    quotation,
) -> bool:

    subject = (
        f"Buyer accepted quotation #{quotation.id}"
    )

    body = f"""
        <p>
            Hello <strong>{escape(vendor.full_name)}</strong>,
        </p>

        <p>
            The buyer has accepted quotation
            <strong>#{quotation.id}</strong>.
        </p>

        <p>
            Please log in and accept the connection
            to complete the two-way handshake.
        </p>

        <p>
            Contact details will remain masked until
            both parties accept.
        </p>
    """

    return await send_email(
        vendor.email,
        subject,
        email_template(
            "Buyer Acceptance",
            body,
            "WAITING FOR VENDOR",
        ),
    )


# ============================================================
# 11. VENDOR ACCEPTANCE → BUYER
# ============================================================

async def send_vendor_acceptance_email(
    buyer,
    enquiry,
) -> bool:

    subject = (
        f"Vendor accepted connection "
        f"for enquiry #{enquiry.id}"
    )

    body = f"""
        <p>
            Hello <strong>{escape(buyer.full_name)}</strong>,
        </p>

        <p>
            The vendor has accepted the connection
            for enquiry <strong>#{enquiry.id}</strong>.
        </p>

        <p>
            The two-way handshake will unlock contact details
            when both parties have accepted.
        </p>

        <p>
            Please check your dashboard for the latest status.
        </p>
    """

    return await send_email(
        buyer.email,
        subject,
        email_template(
            "Vendor Acceptance",
            body,
            "VENDOR ACCEPTED",
        ),
    )


# ============================================================
# 12. VENDOR DECLINED → BUYER
# ============================================================

async def send_vendor_declined_email(
    buyer,
    enquiry,
) -> bool:

    subject = (
        f"Vendor declined connection "
        f"for enquiry #{enquiry.id}"
    )

    body = f"""
        <p>
            Hello <strong>{escape(buyer.full_name)}</strong>,
        </p>

        <p>
            The matched vendor has declined the connection
            for enquiry <strong>#{enquiry.id}</strong>.
        </p>

        <p>
            The activity has been recorded in your CRM history.
        </p>
    """

    return await send_email(
        buyer.email,
        subject,
        email_template(
            "Connection Declined",
            body,
            "DECLINED",
        ),
    )


# ============================================================
# 13. MUTUAL HANDSHAKE → BUYER
# ============================================================

async def send_mutual_handshake_buyer_email(
    buyer,
    enquiry,
) -> bool:

    subject = (
        f"Two-way handshake completed "
        f"for enquiry #{enquiry.id}"
    )

    body = f"""
        <p>
            Hello <strong>{escape(buyer.full_name)}</strong>,
        </p>

        <p>
            Both you and the vendor have accepted the connection
            for enquiry <strong>#{enquiry.id}</strong>.
        </p>

        <div style="
            background:#eef7f0;
            padding:18px;
            border-radius:8px;
        ">

            <strong>
                Contact details are now unlocked.
            </strong>

        </div>

        <p>
            You can now view the vendor contact information
            from your dashboard.
        </p>
    """

    return await send_email(
        buyer.email,
        subject,
        email_template(
            "Mutual Handshake Completed",
            body,
            "CONTACT UNLOCKED",
        ),
    )


# ============================================================
# 14. MUTUAL HANDSHAKE → VENDOR
# ============================================================

async def send_mutual_handshake_vendor_email(
    vendor,
    enquiry,
) -> bool:

    subject = (
        f"Two-way handshake completed "
        f"for enquiry #{enquiry.id}"
    )

    body = f"""
        <p>
            Hello <strong>{escape(vendor.full_name)}</strong>,
        </p>

        <p>
            Both you and the buyer have accepted the connection
            for enquiry <strong>#{enquiry.id}</strong>.
        </p>

        <div style="
            background:#eef7f0;
            padding:18px;
            border-radius:8px;
        ">

            <strong>
                Buyer contact details are now unlocked.
            </strong>

        </div>

        <p>
            You can now view the buyer contact information
            from your dashboard.
        </p>
    """

    return await send_email(
        vendor.email,
        subject,
        email_template(
            "Mutual Handshake Completed",
            body,
            "CONTACT UNLOCKED",
        ),
    )


# ============================================================
# 15. CONTACT DETAILS UNLOCKED
# ============================================================

async def send_contact_unlocked_email(
    to: str,
    name: str,
    enquiry_id: int,
    other_party_name: str,
    other_party_email: str,
    other_party_phone: str | None = None,
) -> bool:

    phone_html = ""

    if other_party_phone:
        phone_html = f"""
            <strong>Phone:</strong>
            {escape(other_party_phone)}<br>
        """

    subject = (
        f"Contact details unlocked "
        f"for enquiry #{enquiry_id}"
    )

    body = f"""
        <p>
            Hello <strong>{escape(name)}</strong>,
        </p>

        <p>
            The two-way handshake has been completed.
            Contact details are now unlocked.
        </p>

        <div style="
            background:#eef7f0;
            padding:18px;
            border-radius:8px;
        ">

            <strong>Enquiry:</strong>
            #{enquiry_id}<br><br>

            <strong>Contact:</strong>
            {escape(other_party_name)}<br>

            <strong>Email:</strong>
            {escape(other_party_email)}<br>

            {phone_html}

        </div>

        <p>
            You can now proceed with direct communication
            regarding the enquiry.
        </p>
    """

    return await send_email(
        to,
        subject,
        email_template(
            "Contact Details Unlocked",
            body,
            "UNLOCKED",
        ),
    )


# ============================================================
# 16. GENERIC CRM ACTIVITY EMAIL
# ============================================================

async def send_crm_activity_email(
    to: str,
    name: str,
    enquiry_id: int,
    event_type: str,
    note: str,
) -> bool:

    subject = (
        f"CRM update for enquiry #{enquiry_id}"
    )

    body = f"""
        <p>
            Hello <strong>{escape(name)}</strong>,
        </p>

        <p>
            There is a new activity update for
            enquiry <strong>#{enquiry_id}</strong>.
        </p>

        <div style="
            background:#f7faf8;
            padding:18px;
            border-radius:8px;
        ">

            <strong>Event:</strong>
            {escape(event_type)}<br><br>

            <strong>Details:</strong><br>
            {escape(note)}

        </div>

        <p>
            Log in to your dashboard to view the complete CRM history.
        </p>
    """

    return await send_email(
        to,
        subject,
        email_template(
            "CRM Activity Update",
            body,
            "CRM UPDATE",
        ),
    )


# ============================================================
# 17. QUOTATION DEADLINE REMINDER
# ============================================================

async def send_quotation_deadline_reminder_email(
    vendor,
    enquiry,
    deadline,
) -> bool:

    subject = (
        f"Quotation deadline reminder "
        f"for enquiry #{enquiry.id}"
    )

    body = f"""
        <p>
            Hello <strong>{escape(vendor.full_name)}</strong>,
        </p>

        <p>
            This is a reminder that the quotation window
            for enquiry <strong>#{enquiry.id}</strong>
            is approaching its deadline.
        </p>

        <div style="
            background:#fff8e8;
            padding:18px;
            border-radius:8px;
        ">

            <strong>Domain:</strong>
            {escape(enquiry.domain.name)}<br>

            <strong>Problem:</strong>
            {escape(enquiry.problem.name)}<br>

            <strong>Quotation Deadline:</strong>
            {escape(str(deadline))}

        </div>

        <p>
            Please submit your quotation before the deadline.
        </p>
    """

    return await send_email(
        vendor.email,
        subject,
        email_template(
            "Quotation Deadline Reminder",
            body,
            "DEADLINE APPROACHING",
        ),
    )


# ============================================================
# WEBSITE CONTACT FORM → ADMIN
# ============================================================

async def send_contact_form_email(
    name: str,
    mobile: str,
    email: str,
    message: str,
) -> bool:

    subject = f"New Website Enquiry - {name}"

    body = f"""
        <p>Hello Admin,</p>

        <p>
            A new enquiry has been submitted from the
            <strong>SM Clean Tech website contact form</strong>.
        </p>

        <div style="
            background:#f7faf8;
            padding:20px;
            border-radius:8px;
            border:1px solid #e2e8e4;
            margin:20px 0;
        ">

            <p>
                <strong>Name:</strong><br>
                {escape(name)}
            </p>

            <p>
                <strong>Mobile Number:</strong><br>
                {escape(mobile)}
            </p>

            <p>
                <strong>Email:</strong><br>
                {escape(email)}
            </p>

            <p>
                <strong>Requirement:</strong><br>
                {escape(message)}
            </p>

        </div>

        <p>
            Please contact the person regarding their requirement.
        </p>
    """

    return await send_email(
        to="gajanand1902@gmail.com",
        subject=subject,
        html=email_template(
            "New Website Enquiry",
            body,
            "NEW ENQUIRY",
        ),
    )