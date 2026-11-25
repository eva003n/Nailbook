import type { Booking, Service, ServiceCategory } from "@/lib/schemas";

/** Text on the pastel swatches stays dark in both themes. */
const ON_SWATCH = "#2b1d27";

/** Swatch colour + label for each service category (matches the Figma legend). */
export const SERVICE_CATEGORY_META: Record<ServiceCategory, { label: string; color: string; onColor: string }> = {
  MANICURE: { label: "Manicure", color: "var(--color-swatch-manicure)", onColor: ON_SWATCH },
  PEDICURE: { label: "Pedicure", color: "var(--color-swatch-pedicure)", onColor: ON_SWATCH },
  ENHANCEMENTS: { label: "Enhancements", color: "var(--color-swatch-enhancements)", onColor: "#ffffff" },
  REMOVAL: { label: "Removal", color: "var(--color-swatch-removal)", onColor: ON_SWATCH },
};

export const FALLBACK_CATEGORY_META = { label: "Service", color: "var(--color-mauve)", onColor: ON_SWATCH };

/** First service id on a booking (new `services[]` shape, falling back to legacy `service`). */
export function primaryServiceId(booking: Booking): string | undefined {
  return booking.services?.[0]?.service.id ?? booking.service?.id;
}

/** Display name for a booking's services, e.g. "Gel manicure +1 more". */
export function bookingServiceLabel(booking: Booking): string {
  if (booking.services && booking.services.length > 0) {
    const extra = booking.services.length - 1;
    return booking.services[0].service.name + (extra > 0 ? ` +${extra} more` : "");
  }
  return booking.service?.name ?? "Nail service";
}

/** Build a lookup of service id → category from the services list. */
export function categoryLookup(services: Service[] | undefined): Map<string, ServiceCategory> {
  const map = new Map<string, ServiceCategory>();
  for (const s of services ?? []) map.set(s.id, s.category);
  return map;
}

export function categoryMetaFor(booking: Booking, lookup: Map<string, ServiceCategory>) {
  const id = primaryServiceId(booking);
  const cat = id ? lookup.get(id) : undefined;
  return cat ? SERVICE_CATEGORY_META[cat] : FALLBACK_CATEGORY_META;
}
