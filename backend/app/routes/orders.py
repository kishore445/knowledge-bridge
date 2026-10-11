"""School orders with Razorpay and 30-min reservation."""
import asyncio
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from bson import ObjectId

from ..models import OrderCreate, OrderStatus, PriceBreakdown
from ..database import col
from ..deps import get_current_user, require_school, require_admin
from ..services.payment_service import create_razorpay_order, verify_razorpay_payment
from ..services.delivery_service import get_quote, books_to_weight
from ..services.email_service import notify_order_shipped

router = APIRouter(prefix="/orders", tags=["orders"])

RESERVATION_MINUTES = 30


def _ser(doc):
    if doc:
        doc["id"] = str(doc.pop("_id"))
    return doc


async def _reserve_items(inventory_ids: list[str]):
    """Mark items as reserved for 30 minutes."""
    expires = datetime.utcnow() + timedelta(minutes=RESERVATION_MINUTES)
    await col("inventory").update_many(
        {"_id": {"$in": [ObjectId(i) for i in inventory_ids]}, "status": "in_stock"},
        {"$set": {"status": "reserved", "reserved_until": expires}},
    )


async def _release_expired_reservations():
    """Release any inventory where reservation window has passed unpaid."""
    now = datetime.utcnow()
    await col("inventory").update_many(
        {"status": "reserved", "reserved_until": {"$lt": now}},
        {"$set": {"status": "in_stock", "reserved_until": None}},
    )


async def _auto_release_after_delay(order_id: str, inventory_ids: list[str]):
    await asyncio.sleep(RESERVATION_MINUTES * 60)
    # Check if order is still unpaid
    order = await col("orders").find_one({"_id": ObjectId(order_id)})
    if order and order.get("status") == "pending_payment":
        # Cancel order and release items
        await col("orders").update_one(
            {"_id": ObjectId(order_id)},
            {"$set": {"status": "cancelled", "updated_at": datetime.utcnow()}},
        )
        await col("inventory").update_many(
            {"_id": {"$in": [ObjectId(i) for i in inventory_ids]}},
            {"$set": {"status": "in_stock", "reserved_until": None}},
        )


@router.post("/quote")
async def delivery_quote(
    from_pin: str,
    to_pin: str,
    book_count: int,
):
    weight = books_to_weight(book_count)
    return get_quote(from_pin, to_pin, weight)


