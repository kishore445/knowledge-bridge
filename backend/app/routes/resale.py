"""Resale listings and buyer checkout."""
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends, Query
from bson import ObjectId

from ..models import ListingCreate
from ..database import col
from ..deps import get_current_user, require_admin

router = APIRouter(prefix="/resale", tags=["resale"])


def _ser(doc):
    if doc:
        doc["id"] = str(doc.pop("_id"))
    return doc


@router.post("/listings")
async def create_listing(body: ListingCreate, admin: dict = Depends(require_admin)):
    """Admin creates a resale listing from in_stock, resale-lane inventory."""
    items = await col("inventory").find(
        {
            "_id": {"$in": [ObjectId(i) for i in body.inventory_ids]},
            "lane": "resale",
            "status": "in_stock",
            "govt_issued": False,  # double-check even though lane enforces it
        }
    ).to_list(len(body.inventory_ids))

    if len(items) != len(body.inventory_ids):
        raise HTTPException(400, "Some books are not available for resale or are govt-issued")

    doc = {
        "inventory_ids": body.inventory_ids,
        "price": body.price,
        "title": body.title,
        "description": body.description,
        "active": True,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    result = await col("listings").insert_one(doc)
    return {"id": str(result.inserted_id)}


@router.get("/listings")
async def browse_listings(
    book_class: str = "",
    board: str = "",
    subject: str = "",
    skip: int = 0,
    limit: int = 40,
):
    pipeline = [
        {"$match": {"active": True}},
        {"$lookup": {
            "from": "inventory",
            "localField": "inventory_ids",
            "foreignField": "_id_str",  # we'll do a manual approach below
            "as": "_books",
        }},
        {"$skip": skip},
        {"$limit": limit},
    ]
    # Simple approach: fetch listings and enrich
    query: dict = {"active": True}
    cursor = col("listings").find(query).skip(skip).limit(limit)
    listings = await cursor.to_list(limit)

    for listing in listings:
        listing["id"] = str(listing.pop("_id"))
        inv_ids = [ObjectId(i) for i in listing.get("inventory_ids", [])]
        books = await col("inventory").find({"_id": {"$in": inv_ids}}).to_list(len(inv_ids))
        # Apply filters
        if book_class and not any(b.get("book_class") == book_class for b in books):
            continue
        if board and not any(b.get("board") == board for b in books):
            continue
        if subject and not any(b.get("subject") == subject for b in books):
            continue
        listing["books"] = [_ser(b) for b in books]

    return listings


@router.get("/listings/{listing_id}")
async def get_listing(listing_id: str):
    listing = await col("listings").find_one({"_id": ObjectId(listing_id)})
    if not listing:
        raise HTTPException(404, "Listing not found")
    listing["id"] = str(listing.pop("_id"))
    inv_ids = [ObjectId(i) for i in listing.get("inventory_ids", [])]
    books = await col("inventory").find({"_id": {"$in": inv_ids}}).to_list(len(inv_ids))
    listing["books"] = [_ser(b) for b in books]
    return listing


@router.delete("/listings/{listing_id}")
async def remove_listing(listing_id: str, admin: dict = Depends(require_admin)):
    await col("listings").update_one(
        {"_id": ObjectId(listing_id)},
        {"$set": {"active": False, "updated_at": datetime.utcnow()}},
    )
    return {"message": "Listing deactivated"}
