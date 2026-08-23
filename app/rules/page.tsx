import { SiteHeader } from "@/app/components/site-header";

export const metadata = { title: "Rules · Podium" };

export default function RulesPage() {
  return (
    <main className="rules-page">
      <SiteHeader cta={false} />
      <article className="rules-content narrow-shell">
        <span className="section-kicker">THE FINE PRINT</span><h1>Rules of<br /><i>the podium.</i></h1>
        <div className="rule-list">
          <section><b>01</b><div><h2>Ranking</h2><p>Listings are ranked by total confirmed dollars paid. Higher totals rank first. If totals are tied, the older listing ranks first.</p></div></section>
          <section><b>02</b><div><h2>Payments</h2><p>New listings require at least $5. You can choose any whole-dollar total, or use the live #1 price to lead. Existing listings pay only the difference. Payment must be confirmed by Stripe before a rank changes.</p></div></section>
          <section><b>03</b><div><h2>Final sale</h2><p><strong>All bids are final. No refunds.</strong> A higher bid may replace your position at any time, and payment does not guarantee traffic, sales, or a minimum time at any rank.</p></div></section>
          <section><b>04</b><div><h2>Acceptable links</h2><p>No adult content, illegal material, malware, impersonation, chat invites, or deceptive destinations. Prohibited listings may be removed without refund.</p></div></section>
          <section><b>05</b><div><h2>Clicks</h2><p>Outbound visits pass through our redirect so the public click count can be incremented. Counts are informational and may include automated or repeat visits.</p></div></section>
        </div>
      </article>
    </main>
  );
}
