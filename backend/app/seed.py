"""Seed database with sample data for development."""
import asyncio
from datetime import datetime
from bson import ObjectId
from .database import col, get_client
from .config import get_settings


async def seed():
    print("Seeding database...")

    # Clear existing seed data
    for c in ["users", "schools", "kabadiwalas", "inventory", "pickups",
              "sponsorships", "donor_listings", "pending_otps"]:
        await col(c).delete_many({"_seed": True})

    # --- Users ---
    admin_id = ObjectId()
    school1_uid = ObjectId()
    school2_uid = ObjectId()
    school3_uid = ObjectId()
    kb1_uid = ObjectId()
    kb2_uid = ObjectId()
    donor1_uid = ObjectId()
    sponsor1_uid = ObjectId()
    sponsor2_uid = ObjectId()

    users = [
        {"_id": admin_id, "role": "admin", "name": "Priya Admin", "email": "admin@kb.dev", "phone": "+910000000001", "city": "Hyderabad", "area": "Banjara Hills", "_seed": True},
        {"_id": school1_uid, "role": "school", "name": "Mrs. Lakshmi Devi", "email": "lakshmi@school1.edu", "phone": "+910000000010", "city": "Hyderabad", "area": "Kukatpally", "_seed": True},
        {"_id": school2_uid, "role": "school", "name": "Mr. Ravi Kumar", "email": "ravi@school2.edu", "phone": "+910000000011", "city": "Hyderabad", "area": "LB Nagar", "_seed": True},
        {"_id": school3_uid, "role": "school", "name": "Ms. Fatima Begum", "email": "fatima@school3.edu", "phone": "+910000000012", "city": "Hyderabad", "area": "Secunderabad", "_seed": True},
        {"_id": kb1_uid, "role": "kabadiwala", "name": "Ramesh Scrap", "phone": "+910000000020", "city": "Hyderabad", "area": "Ameerpet", "_seed": True},
        {"_id": kb2_uid, "role": "kabadiwala", "name": "Suresh Books", "phone": "+910000000021", "city": "Hyderabad", "area": "Dilsukhnagar", "_seed": True},
        {"_id": donor1_uid, "role": "donor", "name": "Ananya Reddy", "email": "ananya@donor.dev", "phone": "+910000000030", "city": "Hyderabad", "area": "Jubilee Hills", "_seed": True},
        {"_id": sponsor1_uid, "role": "sponsor", "name": "TechCorp Foundation", "email": "csr@techcorp.dev", "phone": "+910000000040", "city": "Hyderabad", "area": "HITEC City", "_seed": True},
        {"_id": sponsor2_uid, "role": "sponsor", "name": "Anonymous Giver", "email": "anon@sponsor.dev", "phone": "+910000000041", "city": "Hyderabad", "area": "Secunderabad", "_seed": True},
    ]
    await col("users").insert_many(users)

    # --- Schools ---
    school1_id = ObjectId()
    school2_id = ObjectId()
    school3_id = ObjectId()

    schools = [
        {
            "_id": school1_id, "udise": "36150100201", "name": "Govt High School Kukatpally",
            "address": "Plot 12, Phase 3, Kukatpally, Hyderabad", "district": "Hyderabad",
            "headmaster_name": "M. Satyanarayana", "user_id": str(school1_uid),
            "verified_status": "verified", "email": "ghsk@school.gov.in",
            "created_at": datetime.utcnow(), "updated_at": datetime.utcnow(), "_seed": True,
        },
        {
            "_id": school2_id, "udise": "36152200102", "name": "ZP High School LB Nagar",
            "address": "Road No. 5, LB Nagar, Hyderabad", "district": "Rangareddy",
            "headmaster_name": "K. Rajeshwar", "user_id": str(school2_uid),
            "verified_status": "verified", "email": "zphs@school.gov.in",
            "created_at": datetime.utcnow(), "updated_at": datetime.utcnow(), "_seed": True,
        },
        {
            "_id": school3_id, "udise": "36150300303", "name": "Govt Boys School Secunderabad",
            "address": "MG Road, Secunderabad, Hyderabad", "district": "Hyderabad",
            "headmaster_name": "P. Nagamani", "user_id": str(school3_uid),
            "verified_status": "pending", "email": "gbss@school.gov.in",
            "created_at": datetime.utcnow(), "updated_at": datetime.utcnow(), "_seed": True,
        },
    ]
    await col("schools").insert_many(schools)

    # --- Kabadiwalas ---
    kb1_id = ObjectId()
    kb2_id = ObjectId()
    await col("kabadiwalas").insert_many([
        {"_id": kb1_id, "user_id": str(kb1_uid), "area": "Ameerpet", "trust_score": 0.95,
         "upi_id": "ramesh@upi", "total_pickups": 20, "accepted_pickups": 19,
         "created_at": datetime.utcnow(), "updated_at": datetime.utcnow(), "_seed": True},
        {"_id": kb2_id, "user_id": str(kb2_uid), "area": "Dilsukhnagar", "trust_score": 0.80,
         "upi_id": "suresh@upi", "total_pickups": 10, "accepted_pickups": 8,
         "created_at": datetime.utcnow(), "updated_at": datetime.utcnow(), "_seed": True},
    ])

    # --- Inventory (30 items) ---
    boards = ["SCERT", "CBSE", "CBSE", "SCERT"]
    classes = ["6", "7", "8", "9", "10"]
    subjects = ["Mathematics", "Science", "Social Studies", "English", "Telugu", "Hindi"]
    conditions = ["like_new", "good", "usable"]

    inventory_docs = []
    for i in range(30):
        govt = i < 5  # first 5 are govt-issued
        lane = "donate" if (govt or i < 18) else "resale"
        inventory_docs.append({
            "_id": ObjectId(),
            "source_type": "kabadiwala",
            "source_id": str(kb1_id) if i % 2 == 0 else str(kb2_id),
            "book_class": classes[i % 5],
            "board": boards[i % 4],
            "subject": subjects[i % 6],
            "edition_year": 2018 + (i % 5),
            "condition": conditions[i % 3],
            "govt_issued": govt,
            "lane": lane,
            "status": "in_stock",
            "graded_by": str(admin_id),
            "reserved_until": None,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "_seed": True,
        })
    await col("inventory").insert_many(inventory_docs)

    # --- Sponsorships ---
    await col("sponsorships").insert_many([
        {
            "_id": ObjectId(), "sponsor_id": str(sponsor1_uid), "tier": "classroom",
            "amount": 1200.0, "ops_fee": 128.57, "target_school_id": str(school1_id),
            "district": "Hyderabad", "anonymous": False, "fulfilled": True,
            "message": "Education is the best investment.",
            "order_ids": [], "created_at": datetime.utcnow(), "updated_at": datetime.utcnow(), "_seed": True,
        },
        {
            "_id": ObjectId(), "sponsor_id": str(sponsor2_uid), "tier": "student",
            "amount": 350.0, "ops_fee": 37.5, "target_school_id": str(school2_id),
            "district": "Rangareddy", "anonymous": True, "fulfilled": True,
            "message": "",
            "order_ids": [], "created_at": datetime.utcnow(), "updated_at": datetime.utcnow(), "_seed": True,
        },
    ])

    print("Seed complete!")
    print("Dev users (use MOCK_OTP=true, any 6-digit OTP):")
    print("  Admin:    admin@kb.dev")
    print("  School:   lakshmi@school1.edu")
    print("  Kabadiwala: +910000000020")
    print("  Donor:    ananya@donor.dev")
    print("  Sponsor:  csr@techcorp.dev")


if __name__ == "__main__":
    asyncio.run(seed())
