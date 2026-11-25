import { Link } from "react-router-dom";
import { ArrowRight, Clock, MapPin, MessageCircle, Smartphone } from "lucide-react";
import NailSwatch from "@/components/ui/NailSwatch";
import { formatKes } from "@/lib/format";
import { SiteButtonLink, SiteContainer } from "@/components/site/SiteLayout";
import { usePublicServices } from "./hooks/usePublic";
import { CATEGORY_ORDER, FAQ_GROUPS, PHOTOS, SALON, categoryContent } from "./siteContent";

const STEPS = [
  {
    title: "Choose your service",
    body: "Manicure, pedicure, overlays or removal — prices and durations shown up front.",
  },
  {
    title: "Pick a time that works",
    body: "You only see times that are actually open, based on how long your services take.",
  },
  {
    title: "Get confirmed on WhatsApp",
    body: "The studio approves your booking, then you can pay with M‑Pesa straight from your phone.",
  },
];

/** "From KES 1,000" per category, from the live price list. */
function useCategoryPrices() {
  const { data } = usePublicServices();
  const lowest = new Map<string, number>();
  for (const s of data ?? []) {
    const current = lowest.get(s.category);
    if (current === undefined || s.priceKes < current) lowest.set(s.category, s.priceKes);
  }
  return lowest;
}

function SectionHeading({ id, title, subtitle }: { id: string; title: string; subtitle?: string }) {
  return (
    <div className="flex max-w-160 flex-col gap-2.5">
      <h2 id={id} className="font-display text-[clamp(2rem,3.4vw,2.75rem)] leading-[1.1] font-bold tracking-[-0.03em]">
        {title}
      </h2>
      {subtitle && <p className="text-[1.0625rem] leading-relaxed text-ink-2">{subtitle}</p>}
    </div>
  );
}

