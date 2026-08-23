CREATE TABLE "categories" (
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "mark" TEXT NOT NULL,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "categories_pkey" PRIMARY KEY ("slug")
);

INSERT INTO "categories" ("slug", "name", "mark", "sort_order") VALUES
  ('seo-ai', 'SEO & AI Visibility', 'SV', 1),
  ('ai-agents', 'AI Agents & Infrastructure', 'AI', 2),
  ('ai-media', 'AI Media Generation', 'MG', 3),
  ('marketing', 'Marketing & Advertising', 'MA', 4),
  ('developer-tools', 'Developer Tools', 'DT', 5),
  ('productivity', 'Productivity & Personal Tools', 'PX', 6),
  ('design', 'Design & Creative', 'DC', 7),
  ('finance', 'Business, Finance & Legal', 'BF', 8),
  ('education', 'Education & Learning', 'EL', 9),
  ('health', 'Health, Fitness & Wellness', 'HW', 10),
  ('games', 'Games & Entertainment', 'GE', 11),
  ('other', 'Other Products', 'OP', 12);

ALTER TABLE "listings" ADD COLUMN "description" TEXT;
ALTER TABLE "listings" ADD COLUMN "is_demo" BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX "categories_sort_order_idx" ON "categories"("sort_order");
ALTER TABLE "listings" ADD CONSTRAINT "listings_category_fkey" FOREIGN KEY ("category") REFERENCES "categories"("slug") ON DELETE SET NULL ON UPDATE CASCADE;