@router.post("/")
async def create_order(
    body: OrderCreate,
    background: BackgroundTasks,
    user: dict = Depends(get_current_user),
):
    await _release_expired_reservations()

    # Validate all items are in_stock and exist
    item_ids = [i.inventory_id for i in body.items]
    items_in_db = await col("inventory").find(
        {"_id": {"$in": [ObjectId(i) for i in item_ids]}, "status": "in_stock"}
    ).to_list(len(item_ids))

    if len(items_in_db) != len(item_ids):
        raise HTTPException(409, "One or more books are no longer available")

    # Enforce: school orders must only use donate-lane items
    if body.school_id:
        non_donate = [i for i in items_in_db if i.get("lane") != "donate"]
        if non_donate:
            raise HTTPException(400, "School orders can only include donate-lane books")

    total = body.price_breakdown.book_cost + body.price_breakdown.handling + body.price_breakdown.delivery

    # Create Razorpay order
    receipt = f"kb_{str(ObjectId())[:10]}"
    rp_order = create_razorpay_order(total, receipt, {"user_id": user["_id"]})

    doc = {
        "items": [i.model_dump() for i in body.items],
        "price_breakdown": body.price_breakdown.model_dump(),
        "school_id": body.school_id,
        "buyer_id": body.buyer_id or user["_id"],
        "delivery_pincode": body.delivery_pincode,
        "notes": body.notes,
        "status": "pending_payment",
        "razorpay_order_id": rp_order.get("id"),
        "razorpay_payment_id": None,
        "sponsorship_id": None,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    result = await col("orders").insert_one(doc)
    order_id = str(result.inserted_id)

    # Reserve inventory
    await _reserve_items(item_ids)

    # Auto-release after 30 min in background
    background.add_task(_auto_release_after_delay, order_id, item_ids)

    return {
        "order_id": order_id,
        "razorpay_order_id": rp_order.get("id"),
        "amount": total,
        "price_breakdown": body.price_breakdown.model_dump(),
    }


@router.post("/{order_id}/confirm-payment")
async def confirm_payment(
    order_id: str,
    razorpay_payment_id: str,
    razorpay_signature: str,
    user: dict = Depends(get_current_user),
):
    order = await col("orders").find_one({"_id": ObjectId(order_id)})
    if not order:
        raise HTTPException(404, "Order not found")
    if order["status"] != "pending_payment":
        raise HTTPException(400, "Order is not awaiting payment")

    verified = verify_razorpay_payment(
        order["razorpay_order_id"], razorpay_payment_id, razorpay_signature
    )
    if not verified:
        raise HTTPException(400, "Payment signature verification failed")

    item_ids = [i["inventory_id"] for i in order["items"]]
    await col("inventory").update_many(
        {"_id": {"$in": [ObjectId(i) for i in item_ids]}},
        {"$set": {"status": "reserved", "reserved_until": None}},
    )
    await col("orders").update_one(
        {"_id": ObjectId(order_id)},
        {"$set": {
            "status": "paid",
            "razorpay_payment_id": razorpay_payment_id,
            "updated_at": datetime.utcnow(),
        }},
    )
    # Record payment
    bd = order.get("price_breakdown", {})
    order_total = bd.get("book_cost", 0) + bd.get("handling", 0) + bd.get("delivery", 0)
    await col("payments").insert_one({
        "razorpay_order_id": order["razorpay_order_id"],
        "razorpay_payment_id": razorpay_payment_id,
        "razorpay_signature": razorpay_signature,
        "amount": order_total,
        "currency": "INR",
        "purpose": "school_order",
        "reference_id": order_id,
        "user_id": user["_id"],
        "verified": True,
        "created_at": datetime.utcnow(),
    })
    return {"message": "Payment confirmed", "status": "paid"}


@router.get("/my")
async def my_orders(user: dict = Depends(get_current_user)):
    query: dict = {}
    if user["role"] == "school":
        school = await col("schools").find_one({"user_id": user["_id"]})
        if school:
            query["school_id"] = str(school["_id"])
    else:
        query["buyer_id"] = user["_id"]
    cursor = col("orders").find(query).sort("created_at", -1)
    orders = await cursor.to_list(100)
    return [_ser(o) for o in orders]


@router.get("/{order_id}")
async def get_order(order_id: str, user: dict = Depends(get_current_user)):
    order = await col("orders").find_one({"_id": ObjectId(order_id)})
    if not order:
        raise HTTPException(404, "Order not found")
    return _ser(order)


# Admin status transitions
@router.patch("/{order_id}/status")
async def update_order_status(
    order_id: str,
    new_status: str,
    admin: dict = Depends(require_admin),
):
    valid = {"packed", "shipped", "delivered", "cancelled"}
    if new_status not in valid:
        raise HTTPException(400, f"Status must be one of {valid}")
    update: dict = {"status": new_status, "updated_at": datetime.utcnow()}
    if new_status == "delivered":
        item_ids_raw = (await col("orders").find_one({"_id": ObjectId(order_id)}) or {}).get("items", [])
        item_ids = [i["inventory_id"] for i in item_ids_raw]
        await col("inventory").update_many(
            {"_id": {"$in": [ObjectId(i) for i in item_ids]}},
            {"$set": {"status": "delivered"}},
        )
    await col("orders").update_one({"_id": ObjectId(order_id)}, {"$set": update})
    return {"message": f"Order status set to {new_status}"}
