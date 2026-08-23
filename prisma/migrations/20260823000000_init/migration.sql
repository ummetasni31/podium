CREATE TABLE "listings" (
  "id" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "normalized_url" TEXT NOT NULL,
  "display_name" TEXT NOT NULL,
  "category" TEXT,
  "total_bid_cents" INTEGER NOT NULL DEFAULT 0,
  "click_count" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "listings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "bids" (
  "id" TEXT NOT NULL,
  "listing_id" TEXT NOT NULL,
  "amount_cents" INTEGER NOT NULL,
  "stripe_session_id" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "bids_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "listings_normalized_url_key" ON "listings"("normalized_url");
CREATE INDEX "listings_total_bid_cents_created_at_idx" ON "listings"("total_bid_cents", "created_at");
CREATE UNIQUE INDEX "bids_stripe_session_id_key" ON "bids"("stripe_session_id");
CREATE INDEX "bids_listing_id_created_at_idx" ON "bids"("listing_id", "created_at");
ALTER TABLE "bids" ADD CONSTRAINT "bids_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
