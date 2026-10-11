"""Inventory grading and management."""
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends, Query
from bson import ObjectId

from ..models import InventoryCreate, InventoryInDB, InventoryGrade, Lane
from ..database import col
from ..deps import get_current_user, require_admin

router = APIRouter(prefix="/inventory", tags=["inventory"])


def _ser(doc):
    if doc:
        doc["id"] = str(doc.pop("_id"))
    return doc


@router.post("/grade")
async def grade_book(
    pickup_id: str,
    grade: InventoryGrade,
    admin: dict = Depends(require_admin),
):
    """Admin grades a book from a pickup into inventory."""
    # RULE: govt-issued books can NEVER enter resale lane
    if grade.govt_issued and grade.lane == Lane.resale:
        raise HTTPException(
            400,
            "Government-issued books cannot be placed in the resale lane.",
        )
    pickup = await col("pickups").find_one({"_id": ObjectId(pickup_id)})
    if not pickup:
        raise HTTPException(404, "Pickup not found")
    if pickup.get("status") != "accepted":
        raise HTTPException(400, "Pickup must be accepted before grading")

    doc = {
        "source_type": "kabadiwala",
        "source_id": pickup["kabadiwala_id"],
        "pickup_id": pickup_id,
        "book_class": grade.book_class,
        "board": grade.board,
        "subject": grade.subject,
        "edition_year": grade.edition_year,
        "condition": grade.condition.value,
        "govt_issued": grade.govt_issued,
        "lane": grade.lane.value,
        "status": "in_stock",
        "graded_by": admin["_id"],
        "reserved_until": None,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    result = await col("inventory").insert_one(doc)
    return {"id": str(result.inserted_id), "lane": grade.lane.value}


@router.post("/from-donor")
async def add_donor_book(
    listing_id: str,
    grade: InventoryGrade,
    admin: dict = Depends(require_admin),
):
    """Admin grades a book from a donor listing into inventory."""
    if grade.govt_issued and grade.lane == Lane.resale:
        raise HTTPException(400, "Government-issued books cannot enter the resale lane.")
    listing = await col("donor_listings").find_one({"_id": ObjectId(listing_id)})
    if not listing:
        raise HTTPException(404, "Donor listing not found")

    doc = {
        "source_type": "donor",
        "source_id": listing["donor_id"],
        "listing_id": listing_id,
        "book_class": grade.book_class,
        "board": grade.board,
        "subject": grade.subject,
        "edition_year": grade.edition_year,
        "condition": grade.condition.value,
        "govt_issued": grade.govt_issued,
        "lane": grade.lane.value,
        "status": "in_stock",
        "graded_by": admin["_id"],
        "reserved_until": None,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    result = await col("inventory").insert_one(doc)
    await col("donor_listings").update_one(
        {"_id": ObjectId(listing_id)},
        {"$set": {"status": "collected", "inventory_id": str(result.inserted_id)}},
    )
    return {"id": str(result.inserted_id)}


@router.get("/")
async def list_inventory(
    lane: str = "",
    book_class: str = "",
    board: str = "",
    subject: str = "",
    in_stock_only: bool = True,
    skip: int = 0,
    limit: int = 50,
):
    query: dict = {}
    if lane:
        query["lane"] = lane
    if book_class:
        query["book_class"] = book_class
    if board:
        query["board"] = board
    if subject:
        query["subject"] = subject
    if in_stock_only:
        query["status"] = "in_stock"
    cursor = col("inventory").find(query).skip(skip).limit(limit)
    items = await cursor.to_list(limit)
    return [_ser(i) for i in items]


@router.get("/{item_id}")
async def get_item(item_id: str):
    item = await col("inventory").find_one({"_id": ObjectId(item_id)})
    if not item:
        raise HTTPException(404, "Item not found")
    return _ser(item)
