/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const demos = await prisma.listing.findMany({ where: { isDemo: true }, select: { id: true } });
  const ids = demos.map((listing) => listing.id);
  if (!ids.length) {
    console.log("No demo listings found.");
    return;
  }

  await prisma.$transaction([
    prisma.bid.deleteMany({ where: { listingId: { in: ids } } }),
    prisma.listing.deleteMany({ where: { id: { in: ids } } }),
  ]);
  console.log(`Removed ${ids.length} demo listings and their bid ledger entries.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
