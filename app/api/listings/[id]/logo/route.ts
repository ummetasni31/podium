import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const listing = await prisma.listing.findUnique({
    where: { id },
    select: { logoData: true, logoMimeType: true },
  });
  if (!listing?.logoData || !listing.logoMimeType) return new Response("Logo not found", { status: 404 });

  return new Response(Buffer.from(listing.logoData), {
    headers: {
      "content-type": listing.logoMimeType,
      "cache-control": "public, max-age=3600, stale-while-revalidate=86400",
      "x-content-type-options": "nosniff",
    },
  });
}
