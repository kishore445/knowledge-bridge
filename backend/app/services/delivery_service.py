"""Delivery quote stub — to be wired to Shiprocket."""
from typing import Optional


# Flat-rate tiers (INR) until Shiprocket is integrated
_RATE_TABLE = [
    (0.5, 60),
    (1.0, 80),
    (2.0, 120),
    (5.0, 180),
    (10.0, 250),
    (float("inf"), 320),
]

# Books-per-kg estimate for quoting
BOOKS_PER_KG = 4


def get_quote(from_pin: str, to_pin: str, weight_kg: float) -> dict:
    """Returns {amount, currency, provider, estimated_days}."""
    amount = 60.0
    for limit, price in _RATE_TABLE:
        if weight_kg <= limit:
            amount = float(price)
            break

    # Same-city discount
    if from_pin[:3] == to_pin[:3]:
        amount = max(40.0, amount * 0.7)

    return {
        "amount": round(amount, 2),
        "currency": "INR",
        "provider": "stub_flat_rate",
        "estimated_days": 3 if from_pin[:3] == to_pin[:3] else 7,
        "from_pin": from_pin,
        "to_pin": to_pin,
        "weight_kg": weight_kg,
    }


def books_to_weight(book_count: int) -> float:
    return round(book_count / BOOKS_PER_KG, 2)
