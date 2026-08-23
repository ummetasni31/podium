"use client";

import Image from "next/image";
import { FormEvent, useState } from "react";

type CategoryOption = { slug: string; name: string };
type ExistingProfile = { id: string; displayName: string; description: string | null; hasLogo: boolean };

function suggestedTitle(value: string) {
  const handle = value.trim().match(/^@?([A-Za-z0-9_]{1,15})$/);
  if (handle) return `@${handle[1]}`;
  try {
    const source = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    const host = new URL(source).hostname.replace(/^www\./, "").split(".")[0];
    return host.split(/[-_]/).filter(Boolean).map((part) => part[0]?.toUpperCase() + part.slice(1)).join(" ");
  } catch {
    return "";
  }
}

export function BidForm({
  claimCents,
  categories,
  initialCategory = "",
  initialTargetCents,
}: {
  claimCents: number;
  categories: CategoryOption[];
  initialCategory?: string;
  initialTargetCents?: number;
}) {
  const [value, setValue] = useState("");
  const [category, setCategory] = useState(initialCategory);
  const [targetDollars, setTargetDollars] = useState((initialTargetCents ?? claimCents) / 100);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [description, setDescription] = useState("");
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [existingProfile, setExistingProfile] = useState<ExistingProfile | null>(null);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);
  const [loading, setLoading] = useState(false);

  async function openDetails(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setChecking(true);
    try {
      const response = await fetch(`/api/listings?url=${encodeURIComponent(value)}`, { cache: "no-store" });
      const result = (await response.json()) as { existing?: ExistingProfile | null; error?: string };
      if (!response.ok) throw new Error(result.error || "This listing could not be checked.");
      setExistingProfile(result.existing ?? null);
      if (result.existing) {
        setDisplayName(result.existing.displayName);
        setDescription(result.existing.description ?? "Existing listing profile");
      } else if (!displayName) {
        setDisplayName(suggestedTitle(value));
      }
      setDetailsOpen(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "This listing could not be checked.");
    } finally {
      setChecking(false);
    }
  }

  function chooseLogo(file: File | undefined) {
    setError("");
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setError("Choose a PNG, JPEG, or WebP logo.");
      return;
    }
    if (file.size > 512 * 1024) {
      setError("Logo must be 512 KB or smaller.");
      return;
    }
    setLogo(file);
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(typeof reader.result === "string" ? reader.result : "");
    reader.readAsDataURL(file);
  }

  async function startCheckout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const payload = new FormData();
      payload.set("url", value);
      payload.set("category", category);
      payload.set("targetTotalCents", String(Math.round(targetDollars * 100)));
      payload.set("displayName", displayName);
      payload.set("description", description);
      if (logo) payload.set("logo", logo);

      const response = await fetch("/api/listings", { method: "POST", body: payload });
      const result = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !result.url) throw new Error(result.error || "Checkout could not be started.");
      window.location.assign(result.url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <div className="bid-panel">
      <form className="bid-form" onSubmit={openDetails}>
        <div className="bid-form-row">
          <label className="url-field" htmlFor="listing-url">
            <span aria-hidden="true">◎</span>
            <input id="listing-url" name="url" type="text" value={value} onChange={(event) => setValue(event.target.value)} placeholder="Your product URL or @handle" autoComplete="url" maxLength={2048} required />
          </label>
          <label className="category-field" htmlFor="listing-category">
            <select className={category ? undefined : "is-placeholder"} id="listing-category" value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Product category" required>
              <option value="" disabled>Choose category</option>
              {categories.map((item) => <option value={item.slug} key={item.slug}>{item.name}</option>)}
            </select>
          </label>
          <label className="amount-field" htmlFor="target-total">
            <span>$</span>
            <input id="target-total" type="number" min="5" max="999999" step="1" value={targetDollars} onChange={(event) => setTargetDollars(Number(event.target.value))} aria-label="Target total bid in dollars" required />
          </label>
          <button type="submit" disabled={checking}>{checking ? "Checking…" : "Place bid"}</button>
        </div>
        {/*<div className="form-meta">*/}
        {/*  <span>Already listed? Use the same URL and pay only the difference.</span>*/}
        {/*  {targetDollars !== claimCents / 100 && <button className="text-button" type="button" onClick={() => setTargetDollars(claimCents / 100)}>Use #1 price</button>}*/}
        {/*</div>*/}
        {/*<p className="final-copy">Secure checkout by Stripe · All bids are final. No refunds.</p>*/}
        {!detailsOpen && error && <p className="form-error" role="alert">{error}</p>}
      </form>

      {detailsOpen && (
        <div className="details-overlay" role="presentation">
          <section className="details-modal" role="dialog" aria-modal="true" aria-labelledby="listing-details-title">
            <button className="details-close" type="button" onClick={() => setDetailsOpen(false)} aria-label="Close listing details">×</button>
            <span className="section-kicker">{existingProfile ? "TOP UP LISTING" : "LISTING PROFILE"}</span>
            <h2 id="listing-details-title">{existingProfile ? "Profile found." : "Make your spot recognizable."}</h2>
            <p className="details-intro">{existingProfile ? "This saved identity will stay unchanged. You will pay only the difference to reach your new total." : "Add the identity visitors will see on the board before continuing to secure payment."}</p>
            <form className="details-form" onSubmit={startCheckout}>
              {existingProfile ? (
                <div className="existing-profile">
                  <div className="existing-logo">{existingProfile.hasLogo ? <Image src={`/api/listings/${existingProfile.id}/logo`} width={72} height={72} alt={`${existingProfile.displayName} logo`} unoptimized /> : existingProfile.displayName.slice(0, 1).toUpperCase()}</div>
                  <div><strong>{existingProfile.displayName}</strong><p>{existingProfile.description || "No description provided."}</p></div>
                </div>
              ) : (
                <>
                  <label className="logo-upload">
                    <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => chooseLogo(event.target.files?.[0])} />
                    {logoPreview ? <Image src={logoPreview} width={112} height={112} alt="Selected company logo" unoptimized /> : <span><b>+</b>Upload logo<small>PNG, JPG or WebP<br />Max 512 KB</small></span>}
                  </label>
                  <div className="profile-fields">
                    <label htmlFor="company-title">Company title<input id="company-title" type="text" minLength={2} maxLength={60} value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Acme" required /></label>
                    <label htmlFor="company-description">Short description<textarea id="company-description" minLength={10} maxLength={160} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Explain what your product does in one clear sentence." rows={3} required /></label>
                    <span className="character-count">{description.length}/160</span>
                  </div>
                </>
              )}
              {error && <p className="modal-error" role="alert">{error}</p>}
              <div className="details-actions">
                <button type="button" onClick={() => setDetailsOpen(false)}>Back</button>
                <button type="submit" disabled={loading}>{loading ? "Opening Stripe…" : "Continue to payment"}</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
