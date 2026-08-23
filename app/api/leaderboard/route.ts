import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  const listings = await prisma.listing.findMany({
    where: { totalBidCents: { gt: 0 } },
    orderBy: [{ totalBidCents: "desc" }, { createdAt: "asc" }],
    select: {
      id: true,
      displayName: true,
      description: true,
      logoMimeType: true,
      url: true,
      category: { select: { slug: true, name: true } },
      totalBidCents: true,
      clickCount: true,
    },
  });
  return Response.json({
    listings: listings.map(({ logoMimeType, ...listing }) => ({ ...listing, hasLogo: Boolean(logoMimeType) })),
  });
}
