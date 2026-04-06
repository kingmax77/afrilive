# Afrimarket — Project Overview

## What We're Building

Two tightly integrated apps designed for the African market.

---

## 1. AfriLive Market

A TikTok-style live commerce platform where sellers broadcast live video, pin products on screen, and buyers tap to purchase in real time.

**Core flow:**
1. Seller goes live (streamed via Agora.io)
2. Seller pins products on the live screen during broadcast
3. Buyer taps a product to buy without leaving the stream
4. Buyer pays via mobile money (M-Pesa, Flutterwave, or Paystack)
5. Order is automatically dispatched to a 3PL delivery partner (Sendy / Kwik)
6. Buyer's SmartAddress code is resolved at checkout — no manual address entry

---

## 2. SmartAddress

A digital addressing system that gives every African user a unique, shareable address code (e.g. `BXR-204-17`) regardless of whether formal street addresses exist in their area.

**Core flow:**
1. User drops a pin on Google Maps
2. User adds landmarks, gate color, photos, and delivery notes
3. System generates a unique address code tied to that pin
4. Code is saved to the user's profile and used at checkout on AfriLive

---

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile / Frontend | React Native (Expo) |
| Backend | Node.js + NestJS |
| Database | PostgreSQL (primary), Redis (cache / queues) |
| Payments | Flutterwave, Paystack, M-Pesa Daraja API |
| Live Streaming | Agora.io |
| Maps | Google Maps API |
| Delivery / 3PL | Sendy API, Kwik API |
| Push Notifications | Firebase Cloud Messaging (FCM) |

---

## Architecture Notes

- **Monorepo structure** — shared types and utilities between the two apps where possible.
- **SmartAddress is a dependency of AfriLive** — every AfriLive checkout resolves a SmartAddress code to dispatch coordinates and delivery notes to the 3PL.
- **Payment providers are region-aware** — M-Pesa targets Kenya/East Africa, Paystack targets Nigeria/Ghana, Flutterwave covers broader pan-Africa.
- **Orders are event-driven** — on payment confirmation, an order event triggers the 3PL dispatch automatically via webhook or queue worker.
- **Streaming sessions are ephemeral** — Agora tokens are short-lived; product pins are persisted in PostgreSQL and replayed on stream join.

---

## Key Integrations

### Payments
- **M-Pesa Daraja API** — STK Push for Kenya
- **Paystack** — card + mobile money for Nigeria, Ghana
- **Flutterwave** — pan-Africa fallback, multiple currencies

### Delivery
- **Sendy** — last-mile delivery, Kenya-first
- **Kwik** — on-demand logistics, Nigeria-first

### Streaming
- **Agora.io** — low-latency live video with token-based auth per session

### Notifications
- **Firebase Cloud Messaging** — order updates, stream alerts, delivery status pushes
