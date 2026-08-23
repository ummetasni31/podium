const BLOCKED_HOSTS = new Set([
  "t.me",
  "telegram.me",
  "wa.me",
  "whatsapp.com",
  "discord.gg",
  "discord.com",
  "signal.org",
  "messenger.com",
  "m.me",
]);

const BLOCKED_WORDS = ["porn", "xxx", "nsfw", "hentai", "escort", "onlyfans"];
const PATH_IDENTITY_HOSTS = new Set([
  "apps.apple.com",
  "itunes.apple.com",
  "play.google.com",
  "github.com",
  "x.com",
  "twitter.com",
]);

export type NormalizedListing = {
  url: string;
  normalizedUrl: string;
  displayName: string;
};

export function normalizeListing(raw: string): NormalizedListing {
  const input = raw.trim();
  if (!input) throw new Error("Enter a product URL or X handle.");

  const handleMatch = input.match(/^@?([A-Za-z0-9_]{1,15})$/);
  const source = handleMatch ? `https://x.com/${handleMatch[1]}` : input;
  const withProtocol = /^https?:\/\//i.test(source) ? source : `https://${source}`;

  let parsed: URL;
  try {
    parsed = new URL(withProtocol);
  } catch {
    throw new Error("Enter a valid public URL or X handle.");
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error("Only HTTP and HTTPS links are allowed.");
  }

  const hostname = parsed.hostname.toLowerCase().replace(/^www\./, "");
  if (!hostname.includes(".") && hostname !== "localhost") {
    throw new Error("Enter a valid public URL or X handle.");
  }
  if ([...BLOCKED_HOSTS].some((host) => hostname === host || hostname.endsWith(`.${host}`))) {
    throw new Error("Chat and invite links cannot be listed.");
  }

  parsed.protocol = "https:";
  parsed.hostname = hostname;
  parsed.username = "";
  parsed.password = "";
  parsed.hash = "";
  const playStoreId = hostname === "play.google.com" ? parsed.searchParams.get("id") : null;
  parsed.search = "";
  if (playStoreId) parsed.searchParams.set("id", playStoreId);
  parsed.pathname = parsed.pathname.replace(/\/+$/, "") || "/";

  let identityPath = "";
  if (PATH_IDENTITY_HOSTS.has(hostname)) {
    const parts = parsed.pathname.split("/").filter(Boolean);
    identityPath = hostname === "github.com" ? `/${parts.slice(0, 2).join("/")}` : parsed.pathname;
  }

  const identityQuery = playStoreId ? `?id=${encodeURIComponent(playStoreId)}` : "";
  const normalizedUrl = `https://${hostname}${identityPath === "/" ? "" : identityPath}${identityQuery}`.toLowerCase();
  const pathParts = identityPath.split("/").filter(Boolean);
  const displayName =
    hostname === "x.com" || hostname === "twitter.com"
      ? `@${pathParts[0] || hostname}`
      : hostname === "github.com" && pathParts.length >= 2
        ? `${pathParts[0]}/${pathParts[1]}`
        : hostname.replace(/^www\./, "");

  const filterText = `${input} ${normalizedUrl} ${displayName}`.toLowerCase();
  if (BLOCKED_WORDS.some((word) => filterText.includes(word))) {
    throw new Error("This listing cannot be accepted.");
  }

  return { url: parsed.toString(), normalizedUrl, displayName };
}

export function formatMoney(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

export function validateListingProfile(displayName: string, description: string) {
  const name = displayName.trim();
  const summary = description.trim();
  if (name.length < 2 || name.length > 60) throw new Error("Company title must be between 2 and 60 characters.");
  if (summary.length < 10 || summary.length > 160) throw new Error("Short description must be between 10 and 160 characters.");
  if (BLOCKED_WORDS.some((word) => `${name} ${summary}`.toLowerCase().includes(word))) {
    throw new Error("This listing profile cannot be accepted.");
  }
  return { displayName: name, description: summary };
}
