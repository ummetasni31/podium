import Link from "next/link";
import { SiteHeader } from "@/app/components/site-header";

export const metadata = { title: "About · Podium" };

export default function AboutPage() {
  return (
    <main className="about-page">
      <SiteHeader />
      <section className="about-hero narrow-shell">
        <span className="section-kicker">WHY PODIUM EXISTS</span>
        <h1>The billboard<br />that <i>fights back.</i></h1>
        <p>Most product directories reward whoever knows the algorithm. Podium makes the mechanism visible: every position is backed by a real payment, every click is counted, and every challenger plays by the same rules.</p>
      </section>
      <section className="about-principles narrow-shell">
        <article><span>01</span><h2>Radically legible</h2><p>No secret score and no editorial favorites. Confirmed dollars determine rank; time breaks a tie.</p></article>
        <article><span>02</span><h2>Built for motion</h2><p>A position is never permanent. Products can top up, communities can rally, and the board keeps moving.</p></article>
        <article><span>03</span><h2>Attention with proof</h2><p>Outbound visits are counted publicly, so backing is paired with a visible signal of real attention.</p></article>
      </section>
      <section className="about-callout narrow-shell">
        <div><span className="section-kicker">THE SIMPLE PROMISE</span><h2>You pay for position.<br />We make the contest public.</h2></div>
        <Link href="/#claim">Enter the board</Link>
      </section>
    </main>
  );
}
