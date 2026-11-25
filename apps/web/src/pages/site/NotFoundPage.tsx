import { SiteButtonLink, SiteContainer } from "@/components/site/SiteLayout";

export function NotFoundPage() {
  return (
    <SiteContainer className="flex flex-col items-start gap-6 py-28">
      <p className="font-display text-6xl font-bold text-mauve">404</p>
      <h1 className="font-display text-[clamp(2rem,4vw,3rem)] font-bold tracking-[-0.03em]">We couldn't find that page.</h1>
      <p className="max-w-136 text-lg text-ink-2">
        The link may be old. If you're staff, the salon app now lives at <strong>/admin</strong>.
      </p>
      <div className="flex flex-wrap gap-3">
        <SiteButtonLink to="/" size="lg">Go to the homepage</SiteButtonLink>
        <SiteButtonLink to="/admin/login" size="lg" variant="secondary">Staff login</SiteButtonLink>
      </div>
    </SiteContainer>
  );
}
