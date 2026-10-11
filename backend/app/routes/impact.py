"""Public impact dashboard data."""
from fastapi import APIRouter, Query
from bson import ObjectId
from ..database import col

router = APIRouter(prefix="/impact", tags=["impact"])


@router.get("/stats")
async def global_stats():
    """Totals: books delivered, schools reached, students served."""
    books_delivered = await col("inventory").count_documents({"status": "delivered"})
    schools_reached = await col("orders").distinct(
        "school_id", {"status": "delivered", "school_id": {"$ne": None}}
    )
    deliveries = await col("deliveries").count_documents({"headmaster_confirmed": True})

    return {
        "books_delivered": books_delivered,
        "schools_reached": len(schools_reached),
        "confirmed_deliveries": deliveries,
    }


@router.get("/feed")
async def impact_feed(
    district: str = "",
    school_id: str = "",
    sponsor_id: str = "",
    limit: int = 20,
):
    """Feed of sponsor → books → school → delivery photo."""
    match: dict = {"headmaster_confirmed": True}

    pipeline = [
        {"$match": match},
        {"$lookup": {
            "from": "orders",
            "localField": "order_id",
            "foreignField": "_id_str",
            "as": "_order",
        }},
        {"$sort": {"delivered_at": -1}},
        {"$limit": limit},
    ]

    # Simpler flat approach
    deliveries = await col("deliveries").find({"headmaster_confirmed": True}).sort("delivered_at", -1).to_list(limit)

    feed = []
    for d in deliveries:
        order = await col("orders").find_one({"_id": ObjectId(d["order_id"])})
        if not order:
            continue
        if school_id and order.get("school_id") != school_id:
            continue

        school = None
        if order.get("school_id"):
            s = await col("schools").find_one({"_id": ObjectId(order["school_id"])})
            if s:
                if district and s.get("district") != district:
                    continue
                school = {"name": s["name"], "district": s.get("district"), "id": str(s["_id"])}

        sponsor_info = None
        if order.get("sponsorship_id"):
            sp = await col("sponsorships").find_one({"_id": ObjectId(order["sponsorship_id"])})
            if sp:
                if sponsor_id and sp.get("sponsor_id") != sponsor_id:
                    continue
                name = "Anonymous" if sp.get("anonymous") else None
                if not name:
                    u = await col("users").find_one({"_id": ObjectId(sp["sponsor_id"])})
                    name = u["name"] if u else "Sponsor"
                sponsor_info = {
                    "name": name,
                    "tier": sp.get("tier"),
                    "message": sp.get("message"),
                    "anonymous": sp.get("anonymous", False),
                }

        feed.append({
            "delivery_id": str(d["_id"]),
            "photo_url": d.get("photo_url"),
            "delivered_at": d.get("delivered_at"),
            "school": school,
            "sponsor": sponsor_info,
            "book_count": len(order.get("items", [])),
        })

    return feed


@router.get("/districts")
async def list_districts():
    districts = await col("schools").distinct("district", {"verified_status": "verified"})
    return sorted(districts)
