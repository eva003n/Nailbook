/**
 * Transaction detail — amount, status, M-Pesa receipt, customer and booking.
 */
import { useNavigate, useParams } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import { usePayment } from "@/pages/payments/hooks/usePayments";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import ErrorState from "@/components/ui/ErrorState";
import Skeleton from "@/components/ui/Skeleton";
import Avatar from "@/components/ui/Avatar";
import { formatDate, formatPhone, formatPhoneForWhatsApp, formatTime } from "@/lib/format";

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-line px-4.5 py-3.5 first:border-t-0">
      <dt className="text-[0.9375rem] text-ink-2">{label}</dt>
      <dd className="text-right text-[0.9375rem] font-semibold text-ink">{children}</dd>
    </div>
  );
}

export default function PaymentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  if (!id) throw new Error("Missing payment ID");

  const { data: payment, isLoading, error, refetch } = usePayment(id);
  const header = <PageHeader title="Payment" showBack backTo="/payments" bell={false} />;

  if (isLoading) {
    return (
      <div>
        {header}
        <div className="mx-auto max-w-2xl space-y-4 px-5 py-4">
          <Skeleton shape="rect" height="120px" />
          <Skeleton shape="rect" height="240px" />
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div>
        {header}
        <ErrorState heading="Couldn't load this payment" message="Check your connection and try again." onRetry={refetch} />
      </div>
    );
  }
  if (!payment) {
    return (
      <div>
        {header}
        <ErrorState heading="Payment not found" message="It may have been removed." />
      </div>
    );
  }

  const service = payment.booking.services?.[0]?.service?.name ?? payment.booking.service?.name ?? "Nail service";
  const phone = payment.phoneNumber || payment.customer.phone;

  return (
    <div className="pb-6">
      {header}
      <div className="mx-auto flex max-w-2xl flex-col gap-5 px-5 pt-2 md:px-8">
        <section className="flex flex-wrap items-end justify-between gap-4 rounded-(--radius-panel) border border-line bg-surface p-6">
          <div>
            <p className="text-sm text-ink-2">Amount</p>
            <p className="font-display text-[2.5rem] leading-11 font-bold tracking-[-0.02em] tabular-nums">
              <small className="mr-1.5 text-lg font-semibold tracking-normal text-ink-2">KES</small>
              {payment.amountKes.toLocaleString("en-KE")}
            </p>
            <p className="mt-1 text-sm text-ink-2">
              {formatDate(payment.createdAt)} at {formatTime(payment.createdAt)}
            </p>
          </div>
          <Badge kind="payment" status={payment.status} />
        </section>

        <dl className="rounded-(--radius-lg) border border-line bg-surface">
          <Row label="M-Pesa receipt">
            <span className="tracking-[0.02em]">{payment.mpesaReceiptNumber ?? (payment.method === "CASH" ? "Paid in cash" : "Not issued yet")}</span>
          </Row>
          <Row label="Paid from">{formatPhone(phone)}</Row>
          <Row label="Method">{payment.method === "CASH" ? "Cash" : "M-Pesa"}</Row>
          <Row label="Service">{service}</Row>
          <Row label="Booking">{payment.booking.reference}</Row>
        </dl>

        <section className="flex flex-wrap items-center gap-4 rounded-(--radius-lg) border border-line bg-surface p-4.5">
          <Avatar name={payment.customer.name} />
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{payment.customer.name}</p>
            <p className="text-sm text-ink-2">{formatPhone(payment.customer.phone)}</p>
          </div>
          <a
            href={`https://wa.me/${formatPhoneForWhatsApp(phone)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-2 rounded-(--radius-md) bg-whatsapp-bg px-4 text-[0.9375rem] font-semibold text-whatsapp"
            aria-label={`Open WhatsApp chat with ${payment.customer.name}`}
          >
            <MessageCircle size={18} aria-hidden="true" />
            WhatsApp
          </a>
        </section>

        <Button variant="secondary" size="lg" onClick={() => navigate(`/admin/bookings/${payment.bookingId}`)}>
          View booking
        </Button>
      </div>
    </div>
  );
}
