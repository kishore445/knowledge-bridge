"""School registration + verification."""
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId

from ..models import SchoolCreate, SchoolInDB, VerifiedStatus
from ..database import col
from ..deps import get_current_user, require_admin, require_school
from ..services.email_service import notify_school_verified

router = APIRouter(prefix="/schools", tags=["schools"])


def _serialize(doc: dict) -> dict:
    if doc:
        doc["id"] = str(doc.pop("_id"))
    return doc


@router.post("/register")
async def register_school(body: SchoolCreate, user: dict = Depends(get_current_user)):
    if user["role"] != "school":
        raise HTTPException(403, "Only school accounts can register a school")
    existing = await col("schools").find_one({"udise": body.udise})
    if existing:
        raise HTTPException(409, "UDISE already registered")
    doc = body.model_dump()
    doc["user_id"] = user["_id"]
    doc["verified_status"] = "pending"
    doc["created_at"] = datetime.utcnow()
    doc["updated_at"] = datetime.utcnow()
    result = await col("schools").insert_one(doc)
    return {"id": str(result.inserted_id), "message": "Registration submitted. Awaiting verification."}


@router.get("/me")
async def my_school(user: dict = Depends(require_school)):
    school = await col("schools").find_one({"user_id": user["_id"]})
    if not school:
        raise HTTPException(404, "No school profile found")
    return _serialize(school)


@router.get("/")
async def list_schools(district: str = "", verified_only: bool = True):
    query: dict = {}
    if verified_only:
        query["verified_status"] = "verified"
    if district:
        query["district"] = district
    cursor = col("schools").find(query, {"udise": 1, "name": 1, "district": 1, "address": 1})
    schools = await cursor.to_list(200)
    return [_serialize(s) for s in schools]


@router.get("/{school_id}")
async def get_school(school_id: str):
    school = await col("schools").find_one({"_id": ObjectId(school_id)})
    if not school:
        raise HTTPException(404, "School not found")
    return _serialize(school)


# Admin endpoints
@router.post("/{school_id}/verify")
async def verify_school(school_id: str, admin: dict = Depends(require_admin)):
    school = await col("schools").find_one({"_id": ObjectId(school_id)})
    if not school:
        raise HTTPException(404, "School not found")
    await col("schools").update_one(
        {"_id": ObjectId(school_id)},
        {"$set": {"verified_status": "verified", "updated_at": datetime.utcnow()}},
    )
    if school.get("email"):
        await notify_school_verified(school["name"], school["email"])
    return {"message": "School verified"}


@router.post("/{school_id}/reject")
async def reject_school(school_id: str, reason: str = "", admin: dict = Depends(require_admin)):
    await col("schools").update_one(
        {"_id": ObjectId(school_id)},
        {"$set": {
            "verified_status": "rejected",
            "rejection_reason": reason,
            "updated_at": datetime.utcnow(),
        }},
    )
    return {"message": "School rejected"}
