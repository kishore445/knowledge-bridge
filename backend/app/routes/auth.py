"""Auth routes: OTP request + verify → JWT."""
from datetime import datetime
from fastapi import APIRouter, HTTPException, status
from bson import ObjectId

from ..models import (
    OTPRequest, OTPVerify, TokenResponse, UserResponse,
    UserInDB, UserRole,
)
from ..database import col
from ..services.auth_service import send_otp, verify_otp_and_get_user, create_access_token
from ..deps import get_current_user
from fastapi import Depends

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/otp/request")
async def request_otp(body: OTPRequest):
    if not body.phone and not body.email:
        raise HTTPException(400, "Provide phone or email")

    query = {"phone": body.phone} if body.phone else {"email": body.email}
    existing = await col("users").find_one(query)

    if not existing:
        # First-time — need a name
        if not body.name:
            raise HTTPException(400, "Name is required for new users")
        doc = {
            "role": body.role.value,
            "name": body.name,
            "phone": body.phone,
            "email": body.email,
            "is_minor": False,
            "area": None,
            "city": "Hyderabad",
            "pincode": None,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }
        result = await col("users").insert_one(doc)
        doc["_id"] = result.inserted_id

    otp_plain = await send_otp(body.phone, body.email)
    resp = {"message": "OTP sent"}
    if otp_plain:
        resp["otp"] = otp_plain  # only in MOCK_OTP mode
    return resp


@router.post("/otp/verify", response_model=TokenResponse)
async def verify_otp(body: OTPVerify):
    if not body.phone and not body.email:
        raise HTTPException(400, "Provide phone or email")

    user = await verify_otp_and_get_user(body.phone, body.email, body.otp)
    if not user:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired OTP")

    user_id = str(user["_id"])
    token = create_access_token(user_id, user["role"])

    return TokenResponse(
        access_token=token,
        user=UserResponse(
            id=user_id,
            role=user["role"],
            name=user["name"],
            phone=user.get("phone"),
            email=user.get("email"),
            area=user.get("area"),
            city=user.get("city", "Hyderabad"),
            is_minor=user.get("is_minor", False),
        ),
    )


@router.get("/me", response_model=UserResponse)
async def me(user: dict = Depends(get_current_user)):
    return UserResponse(
        id=user["_id"],
        role=user["role"],
        name=user["name"],
        phone=user.get("phone"),
        email=user.get("email"),
        area=user.get("area"),
        city=user.get("city", "Hyderabad"),
        is_minor=user.get("is_minor", False),
    )


@router.patch("/me")
async def update_profile(
    body: dict,
    user: dict = Depends(get_current_user),
):
    allowed = {"name", "area", "city", "pincode", "email", "phone"}
    update = {k: v for k, v in body.items() if k in allowed}
    if not update:
        raise HTTPException(400, "Nothing to update")
    update["updated_at"] = datetime.utcnow()
    await col("users").update_one(
        {"_id": ObjectId(user["_id"])},
        {"$set": update},
    )
    return {"message": "Profile updated"}
