import Link from "next/link";
import { BidForm } from "@/app/components/bid-form";
import { Leaderboard } from "@/app/components/leaderboard";
import { SiteHeader } from "@/app/components/site-header";
import { formatMoney } from "@/lib/listings";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: { searchParams: Promise<{ category?: string; bidCategory?: string; targetCents?: string }> }) {
  const { category: requestedCategory, bidCategory: requestedBidCategory, targetCents: requestedTargetCents } = await searchParams;
  const [listingRecords, recentBids, categories] = await Promise.all([
    prisma.listing.findMany({
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
    }),
    prisma.bid.findMany({
      where: { status: "confirmed" },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, amountCents: true, createdAt: true, listing: { select: { displayName: true } } },
    }),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" }, select: { slug: true, name: true, mark: true } }),
  ]);
  const listings = listingRecords.map(({ logoMimeType, ...listing }) => ({ ...listing, hasLogo: Boolean(logoMimeType) }));
  const initialCategory = categories.some((category) => category.slug === requestedCategory) ? requestedCategory : "all";
  const initialBidCategory = categories.some((category) => category.slug === requestedBidCategory) ? requestedBidCategory : "";
  const parsedTargetCents = requestedTargetCents && /^\d+$/.test(requestedTargetCents) ? Number(requestedTargetCents) : undefined;
  const initialTargetCents = parsedTargetCents && parsedTargetCents >= 500 && parsedTargetCents <= 99_999_900 && parsedTargetCents % 100 === 0
    ? parsedTargetCents
    : undefined;
  const claimCents = Math.max(500, (listings[0]?.totalBidCents ?? 0) + 500);
  const totalClicks = listings.reduce((sum, listing) => sum + listing.clickCount, 0);

  function bidDate(createdAt: Date) {
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(createdAt);
  }

  return (
    <main>
      <SiteHeader />

      <section className="hero narrow-shell" id="claim">
        <div className="live-proof"><i /> <strong>Board live</strong><span>·</span>{listings.length} ranked<span>·</span>{totalClicks.toLocaleString()} verified visits</div>
        <h1>Claim #1 for <em>{formatMoney(claimCents)}</em></h1>
        <p className="hero-copy"><strong>New spots start at $5.</strong> Pay less than the #1 price and rank wherever your total can take you.</p>
        <BidForm
          key={`${initialBidCategory}-${initialTargetCents ?? "leader"}`}
          claimCents={claimCents}
          categories={categories}
          initialCategory={initialBidCategory}
          initialTargetCents={initialTargetCents}
        />
      </section>

      <section className="board-section" id="leaderboard">
        <div className="narrow-shell">
          {/*<div className="section-heading">*/}
          {/*  <div><span className="section-kicker">LIVE RANKING</span><h2>The board</h2></div>*/}
          {/*  <p>Total backing sets the order. Older listings win ties.</p>*/}
          {/*</div>*/}
          <Leaderboard
            initialListings={listings}
            categories={categories}
            initialCategory={initialCategory}
            activities={recentBids.map((bid) => ({
              id: bid.id,
              displayName: bid.listing.displayName,
              amountCents: bid.amountCents,
              date: bidDate(bid.createdAt),
            }))}
          />
        </div>
      </section>

      <section className="how-it-works narrow-shell" id="how">
        <span className="section-kicker">HOW IT WORKS</span>
        <div className="steps">
          <article><b>01</b><h3>Drop your link</h3><p>Add a product URL, GitHub repo, app listing, or X handle.</p></article>
          <article><b>02</b><h3>Back your spot</h3><p>Pay the live difference through secure Stripe Checkout.</p></article>
          <article><b>03</b><h3>Own the attention</h3><p>Your confirmed total sets your rank. More backing moves you up.</p></article>
        </div>
      </section>

      <footer>
        <div className="shell footer-inner">
          <Link className="wordmark" href="/">PODIUM<span>°</span></Link>
          <p>Attention, priced in public.</p>
          <Link href="/rules">Rules & terms</Link>
        </div>
        <div className="shell developer-strip">
          <p>Developed by <strong>Umme Tasni</strong></p>
          <nav className="developer-contact" aria-label="Developer contact links">
            <a href="https://www.facebook.com/umme.tasni.2024" target="_blank" rel="noopener noreferrer"><span aria-hidden="true">f</span>Facebook</a>
            <a href="mailto:ummetasni15@gmail.com"><span aria-hidden="true">@</span>Gmail</a>
            <a href="https://www.facebook.com/umme.tasni.2024" target="_blank" rel="noopener noreferrer"><span aria-hidden="true">ig</span>Instagram</a>
          </nav>
        </div>
      </footer>
    </main>
  );
}
