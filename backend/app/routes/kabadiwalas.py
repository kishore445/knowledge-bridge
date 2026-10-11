"""Kabadiwala pickups and payouts."""
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from bson import ObjectId

from ..models import PickupCreate, PickupInDB, PickupStatus
from ..database import col
from ..deps import get_current_user, require_kabadiwala, require_admin
from ..services.storage_service import presigned_upload_url
from ..services.payment_service import initiate_upi_payout
from ..services.email_service import notify_kabadiwala_payment

router = APIRouter(prefix="/kabadiwalas", tags=["kabadiwalas"])


def _ser(doc):
    if doc:
        doc["id"] = str(doc.pop("_id"))
    return doc


@router.post("/profile")
async def create_profile(area: str, upi_id: str = "", user: dict = Depends(get_current_user)):
    if user["role"] != "kabadiwala":
        raise HTTPException(403, "Kabadiwala role required")
    existing = await col("kabadiwalas").find_one({"user_id": user["_id"]})
    if existing:
        raise HTTPException(409, "Profile already exists")
    doc = {
        "user_id": user["_id"],
        "area": area,
        "trust_score": 1.0,
        "upi_id": upi_id,
        "total_pickups": 0,
        "accepted_pickups": 0,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    await col("kabadiwalas").insert_one(doc)
    return {"message": "Profile created"}


@router.get("/me")
async def my_profile(user: dict = Depends(require_kabadiwala)):
    profile = await col("kabadiwalas").find_one({"user_id": user["_id"]})
    if not profile:
        raise HTTPException(404, "Profile not found")
    return _ser(profile)


@router.post("/pickups")
async def log_pickup(body: PickupCreate, user: dict = Depends(require_kabadiwala)):
    profile = await col("kabadiwalas").find_one({"user_id": user["_id"]})
    if not profile:
        raise HTTPException(404, "Create a kabadiwala profile first")
    doc = {
        "kabadiwala_id": str(profile["_id"]),
        "photos": [],
        "declared_count": body.declared_count,
        "accepted_count": None,
        "govt_issued": body.govt_issued,
        "notes": body.notes,
        "status": "submitted",
        "amount_paid": None,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    result = await col("pickups").insert_one(doc)
    return {"id": str(result.inserted_id), "message": "Pickup logged"}


@router.get("/pickups/upload-url")
async def photo_upload_url(pickup_id: str, user: dict = Depends(require_kabadiwala)):
    return presigned_upload_url(f"pickups/{pickup_id}")


@router.post("/pickups/{pickup_id}/add-photo")
async def add_photo(pickup_id: str, photo_url: str, user: dict = Depends(require_kabadiwala)):
    await col("pickups").update_one(
        {"_id": ObjectId(pickup_id)},
        {"$push": {"photos": photo_url}, "$set": {"updated_at": datetime.utcnow()}},
    )
    return {"message": "Photo added"}


@router.get("/pickups")
async def my_pickups(user: dict = Depends(require_kabadiwala)):
    profile = await col("kabadiwalas").find_one({"user_id": user["_id"]})
    if not profile:
        return []
    cursor = col("pickups").find({"kabadiwala_id": str(profile["_id"])}).sort("created_at", -1)
    pickups = await cursor.to_list(100)
    return [_ser(p) for p in pickups]


# Admin: accept / reject pickup
@router.post("/pickups/{pickup_id}/accept")
async def accept_pickup(
    pickup_id: str,
    accepted_count: int,
    amount_per_book: float,
    admin: dict = Depends(require_admin),
):
    pickup = await col("pickups").find_one({"_id": ObjectId(pickup_id)})
    if not pickup:
        raise HTTPException(404, "Pickup not found")
    amount = accepted_count * amount_per_book
    await col("pickups").update_one(
        {"_id": ObjectId(pickup_id)},
        {"$set": {
            "status": "accepted",
            "accepted_count": accepted_count,
            "amount_paid": amount,
            "updated_at": datetime.utcnow(),
        }},
    )
    # Update trust score
    profile = await col("kabadiwalas").find_one({"_id": ObjectId(pickup["kabadiwala_id"])})
    if profile:
        total = profile.get("total_pickups", 0) + 1
        accepted = profile.get("accepted_pickups", 0) + 1
        trust = round(accepted / total, 2)
        await col("kabadiwalas").update_one(
            {"_id": profile["_id"]},
            {"$set": {"total_pickups": total, "accepted_pickups": accepted, "trust_score": trust}},
        )
    # Initiate payout
    if profile and profile.get("upi_id"):
        payout = await initiate_upi_payout(profile["upi_id"], amount, f"Pickup {pickup_id}")
        await notify_kabadiwala_payment(profile["upi_id"], amount)
    return {"message": f"Accepted {accepted_count} books, ₹{amount} payout queued"}


@router.post("/pickups/{pickup_id}/reject")
async def reject_pickup(pickup_id: str, reason: str = "", admin: dict = Depends(require_admin)):
    pickup = await col("pickups").find_one({"_id": ObjectId(pickup_id)})
    if not pickup:
        raise HTTPException(404, "Pickup not found")
    await col("pickups").update_one(
        {"_id": ObjectId(pickup_id)},
        {"$set": {
            "status": "rejected",
            "rejection_reason": reason,
            "updated_at": datetime.utcnow(),
        }},
    )
    # Update trust score (total up, accepted stays)
    profile = await col("kabadiwalas").find_one({"_id": ObjectId(pickup["kabadiwala_id"])})
    if profile:
        total = profile.get("total_pickups", 0) + 1
        accepted = profile.get("accepted_pickups", 0)
        trust = round(accepted / total, 2) if total else 1.0
        await col("kabadiwalas").update_one(
            {"_id": profile["_id"]},
            {"$set": {"total_pickups": total, "trust_score": trust}},
        )
    return {"message": "Pickup rejected"}
