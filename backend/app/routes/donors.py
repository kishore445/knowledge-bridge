"""Donor listings and impact."""
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId

from ..models import DonorListingCreate
from ..database import col
from ..deps import get_current_user, require_donor
from ..services.storage_service import presigned_upload_url

router = APIRouter(prefix="/donors", tags=["donors"])


def _ser(doc):
    if doc:
        doc["id"] = str(doc.pop("_id"))
    return doc


@router.post("/listings")
async def create_listing(body: DonorListingCreate, user: dict = Depends(require_donor)):
    doc = body.model_dump()
    doc["donor_id"] = user["_id"]
    doc["photos"] = []
    doc["status"] = "pending"
    doc["inventory_id"] = None
    doc["created_at"] = datetime.utcnow()
    doc["updated_at"] = datetime.utcnow()
    result = await col("donor_listings").insert_one(doc)
    return {"id": str(result.inserted_id), "message": "Listing created. We will contact you for pickup."}


@router.get("/listings/upload-url")
async def upload_url(listing_id: str, user: dict = Depends(require_donor)):
    return presigned_upload_url(f"donor_listings/{listing_id}")


@router.post("/listings/{listing_id}/add-photo")
async def add_photo(listing_id: str, photo_url: str, user: dict = Depends(require_donor)):
    listing = await col("donor_listings").find_one({"_id": ObjectId(listing_id)})
    if not listing:
        raise HTTPException(404, "Listing not found")
    if listing["donor_id"] != user["_id"]:
        raise HTTPException(403, "Not your listing")
    await col("donor_listings").update_one(
        {"_id": ObjectId(listing_id)},
        {"$push": {"photos": photo_url}, "$set": {"updated_at": datetime.utcnow()}},
    )
    return {"message": "Photo added"}


@router.get("/listings")
async def my_listings(user: dict = Depends(require_donor)):
    cursor = col("donor_listings").find({"donor_id": user["_id"]}).sort("created_at", -1)
    items = await cursor.to_list(100)
    return [_ser(i) for i in items]


@router.get("/impact")
async def my_impact(user: dict = Depends(require_donor)):
    """Show donor how many books were delivered and to which schools."""
    listings = await col("donor_listings").find(
        {"donor_id": user["_id"], "status": "collected"}
    ).to_list(200)
    inv_ids = [l["inventory_id"] for l in listings if l.get("inventory_id")]
    if not inv_ids:
        return {"books_donated": 0, "schools_reached": [], "deliveries": []}

    delivered = await col("inventory").find(
        {"_id": {"$in": [ObjectId(i) for i in inv_ids]}, "status": "delivered"}
    ).to_list(200)

    # Trace back to which school orders
    school_ids: set = set()
    for item in delivered:
        order = await col("orders").find_one({"items.inventory_id": str(item["_id"])})
        if order and order.get("school_id"):
            school_ids.add(order["school_id"])

    schools = []
    for sid in school_ids:
        s = await col("schools").find_one({"_id": ObjectId(sid)})
        if s:
            schools.append({"id": str(s["_id"]), "name": s["name"], "district": s.get("district")})

    return {
        "books_donated": len(listings),
        "books_delivered": len(delivered),
        "schools_reached": schools,
    }


@router.delete("/listings/{listing_id}")
async def cancel_listing(listing_id: str, user: dict = Depends(require_donor)):
    listing = await col("donor_listings").find_one({"_id": ObjectId(listing_id)})
    if not listing:
        raise HTTPException(404, "Listing not found")
    if listing["donor_id"] != user["_id"]:
        raise HTTPException(403, "Not your listing")
    if listing["status"] == "collected":
        raise HTTPException(400, "Book already collected, cannot cancel")
    await col("donor_listings").update_one(
        {"_id": ObjectId(listing_id)},
        {"$set": {"status": "cancelled", "updated_at": datetime.utcnow()}},
    )
    return {"message": "Listing cancelled"}
