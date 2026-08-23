import { Prisma } from "@prisma/client";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeListing, validateListingProfile } from "@/lib/listings";
import { takeSubmissionSlot } from "@/lib/rate-limit";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

function error(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

export async function GET(request: NextRequest) {
  const rawUrl = request.nextUrl.searchParams.get("url");
  if (!rawUrl || rawUrl.length > 2048) return error("Enter a valid product URL or X handle.");
  let normalized;
  try {
    normalized = normalizeListing(rawUrl);
  } catch (cause) {
    return error(cause instanceof Error ? cause.message : "Invalid listing.");
  }
  const listing = await prisma.listing.findUnique({
    where: { normalizedUrl: normalized.normalizedUrl },
    select: { id: true, displayName: true, description: true, logoMimeType: true, totalBidCents: true },
  });
  return Response.json({
    existing: listing && listing.totalBidCents > 0
      ? { id: listing.id, displayName: listing.displayName, description: listing.description, hasLogo: Boolean(listing.logoMimeType) }
      : null,
  });
}

async function readLogo(file: File | null) {
  if (!file || file.size === 0) throw new Error("Upload a company logo.");
  if (file.size > 512 * 1024) throw new Error("Logo must be 512 KB or smaller.");

  const bytes = new Uint8Array(await file.arrayBuffer());
  const isPng = bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  const isJpeg = bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const isWebp = bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  const mimeType = isPng ? "image/png" : isJpeg ? "image/jpeg" : isWebp ? "image/webp" : null;
  if (!mimeType) throw new Error("Logo must be a valid PNG, JPEG, or WebP image.");
  return { logoData: Buffer.from(bytes), logoMimeType: mimeType };
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!takeSubmissionSlot(ip)) return error("Too many attempts. Try again in an hour.", 429);

  let body: {
    url?: unknown;
    category?: unknown;
    targetTotalCents?: unknown;
    displayName?: unknown;
    description?: unknown;
  };
  let logoFile: File | null = null;
  try {
    const formData = await request.formData();
    const logo = formData.get("logo");
    const target = formData.get("targetTotalCents");
    body = {
      url: formData.get("url"),
      category: formData.get("category"),
      targetTotalCents: typeof target === "string" && target ? Number(target) : undefined,
      displayName: formData.get("displayName"),
      description: formData.get("description"),
    };
    if (logo instanceof File) logoFile = logo;
  } catch {
    return error("Invalid request body.");
  }
  if (typeof body.url !== "string" || body.url.length > 2048) {
    return error("Enter a valid product URL or X handle.");
  }
  if (typeof body.category !== "string") return error("Choose a valid category.");
  const submittedCategory = await prisma.category.findUnique({ where: { slug: body.category } });
  if (!submittedCategory) return error("Choose a valid category.");

  let normalized;
  try {
    normalized = normalizeListing(body.url);
  } catch (cause) {
    return error(cause instanceof Error ? cause.message : "Invalid listing.");
  }

  const [leader, existing] = await Promise.all([
    prisma.listing.findFirst({ orderBy: [{ totalBidCents: "desc" }, { createdAt: "asc" }] }),
    prisma.listing.findUnique({ where: { normalizedUrl: normalized.normalizedUrl } }),
  ]);

  const priceToLeadCents = Math.max(500, (leader?.totalBidCents ?? 0) + 500);
  const targetTotalCents = body.targetTotalCents ?? priceToLeadCents;
  if (
    typeof targetTotalCents !== "number" ||
    !Number.isInteger(targetTotalCents) ||
    targetTotalCents % 100 !== 0 ||
    targetTotalCents > 99_999_900
  ) {
    return error("Choose a whole-dollar total between $5 and $999,999.");
  }

  const currentTotalCents = existing?.totalBidCents ?? 0;
  const needsProfile = currentTotalCents === 0;
  const requestedTotalCents = targetTotalCents;
  const amountCents = requestedTotalCents - currentTotalCents;

  if (needsProfile && requestedTotalCents < 500) return error("New listings require a minimum $5 bid.");
  if (!needsProfile && amountCents < 100) return error("Top-ups require at least $1.");
  if (
    leader &&
    leader.id !== existing?.id &&
    requestedTotalCents > leader.totalBidCents &&
    requestedTotalCents < priceToLeadCents
  ) {
    return error(`Taking #1 requires a total bid of at least $${priceToLeadCents / 100}.`);
  }

  let profile;
  let logo;
  if (needsProfile) {
    if (typeof body.displayName !== "string" || typeof body.description !== "string") {
      return error("Enter a company title and short description.");
    }
    try {
      profile = validateListingProfile(body.displayName, body.description);
      logo = await readLogo(logoFile);
    } catch (cause) {
      return error(cause instanceof Error ? cause.message : "Invalid company profile.");
    }
  }

  let listing = existing;
  let profileCreated = false;
  if (!listing) {
    try {
      listing = await prisma.listing.create({
        data: { ...normalized, ...profile, ...logo, categorySlug: submittedCategory.slug },
      });
      profileCreated = true;
    } catch (cause) {
      if (cause instanceof Prisma.PrismaClientKnownRequestError && cause.code === "P2002") {
        listing = await prisma.listing.findUnique({ where: { normalizedUrl: normalized.normalizedUrl } });
      } else {
        throw cause;
      }
    }
  }
  if (!listing) return error("Could not prepare this listing.", 500);
  if (needsProfile && !profileCreated) {
    await prisma.listing.updateMany({
      where: { id: listing.id, totalBidCents: 0 },
      data: { ...profile, ...logo, categorySlug: submittedCategory.slug },
    });
    listing = await prisma.listing.findUnique({ where: { id: listing.id } });
    if (!listing) return error("Could not prepare this listing.", 500);
  }
  if (!listing.categorySlug) {
    listing = await prisma.listing.update({ where: { id: listing.id }, data: { categorySlug: submittedCategory.slug } });
  }

  const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin).replace(/\/$/, "");
  try {
    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: amountCents,
            product_data: { name: `Podium bid for ${listing.displayName}` },
          },
        },
      ],
      metadata: { listingId: listing.id, targetTotalCents: String(requestedTotalCents) },
      success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/?checkout=cancelled`,
    });

    await prisma.bid.create({
      data: {
        listingId: listing.id,
        amountCents,
        stripeSessionId: session.id,
      },
    });

    if (!session.url) return error("Stripe did not return a checkout URL.", 502);
    return Response.json({ url: session.url });
  } catch (cause) {
    console.error("Checkout creation failed", cause);
    return error("Checkout could not be started. Please try again.", 502);
  }
}
