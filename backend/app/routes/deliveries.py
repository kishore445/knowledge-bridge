"""Delivery confirmation by school + photo."""
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId

from ..models import DeliveryCreate
from ..database import col
from ..deps import get_current_user, require_school, require_admin
from ..services.storage_service import presigned_upload_url

router = APIRouter(prefix="/deliveries", tags=["deliveries"])


def _ser(doc):
    if doc:
        doc["id"] = str(doc.pop("_id"))
    return doc


@router.get("/upload-url")
async def delivery_photo_upload_url(order_id: str, user: dict = Depends(require_admin)):
    return presigned_upload_url(f"deliveries/{order_id}")


@router.post("/")
async def confirm_delivery(body: DeliveryCreate, user: dict = Depends(require_admin)):
    order = await col("orders").find_one({"_id": ObjectId(body.order_id)})
    if not order:
        raise HTTPException(404, "Order not found")

    doc = {
        "order_id": body.order_id,
        "photo_url": body.photo_url,
        "headmaster_confirmed": body.headmaster_confirmed,
        "delivered_at": datetime.utcnow() if body.headmaster_confirmed else None,
        "confirmed_by": None,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    result = await col("deliveries").insert_one(doc)

    if body.headmaster_confirmed:
        # Update order status
        await col("orders").update_one(
            {"_id": ObjectId(body.order_id)},
            {"$set": {"status": "delivered", "updated_at": datetime.utcnow()}},
        )
        # Mark inventory as delivered
        item_ids = [i["inventory_id"] for i in order.get("items", [])]
        if item_ids:
            await col("inventory").update_many(
                {"_id": {"$in": [ObjectId(i) for i in item_ids]}},
                {"$set": {"status": "delivered", "updated_at": datetime.utcnow()}},
            )

    return {"id": str(result.inserted_id), "message": "Delivery recorded"}


@router.post("/{delivery_id}/school-confirm")
async def school_confirm(delivery_id: str, user: dict = Depends(require_school)):
    delivery = await col("deliveries").find_one({"_id": ObjectId(delivery_id)})
    if not delivery:
        raise HTTPException(404, "Delivery not found")

    await col("deliveries").update_one(
        {"_id": ObjectId(delivery_id)},
        {"$set": {
            "headmaster_confirmed": True,
            "confirmed_by": user["_id"],
            "delivered_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }},
    )
    # Update order
    await col("orders").update_one(
        {"_id": ObjectId(delivery["order_id"])},
        {"$set": {"status": "delivered", "updated_at": datetime.utcnow()}},
    )
    return {"message": "Delivery confirmed by school"}


@router.get("/")
async def list_deliveries(school_id: str = "", admin: dict = Depends(require_admin)):
    query: dict = {}
    if school_id:
        order_ids_cursor = col("orders").find({"school_id": school_id}, {"_id": 1})
        order_ids = [str(o["_id"]) async for o in order_ids_cursor]
        query["order_id"] = {"$in": order_ids}
    cursor = col("deliveries").find(query).sort("created_at", -1)
    items = await cursor.to_list(100)
    return [_ser(i) for i in items]
