"""OTP + JWT auth service."""
import random
import string
from datetime import datetime, timedelta
from typing import Optional

import jwt
from passlib.context import CryptContext

from ..config import get_settings
from ..database import col

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

OTP_TTL_MINUTES = 10


def _generate_otp() -> str:
    return "".join(random.choices(string.digits, k=6))


def _hash_otp(otp: str) -> str:
    return pwd_context.hash(otp)


def _verify_otp_hash(otp: str, hashed: str) -> bool:
    return pwd_context.verify(otp, hashed)


async def send_otp(phone: Optional[str], email: Optional[str]) -> str:
    """Generate OTP, persist hash, and dispatch."""
    settings = get_settings()
    otp = _generate_otp()
    hashed = _hash_otp(otp)
    expires = datetime.utcnow() + timedelta(minutes=OTP_TTL_MINUTES)

    query = {"phone": phone} if phone else {"email": email}
    await col("users").update_one(
        query,
        {"$set": {"hashed_otp": hashed, "otp_expires_at": expires}},
        upsert=False,
    )
    # Store in pending_otps for users who haven't signed up yet
    await col("pending_otps").replace_one(
        query,
        {**query, "hashed_otp": hashed, "otp_expires_at": expires},
        upsert=True,
    )

    if settings.mock_otp:
        # In dev: print to console instead of sending SMS/email
        identifier = phone or email
        print(f"[MOCK OTP] {identifier} → {otp}")
    else:
        if phone:
            await _send_sms(phone, otp, settings)
        elif email:
            await _send_email(email, otp, settings)

    return otp if settings.mock_otp else ""


async def _send_sms(phone: str, otp: str, settings):
    try:
        from twilio.rest import Client
        client = Client(settings.twilio_account_sid, settings.twilio_auth_token)
        client.messages.create(
            body=f"Your Knowledge Bridge OTP is {otp}. Valid for {OTP_TTL_MINUTES} minutes.",
            from_=settings.twilio_from_number,
            to=phone,
        )
    except Exception as e:
        print(f"[SMS ERROR] {e}")


async def _send_email(email: str, otp: str, settings):
    try:
        import resend
        resend.api_key = settings.resend_api_key
        resend.Emails.send({
            "from": settings.from_email,
            "to": email,
            "subject": "Your Knowledge Bridge OTP",
            "html": f"<p>Your OTP is <strong>{otp}</strong>. Valid for {OTP_TTL_MINUTES} minutes.</p>",
        })
    except Exception as e:
        print(f"[EMAIL ERROR] {e}")


async def verify_otp_and_get_user(
    phone: Optional[str], email: Optional[str], otp: str
) -> Optional[dict]:
    """Returns user doc if OTP is valid; None otherwise."""
    query = {"phone": phone} if phone else {"email": email}

    # Check pending_otps first (new user)
    pending = await col("pending_otps").find_one(query)
    if pending and _check_otp_valid(pending, otp):
        await col("pending_otps").delete_one(query)
        return await col("users").find_one(query)

    # Existing user
    user = await col("users").find_one(query)
    if user and _check_otp_valid(user, otp):
        await col("users").update_one(
            {"_id": user["_id"]},
            {"$unset": {"hashed_otp": "", "otp_expires_at": ""}},
        )
        return user
    return None


def _check_otp_valid(doc: dict, otp: str) -> bool:
    hashed = doc.get("hashed_otp")
    expires = doc.get("otp_expires_at")
    if not hashed or not expires:
        return False
    if datetime.utcnow() > expires:
        return False
    return _verify_otp_hash(otp, hashed)


def create_access_token(user_id: str, role: str) -> str:
    settings = get_settings()
    payload = {
        "sub": user_id,
        "role": role,
        "exp": datetime.utcnow() + timedelta(minutes=settings.jwt_expire_minutes),
        "iat": datetime.utcnow(),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> Optional[dict]:
    settings = get_settings()
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None
