import Link from "next/link";
import { ThemeToggle } from "@/app/components/theme-toggle";

export function SiteHeader({ cta = true }: { cta?: boolean }) {
  return (
    <nav className="site-nav narrow-shell">
      <Link className="wordmark" href="/">PODIUM<span>°</span></Link>
      <div className="nav-links">
        <Link href="/#leaderboard">Leaderboard</Link>
        <Link href="/categories">Categories</Link>
        <Link href="/about">About</Link>
        <Link href="/rules">Rules</Link>
      </div>
      <div className="nav-actions">
        <ThemeToggle />
        {cta && <Link className="nav-cta" href="/#claim">PODIUM</Link>}
      </div>
    </nav>
  );
}
