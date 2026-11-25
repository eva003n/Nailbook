import { useState } from "react";
import { clsx } from "clsx";
import { MessageCircle, Plus } from "lucide-react";
import NailSwatch from "@/components/ui/NailSwatch";
import { SiteButtonLink, SiteContainer } from "@/components/site/SiteLayout";
import { FAQ_GROUPS, SALON } from "./siteContent";

export function FaqPage() {
  const [topic, setTopic] = useState("all");
  const [open, setOpen] = useState<string | null>("booking-0");
  const topics = [{ id: "all", title: "All" }, ...FAQ_GROUPS.map((g) => ({ id: g.id, title: g.title }))];
  const groups = FAQ_GROUPS.filter((g) => topic === "all" || g.id === topic);

  return (
    <SiteContainer className="flex flex-wrap items-start gap-12 pt-18 pb-24">
      <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-6 lg:sticky lg:top-26">
        <h1 className="font-display text-[clamp(2.5rem,4.6vw,4rem)] leading-[1.04] font-bold tracking-[-0.035em]">
          Questions, answered
        </h1>
        <p className="text-[1.0625rem] leading-relaxed text-ink-2">
          Everything about booking, paying with M‑Pesa and changing your appointment.
        </p>
        <div role="group" aria-label="Filter by topic" className="flex flex-wrap gap-2">
          {topics.map((t) => {
            const on = topic === t.id;
            return (
              <button
                key={t.id}
                type="button"
                aria-pressed={on}
                onClick={() => setTopic(t.id)}
                className={clsx(
                  "min-h-11 rounded-full border-[1.5px] px-4 text-[0.9375rem] font-semibold transition-colors",
                  on ? "border-ink bg-ink text-paper" : "border-border-strong bg-surface text-ink hover:bg-petal",
                )}
              >
                {t.title}
              </button>
            );
          })}
        </div>
        <div className="mt-2 flex flex-col gap-3.5 rounded-[20px] bg-toast p-6 text-white">
          <h2 className="text-lg font-bold">Still stuck?</h2>
          <p className="text-[0.9375rem] leading-normal text-white/85">
            Message us on WhatsApp and a real person at the studio will help.
          </p>
          <a
            href={SALON.whatsappUrl}
            className="inline-flex min-h-12 items-center gap-2.5 self-start rounded-full bg-[#1f8f4e] px-5 font-semibold text-white"
          >
            <MessageCircle size={18} aria-hidden="true" />
            Chat on WhatsApp
          </a>
        </div>
      </div>

      <div className="flex min-w-0 flex-[2_1_560px] flex-col gap-10">
        {groups.map((g) => (
          <section key={g.id} aria-labelledby={`faq-${g.id}`} className="flex flex-col gap-2">
            <h2 id={`faq-${g.id}`} className="mb-2 flex items-center gap-2.5 font-display text-2xl font-bold tracking-[-0.02em]">
              <NailSwatch color={g.color} width={12} height={20} />
              {g.title}
            </h2>
            <div className="overflow-hidden rounded-[20px] border border-line bg-surface">
              {g.items.map((item, i) => {
                const key = `${g.id}-${i}`;
                const expanded = open === key;
                const panelId = `faq-panel-${key}`;
                return (
                  <div key={key} className={clsx(i > 0 && "border-t border-divider")}>
                    <h3>
                      <button
                        type="button"
                        aria-expanded={expanded}
                        aria-controls={panelId}
                        onClick={() => setOpen(expanded ? null : key)}
                        className={clsx(
                          "flex min-h-16 w-full items-center justify-between gap-4 px-6 py-4.5 text-left text-[1.0625rem] font-bold",
                          expanded ? "bg-paper" : "bg-surface hover:bg-paper",
                        )}
                      >
                        <span>{item.q}</span>
                        <span
                          aria-hidden="true"
                          className={clsx(
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-transform",
                            expanded ? "rotate-45 bg-plum-strong text-white" : "bg-petal text-plum-deep",
                          )}
                        >
                          <Plus size={16} strokeWidth={2.4} />
                        </span>
                      </button>
                    </h3>
                    {expanded && (
                      <div id={panelId} className="bg-paper px-6 pb-5.5">
                        <p className="max-w-176 leading-relaxed text-ink-2">{item.a}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}

        <div className="flex flex-wrap items-center justify-between gap-5 rounded-[28px] bg-petal p-8">
          <h2 className="flex-[1_1_280px] font-display text-[1.75rem] font-bold tracking-[-0.03em]">Ready when you are.</h2>
          <SiteButtonLink to="/book" size="lg">Book an appointment</SiteButtonLink>
        </div>
      </div>
    </SiteContainer>
  );
}
