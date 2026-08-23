import Link from "next/link";
import { SiteHeader } from "@/app/components/site-header";

export const metadata = { title: "Payment received · Podium" };

export default function SuccessPage() {
  return (
    <main className="status-page"><SiteHeader cta={false} /><div className="status-wrap"><div className="status-card"><span className="status-mark">✓</span><span className="section-kicker">CHECKOUT COMPLETE</span><h1>Your bid is being confirmed.</h1><p>Stripe will notify Podium directly. Your position will appear on the live board as soon as payment is verified.</p><Link href="/">Return to the leaderboard</Link></div></div></main>
  );
}
