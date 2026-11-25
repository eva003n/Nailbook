import { useEffect, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import NailSwatch from "@/components/ui/NailSwatch";
import ErrorState from "@/components/ui/ErrorState";
import Skeleton from "@/components/ui/Skeleton";
import { formatKes } from "@/lib/format";
import type { PublicService } from "@/lib/schemas";
import { SiteButtonLink, SiteContainer } from "@/components/site/SiteLayout";
import { usePublicServices } from "./hooks/usePublic";
import { CATEGORY_ORDER, categoryContent } from "./siteContent";

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hrs = minutes / 60;
  return `~${Number.isInteger(hrs) ? hrs : hrs.toFixed(1)} hr${hrs === 1 ? "" : "s"}`;
}

/** Services grouped by category, known categories first in a fixed order. */
function groupByCategory(services: PublicService[]) {
  const groups = new Map<string, PublicService[]>();
  for (const s of services) groups.set(s.category, [...(groups.get(s.category) ?? []), s]);
  const rank = (c: string) => (CATEGORY_ORDER.includes(c) ? CATEGORY_ORDER.indexOf(c) : CATEGORY_ORDER.length);
  return [...groups.entries()].sort(([a], [b]) => rank(a) - rank(b));
}

export function ServicesPage() {
  const { data, isLoading, isError, refetch } = usePublicServices();
  const groups = useMemo(() => groupByCategory(data ?? []), [data]);
  const { hash } = useLocation();

  // client-side navigation to /services#pedicure doesn't scroll by itself
  useEffect(() => {
    if (!hash || groups.length === 0) return;
    document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [hash, groups.length]);

  return (
    <>
      <SiteContainer className="flex flex-wrap items-end justify-between gap-6 pt-18 pb-8">
        <div className="flex min-w-0 flex-[1_1_520px] flex-col gap-4">
          <h1 className="font-display text-[clamp(2.5rem,4.6vw,4rem)] leading-[1.04] font-bold tracking-[-0.035em]">
            Services &amp; prices
          </h1>
          <p className="max-w-144 text-lg leading-relaxed text-ink-2">
            Prices are in Kenyan shillings. Pick more than one service when you book and we'll block out enough time for all of them.
          </p>
        </div>
        {groups.length > 0 && (
          <nav aria-label="Categories" className="flex flex-wrap gap-2">
            {groups.map(([category]) => {
              const c = categoryContent(category);
              return (
                <a
                  key={category}
                  href={`#${category.toLowerCase()}`}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-surface px-4 text-[0.9375rem] font-semibold text-ink"
                >
                  <NailSwatch color={c.color} width={10} height={16} />
                  {c.label}
                </a>
              );
            })}
          </nav>
        )}
      </SiteContainer>

      <SiteContainer className="flex flex-col gap-7 pt-6 pb-24">
        {isLoading &&
          Array.from({ length: 3 }, (_, i) => <Skeleton key={i} shape="card" height={280} />)}

        {isError && (
          <ErrorState
            heading="We couldn't load the price list"
            message="Check your connection and try again."
            onRetry={() => void refetch()}
          />
        )}

        {groups.map(([category, services]) => {
          const c = categoryContent(category);
          const headingId = `h-${category.toLowerCase()}`;
          return (
            <section
              key={category}
              id={category.toLowerCase()}
              aria-labelledby={headingId}
              className="flex scroll-mt-24 flex-wrap gap-8 rounded-[28px] border border-line bg-surface p-6 sm:p-8"
            >
              <div className="flex min-w-0 flex-[1_1_260px] flex-col gap-3.5">
                <img
                  src={c.photo.src}
                  alt={c.photo.alt}
                  width={1200}
                  height={800}
                  loading="lazy"
                  className="h-50 w-full rounded-[18px] bg-petal object-cover"
                  style={{ objectPosition: c.photo.position }}
                />
                <h2 id={headingId} className="flex items-center gap-2.5 font-display text-[2rem] font-bold tracking-[-0.025em]">
                  <NailSwatch color={c.color} width={14} height={22} />
                  {c.label}
                </h2>
                {c.blurb && <p className="leading-relaxed text-ink-2">{c.blurb}</p>}
              </div>
              <ul className="flex min-w-0 flex-[2_1_560px] flex-col">
                {services.map((s) => (
                  <li key={s.id} className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-divider py-5 last:border-b-0">
                    <div className="flex min-w-0 flex-[1_1_260px] flex-col gap-1">
                      <h3 className="text-lg font-bold">{s.name}</h3>
                      {s.description && <p className="text-[0.9375rem] text-ink-2">{s.description}</p>}
                    </div>
                    <span className="text-sm text-ink-2">{formatDuration(s.durationMinutes)}</span>
                    <span className="min-w-26 text-right text-lg font-bold">{formatKes(s.priceKes)}</span>
                    <Link
                      to={`/book?service=${s.id}`}
                      aria-label={`Book ${s.name}`}
                      className="inline-flex min-h-11 items-center rounded-full border border-line px-4.5 text-[0.9375rem] font-semibold text-plum-deep hover:bg-petal"
                    >
                      Book
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}

        <div className="flex flex-wrap items-center justify-between gap-5 rounded-[28px] bg-toast p-10 text-white">
          <h2 className="flex-[1_1_380px] font-display text-[clamp(1.625rem,2.6vw,2.25rem)] font-bold tracking-[-0.03em]">
            Found the one? Grab a slot.
          </h2>
          <SiteButtonLink to="/book" size="lg" variant="light">Book an appointment</SiteButtonLink>
        </div>
      </SiteContainer>
    </>
  );
}
