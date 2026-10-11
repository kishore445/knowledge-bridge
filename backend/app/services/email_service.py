"""Email notifications via Resend."""
from ..config import get_settings


async def send_email(to: str, subject: str, html: str):
    settings = get_settings()
    if not settings.resend_api_key:
        print(f"[EMAIL STUB] To={to} Subject={subject}")
        return
    try:
        import resend
        resend.api_key = settings.resend_api_key
        resend.Emails.send({
            "from": settings.from_email,
            "to": to,
            "subject": subject,
            "html": html,
        })
    except Exception as e:
        print(f"[EMAIL ERROR] {e}")


async def notify_school_verified(school_name: str, email: str):
    await send_email(
        email,
        "Your school is verified on Knowledge Bridge",
        f"<p>Congratulations! <strong>{school_name}</strong> is now verified. "
        "You can start ordering books.</p>",
    )


async def notify_order_shipped(school_email: str, order_id: str):
    await send_email(
        school_email,
        "Your book order is on the way",
        f"<p>Order <code>{order_id}</code> has been shipped and will arrive in a few days.</p>",
    )


async def notify_sponsorship_cert(sponsor_email: str, school_name: str):
    await send_email(
        sponsor_email,
        "Your sponsorship certificate is ready",
        f"<p>Thank you for sponsoring books for <strong>{school_name}</strong>. "
        "Download your certificate from your dashboard.</p>",
    )


async def notify_kabadiwala_payment(upi_id: str, amount: float, phone: str = ""):
    if phone:
        print(f"[SMS STUB] Payment ₹{amount} initiated to UPI {upi_id}")
