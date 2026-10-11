"""All Pydantic models for Knowledge Bridge."""
from __future__ import annotations
from datetime import datetime
from enum import Enum
from typing import Any, Optional
from pydantic import BaseModel, Field, field_validator
from bson import ObjectId


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

class PyObjectId(str):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if isinstance(v, ObjectId):
            return str(v)
        if ObjectId.is_valid(str(v)):
            return str(v)
        raise ValueError(f"Invalid ObjectId: {v}")

    @classmethod
    def __get_pydantic_core_schema__(cls, source_type, handler):
        from pydantic_core import core_schema
        return core_schema.no_info_plain_validator_function(cls.validate)


def now() -> datetime:
    return datetime.utcnow()


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

class UserRole(str, Enum):
    donor = "donor"
    kabadiwala = "kabadiwala"
    school = "school"
    student = "student"
    buyer = "buyer"
    sponsor = "sponsor"
    admin = "admin"


class VerifiedStatus(str, Enum):
    pending = "pending"
    verified = "verified"
    rejected = "rejected"


class Condition(str, Enum):
    like_new = "like_new"
    good = "good"
    usable = "usable"


class Lane(str, Enum):
    donate = "donate"
    resale = "resale"
    scrap = "scrap"


class InventoryStatus(str, Enum):
    in_stock = "in_stock"
    reserved = "reserved"
    delivered = "delivered"


class PickupStatus(str, Enum):
    submitted = "submitted"
    accepted = "accepted"
    rejected = "rejected"


class OrderStatus(str, Enum):
    pending_payment = "pending_payment"
    paid = "paid"
    packed = "packed"
    shipped = "shipped"
    delivered = "delivered"
    cancelled = "cancelled"


class SponsorshipTier(str, Enum):
    student = "student"
    classroom = "classroom"
    school = "school"


class SourceType(str, Enum):
    donor = "donor"
    kabadiwala = "kabadiwala"


class PaymentPurpose(str, Enum):
    school_order = "school_order"
    sponsorship = "sponsorship"
    resale = "resale"


# ---------------------------------------------------------------------------
# Users
# ---------------------------------------------------------------------------

class ParentContact(BaseModel):
    phone: str
    email: str


class UserBase(BaseModel):
    role: UserRole
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    is_minor: bool = False
    parent_contact: Optional[ParentContact] = None
    area: Optional[str] = None
    city: str = "Hyderabad"
    pincode: Optional[str] = None

    @field_validator("phone", "email")
    @classmethod
    def at_least_one_contact(cls, v, info):
        return v


class UserCreate(UserBase):
    otp_channel: str = "phone"  # "phone" or "email"


class UserInDB(UserBase):
    id: Optional[str] = Field(default=None, alias="_id")
    hashed_otp: Optional[str] = None
    otp_expires_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=now)
    updated_at: datetime = Field(default_factory=now)

    model_config = {"populate_by_name": True}


class UserResponse(BaseModel):
    id: str
    role: UserRole
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    area: Optional[str] = None
    city: str
    is_minor: bool = False

    model_config = {"populate_by_name": True}


# ---------------------------------------------------------------------------
# Schools
# ---------------------------------------------------------------------------

class SchoolBase(BaseModel):
    udise: str
    name: str
    address: str
    district: str
    headmaster_name: str
    phone: Optional[str] = None
    email: Optional[str] = None


class SchoolCreate(SchoolBase):
    user_id: str


class SchoolInDB(SchoolBase):
    id: Optional[str] = Field(default=None, alias="_id")
    user_id: str
    verified_status: VerifiedStatus = VerifiedStatus.pending
    created_at: datetime = Field(default_factory=now)
    updated_at: datetime = Field(default_factory=now)

    model_config = {"populate_by_name": True}


# ---------------------------------------------------------------------------
# Kabadiwalas
# ---------------------------------------------------------------------------

