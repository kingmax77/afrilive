# Afrimarket Backend

Node.js + NestJS REST API powering **AfriLive Market** (TikTok-style live commerce) and **SmartAddress** (digital address codes for Africa).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | NestJS 10 |
| Language | TypeScript 5 |
| Database | PostgreSQL via Prisma ORM |
| Cache / Sessions | Redis (ioredis) |
| Auth | JWT + Phone OTP |
| Payments | Flutterwave (primary) |
| API Docs | Swagger / OpenAPI |

---

## Prerequisites

- Node.js ≥ 18
- PostgreSQL ≥ 14 running locally (or a connection string)
- Redis running locally (optional — app degrades gracefully if unavailable)

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and fill in at minimum:

```
DATABASE_URL="postgresql://postgres:password@localhost:5432/afrimarket"
JWT_SECRET=any-long-random-string
OTP_DEV_MODE=true
```

### 3. Create the database

```bash
createdb afrimarket   # or use pgAdmin / Supabase
```

### 4. Run migrations & generate Prisma client

```bash
npm run prisma:generate
npm run prisma:migrate
```

Or push schema directly (no migration history):

```bash
npm run prisma:push
```

### 5. Seed test data

```bash
npm run seed
```

This creates:
- 3 test users (buyer `+254700000001`, seller `+254700000002`, rider `+254700000003`)
- 5 products
- 3 SmartAddress codes: `BXR-204-17`, `LGS-881-44`, `ACC-552-09`
- 2 orders in different statuses

### 6. Start the server

```bash
# Development (watch mode)
npm run start:dev

# Production
npm run build && npm run start:prod
```

Server starts at **http://localhost:3000**

---

## API Docs

Swagger UI: **http://localhost:3000/api/docs**

All endpoints are prefixed with `/api/v1`.

---

## Authentication Flow

1. `POST /api/v1/auth/send-otp` — send OTP to phone  
   *(with `OTP_DEV_MODE=true` the OTP is returned in the response)*
2. `POST /api/v1/auth/verify-otp` — verify OTP → receive `{ token, user }`
3. Include `Authorization: Bearer <token>` in subsequent requests
4. In Swagger: click **Authorize** and paste the token

---

## API Modules

### Auth `/api/v1/auth`
| Method | Path | Description |
|---|---|---|
| POST | `/send-otp` | Send 6-digit OTP to phone |
| POST | `/verify-otp` | Verify OTP → JWT token |
| POST | `/register` | Register new user |
| GET | `/me` | Current user profile |

### SmartAddresses `/api/v1/addresses`
| Method | Path | Description |
|---|---|---|
| GET | `/` | All addresses for current user |
| POST | `/` | Create address (auto-generates code like `BXR-204-17`) |
| GET | `/:code` | Get address by code (public) |
| PUT | `/:id` | Update address |
| DELETE | `/:id` | Delete address |
| PUT | `/:id/primary` | Set as primary address |
| GET | `/:code/confidence` | Confidence score breakdown |

### Products `/api/v1/products`
| Method | Path | Description |
|---|---|---|
| GET | `/` | Seller's own products |
| POST | `/` | Create product |
| PUT | `/:id` | Update product |
| DELETE | `/:id` | Delete product |
| GET | `/public/:sellerId` | Public catalogue for a seller |

### Streams `/api/v1/streams`
| Method | Path | Description |
|---|---|---|
| GET | `/` | Live & upcoming streams feed |
| GET | `/:id` | Stream details |
| POST | `/` | Create / schedule stream |
| PUT | `/:id/start` | Go live — issues Agora token |
| PUT | `/:id/end` | End stream |
| PUT | `/:id/pin-product` | Pin product on screen |

### Orders `/api/v1/orders`
| Method | Path | Description |
|---|---|---|
| POST | `/` | Create order (validates SmartAddress) |
| GET | `/buyer` | Buyer's order history |
| GET | `/seller` | Seller's incoming orders |
| GET | `/:id` | Single order detail |
| PUT | `/:id/status` | Update status (rider / seller) |
| GET | `/smartaddress/:code` | **All parcels incoming to a SmartAddress** |

### Delivery `/api/v1/delivery`
| Method | Path | Description |
|---|---|---|
| POST | `/assign` | Assign rider to order |
| PUT | `/:orderId/location` | Rider updates GPS position |
| GET | `/:orderId/track` | Real-time rider location |
| PUT | `/:orderId/delivered` | Mark delivered |

### Payments `/api/v1/payments`
| Method | Path | Description |
|---|---|---|
| POST | `/initialize` | Initialize Flutterwave payment |
| POST | `/webhook` | Flutterwave webhook (no auth) |
| GET | `/verify/:reference` | Verify payment status |

---

## SmartAddress Code Format

Codes follow the pattern `AAA-NNN-NN`:
- 3 random uppercase letters (no I/O)
- 3-digit number
- 2-digit number

Example: `BXR-204-17`, `LGS-881-44`, `ACC-552-09`

Confidence scores are calculated from how many descriptive fields are filled in (landmark, gate color, arrival instructions, delivery notes, photos).

---

## Key Design Decisions

- **Orders validate SmartAddress codes** — checkout is blocked if the code doesn't exist
- **Redis caches rider GPS** with a 5-minute TTL; rider app should ping every 30s
- **OTP dev mode** — set `OTP_DEV_MODE=true` to receive OTP in the API response (never in production)
- **Payment webhook is unauthenticated** — verified by `verif-hash` header signature from Flutterwave
- **Stock is decremented atomically** in a Prisma transaction when an order is created

---

## Project Structure

```
src/
├── app.module.ts
├── main.ts
├── common/
│   ├── decorators/        # @CurrentUser, @Roles
│   └── guards/            # JwtAuthGuard, RolesGuard
├── prisma/                # PrismaModule + PrismaService
├── redis/                 # RedisModule + RedisService
└── modules/
    ├── auth/              # OTP + JWT auth
    ├── addresses/         # SmartAddress CRUD + code generation
    ├── products/          # Seller product catalogue
    ├── streams/           # Live broadcast sessions
    ├── orders/            # Order lifecycle
    ├── delivery/          # Rider GPS + delivery tracking
    └── payments/          # Flutterwave integration
prisma/
├── schema.prisma          # Full DB schema
└── seed.ts                # Test data seeder
```
