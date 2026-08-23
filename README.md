# Podium

Podium is a public pay-to-rank leaderboard. A listing's rank is its total confirmed Stripe payments; the live price to take first place is the current leading total plus $5.

## Local setup

Requirements: Node.js 20+, PostgreSQL, and a Stripe account with the Stripe CLI installed.

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create the local environment file, then fill in the database and Stripe test credentials:

   ```bash
   cp .env.example .env
   ```

   Prisma reads `.env` automatically. `.env.example` only documents the required variable names and is not loaded as application configuration.

3. Apply the included database migration and generate Prisma Client:

   ```bash
   npx prisma migrate deploy
   npx prisma generate
   ```

4. Start Next.js:

   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000).

## Test Stripe webhooks

In another terminal, forward Stripe test events to the local webhook route:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copy the printed `whsec_...` signing secret into `STRIPE_WEBHOOK_SECRET`, restart the development server, and complete a checkout with Stripe's test card `4242 4242 4242 4242`, any future expiry, and any CVC.

The success page never changes rank. Only a signature-verified `checkout.session.completed` webhook confirms the pending bid and increments the listing total.

## Vercel deployment

Set `DATABASE_URL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and `NEXT_PUBLIC_BASE_URL` in the Vercel project. Set `NEXT_PUBLIC_BASE_URL` to the production origin, apply migrations against the production database, and create a Stripe webhook endpoint for `https://your-domain/api/webhooks/stripe` with these events:

- `checkout.session.completed`
- `checkout.session.expired`

The v1 submission rate limiter is process-local. Replace it with a shared Redis-backed limiter before running at enough scale that requests regularly cross multiple serverless instances.

## Demo data

Populate the board with the tagged pre-release dataset:

```bash
npm run db:seed
```

Before launch, remove only demo listings and their demo bid entries while preserving categories and real data:

```bash
npm run db:demo:clear
```