class KabadiwalaProfile(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    user_id: str
    area: str
    trust_score: float = 1.0  # accepted / total ratio
    upi_id: Optional[str] = None
    total_pickups: int = 0
    accepted_pickups: int = 0
    created_at: datetime = Field(default_factory=now)
    updated_at: datetime = Field(default_factory=now)

    model_config = {"populate_by_name": True}


# ---------------------------------------------------------------------------
# Pickups
# ---------------------------------------------------------------------------

class PickupCreate(BaseModel):
    declared_count: int
    govt_issued: bool = False
    notes: Optional[str] = None


class PickupInDB(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    kabadiwala_id: str
    photos: list[str] = []
    declared_count: int
    accepted_count: Optional[int] = None
    govt_issued: bool = False
    notes: Optional[str] = None
    status: PickupStatus = PickupStatus.submitted
    amount_paid: Optional[float] = None
    rejection_reason: Optional[str] = None
    created_at: datetime = Field(default_factory=now)
    updated_at: datetime = Field(default_factory=now)

    model_config = {"populate_by_name": True}


# ---------------------------------------------------------------------------
# Inventory
# ---------------------------------------------------------------------------

class InventoryCreate(BaseModel):
    source_type: SourceType
    source_id: str
    book_class: str  # "class" is reserved; using book_class
    board: str       # CBSE, SCERT, ICSE, etc.
    subject: str
    edition_year: int
    condition: Condition
    govt_issued: bool = False
    pickup_id: Optional[str] = None  # set when from kabadiwala


class InventoryInDB(InventoryCreate):
    id: Optional[str] = Field(default=None, alias="_id")
    lane: Lane = Lane.donate
    status: InventoryStatus = InventoryStatus.in_stock
    graded_by: Optional[str] = None  # admin user id
    reserved_until: Optional[datetime] = None  # 30-min reservation window
    created_at: datetime = Field(default_factory=now)
    updated_at: datetime = Field(default_factory=now)

    model_config = {"populate_by_name": True}


class InventoryGrade(BaseModel):
    """Payload sent by admin when grading a pickup book."""
    book_class: str
    board: str
    subject: str
    edition_year: int
    condition: Condition
    govt_issued: bool
    lane: Lane  # admin decides donate/resale/scrap


# ---------------------------------------------------------------------------
# Listings (Resale)
# ---------------------------------------------------------------------------

class ListingCreate(BaseModel):
    inventory_ids: list[str]
    price: float
    title: str
    description: Optional[str] = None


class ListingInDB(ListingCreate):
    id: Optional[str] = Field(default=None, alias="_id")
    active: bool = True
    created_at: datetime = Field(default_factory=now)
    updated_at: datetime = Field(default_factory=now)

    model_config = {"populate_by_name": True}


# ---------------------------------------------------------------------------
# Orders
# ---------------------------------------------------------------------------

class PriceBreakdown(BaseModel):
    book_cost: float
    handling: float
    delivery: float

    @property
    def total(self) -> float:
        return self.book_cost + self.handling + self.delivery


class OrderItem(BaseModel):
    inventory_id: str
    book_class: str
    board: str
    subject: str
    condition: str
    unit_price: float


class OrderCreate(BaseModel):
    items: list[OrderItem]
    price_breakdown: PriceBreakdown
    school_id: Optional[str] = None   # donate lane
    buyer_id: Optional[str] = None    # resale lane
    delivery_pincode: str
    notes: Optional[str] = None


class OrderInDB(OrderCreate):
    id: Optional[str] = Field(default=None, alias="_id")
    status: OrderStatus = OrderStatus.pending_payment
    sponsorship_id: Optional[str] = None
    razorpay_order_id: Optional[str] = None
    razorpay_payment_id: Optional[str] = None
    created_at: datetime = Field(default_factory=now)
    updated_at: datetime = Field(default_factory=now)

    model_config = {"populate_by_name": True}


# ---------------------------------------------------------------------------
# Sponsorships
# ---------------------------------------------------------------------------

class SponsorshipCreate(BaseModel):
    tier: SponsorshipTier
    target_school_id: Optional[str] = None
    district: Optional[str] = None
    anonymous: bool = False
    message: Optional[str] = None


class SponsorshipInDB(SponsorshipCreate):
    id: Optional[str] = Field(default=None, alias="_id")
    sponsor_id: str
    amount: float = 0.0
    ops_fee: float = 0.0
    order_ids: list[str] = []
    fulfilled: bool = False
    created_at: datetime = Field(default_factory=now)
    updated_at: datetime = Field(default_factory=now)

    model_config = {"populate_by_name": True}


# ---------------------------------------------------------------------------
# Payments
# ---------------------------------------------------------------------------

class PaymentInDB(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    razorpay_order_id: str
    razorpay_payment_id: Optional[str] = None
    razorpay_signature: Optional[str] = None
    amount: float
    currency: str = "INR"
    purpose: PaymentPurpose
    reference_id: str  # order_id or sponsorship_id
    user_id: str
    verified: bool = False
    created_at: datetime = Field(default_factory=now)
    updated_at: datetime = Field(default_factory=now)

    model_config = {"populate_by_name": True}


# ---------------------------------------------------------------------------
# Deliveries
# ---------------------------------------------------------------------------

class DeliveryCreate(BaseModel):
    order_id: str
    photo_url: str
    headmaster_confirmed: bool = False


class DeliveryInDB(DeliveryCreate):
    id: Optional[str] = Field(default=None, alias="_id")
    delivered_at: Optional[datetime] = None
    confirmed_by: Optional[str] = None  # school user id
    created_at: datetime = Field(default_factory=now)
    updated_at: datetime = Field(default_factory=now)

    model_config = {"populate_by_name": True}


# ---------------------------------------------------------------------------
# Notifications
# ---------------------------------------------------------------------------

class NotificationInDB(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    user_id: str
    title: str
    body: str
    read: bool = False
    action_url: Optional[str] = None
    created_at: datetime = Field(default_factory=now)

    model_config = {"populate_by_name": True}


# ---------------------------------------------------------------------------
# Donor listings
# ---------------------------------------------------------------------------

class DonorListingCreate(BaseModel):
    book_class: str
    board: str
    subject: str
    edition_year: int
    condition: Condition
    is_free: bool = True
    asking_price: Optional[float] = None  # set when is_free=False
    area: str
    city: str = "Hyderabad"
    notes: Optional[str] = None


class DonorListingInDB(DonorListingCreate):
    id: Optional[str] = Field(default=None, alias="_id")
    donor_id: str
    photos: list[str] = []
    status: str = "pending"  # pending | collected | cancelled
    inventory_id: Optional[str] = None  # set after grading
    created_at: datetime = Field(default_factory=now)
    updated_at: datetime = Field(default_factory=now)

    model_config = {"populate_by_name": True}


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------

class OTPRequest(BaseModel):
    phone: Optional[str] = None
    email: Optional[str] = None
    role: UserRole
    name: Optional[str] = None  # required on first signup


class OTPVerify(BaseModel):
    phone: Optional[str] = None
    email: Optional[str] = None
    otp: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# ---------------------------------------------------------------------------
# Phase 2 — Volunteer Tutoring (models only, no routes)
# ---------------------------------------------------------------------------

class TeacherProfile(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    user_id: str
    subjects: list[str]
    classes: list[str]
    languages: list[str]
    weekly_hours: int
    id_verified: bool = False
    created_at: datetime = Field(default_factory=now)
    updated_at: datetime = Field(default_factory=now)

    model_config = {"populate_by_name": True}


class ClassRequest(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    school_id: str
    subject: str
    book_class: str
    slot: str  # e.g. "Saturday 10:00-11:00"
    student_count: int
    status: str = "open"  # open | matched | completed
    created_at: datetime = Field(default_factory=now)
    updated_at: datetime = Field(default_factory=now)

    model_config = {"populate_by_name": True}


class TutoringSession(BaseModel):
    id: Optional[str] = Field(default=None, alias="_id")
    class_request_id: str
    teacher_id: str
    meet_link: str
    scheduled_at: datetime
    completed: bool = False
    created_at: datetime = Field(default_factory=now)
    updated_at: datetime = Field(default_factory=now)

    model_config = {"populate_by_name": True}
