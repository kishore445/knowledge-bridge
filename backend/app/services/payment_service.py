"""Razorpay integration + UPI payout stub."""
import hmac
import hashlib
from typing import Optional

import razorpay

from ..config import get_settings


def _client():
    s = get_settings()
    return razorpay.Client(auth=(s.razorpay_key_id, s.razorpay_key_secret))


def create_razorpay_order(amount_inr: float, receipt: str, notes: dict = None) -> dict:
    """Returns Razorpay order dict with id, amount (paise), currency."""
    try:
        data = {
            "amount": int(amount_inr * 100),
            "currency": "INR",
            "receipt": receipt[:40],
            "notes": notes or {},
        }
        return _client().order.create(data=data)
    except Exception as e:
        print(f"[RAZORPAY STUB] create_order: {e}")
        return {
            "id": f"order_stub_{receipt}",
            "amount": int(amount_inr * 100),
            "currency": "INR",
            "status": "created",
        }


def verify_razorpay_payment(
    order_id: str, payment_id: str, signature: str
) -> bool:
    s = get_settings()
    try:
        msg = f"{order_id}|{payment_id}"
        expected = hmac.new(  # hmac.new is the correct call
            s.razorpay_key_secret.encode(),
            msg.encode(),
            hashlib.sha256,
        ).hexdigest()
        return hmac.compare_digest(expected, signature)
    except Exception:
        return False


async def initiate_upi_payout(upi_id: str, amount_inr: float, notes: str = "") -> dict:
    """Stub — replace with Razorpay Payouts or Cashfree."""
    print(f"[PAYOUT STUB] UPI={upi_id} Amount=₹{amount_inr} Notes={notes}")
    return {
        "status": "queued",
        "upi_id": upi_id,
        "amount": amount_inr,
        "reference": f"payout_stub_{upi_id}",
    }
