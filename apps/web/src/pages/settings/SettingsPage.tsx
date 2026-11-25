/**
 * Settings — grouped sections. Desktop shows a sticky section menu on the
 * left that jumps to each section; mobile stacks the sections.
 */
import PageHeader from "@/components/layout/PageHeader";
import BusinessSection from "./sections/BusinessSection";
import HoursSection from "./sections/HoursSection";
import ServicesSection from "./sections/ServicesSection";
import RemindersSection from "./sections/RemindersSection";
import WhatsAppSection from "./sections/WhatsAppSection";
import MPesaSection from "./sections/MPesaSection";
import AccountSection from "./sections/AccountSection";
import { NotificationSection } from "./sections/NotificationSection";
import { AppInstallSection } from "./sections/AppInstallSection";
import { AppearanceSection } from "./sections/AppearanceSection";
import { useInstallPromptContext } from "@/hooks/useInstallPrompt";

interface SectionProps {
  id: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}

function Section({ id, title, description, children }: SectionProps) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-6">
      <div className="mb-3">
        <h2 id={`${id}-title`} className="font-display text-xl font-semibold tracking-[-0.01em]">
          {title}
        </h2>
        {description && <p className="mt-0.5 text-sm text-ink-2">{description}</p>}
      </div>
      {children}
    </section>
  );
}

export default function SettingsPage() {
  const { isInstallable } = useInstallPromptContext();

  const sections: (SectionProps & { show?: boolean })[] = [
    { id: "business", title: "Business", description: "Salon name and contact details.", children: <BusinessSection /> },
    { id: "hours", title: "Opening hours", description: "Clients can only book inside these hours.", children: <HoursSection /> },
    { id: "services", title: "Services", description: "What clients can book, grouped by category.", children: <ServicesSection /> },
    { id: "notifications", title: "Notifications", description: "Alerts on this device when bookings come in.", children: <NotificationSection /> },
    { id: "appearance", title: "Appearance", description: "Light, dark, or follow this device.", children: <AppearanceSection /> },
    { id: "install", title: "Install the app", children: <AppInstallSection />, show: isInstallable },
    { id: "reminders", title: "Reminders", description: "WhatsApp reminders sent before each visit.", children: <RemindersSection /> },
    { id: "whatsapp", title: "WhatsApp", children: <WhatsAppSection /> },
    { id: "mpesa", title: "M-Pesa", children: <MPesaSection /> },
    { id: "account", title: "Account", children: <AccountSection /> },
  ];
  const visible = sections.filter((s) => s.show !== false);

  return (
    <div className="flex flex-col pb-10">
      <PageHeader title="Settings" subtitle="How the salon shows up to clients on WhatsApp and the website." />

      <div className="flex items-start gap-10 px-5 pt-4 md:px-8 lg:px-12">
        <nav aria-label="Settings sections" className="sticky top-6 hidden w-50 shrink-0 flex-col gap-0.5 lg:flex">
          {visible.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="flex h-10 items-center rounded-[10px] px-3 text-[0.9375rem] font-medium text-ink-2 hover:bg-petal hover:text-plum-deep"
            >
              {s.title}
            </a>
          ))}
        </nav>

        <div className="flex min-w-0 max-w-3xl flex-1 flex-col gap-10">
          {visible.map(({ id, title, description, children }) => (
            <Section key={id} id={id} title={title} description={description}>
              {children}
            </Section>
          ))}
        </div>
      </div>
    </div>
  );
}
