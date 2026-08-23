"use client";

import Image from "next/image";
import Link from "next/link";
import { Fragment, useEffect, useState } from "react";
import { formatMoney } from "@/lib/listings";

const PAGE_SIZE = 20;

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
  const [selectedPage, setSelectedPage] = useState(1);

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
  const pageCount = Math.max(1, Math.ceil(visibleListings.length / PAGE_SIZE));
  const currentPage = Math.min(selectedPage, pageCount);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageEnd = Math.min(pageStart + PAGE_SIZE, visibleListings.length);
  const pageListings = visibleListings.slice(pageStart, pageEnd);
  const featured = currentPage === 1 ? pageListings.slice(0, 3) : [];
  const topTen = currentPage === 1 ? pageListings.slice(3, 10) : [];
  const topTwenty = currentPage === 1 ? pageListings.slice(10, 20) : [];
  const laterRanks = currentPage > 1 ? pageListings : [];
  const paginationPages = Array.from({ length: pageCount }, (_, index) => index + 1).filter(
    (page) => page === 1 || page === pageCount || Math.abs(page - currentPage) <= 1,
  );

  function selectCategory(category: string) {
    setActiveCategory(category);
    setSelectedPage(1);
  }

  function goToPage(page: number) {
    setSelectedPage(Math.min(Math.max(page, 1), pageCount));
    window.requestAnimationFrame(() => {
      document.getElementById("leaderboard")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

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
          <div className="listing-title">{listing.displayName}<span aria-hidden="true">&nearr;</span></div>
          {listing.description && <p>{listing.description}</p>}
          <span>{listing.category?.name ?? "Other Products"} &middot; <b>{listing.clickCount.toLocaleString()} clicks</b></span>
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
        <button className={activeCategory === "all" ? "active" : ""} type="button" onClick={() => selectCategory("all")}>All</button>
        {categories.map((category) => (
          <button className={activeCategory === category.slug ? "active" : ""} type="button" onClick={() => selectCategory(category.slug)} key={category.slug}>{category.name}</button>
        ))}
      </div>

      {visibleListings.length ? (
        <>
          {currentPage === 1 && (
            <>
              <ol className="ranking-list featured-list">{featured.map((listing, index) => listingRow(listing, index))}</ol>
              <aside className="activity-rail">
                <div className="activity-title"><i /> Latest moves</div>
                <div className="activity-items">
                  {activities.length ? activities.map((activity) => (
                    <div className="activity-item" key={activity.id}>
                      <span className="activity-icon">&nearr;</span>
                      <p><strong>{activity.displayName}</strong><span>added {formatMoney(activity.amountCents)} &middot; {activity.date}</span></p>
                    </div>
                  )) : <p className="activity-empty">The first move will show up here.</p>}
                </div>
              </aside>

              {topTen.length > 0 && (
                <>
                  <div className="rank-divider top-ten-divider">
                    <span><b>Top 10</b><small>Ranks 4–10</small></span>
                  </div>
                  <ol className="ranking-list compact-list tier-list" start={4}>
                    {topTen.map((listing, index) => listingRow(listing, index + 3, true))}
                  </ol>
                </>
              )}

              {topTwenty.length > 0 && (
                <>
                  <div className="rank-divider top-twenty-divider">
                    <span><b>Top 20</b><small>Ranks 11–20</small></span>
                  </div>
                  <ol className="ranking-list compact-list tier-list" start={11}>
                    {topTwenty.map((listing, index) => listingRow(listing, index + 10, true))}
                  </ol>
                </>
              )}
            </>
          )}

          {laterRanks.length > 0 && (
            <ol className="ranking-list compact-list page-list" start={pageStart + 1}>
              {laterRanks.map((listing, index) => listingRow(listing, pageStart + index, true))}
            </ol>
          )}

          <div className="board-footer">
            <span>Showing {pageStart + 1}–{pageEnd} of {visibleListings.length} ranked product{visibleListings.length === 1 ? "" : "s"}</span>
            <button type="button" onClick={() => window.location.reload()}>&#8635; Refresh</button>
          </div>

          {pageCount > 1 && (
            <nav className="pagination" aria-label="Leaderboard pagination">
              <button className="pagination-control pagination-previous" type="button" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>
                <span aria-hidden="true">&larr;</span> Previous
              </button>
              <div className="pagination-pages">
                {paginationPages.map((page, index) => (
                  <Fragment key={page}>
                    {index > 0 && page - paginationPages[index - 1] > 1 && <span className="pagination-ellipsis" aria-hidden="true">&hellip;</span>}
                    <button
                      className={page === currentPage ? "pagination-page active" : "pagination-page"}
                      type="button"
                      onClick={() => goToPage(page)}
                      aria-label={`Go to page ${page}`}
                      aria-current={page === currentPage ? "page" : undefined}
                    >
                      {page}
                    </button>
                  </Fragment>
                ))}
              </div>
              <button className="pagination-control pagination-next" type="button" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === pageCount}>
                Next <span aria-hidden="true">&rarr;</span>
              </button>
            </nav>
          )}
        </>
      ) : <div className="empty-board"><span>OPEN</span><h3>No one owns this category yet.</h3><p>Place the first bid and become its founding leader.</p></div>}
    </>
  );
}
