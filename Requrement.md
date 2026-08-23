# Build Prompt: Pay-to-Rank Leaderboard App

Paste this whole thing into Claude Code, Cursor, or whatever agent you're using. It's written as a single build spec so it can run mostly unattended.

## What we're building
A public leaderboard where anyone pays real money via Stripe to rank a product URL or X handle. Rank = total dollars paid to that listing, sorted highest first. Inspired by outbid.lol.

## Tech stack — use exactly this, no substitutions
- Next.js 14+, App Router, TypeScript
- Prisma ORM + PostgreSQL - Neon (postgresql://neondb_owner:npg_yzJ81xlrOYgi@ep-wild-butterfly-az8why0t-pooler.c-3.ap-southeast-1.aws.neon.tech/podiumdb?sslmode=require&channel_binding=require)
- Stripe Checkout (hosted page) + Stripe Webhooks for payment confirmation
- Tailwind CSS for styling
- Deploy target: Vercel

## Data model (Prisma schema)
```prisma
model Listing {
  id              String   @id @default(cuid())
  url             String
  normalizedUrl   String   @unique
  displayName     String
  category        String?
  totalBidCents   Int      @default(0)
  clickCount      Int      @default(0)
  createdAt       DateTime @default(now())
  bids            Bid[]
}

model Bid {
  id                String   @id @default(cuid())
  listingId         String
  listing           Listing  @relation(fields: [listingId], references: [id])
  amountCents       Int
  stripeSessionId   String   @unique
  status            String   @default("pending") // pending | confirmed | failed
  createdAt         DateTime @default(now())
}
```
Bid is an append-only ledger, not just a counter — this gives you the activity feed for free and makes the payment step below safe against double-counting.

## Core user flows
1. **Leaderboard / landing page** — shows all listings sorted by `totalBidCents DESC, createdAt ASC` (older bid wins ties), plus a live "Claim #1 for $X" hero computed from the current top bid + $5.
2. **Submit a new listing** — form takes URL/handle + optional category, shows the price to take #1 (recomputed server-side, never trust a cached client number), redirects to Stripe Checkout.
3. **Top up an existing listing** — user enters a URL/handle already on the board; look it up by `normalizedUrl`; they pay only the difference to reach a new total, minimum $1 above their current amount.
4. **Stripe Checkout + webhook confirmation** — see critical rules below.
5. **Click tracking redirect** — `/go/[listingId]` increments `clickCount` then 302s to the real URL.
6. **Rules page** — plain text, must state bids are final and non-refundable.

## Critical correctness rules — implement these, they are not optional
- **Rank/total updates happen ONLY inside the Stripe webhook handler** (`checkout.session.completed`), never on the success-page redirect. A browser landing on `/success` proves nothing — payment could still fail.
- **Idempotency**: use the Stripe `checkout.session.id` (unique on `Bid`) to guard against Stripe retrying the same webhook and double-applying a bid.
- **Atomic increment**: apply a confirmed bid to `Listing.totalBidCents` inside a DB transaction (`UPDATE ... SET total_bid_cents = total_bid_cents + $amount`) so concurrent webhooks can't race each other.
- **Server-side validation of amounts** — enforce $5 minimum for new listings, $1 minimum increment for top-ups, and "$5+ over current #1" to take #1. Validate in the API route before creating the Stripe session, not just in the UI.
- **URL normalization** — strip query strings and tracking params, except for platform links (App Store, Play Store, GitHub) where the full path is the identity, so two different apps under the same domain don't share a bid.
- Verify the Stripe webhook signature on every request.

## Anti-abuse (cheap to add now, expensive to bolt on later)
- Blocklist domains: t.me, wa.me, discord.gg, signal.org, messenger.com, and similar chat/invite links.
- Basic keyword filter on submitted URLs/display names for NSFW content.
- Rate-limit listing submissions per IP (a simple in-memory or Redis counter is fine for v1).

## Pages / API routes
- `GET /` — leaderboard + submit form + hero
- `GET /rules` — rules page
- `GET /go/[id]` — click redirect
- `POST /api/listings` — validate input, create pending `Bid`, create Stripe Checkout session, return session URL
- `POST /api/webhooks/stripe` — verify signature, mark `Bid` confirmed, atomically update `Listing.totalBidCents`

## Explicit non-goals for v1 — do not build these
- No user accounts or auth
- No categories (launch flat; add later only if needed)
- No websockets — polling the leaderboard every few seconds is fine
- No admin dashboard beyond direct DB access

## Copy to use
- Hero: "Claim #1 for $X"
- Near the submit button and on the rules page: "All bids are final. No refunds."

## Deliverable
A working app that runs locally with `npm run dev`, includes the Prisma migration, and ships a `.env.example` with `DATABASE_URL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_BASE_URL`. Include a short README covering setup and how to test the webhook locally with `stripe listen --forward-to localhost:3000/api/webhooks/stripe`.