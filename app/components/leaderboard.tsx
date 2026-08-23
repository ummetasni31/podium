"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { formatMoney } from "@/lib/listings";

type Category = { slug: string; name: string; mark?: string };
type Activity = { id: string; displayName: string; amountCents: number; date: string };
type Listing = {
  id: string;
  displayName: string;
  description: string | null;
  hasLogo: boolean;
  url: string;
  category: { slug: string; name: string } | null;
  totalBidCents: number;
  clickCount: number;
};

export function Leaderboard({
  initialListings,
  categories,
  initialCategory = "all",
  activities,
}: {
  initialListings: Listing[];
  categories: Category[];
  initialCategory?: string;
  activities: Activity[];
}) {
  const [listings, setListings] = useState(initialListings);
  const [activeCategory, setActiveCategory] = useState(initialCategory);

  useEffect(() => {
    const timer = window.setInterval(async () => {
      try {
        const response = await fetch("/api/leaderboard", { cache: "no-store" });
        if (response.ok) setListings((await response.json()).listings);
      } catch {
        // Keep the last good board visible through transient network failures.
      }
    }, 8000);
    return () => window.clearInterval(timer);
  }, []);

  const visibleListings = activeCategory === "all"
    ? listings
    : listings.filter((listing) => (listing.category?.slug ?? "other") === activeCategory);
  const featured = visibleListings.slice(0, 3);
  const longTail = visibleListings.slice(3);

  function listingRow(listing: Listing, index: number, compact = false) {
    const claimTargetCents = listing.totalBidCents + (listings[0]?.id === listing.id ? 500 : 100);

    return (
      <li className={`${index === 0 ? "ranking-row champion" : "ranking-row"}${compact ? " compact" : ""}`} key={listing.id}>
        <a className="card-hit-area" href={`/go/${listing.id}`} target="_blank" rel="noopener noreferrer">
          <span className="sr-only">Visit {listing.displayName}</span>
        </a>
        <span className="rank">#{index + 1}</span>
        <div className="listing-mark">
          {listing.hasLogo
            ? <Image src={`/api/listings/${listing.id}/logo`} width={51} height={51} alt={`${listing.displayName} logo`} unoptimized />
            : <span aria-hidden="true">{listing.displayName.slice(0, 1).toUpperCase()}</span>}
        </div>
        <div className="listing-info">
          <div className="listing-title">{listing.displayName}<span aria-hidden="true">↗</span></div>
          {listing.description && <p>{listing.description}</p>}
          <span>{listing.category?.name ?? "Other Products"} · <b>{listing.clickCount.toLocaleString()} clicks</b></span>
        </div>
        <strong>{formatMoney(listing.totalBidCents)}</strong>
        <Link className="claim-hint" href={`/?bidCategory=${listing.category?.slug ?? ""}&targetCents=${claimTargetCents}#claim`}>
          Claim this spot for {formatMoney(claimTargetCents)}
        </Link>
      </li>
    );
  }

  return (
    <>
      <div className="category-tabs" aria-label="Filter leaderboard by category">
        <button className={activeCategory === "all" ? "active" : ""} type="button" onClick={() => setActiveCategory("all")}>All</button>
        {categories.map((category) => (
          <button className={activeCategory === category.slug ? "active" : ""} type="button" onClick={() => setActiveCategory(category.slug)} key={category.slug}>{category.name}</button>
        ))}
      </div>

      {visibleListings.length ? (
        <>
          <ol className="ranking-list featured-list">{featured.map((listing, index) => listingRow(listing, index))}</ol>
          <aside className="activity-rail">
            <div className="activity-title"><i /> Latest moves</div>
            <div className="activity-items">
              {activities.length ? activities.map((activity) => (
                <div className="activity-item" key={activity.id}>
                  <span className="activity-icon">↗</span>
                  <p><strong>{activity.displayName}</strong><span>added {formatMoney(activity.amountCents)} · {activity.date}</span></p>
                </div>
              )) : <p className="activity-empty">The first move will show up here.</p>}
            </div>
          </aside>
          {longTail.length > 0 && <ol className="ranking-list compact-list">{longTail.map((listing, index) => listingRow(listing, index + 3, true))}</ol>}
          <div className="board-footer"><span>Showing {visibleListings.length} ranked product{visibleListings.length === 1 ? "" : "s"}</span><button type="button" onClick={() => window.location.reload()}>↻ Refresh</button></div>
        </>
      ) : <div className="empty-board"><span>OPEN</span><h3>No one owns this category yet.</h3><p>Place the first bid and become its founding leader.</p></div>}
    </>
  );
}
