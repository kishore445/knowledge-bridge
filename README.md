# Knowledge Bridge

> **Teach one child, and you change a whole family.**

Move used school books from homes and kabadiwalas (scrap dealers) to government schools and low-income students in Hyderabad.

---

## Architecture

```
knowledge-bridge/
├── backend/          FastAPI + Motor (MongoDB)
│   └── app/
│       ├── main.py          App entry point
│       ├── models.py        All Pydantic models (incl. Phase 2)
│       ├── config.py        Settings via pydantic-settings
│       ├── database.py      Motor async MongoDB client
│       ├── deps.py          JWT auth dependencies
│       ├── routes/          One file per domain
│       └── services/        Storage, payment, delivery, email stubs
└── frontend/         React 18 + Vite + Tailwind
    └── src/
        ├── App.jsx          React Router routes
        ├── i18n/en.js       All copy (swap for Telugu/Hindi)
        ├── lib/api.js       Axios API client
        ├── hooks/useAuth    JWT auth context
        ├── components/      Reusable UI pieces
        └── pages/           Public / Donor / Kabadiwala / School / Admin / Sponsor
```

---

## Quick start

### Prerequisites
- Python 3.11+
- Node 18+
- MongoDB Atlas account (free tier works)
- AWS S3 bucket (or set `MOCK_OTP=true` and skip S3 for local dev)

### Backend

```bash
cd knowledge-bridge/backend

# Create and activate a virtualenv
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Copy env file and fill in values
cp .env.example .env

# Run the dev server
uvicorn app.main:app --reload --port 8000

# Seed the database (in a second terminal with the same .venv active)
python -m app.seed
```

API docs are at **http://localhost:8000/docs**

### Frontend

```bash
cd knowledge-bridge/frontend

# Install dependencies
npm install

# Copy env file
cp .env.example .env
# Set VITE_API_BASE_URL=http://localhost:8000

# Start dev server
npm run dev
```

Open **http://localhost:5173**

---

## Environment variables

### Backend (`.env`)

| Variable | Description | Default |
|---|---|---|
| `MONGODB_URL` | MongoDB Atlas connection string | `mongodb://localhost:27017` |
| `DB_NAME` | Database name | `knowledge_bridge` |
| `JWT_SECRET` | **Change this** — 32+ random chars | `dev_secret_change_me` |
| `JWT_EXPIRE_MINUTES` | Token lifetime | `10080` (7 days) |
| `AWS_ACCESS_KEY_ID` | S3 upload credentials | — |
| `AWS_SECRET_ACCESS_KEY` | S3 upload credentials | — |
| `AWS_REGION` | S3 region | `ap-south-1` |
| `S3_BUCKET` | S3 bucket for photos | `knowledge-bridge-books` |
| `RAZORPAY_KEY_ID` | Razorpay API key | — |
| `RAZORPAY_KEY_SECRET` | Razorpay secret | — |
| `RESEND_API_KEY` | Resend email API key | — |
| `FROM_EMAIL` | Sender email | `noreply@knowledgebridge.in` |
| `MOCK_OTP` | Print OTP to console (dev only) | `true` |
| `TWILIO_ACCOUNT_SID` | Twilio for SMS OTP | — |
| `TWILIO_AUTH_TOKEN` | Twilio auth token | — |
| `TWILIO_FROM_NUMBER` | Twilio sender number | — |
| `ALLOWED_ORIGINS` | CORS origins (comma-separated) | `http://localhost:5173` |
| `SPONSORSHIP_OPS_FEE_PCT` | Operations fee % shown to sponsors | `12` |

### Frontend (`.env`)

| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | Backend URL (e.g. `http://localhost:8000`) |
| `VITE_RAZORPAY_KEY_ID` | Razorpay publishable key (starts with `rzp_`) |

---

## Seed data

Running `python -m app.seed` creates:

- **3 schools** (2 verified, 1 pending)
- **2 kabadiwalas** with trust scores
- **30 inventory items** (5 govt-issued donate-lane, 13 donate-lane, 12 resale-lane)
- **2 sponsors** (1 named, 1 anonymous)
- **Dev users** (all use `MOCK_OTP=true` — any 6-digit code works in test)

| Role | Login |
|---|---|
| Admin | `admin@kb.dev` |
| School | `lakshmi@school1.edu` |
| Kabadiwala | `+910000000020` |
| Donor | `ananya@donor.dev` |
| Sponsor | `csr@techcorp.dev` |

---

## Key business rules (enforced in backend)

1. **Government-issued books never enter resale lane** — checked in `/api/inventory/grade` and `/api/resale/listings`.
2. **30-minute reservation** — inventory is reserved on order creation and auto-released if payment isn't confirmed in time (background task).
3. **Price breakdown always shown** — `price_breakdown` object is required on every school order, never a single opaque number.
4. **Sponsorship ops fee shown openly** — fee percentage stored in settings, returned alongside `book_cost` in every sponsorship response.
5. **Student privacy** — no ads surfaced, student data never exposed publicly.

---

## Build order (implemented)

- [x] 1. Auth + roles (phone/email OTP + JWT, role picker)
- [x] 2. School verification (UDISE, admin queue, email notification)
- [x] 3. Kabadiwala pickups + admin review (trust score, UPI payout stub)
- [x] 4. Inventory grading (condition, board, lane assignment)
- [x] 5. School orders with Razorpay (reservation, breakdown, confirm)
- [x] 6. Sponsorships (tier picker, ops fee, anonymous option, cert)
- [x] 7. Resale listings + checkout (buyers, Razorpay)
- [x] 8. Delivery confirmation + impact dashboard (photo, headmaster sign-off, feed)
- [x] 9. Certificates (JSON data → browser print-to-PDF)
- [x] 10. Admin dashboard polish (kanban board, pricing settings, disputes)

---

## Phase 2 — Volunteer Tutoring (models only)

Data models defined in `backend/app/models.py`:
- `TeacherProfile` — subjects, classes, languages, weekly hours, ID-verified flag
- `ClassRequest` — school → subject/class/slot/student count
- `TutoringSession` — meet link, teacher, scheduled time

Rules: group classes only (never one-on-one). Admin verifies teachers. Paid small-batch classes for paying families will fund free classes later. No routes or UI yet.

---

## Stubs to replace before production

| Stub | File | Replace with |
|---|---|---|
| Delivery quote | `services/delivery_service.py` | Shiprocket API |
| UPI payout | `services/payment_service.py` | Razorpay Payouts |
| SMS OTP | `services/auth_service.py` | Twilio / MSG91 |
| S3 presigned URLs | `services/storage_service.py` | Real AWS credentials |

---

## Fonts & design tokens

- **Body / UI**: Inter (Google Fonts)
- **Labels, prices, tags, step numbers**: JetBrains Mono (Google Fonts)
- **Background**: `#F6F4EF` · **Ink**: `#0E1726` · **Primary**: `#1F63D6` · **Accent**: `#E8873A` · **Dark band**: `#071525`
- Rounded cards: 16–20px · Min tap target: 44px

---

## i18n

All user-facing copy lives in `frontend/src/i18n/en.js`.  
To add Telugu: copy `en.js` → `te.js`, translate the values, and swap the import in `App.jsx`.
