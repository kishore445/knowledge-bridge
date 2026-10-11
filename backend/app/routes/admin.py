"""Admin dashboard data."""
from datetime import datetime
from fastapi import APIRouter, Depends, Query
from bson import ObjectId

from ..database import col
from ..deps import require_admin
from ..config import get_settings

router = APIRouter(prefix="/admin", tags=["admin"])


def _ser(doc):
    if doc:
        doc["id"] = str(doc.pop("_id"))
    return doc


@router.get("/verification-queue")
async def verification_queue(admin: dict = Depends(require_admin)):
    schools = await col("schools").find({"verified_status": "pending"}).to_list(100)
    return [_ser(s) for s in schools]


@router.get("/pickup-queue")
async def pickup_queue(admin: dict = Depends(require_admin)):
    pickups = await col("pickups").find({"status": "submitted"}).sort("created_at", 1).to_list(100)
    result = []
    for p in pickups:
        p["id"] = str(p.pop("_id"))
        kb = await col("kabadiwalas").find_one({"_id": ObjectId(p["kabadiwala_id"])})
        if kb:
            user = await col("users").find_one({"_id": ObjectId(kb["user_id"])})
            p["kabadiwala_name"] = user["name"] if user else "Unknown"
            p["trust_score"] = kb.get("trust_score", 1.0)
        result.append(p)
    return result


@router.get("/orders-board")
async def orders_board(admin: dict = Depends(require_admin)):
    """Kanban by status."""
    statuses = ["pending_payment", "paid", "packed", "shipped", "delivered", "cancelled"]
    board: dict = {}
    for s in statuses:
        orders = await col("orders").find({"status": s}).sort("created_at", -1).to_list(50)
        board[s] = [_ser(o) for o in orders]
    return board


@router.get("/inventory-to-grade")
async def inventory_to_grade(admin: dict = Depends(require_admin)):
    """Accepted pickups that haven't been graded yet."""
    pickups = await col("pickups").find({"status": "accepted"}).to_list(100)
    result = []
    for p in pickups:
        graded_count = await col("inventory").count_documents({"pickup_id": str(p["_id"])})
        p["id"] = str(p.pop("_id"))
        p["graded_count"] = graded_count
        result.append(p)
    return result


@router.get("/pricing")
async def get_pricing(admin: dict = Depends(require_admin)):
    doc = await col("pricing_settings").find_one({"_id": "global"})
    if not doc:
        return {
            "handling_fee": 20,
            "ops_fee_pct": get_settings().sponsorship_ops_fee_pct,
            "book_price_per_condition": {
                "like_new": 50,
                "good": 35,
                "usable": 20,
            },
            "kabadiwala_rate_per_book": 8,
        }
    doc.pop("_id", None)
    return doc


@router.put("/pricing")
async def update_pricing(body: dict, admin: dict = Depends(require_admin)):
    await col("pricing_settings").replace_one(
        {"_id": "global"},
        {"_id": "global", **body, "updated_at": datetime.utcnow()},
        upsert=True,
    )
    return {"message": "Pricing updated"}


@router.get("/disputes")
async def list_disputes(admin: dict = Depends(require_admin)):
    disputes = await col("disputes").find({}).sort("created_at", -1).to_list(100)
    return [_ser(d) for d in disputes]


@router.post("/disputes")
async def raise_dispute(
    reference_id: str,
    reference_type: str,
    description: str,
    user: dict = Depends(require_admin),
):
    doc = {
        "reference_id": reference_id,
        "reference_type": reference_type,
        "description": description,
        "raised_by": user["_id"],
        "status": "open",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    result = await col("disputes").insert_one(doc)
    return {"id": str(result.inserted_id)}


@router.patch("/disputes/{dispute_id}/resolve")
async def resolve_dispute(dispute_id: str, resolution: str, admin: dict = Depends(require_admin)):
    await col("disputes").update_one(
        {"_id": ObjectId(dispute_id)},
        {"$set": {
            "status": "resolved",
            "resolution": resolution,
            "resolved_by": admin["_id"],
            "updated_at": datetime.utcnow(),
        }},
    )
    return {"message": "Dispute resolved"}


@router.get("/donor-listings")
async def donor_listings_queue(admin: dict = Depends(require_admin)):
    listings = await col("donor_listings").find({"status": "pending"}).sort("created_at", 1).to_list(100)
    return [_ser(l) for l in listings]
