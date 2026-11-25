/**
 * Payments — M-Pesa and cash payments for a period.
 * Desktop: table. Mobile: rows. Totals use dashboard stats where available.
 */
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CreditCard } from "lucide-react";
import PageHeader from "@/components/layout/PageHeader";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import SegmentedControl from "@/components/ui/SegmentedControl";
import StatStrip from "@/components/ui/StatStrip";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import { ListRowSkeleton } from "@/components/ui/Skeleton";
import Pagination from "@/components/ui/Pagination";
import { usePayments } from "@/pages/payments/hooks/usePayments";
import { useDashboardStats } from "@/pages/dashboard/hooks/useDashboard";
import { formatDateShort, formatKes, formatTime, isToday } from "@/lib/format";
import type { PaymentTransaction } from "@/lib/schemas";

type Period = "today" | "week" | "month" | "all";

const PERIOD_COPY: Record<Period, string> = {
  today: "Payments received today.",
  week: "Payments for the last 7 days.",
  month: "Payments for this month.",
  all: "Every payment on record.",
};

function serviceName(p: PaymentTransaction) {
  return p.booking.services?.[0]?.service?.name ?? p.booking.service?.name ?? "Nail service";
}

function when(iso: string) {
  return isToday(iso) ? `Today, ${formatTime(iso)}` : `${formatDateShort(iso)}, ${formatTime(iso)}`;
}

export default function PaymentsListPage() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<Period>("week");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const { data: result, isLoading, error, refetch } = usePayments({ period }, page, limit);
  const { data: stats } = useDashboardStats();

  const payments = useMemo(() => result?.data ?? [], [result?.data]);
  const meta = result?.meta;

  const pageTotal = useMemo(
    () => payments.filter((p) => p.status === "SUCCESS").reduce((sum, p) => sum + p.amountKes, 0),
    [payments],
  );
  const collected =
    period === "today" ? stats?.todayRevenueKes : period === "week" ? stats?.weekRevenueKes : period === "month" ? stats?.monthRevenueKes : undefined;
  const failed = payments.filter((p) => p.status === "FAILED" || p.status === "EXPIRED").length;

  return (
    <div className="flex flex-col pb-6 lg:pb-9">
      <PageHeader
        title="Payments"
        subtitle={PERIOD_COPY[period]}
        action={
          <span className="hidden md:block">
            <SegmentedControl
              aria-label="Filter payments by period"
              value={period}
              onChange={(v) => {
                setPeriod(v);
                setPage(1);
              }}
              options={[
                { value: "today", label: "Today" },
                { value: "week", label: "Week" },
                { value: "month", label: "Month" },
                { value: "all", label: "All" },
              ]}
            />
          </span>
        }
      />

      <div className="flex flex-col gap-5 px-5 pt-4 md:gap-7 md:px-8 lg:px-12">
        <div className="md:hidden">
          <SegmentedControl
            aria-label="Filter payments by period"
            value={period}
            onChange={(v) => {
              setPeriod(v);
              setPage(1);
            }}
            options={[
              { value: "today", label: "Today" },
              { value: "week", label: "Week" },
              { value: "month", label: "Month" },
              { value: "all", label: "All" },
            ]}
          />
        </div>

        <StatStrip
          items={[
            { label: "Collected", unit: "KES", value: (collected ?? pageTotal).toLocaleString("en-KE") },
            { label: "Payments", value: String(meta?.total ?? payments.length) },
            { label: "Unpaid bookings", unit: "KES", value: (stats?.unpaidKes ?? 0).toLocaleString("en-KE"), onClick: () => navigate("/admin/bookings") },
            { label: failed === 1 ? "Failed or expired request" : "Failed or expired requests", value: String(failed), highlight: failed > 0 },
          ]}
        />

        {error ? (
          <ErrorState heading="Couldn't load payments" message="Check your connection and try again." onRetry={() => refetch()} />
        ) : isLoading ? (
          <div className="flex flex-col rounded-(--radius-panel) border border-line bg-surface p-2">
            <ListRowSkeleton />
            <ListRowSkeleton />
            <ListRowSkeleton />
          </div>
        ) : payments.length === 0 ? (
          <EmptyState icon={CreditCard} heading="No transactions in this period" description="Pick a longer period to see older payments." />
        ) : (
          <>
            {/* Desktop table */}
            <section className="hidden rounded-(--radius-panel) border border-line bg-surface px-2 pt-5 pb-2 md:block">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="text-[0.8125rem] font-semibold text-ink-2">
                    <th className="border-b border-line px-4 pb-3 font-semibold">Customer</th>
                    <th className="border-b border-line px-4 pb-3 font-semibold">Service</th>
                    <th className="border-b border-line px-4 pb-3 font-semibold">Amount</th>
                    <th className="hidden border-b border-line px-4 pb-3 font-semibold lg:table-cell">M-Pesa receipt</th>
                    <th className="border-b border-line px-4 pb-3 font-semibold">Time</th>
                    <th className="border-b border-line px-4 pb-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr
                      key={p.id}
                      onClick={() => navigate(`/admin/payments/${p.id}`)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") navigate(`/admin/payments/${p.id}`);
                      }}
                      tabIndex={0}
                      className="cursor-pointer text-[0.9375rem] hover:bg-petal focus-visible:bg-petal"
                    >
                      <td className="border-b border-line px-4 py-3.5 last:border-b-0">
                        <span className="flex items-center gap-3 font-semibold">
                          <Avatar name={p.customer.name} size="sm" />
                          {p.customer.name}
                        </span>
                      </td>
                      <td className="border-b border-line px-4 py-3.5 text-ink-2">{serviceName(p)}</td>
                      <td className="border-b border-line px-4 py-3.5 font-bold tabular-nums">{formatKes(p.amountKes)}</td>
                      <td className="hidden border-b border-line px-4 py-3.5 text-sm tracking-[0.02em] text-ink-2 lg:table-cell">
                        {p.mpesaReceiptNumber ?? (p.method === "CASH" ? "Cash" : "Not issued")}
                      </td>
                      <td className="border-b border-line px-4 py-3.5 text-ink-2">{when(p.createdAt)}</td>
                      <td className="border-b border-line px-4 py-3.5">
                        <Badge kind="payment" status={p.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            {/* Mobile rows */}
            <section className="flex flex-col divide-y divide-line md:hidden">
              {payments.map((p) => (
                <button key={p.id} onClick={() => navigate(`/admin/payments/${p.id}`)} className="flex w-full items-center gap-3 py-3 text-left">
                  <Avatar name={p.customer.name} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[0.9375rem] font-semibold">{p.customer.name}</span>
                    <span className="block truncate text-[0.8125rem] text-ink-2">
                      {serviceName(p)}, {when(p.createdAt)}
                    </span>
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-1">
                    <span className="text-[0.9375rem] font-bold tabular-nums">{formatKes(p.amountKes)}</span>
                    <Badge kind="payment" status={p.status} />
                  </span>
                </button>
              ))}
            </section>

            {meta && meta.totalPages > 1 && (
              <Pagination
                page={meta.page}
                totalPages={meta.totalPages}
                onPageChange={setPage}
                limit={meta.limit}
                onLimitChange={(l) => {
                  setLimit(l);
                  setPage(1);
                }}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
