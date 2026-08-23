import Link from "next/link";
import { SiteHeader } from "@/app/components/site-header";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Categories · Podium" };
export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      _count: { select: { listings: { where: { totalBidCents: { gt: 0 } } } } },
    },
  });

  return (
    <main className="directory-page">
      <SiteHeader />
      <section className="directory-content narrow-shell">
        <span className="section-kicker">EXPLORE THE BOARD</span>
        <h1>Every arena has<br /><i>its own podium.</i></h1>
        <p>Pick a category to see its leaders. Category rankings use the same confirmed public bids as the main board.</p>
        <div className="category-grid">
          {categories.map((category) => (
            <Link href={`/?category=${category.slug}#leaderboard`} className="category-card" key={category.slug}>
              <span>{category.mark}</span>
              <div><strong>{category.name}</strong><small>{category._count.listings} ranked</small></div>
              <b aria-hidden="true">↗</b>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
