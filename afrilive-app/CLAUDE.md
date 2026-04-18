# AfriLive Market — Project Context

## What This App Is

AfriLive Market is a TikTok-style live commerce platform built for Africa.
Sellers broadcast live video while showcasing products pinned on screen.
Buyers watch the stream and tap to purchase without ever leaving the live.
Delivery is resolved through SmartAddress — the sister app already built.

---

## User Types

### Sellers
- Go live and stream video of their products
- Pin products onto the live screen during the broadcast
- Accept payments from viewers directly inside the live
- Manage product listings, view incoming orders, track earnings

### Buyers
- Browse a feed of active and past live streams
- Watch any live and tap a pinned product to purchase
- Pay via mobile money without leaving the stream
- Enter their SmartAddress code at checkout (e.g. `BXR-204-17`) — no manual address entry
- Track their delivery in the SmartAddress app after purchase

---

## Core User Flows

### Seller Flow
1. Seller logs in and taps "Go Live"
2. Live stream begins (Agora.io token issued, stream starts)
3. Seller pins products from their catalogue onto the screen mid-broadcast
4. Buyers tap pinned products → checkout sheet slides up
5. Payment confirmed → order auto-dispatched to rider via 3PL
6. Seller sees order appear in real time on their dashboard
7. Seller ends live → stream recording saved, stats shown

### Buyer Flow
1. Buyer opens the feed and sees live streams sorted by activity
2. Buyer taps a live → enters the stream viewer
3. Buyer sees pinned products as floating cards on the video
4. Buyer taps a product → bottom sheet shows product detail + Buy button
5. Buyer taps Buy → checkout: quantity, SmartAddress code entry, payment method
6. Mobile money prompt sent to buyer's phone (STK push or redirect)
7. Payment confirmed → order placed, buyer notified
8. Buyer switches to SmartAddress app to track the delivery

---

## Screens

### Shared / Auth
- `SplashScreen` — logo animation, check auth state
- `OnboardingScreen` — role selection: Seller or Buyer
- `AuthScreen` — phone number login + OTP verification

### Buyer Screens
- `FeedScreen` (Home tab) — scrollable grid of live streams + upcoming lives
- `LiveViewerScreen` — full-screen video player with product pins overlay
- `ProductDetailSheet` — bottom sheet with product info, price, Buy button
- `CheckoutScreen` — quantity picker, SmartAddress code input, payment method
- `PaymentScreen` — mobile money prompt / status
- `OrdersScreen` — buyer's order history with statuses
- `ProfileScreen` — buyer profile, saved SmartAddress codes, settings

### Seller Screens
- `SellerDashboardScreen` (Home tab) — earnings summary, active orders, quick actions
- `GoLiveScreen` — pre-live setup: title, category, thumbnail
- `LiveBroadcastScreen` — full-screen broadcaster view with product pin controls
- `ProductsScreen` — catalogue management (add, edit, toggle availability)
- `AddEditProductScreen` — product form: name, price, photos, stock
- `OrdersScreen` — incoming orders list with fulfillment status
- `EarningsScreen` — revenue breakdown, payout history

---

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile | React Native (Expo SDK 54) |
| Navigation | React Navigation — Bottom Tabs + Native Stack |
| Local State | AsyncStorage |
| Live Streaming | Agora.io (RTC SDK) |
| Payments | M-Pesa Daraja API · Paystack · Flutterwave |
| Delivery | Sendy API (Kenya) · Kwik API (Nigeria) |
| Push Notifications | Firebase Cloud Messaging (FCM) |
| Backend | Node.js + NestJS (shared with SmartAddress) |
| Database | PostgreSQL + Redis |
| Maps | Google Maps (via SmartAddress integration) |

---

## Color Palette

| Token | Hex | Usage |
|---|---|---|
| Gold | `#E8A020` | Primary CTA, highlights, active state |
| Dark | `#0A0A0A` | Backgrounds, text on light |
| Green | `#1A6B3C` | Success, confirmed, live badge |
| Red | `#C0392B` | Errors, destructive actions, price drops |
| White | `#FFFFFF` | Text on dark backgrounds |
| Surface | `#141414` | Card backgrounds |
| Border | `#2A2A2A` | Dividers, input borders |
| Text Muted | `#6B6B6B` | Secondary labels, placeholders |

---

## SmartAddress Integration

AfriLive is a consumer of SmartAddress. The two apps are separate but tightly linked:

- At checkout, the buyer provides their SmartAddress code instead of a physical address
- AfriLive backend resolves the code → retrieves GPS coordinates + delivery notes + gate color + arrival instructions
- Those details are forwarded to the 3PL dispatch API (Sendy / Kwik) automatically
- The buyer tracks delivery progress inside the SmartAddress app (Parcel Tracking tab)
- No address typing, no ambiguity — the code carries everything the rider needs

---

## Payment Providers

| Provider | Region | Method |
|---|---|---|
| M-Pesa Daraja | Kenya, East Africa | STK Push |
| Paystack | Nigeria, Ghana | Card + mobile money |
| Flutterwave | Pan-Africa fallback | Multiple currencies |

Payment flow: buyer taps Buy → selects method → STK push or redirect → webhook confirms → order placed.

---

## Live Streaming Architecture

- Agora.io issues a short-lived RTC token per stream session
- Seller is the broadcaster (publisher role), buyers are audience (subscriber role)
- Product pins are stored in PostgreSQL and replayed to late-joining viewers
- Stream metadata (title, thumbnail, product list, viewer count) lives in Redis during the live
- On stream end, session data is persisted for order reconciliation and analytics

---

## Key Business Rules

1. **No order without payment** — order record is only created after payment webhook fires
2. **SmartAddress required at checkout** — buyers must provide a valid SmartAddress code; fallback to manual address input only if code lookup fails
3. **Pinned products are live-scoped** — a product pin is only active while the stream is running; past stream replays show pins as non-purchasable
4. **Seller must be verified** — sellers complete phone + ID verification before going live
5. **Delivery auto-dispatched** — on payment confirmation, the 3PL API call is triggered automatically via a queue worker; no manual dispatch step
6. **Currency is local** — display prices in NGN (Nigeria), KES (Kenya), GHS (Ghana) based on the seller's registered country

---

## Architecture Notes

- **Monorepo** — AfriLive and SmartAddress share types and utilities under `shared/`
- **Role-based navigation** — buyers and sellers see entirely different tab navigators
- **Events are the source of truth** — payment confirmed → order event → 3PL dispatch → delivery status updates all flow via events/webhooks, not polling
- **Streaming sessions are ephemeral** — Agora tokens are short-lived; all persistent state lives in PostgreSQL
- **Offline-resilient checkout** — if network drops mid-checkout, the cart state is preserved locally in AsyncStorage until the user reconnects
