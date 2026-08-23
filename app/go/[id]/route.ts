import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const listing = await prisma.listing.findUnique({ where: { id }, select: { url: true } });
  if (!listing) return Response.redirect(new URL("/", _request.url), 302);

  await prisma.listing.update({
    where: { id },
    data: { clickCount: { increment: 1 } },
  });
  return Response.redirect(listing.url, 302);
}
