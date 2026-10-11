"""Sponsorships — pay for a school's order."""
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId

from ..models import SponsorshipCreate, SponsorshipTier
from ..database import col
from ..deps import get_current_user, require_sponsor
from ..services.payment_service import create_razorpay_order, verify_razorpay_payment
from ..services.email_service import notify_sponsorship_cert
from ..config import get_settings

router = APIRouter(prefix="/sponsorships", tags=["sponsorships"])


def _ser(doc):
    if doc:
        doc["id"] = str(doc.pop("_id"))
    return doc


@router.post("/")
async def create_sponsorship(
    body: SponsorshipCreate,
    order_id: str,
    user: dict = Depends(get_current_user),
):
    """Sponsor pays for an existing school order. Adds an ops fee shown openly."""
    settings = get_settings()
    order = await col("orders").find_one({"_id": ObjectId(order_id)})
    if not order:
        raise HTTPException(404, "Order not found")
    if order.get("sponsorship_id"):
        raise HTTPException(409, "Order already has a sponsor")

    breakdown = order["price_breakdown"]
    book_total = sum(breakdown.values())
    ops_fee = round(book_total * settings.sponsorship_ops_fee_pct / 100, 2)
    total = round(book_total + ops_fee, 2)

    receipt = f"sp_{str(ObjectId())[:10]}"
    rp_order = create_razorpay_order(total, receipt, {"order_id": order_id})

    doc = {
        "sponsor_id": user["_id"],
        "tier": body.tier.value,
        "amount": total,
        "ops_fee": ops_fee,
        "target_school_id": body.target_school_id,
        "district": body.district,
        "anonymous": body.anonymous,
        "message": body.message,
        "order_ids": [order_id],
        "fulfilled": False,
        "razorpay_order_id": rp_order.get("id"),
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    result = await col("sponsorships").insert_one(doc)
    sp_id = str(result.inserted_id)

    await col("orders").update_one(
        {"_id": ObjectId(order_id)},
        {"$set": {"sponsorship_id": sp_id}},
    )
    return {
        "sponsorship_id": sp_id,
        "razorpay_order_id": rp_order.get("id"),
        "amount": total,
        "book_cost": book_total,
        "ops_fee": ops_fee,
        "ops_fee_pct": settings.sponsorship_ops_fee_pct,
    }


@router.post("/{sp_id}/confirm-payment")
async def confirm_payment(
    sp_id: str,
    razorpay_payment_id: str,
    razorpay_signature: str,
    user: dict = Depends(get_current_user),
):
    sp = await col("sponsorships").find_one({"_id": ObjectId(sp_id)})
    if not sp:
        raise HTTPException(404, "Sponsorship not found")

    verified = verify_razorpay_payment(
        sp["razorpay_order_id"], razorpay_payment_id, razorpay_signature
    )
    if not verified:
        raise HTTPException(400, "Payment signature verification failed")

    await col("sponsorships").update_one(
        {"_id": ObjectId(sp_id)},
        {"$set": {"fulfilled": True, "updated_at": datetime.utcnow()}},
    )
    # Mark linked orders as paid
    for oid in sp["order_ids"]:
        await col("orders").update_one(
            {"_id": ObjectId(oid)},
            {"$set": {"status": "paid", "updated_at": datetime.utcnow()}},
        )
    # Notify sponsor
    if user.get("email"):
        school_name = "the school"
        if sp.get("target_school_id"):
            school_doc = await col("schools").find_one({"_id": ObjectId(sp["target_school_id"])})
            if school_doc:
                school_name = school_doc["name"]
        await notify_sponsorship_cert(user["email"], school_name)

    return {"message": "Sponsorship confirmed"}


@router.get("/my")
async def my_sponsorships(user: dict = Depends(get_current_user)):
    cursor = col("sponsorships").find({"sponsor_id": user["_id"]}).sort("created_at", -1)
    items = await cursor.to_list(100)
    return [_ser(i) for i in items]


@router.get("/public")
async def public_sponsorships(district: str = "", limit: int = 20):
    query: dict = {"fulfilled": True}
    if district:
        query["district"] = district
    pipeline = [
        {"$match": query},
        {"$lookup": {
            "from": "users",
            "localField": "sponsor_id",
            "foreignField": "_id",
            "as": "sponsor",
        }},
        {"$project": {
            "tier": 1, "amount": 1, "district": 1, "anonymous": 1,
            "message": 1, "created_at": 1,
            "sponsor_name": {
                "$cond": [
                    "$anonymous",
                    "Anonymous",
                    {"$arrayElemAt": ["$sponsor.name", 0]},
                ]
            },
        }},
        {"$sort": {"created_at": -1}},
        {"$limit": limit},
    ]
    items = await col("sponsorships").aggregate(pipeline).to_list(limit)
    for i in items:
        i["id"] = str(i.pop("_id"))
    return items
