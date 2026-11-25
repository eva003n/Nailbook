/**
 * Static content for the public website: contact details, photos, FAQ copy.
 * Photos are from Unsplash (Unsplash License — free for commercial use).
 * Values in [BRACKETS] are placeholders for the salon to fill in.
 */
import { FALLBACK_CATEGORY_META, SERVICE_CATEGORY_META } from "@/lib/serviceCategory";
import type { ServiceCategory } from "@/lib/schemas";

export const SALON = {
  name: "Nailbook",
  area: "Westlands, Nairobi",
  address: "[STREET ADDRESS / BUILDING]",
  whatsappUrl: "https://wa.me/[WHATSAPP NUMBER]",
  instagramUrl: "https://instagram.com/[HANDLE]",
  mapsUrl: "https://maps.google.com/?q=Westlands,Nairobi",
  hoursShort: "Mon–Sat, 7am–7pm",
  hours: [
    { days: "Monday – Saturday", time: "7:00 AM – 7:00 PM" },
    { days: "Sunday", time: "Closed" },
  ],
} as const;

export interface SitePhoto {
  src: string;
  alt: string;
  /** CSS object-position, to keep the subject in frame when cropped */
  position?: string;
}

export const PHOTOS = {
  hero: { src: "/images/site/hero-red-nail-art.jpg", alt: "Woman with long red nail art framing her face", position: "center 30%" },
  technician: { src: "/images/site/technician-at-work.jpg", alt: "Nail technician shaping a client's gel nails" },
  gallery: [
    { src: "/images/site/gallery-tortoiseshell.jpg", alt: "Short nails in glossy black and tortoiseshell gel" },
    { src: "/images/site/gallery-gold-chrome.jpg", alt: "Almond nails in pearly gold chrome" },
    { src: "/images/site/pedicure-treatment.jpg", alt: "Technician in pink gloves giving a pedicure treatment" },
    { src: "/images/site/gallery-polish-wall.jpg", alt: "Wall of gel polish colours on gold shelves" },
  ],
} satisfies Record<string, SitePhoto | SitePhoto[]>;

interface CategoryContent {
  label: string;
  color: string;
  blurb: string;
  photo: SitePhoto;
}

const CATEGORY_CONTENT: Partial<Record<string, Omit<CategoryContent, "label" | "color">>> = {
  MANICURE: {
    blurb: "Plain manicures, gel polish on natural nails, or both together.",
    photo: { src: "/images/site/manicure-nude-gel.jpg", alt: "Hand with glossy nude gel manicure" },
  },
  PEDICURE: {
    blurb: "Soak, scrub and tidy — finished plain, with polish, or gel.",
    photo: { src: "/images/site/pedicure-station.jpg", alt: "Pedicure chair beside a white foot bath", position: "center 70%" },
  },
  ENHANCEMENTS: {
    blurb: "Overlays with gel, ombre finishes, and refills to keep them fresh.",
    photo: { src: "/images/site/enhancements-ombre.jpg", alt: "Square overlay nails with blue ombre tips", position: "center 45%" },
  },
  REMOVAL: {
    blurb: "Safe acrylic soak‑off that protects your natural nail.",
    photo: { src: "/images/site/removal-tools.jpg", alt: "Nail scissors, file and cuticle sticks on a towel" },
  },
};

/** Display order for categories on the website. */
export const CATEGORY_ORDER = ["MANICURE", "PEDICURE", "ENHANCEMENTS", "REMOVAL"];

export function categoryContent(category: string): CategoryContent {
  const meta =
    category in SERVICE_CATEGORY_META ? SERVICE_CATEGORY_META[category as ServiceCategory] : FALLBACK_CATEGORY_META;
  const extra = CATEGORY_CONTENT[category];
  const label = meta === FALLBACK_CATEGORY_META ? titleCase(category) : meta.label;
  return {
    label,
    color: meta.color,
    blurb: extra?.blurb ?? "",
    photo: extra?.photo ?? PHOTOS.technician,
  };
}

function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export interface FaqGroup {
  id: string;
  title: string;
  color: string;
  items: Array<{ q: string; a: string }>;
}

export const FAQ_GROUPS: FaqGroup[] = [
  {
    id: "booking",
    title: "Booking",
    color: "var(--color-swatch-manicure)",
    items: [
      {
        q: "How do I book?",
        a: "Tap Book now, choose your services, then a day and time. Add your name and phone number and send the request. It takes about three minutes and there is no app to download.",
      },
      {
        q: "Is my booking confirmed straight away?",
        a: "Your request reserves the time while the studio checks it. You'll get a WhatsApp message as soon as it's approved — usually within a few hours during opening times.",
      },
      {
        q: "Can I book more than one service?",
        a: "Yes. Select as many as you like on the first step. We add up the time each one needs and only show start times long enough for all of them.",
      },
      {
        q: "Do you take walk-ins?",
        a: "If a technician is free when you arrive, yes. Booking ahead is the only way to guarantee your time, especially on Saturdays.",
      },
    ],
  },
  {
    id: "pay",
    title: "Paying with M-Pesa",
    color: "var(--color-swatch-enhancements)",
    items: [
      {
        q: "When do I pay?",
        a: "Once the studio approves your booking you can pay from the My booking page. Enter your booking reference and phone number, tap Pay, and an M-Pesa prompt pops up on your phone. You can also pay at the studio.",
      },
      {
        q: "I didn't get the M-Pesa prompt. What now?",
        a: "Make sure your phone is unlocked and has signal, then tap Send the prompt again on the My booking page. Your booking is kept while you try again.",
      },
      {
        q: "Do I need a paybill or till number?",
        a: "No. The prompt comes straight to your phone — you only enter your M-Pesa PIN.",
      },
    ],
  },
  {
    id: "changes",
    title: "Changes & cancellations",
    color: "var(--color-swatch-pedicure)",
    items: [
      {
        q: "How do I reschedule or cancel?",
        a: "Message us on WhatsApp with your booking reference and we'll move or cancel it for you. Please give at least [CANCELLATION WINDOW] notice.",
      },
      {
        q: "What if I'm running late?",
        a: "Message us on WhatsApp as soon as you can. We'll do our best to fit you in, but a late start may shorten your service if the next client is booked.",
      },
    ],
  },
  {
    id: "reminders",
    title: "Confirmations & reminders",
    color: "var(--color-swatch-removal)",
    items: [
      {
        q: "How will I know my booking is approved?",
        a: "We send a WhatsApp message when the studio approves it. You can also check any time on the My booking page.",
      },
      {
        q: "Will you remind me?",
        a: "Yes. We send a WhatsApp reminder 24 hours before your appointment with the service, time and our location.",
      },
    ],
  },
  {
    id: "privacy",
    title: "Your data",
    color: "var(--color-plum)",
    items: [
      {
        q: "What do you do with my phone number?",
        a: "We use it only for your appointment: confirmations, reminders and the M-Pesa prompt. We handle your details in line with the Kenya Data Protection Act and never sell them.",
      },
      {
        q: "Can I ask you to delete my details?",
        a: "Yes. Send us a WhatsApp message asking for your data to be deleted and we will remove it.",
      },
    ],
  },
];
