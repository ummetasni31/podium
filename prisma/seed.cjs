/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require("@prisma/client");
const categories = require("./categories.json");

const prisma = new PrismaClient();

const products = [
  { slug: "signalforge", name: "SignalForge", category: "ai-agents", total: 125000, clicks: 8421, description: "Deploy a dependable team of AI agents that plans, researches, and ships work around the clock." },
  { slug: "orbitrank", name: "OrbitRank", category: "seo-ai", total: 98500, clicks: 6910, description: "Track how your brand appears across search engines and AI answers, then close every visibility gap." },
  { slug: "frameflow", name: "Frameflow", category: "ai-media", total: 78000, clicks: 5237, description: "Turn a product brief into campaign-ready images, motion, and social cuts from one creative workspace." },
  { slug: "shipyard", name: "Shipyard", category: "developer-tools", total: 65500, clicks: 4892, description: "Preview every pull request in a production-like environment your whole team can safely explore." },
  { slug: "briefly", name: "Briefly", category: "marketing", total: 52000, clicks: 3764, description: "Build a living marketing brief from customer calls, campaign results, and competitive movement." },
  { slug: "focuslane", name: "Focuslane", category: "productivity", total: 44000, clicks: 2941, description: "A calm daily command center that turns ambitious goals into a realistic, focused schedule." },
  { slug: "draftlab", name: "DraftLab", category: "design", total: 37500, clicks: 2380, description: "Collect feedback, compare versions, and approve creative work without another chaotic message thread." },
  { slug: "ledgerly", name: "Ledgerly", category: "finance", total: 32000, clicks: 2105, description: "Cash-flow forecasting and plain-language financial answers for lean, fast-moving companies." },
  { slug: "skillspring", name: "SkillSpring", category: "education", total: 27500, clicks: 1864, description: "Adaptive learning paths that turn real projects into measurable, career-ready skills." },
  { slug: "pulsekit", name: "PulseKit", category: "health", total: 21000, clicks: 1327, description: "Private health routines, habit signals, and weekly insights without noisy streak pressure." },
  { slug: "sidequest", name: "SideQuest", category: "games", total: 16000, clicks: 980, description: "Find the perfect co-op game for your group, your available time, and every device you own." },
  { slug: "indieshelf", name: "IndieShelf", category: "other", total: 9500, clicks: 641, description: "A beautifully small directory for discovering useful products before everyone else does." },
];

async function clearDemoData(client) {
  const demos = await client.listing.findMany({ where: { isDemo: true }, select: { id: true } });
  const ids = demos.map((listing) => listing.id);
  if (!ids.length) return 0;
  await client.bid.deleteMany({ where: { listingId: { in: ids } } });
  await client.listing.deleteMany({ where: { id: { in: ids } } });
  return ids.length;
}

async function main() {
  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name, mark: category.mark, sortOrder: category.sortOrder },
      create: category,
    });
  }

  const removed = await clearDemoData(prisma);
  const now = Date.now();
  for (const [index, product] of products.entries()) {
    const createdAt = new Date(now - index * 3 * 60 * 60 * 1000);
    await prisma.listing.create({
      data: {
        url: `https://${product.slug}.example.com/`,
        normalizedUrl: `https://${product.slug}.example.com`,
        displayName: product.name,
        description: product.description,
        categorySlug: product.category,
        totalBidCents: product.total,
        clickCount: product.clicks,
        isDemo: true,
        createdAt,
        bids: {
          create: {
            amountCents: product.total,
            stripeSessionId: `demo_seed_v1_${product.slug}`,
            status: "confirmed",
            createdAt,
          },
        },
      },
    });
  }
  console.log(`Seeded ${products.length} demo listings${removed ? ` after replacing ${removed}` : ""}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
