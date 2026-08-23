import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !secret) return new Response("Webhook is not configured", { status: 400 });

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(await request.text(), signature, secret);
  } catch (cause) {
    console.error("Stripe signature verification failed", cause);
    return new Response("Invalid signature", { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    if (session.payment_status !== "paid") return Response.json({ received: true });

    await prisma.$transaction(async (tx) => {
      const bid = await tx.bid.findUnique({ where: { stripeSessionId: session.id } });
      if (!bid || bid.status !== "pending") return;

      const confirmed = await tx.bid.updateMany({
        where: { id: bid.id, status: "pending" },
        data: { status: "confirmed" },
      });
      if (confirmed.count !== 1) return;

      await tx.listing.update({
        where: { id: bid.listingId },
        data: { totalBidCents: { increment: bid.amountCents } },
      });
    });
  } else if (event.type === "checkout.session.expired") {
    await prisma.bid.updateMany({
      where: { stripeSessionId: event.data.object.id, status: "pending" },
      data: { status: "failed" },
    });
  }

  return Response.json({ received: true });
}