export function HomePage() {
  const prices = useCategoryPrices();
  const faqTeaser = FAQ_GROUPS.flatMap((g) => g.items).slice(1, 4);

  return (
    <>
      {/* Hero */}
      <SiteContainer className="flex flex-wrap items-center gap-14 pt-14 pb-20 md:pt-18 md:pb-22">
        <div className="flex min-w-0 flex-[1_1_460px] flex-col gap-6">
          <p className="inline-flex items-center gap-2 self-start rounded-full bg-petal px-3.5 py-1.5 text-sm font-semibold text-plum-deep">
            <MapPin size={16} aria-hidden="true" />
            Nail studio · {SALON.area}
          </p>
          <h1 className="font-display text-[clamp(2.75rem,5.4vw,4.75rem)] leading-[1.02] font-bold tracking-[-0.035em]">
            Book your next set in under three minutes.
          </h1>
          <p className="max-w-136 text-[1.1875rem] leading-relaxed text-ink-2">
            Pick a service and a time, and get your confirmation on WhatsApp. No app to download, no calling around.
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <SiteButtonLink to="/book" size="lg">
              Book an appointment
              <ArrowRight size={18} aria-hidden="true" />
            </SiteButtonLink>
            <SiteButtonLink to="/services" size="lg" variant="secondary">
              See services &amp; prices
            </SiteButtonLink>
          </div>
          <ul className="mt-2 flex flex-wrap gap-x-6 gap-y-2.5 text-[0.9375rem] text-ink-2">
            <li className="flex items-center gap-2"><Clock size={18} className="text-plum" aria-hidden="true" />{SALON.hoursShort}</li>
            <li className="flex items-center gap-2"><Smartphone size={18} className="text-plum" aria-hidden="true" />Pay with M‑Pesa</li>
            <li className="flex items-center gap-2"><MessageCircle size={18} className="text-plum" aria-hidden="true" />Reminders on WhatsApp</li>
          </ul>
        </div>

        <div className="relative min-w-0 flex-[1_1_420px]">
          <div className="h-[clamp(440px,50vw,640px)] overflow-hidden rounded-4xl bg-petal">
            <img
              src={PHOTOS.hero.src}
              alt={PHOTOS.hero.alt}
              width={1200}
              height={1800}
              fetchPriority="high"
              className="h-full w-full object-cover"
              style={{ objectPosition: PHOTOS.hero.position }}
            />
          </div>
          <div className="absolute right-6 -bottom-9 left-6 flex flex-col gap-3.5 rounded-[20px] border border-line bg-surface p-5 shadow-[0_18px_40px_rgba(43,29,39,0.12)]">
            <span className="text-[0.8125rem] font-semibold tracking-[0.04em] text-ink-2 uppercase">How it looks on your phone</span>
            <div className="flex items-center gap-3.5">
              <NailSwatch color="var(--color-swatch-manicure)" width={22} height={36} />
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-[1.0625rem] font-bold">Gel + Full Manicure</span>
                <span className="text-[0.9375rem] text-ink-2">Approved · reminder the day before</span>
              </div>
            </div>
          </div>
        </div>
      </SiteContainer>

      {/* How it works */}
      <section aria-labelledby="how" className="border-y border-line bg-surface">
        <SiteContainer className="flex flex-col gap-10 py-24">
          <SectionHeading id="how" title="How booking works" subtitle="Three steps, all from your phone." />
          <ol className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-5">
            {STEPS.map((step, i) => (
              <li key={step.title} className="flex flex-col gap-3 rounded-[20px] border border-line bg-paper p-7">
                <span className="font-display text-[2.5rem] leading-none font-bold text-mauve">0{i + 1}</span>
                <h3 className="text-xl font-bold">{step.title}</h3>
                <p className="leading-relaxed text-ink-2">{step.body}</p>
              </li>
            ))}
          </ol>
        </SiteContainer>
      </section>

      {/* Services */}
      <section aria-labelledby="services">
        <SiteContainer className="flex flex-col gap-10 py-24">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeading id="services" title="Services" subtitle="Clear prices, no surprises at the chair." />
            <Link to="/services" className="py-2.5 font-semibold text-plum-deep hover:underline">
              View full price list →
            </Link>
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-5">
            {CATEGORY_ORDER.map((category) => {
              const c = categoryContent(category);
              const from = prices.get(category);
              return (
                <Link
                  key={category}
                  to={`/services#${category.toLowerCase()}`}
                  className="group flex flex-col overflow-hidden rounded-3xl border border-line bg-surface text-ink transition-shadow hover:shadow-[0_10px_30px_rgba(43,29,39,0.08)]"
                >
                  <img
                    src={c.photo.src}
                    alt={c.photo.alt}
                    width={1200}
                    height={800}
                    loading="lazy"
                    className="h-50 w-full object-cover"
                    style={{ objectPosition: c.photo.position }}
                  />
                  <div className="flex flex-1 flex-col gap-3 p-7">
                    <h3 className="flex items-center gap-2.5 text-[1.375rem] font-bold">
                      <NailSwatch color={c.color} width={12} height={20} />
                      {c.label}
                    </h3>
                    <p className="text-[0.9375rem] leading-normal text-ink-2">{c.blurb}</p>
                    {from !== undefined && (
                      <p className="mt-auto text-[0.9375rem] text-ink-2">
                        From <strong className="text-lg text-ink">{formatKes(from)}</strong>
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </SiteContainer>
      </section>

      {/* Gallery */}
      <section aria-labelledby="work">
        <SiteContainer className="flex flex-col gap-8 pb-24">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeading id="work" title="Recent work" />
            <a href={SALON.instagramUrl} className="py-2.5 font-semibold text-plum-deep hover:underline">
              Follow on Instagram →
            </a>
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
            {PHOTOS.gallery.map((photo) => (
              <img
                key={photo.src}
                src={photo.src}
                alt={photo.alt}
                width={1200}
                height={1500}
                loading="lazy"
                className="aspect-4/5 w-full rounded-[20px] bg-petal object-cover"
              />
            ))}
          </div>
        </SiteContainer>
      </section>

      {/* Visit */}
      <section id="visit" aria-labelledby="visit-h" className="bg-toast text-white">
        <SiteContainer className="flex flex-wrap gap-12 py-24">
          <div className="flex min-w-0 flex-[1_1_340px] flex-col gap-6">
            <h2 id="visit-h" className="font-display text-[clamp(2rem,3.4vw,2.75rem)] leading-[1.1] font-bold tracking-[-0.03em]">
              Visit the studio
            </h2>
            <address className="text-[1.0625rem] leading-relaxed text-white/85 not-italic">
              {SALON.address}
              <br />
              {SALON.area}
            </address>
            <table className="max-w-88 border-collapse">
              <caption className="pb-2 text-left font-bold">Opening hours</caption>
              <tbody>
                {SALON.hours.map((row) => (
                  <tr key={row.days} className="border-t border-white/20 last:border-b">
                    <th scope="row" className="py-2 text-left font-medium text-white/85">{row.days}</th>
                    <td className="py-2 text-right">{row.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex flex-wrap gap-3">
              <a href={SALON.whatsappUrl} className="inline-flex min-h-12 items-center gap-2.5 rounded-full bg-[#1f8f4e] px-5.5 font-semibold text-white">
                <MessageCircle size={18} aria-hidden="true" />
                Chat on WhatsApp
              </a>
              <a href={SALON.mapsUrl} className="inline-flex min-h-12 items-center rounded-full border border-white/40 px-5.5 font-semibold text-white">
                Get directions
              </a>
            </div>
          </div>
          <img
            src={PHOTOS.technician.src}
            alt={PHOTOS.technician.alt}
            width={1200}
            height={800}
            loading="lazy"
            className="max-h-110 min-h-80 w-full min-w-0 flex-[1_1_340px] rounded-3xl object-cover"
          />
          <div className="flex flex-[1_1_100%] flex-wrap items-center justify-between gap-5 rounded-3xl bg-white/8 px-8 py-7">
            <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-1.5">
              <h3 className="text-[1.375rem] font-bold">Already booked?</h3>
              <p className="leading-relaxed text-white/85">
                Check whether your booking is approved, and pay with M‑Pesa, using your booking reference and phone number.
              </p>
            </div>
            <SiteButtonLink to="/my-booking" variant="light">My booking</SiteButtonLink>
          </div>
        </SiteContainer>
      </section>

      {/* FAQ teaser */}
      <section aria-labelledby="faq-h">
        <SiteContainer className="flex flex-wrap gap-12 py-24">
          <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-4">
            <SectionHeading id="faq-h" title="Good to know" subtitle="The questions we get asked most." />
            <Link to="/faq" className="py-2.5 font-semibold text-plum-deep hover:underline">All FAQs →</Link>
          </div>
          <dl className="min-w-0 flex-[2_1_520px]">
            {faqTeaser.map((item) => (
              <div key={item.q} className="flex flex-col gap-2 border-t border-line py-5.5 last:border-b">
                <dt className="text-lg font-bold">{item.q}</dt>
                <dd className="leading-relaxed text-ink-2">{item.a}</dd>
              </div>
            ))}
          </dl>
        </SiteContainer>
      </section>

      {/* CTA band */}
      <SiteContainer className="pb-24">
        <div className="flex flex-wrap items-center justify-between gap-6 rounded-4xl bg-petal px-10 py-14">
          <h2 className="flex-[1_1_420px] font-display text-[clamp(1.75rem,3vw,2.5rem)] leading-[1.1] font-bold tracking-[-0.03em]">
            Your next set is a few taps away.
          </h2>
          <SiteButtonLink to="/book" size="lg">Book an appointment</SiteButtonLink>
        </div>
      </SiteContainer>
    </>
  );
}
