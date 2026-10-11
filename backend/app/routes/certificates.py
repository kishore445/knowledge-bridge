"""Certificate generation (sponsor / donor)."""
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse
from bson import ObjectId

from ..database import col
from ..deps import get_current_user

router = APIRouter(prefix="/certificates", tags=["certificates"])


async def _build_cert_data(cert_type: str, reference_id: str, user_id: str) -> dict:
    if cert_type == "sponsorship":
        sp = await col("sponsorships").find_one({"_id": ObjectId(reference_id)})
        if not sp or sp.get("sponsor_id") != user_id:
            raise HTTPException(403, "Not your sponsorship")
        if not sp.get("fulfilled"):
            raise HTTPException(400, "Sponsorship not yet fulfilled")
        school_name = "a government school"
        if sp.get("target_school_id"):
            s = await col("schools").find_one({"_id": ObjectId(sp["target_school_id"])})
            if s:
                school_name = s["name"]
        user = await col("users").find_one({"_id": ObjectId(user_id)})
        return {
            "type": "sponsorship",
            "recipient_name": user["name"],
            "school_name": school_name,
            "tier": sp.get("tier"),
            "amount": sp.get("amount"),
            "date": sp.get("updated_at", datetime.utcnow()).isoformat(),
            "message": "Thank you for your generosity.",
        }

    if cert_type == "donor":
        listing = await col("donor_listings").find_one({"_id": ObjectId(reference_id)})
        if not listing or listing.get("donor_id") != user_id:
            raise HTTPException(403, "Not your listing")
        if listing.get("status") != "collected":
            raise HTTPException(400, "Book not yet collected")
        user = await col("users").find_one({"_id": ObjectId(user_id)})
        return {
            "type": "donor",
            "recipient_name": user["name"],
            "book_class": listing.get("book_class"),
            "subject": listing.get("subject"),
            "board": listing.get("board"),
            "date": listing.get("updated_at", datetime.utcnow()).isoformat(),
            "message": "Thank you for your donation.",
        }

    raise HTTPException(400, "cert_type must be sponsorship or donor")


@router.get("/{cert_type}/{reference_id}")
async def get_certificate(
    cert_type: str,
    reference_id: str,
    user: dict = Depends(get_current_user),
):
    """Returns certificate data as JSON; frontend renders it as PDF."""
    data = await _build_cert_data(cert_type, reference_id, user["_id"])
    return data
