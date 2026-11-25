import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronDown, Clock, MessageCircle, Pencil, Plus, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import PageHeader from "@/components/layout/PageHeader";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import Dialog from "@/components/ui/Dialog";
import NailSwatch from "@/components/ui/NailSwatch";
import StatStrip from "@/components/ui/StatStrip";
import { useServices } from "@/hooks/useServices";
import { bookingServiceLabel, categoryLookup, categoryMetaFor } from "@/lib/serviceCategory";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import BottomSheet from "@/components/ui/BottomSheet";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import Skeleton, { ListRowSkeleton } from "@/components/ui/Skeleton";
import { useCustomer, useCustomerBookings } from "@/pages/customers/hooks/useCustomers";
import {
  useUpdateCustomer,
  useDeleteCustomer,
} from "@/hooks/useCustomerMutations";
import { useUiStore } from "@/store/ui.store";
import { formatDateShort, formatKes, formatPhone, formatPhoneForWhatsApp, formatTime } from "@/lib/format";

// ─── Form schema ─────────────────────────────────────────────────────────────

const EditCustomerFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z
    .string()
    .email("Invalid email address")
    .optional()
    .or(z.literal("")),
});

type EditCustomerFormData = z.infer<typeof EditCustomerFormSchema>;

// ─── Extract error helper ────────────────────────────────────────────────────

function extractErrorMessage(err: unknown): string | null {
  if (err && typeof err === "object") {
    const axiosErr = err as {
      response?: { data?: { error?: { message?: string } } };
      message?: string;
    };
    if (axiosErr.response?.data?.error?.message) {
      return axiosErr.response.data.error.message;
    }
    if (axiosErr.message && !axiosErr.message.startsWith("Request failed")) {
      return axiosErr.message;
    }
  }
  return null;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  if (!id) throw new Error("Missing customer ID");

  const { data: customer, isLoading, error, refetch } = useCustomer(id);
  const { data: bookings, isLoading: bookingsLoading } = useCustomerBookings(id);
  const { data: services } = useServices();

  const updateCustomer = useUpdateCustomer();
  const deleteCustomer = useDeleteCustomer();
  const showToast = useUiStore((s) => s.showToast);

  // Edit sheet state
  const [sheetOpen, setSheetOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditCustomerFormData>({
    resolver: zodResolver(EditCustomerFormSchema),
  });

  // ─── Handlers ───────────────────────────────────────────────────────────

  const openEditSheet = () => {
    if (!customer) return;
    reset({
      name: customer.name,
      email: customer.email ?? "",
    });
    setSheetOpen(true);
  };

  const closeSheet = () => {
    setSheetOpen(false);
    reset();
  };

  const onSubmit = (data: EditCustomerFormData) => {
    updateCustomer.mutate(
      {
        id,
        name: data.name,
        email: data.email || undefined,
      },
      {
        onSuccess: () => {
          showToast({ type: "success", message: "Customer updated." });
          closeSheet();
        },
        onError: (err: unknown) => {
          const msg = extractErrorMessage(err) || "Failed to update customer.";
          showToast({ type: "error", message: msg });
        },
      },
    );
  };

  const confirmDelete = () => {
    deleteCustomer.mutate(id, {
      onSuccess: () => {
        showToast({ type: "success", message: "Customer deleted." });
        navigate("/admin/customers", { replace: true });
      },
      onError: (err: unknown) => {
        const msg = extractErrorMessage(err) || "Failed to delete customer.";
        showToast({ type: "error", message: msg });
        setDeleting(false);
      },
    });
  };

  const header = (action?: React.ReactNode) => (
    <PageHeader title="Customer" showBack backTo="/customers" hideBackOnDesktop action={action} bell={false} />
  );

  if (error) {
    return (
      <div className="flex flex-col">
        {header()}
        <ErrorState heading="Couldn't load customer" message="Check your connection and try again." onRetry={() => refetch()} />
      </div>
    );
  }

  if (isLoading || !customer) {
    return (
      <div className="flex flex-col">
        {header()}
        <div className="space-y-4 px-5 py-4 md:px-8 lg:px-12">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  const history = [...(bookings ?? [])].sort((a, b) => b.appointmentAt.localeCompare(a.appointmentAt));
  const payments = history.filter((b) => b.payment);
  const categories = categoryLookup(services);
  const favourite = (() => {
    const counts = new Map<string, number>();
    for (const b of history) {
      const name = bookingServiceLabel(b).replace(/ \+\d+ more$/, "");
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    let best: string | undefined;
    let n = 0;
    for (const [k, v] of counts) if (v > n) [best, n] = [k, v];
    return best;
  })();
  const favouriteBooking = favourite ? history.find((b) => bookingServiceLabel(b).startsWith(favourite)) : undefined;

  return (
    <div className="flex min-h-full flex-col">
      {header(
        <div className="flex items-center gap-1">
          <Button variant="ghost" fullWidth={false} className="w-11 px-0" onClick={openEditSheet} aria-label={`Edit ${customer.name}`}>
            <Pencil size={18} aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            fullWidth={false}
            className="w-11 px-0 text-ink-2 hover:text-error"
            onClick={() => setDeleting(true)}
            aria-label={`Delete ${customer.name}`}
          >
            <Trash2 size={18} aria-hidden="true" />
          </Button>
        </div>,
      )}

      <div className="flex flex-col gap-5 px-5 pb-6 md:px-8 lg:gap-6 lg:px-12 lg:pb-9">
        <div className="flex flex-wrap items-center gap-4 lg:gap-4.5">
          <span className="lg:hidden">
            <Avatar name={customer.name} size="lg" />
          </span>
          <span className="hidden lg:block">
            <Avatar name={customer.name} size="xl" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-2xl leading-7 font-bold tracking-[-0.02em] lg:text-[1.75rem] lg:leading-8.5">{customer.name}</p>
            <p className="mt-0.5 text-sm text-ink-2 lg:text-[0.9375rem]">
              {formatPhone(customer.phone)}
              {customer.email ? `, ${customer.email}` : ""}
            </p>
            <p className="text-[0.8125rem] text-ink-3">
              Client since {new Date(customer.createdAt).toLocaleDateString("en-KE", { month: "long", year: "numeric" })}
            </p>
          </div>
          <div className="flex w-full gap-2.5 sm:w-auto">
            <a
              href={`https://wa.me/${formatPhoneForWhatsApp(customer.phone)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-(--radius-md) bg-whatsapp-bg px-4.5 text-[0.9375rem] font-semibold text-whatsapp sm:flex-none"
              aria-label={`Open WhatsApp chat with ${customer.name}`}
            >
              <MessageCircle size={18} aria-hidden="true" />
              WhatsApp
            </a>
            <Button fullWidth={false} className="flex-1 sm:flex-none" onClick={() => navigate("/admin/bookings/new")}>
              <Plus size={18} aria-hidden="true" />
              New booking
            </Button>
          </div>
        </div>

        <StatStrip
          items={[
            { label: "Visits", value: String(customer.totalBookings ?? history.length) },
            { label: "Spent in total", unit: "KES", value: (customer.totalSpentKes ?? 0).toLocaleString("en-KE") },
            {
              label: "Books most often",
              value: favourite ?? "None yet",
              textValue: true,
              extra: favouriteBooking ? <NailSwatch color={categoryMetaFor(favouriteBooking, categories).color} /> : undefined,
            },
          ]}
        />

        <details open className="group rounded-(--radius-lg) border border-line bg-surface">
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between px-5 [&::-webkit-details-marker]:hidden">
            <h2 className="font-display text-[1.0625rem] font-semibold">Booking history</h2>
            <ChevronDown size={20} className="text-ink-2 transition-transform group-open:rotate-180" aria-hidden="true" />
          </summary>
          <div className="px-5 pb-3">
            {bookingsLoading ? (
              <>
                <ListRowSkeleton />
                <ListRowSkeleton />
              </>
            ) : history.length === 0 ? (
              <EmptyState icon={Clock} heading="No past bookings" />
            ) : (
              history.map((b) => (
                <button
                  key={b.id}
                  onClick={() => navigate(`/admin/bookings/${b.id}`)}
                  className="flex w-full items-center justify-between gap-3 border-t border-line py-3 text-left first:border-t-0 hover:bg-paper"
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <NailSwatch color={categoryMetaFor(b, categories).color} />
                    <span className="min-w-0">
                      <span className="block truncate text-[0.9375rem] font-semibold">{bookingServiceLabel(b)}</span>
                      <span className="block text-[0.8125rem] text-ink-2">
                        {formatDateShort(b.appointmentAt)}, {formatTime(b.appointmentAt)}
                      </span>
                    </span>
                  </span>
                  <Badge kind="booking" status={b.status} />
                </button>
              ))
            )}
          </div>
        </details>

        <details className="group rounded-(--radius-lg) border border-line bg-surface">
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-5 [&::-webkit-details-marker]:hidden">
            <h2 className="font-display text-[1.0625rem] font-semibold">Payment history</h2>
            <span className="flex items-center gap-2 text-sm text-ink-2">
              {payments.length} {payments.length === 1 ? "payment" : "payments"}
              <ChevronDown size={20} className="transition-transform group-open:rotate-180" aria-hidden="true" />
            </span>
          </summary>
          <div className="px-5 pb-3">
            {payments.length === 0 ? (
              <p className="py-3 text-sm text-ink-2">No payments recorded yet.</p>
            ) : (
              payments.map((b) => (
                <div key={b.id} className="flex items-center justify-between gap-3 border-t border-line py-3 first:border-t-0">
                  <span className="min-w-0">
                    <span className="block text-[0.9375rem] font-semibold tabular-nums">{formatKes(b.payment?.amountKes ?? b.priceKes)}</span>
                    <span className="block text-[0.8125rem] text-ink-2">
                      {b.payment?.mpesaReceiptNumber ?? "No receipt"}, {formatDateShort(b.payment?.createdAt ?? b.appointmentAt)}
                    </span>
                  </span>
                  {b.payment && <Badge kind="payment" status={b.payment.status} />}
                </div>
              ))
            )}
          </div>
        </details>
      </div>

      <BottomSheet open={sheetOpen} onClose={closeSheet} title="Edit customer">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit(onSubmit)();
          }}
          className="flex flex-col gap-4"
        >
          <Input label="Full name" type="text" {...register("name")} error={errors.name?.message} />
          <Input label="Email (optional)" type="email" inputMode="email" {...register("email")} error={errors.email?.message} />
          <div className="mt-2 flex flex-col-reverse gap-2.5 sm:flex-row">
            <Button variant="secondary" size="lg" className="sm:flex-1" type="button" onClick={closeSheet}>
              Cancel
            </Button>
            <Button type="submit" size="lg" className="sm:flex-1" loading={updateCustomer.isPending}>
              Save changes
            </Button>
          </div>
        </form>
      </BottomSheet>

      <Dialog
        open={deleting}
        title="Delete customer?"
        description={`${customer.name} will be removed. This can't be undone.`}
        confirmLabel="Delete"
        destructive
        isConfirming={deleteCustomer.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(false)}
      />
    </div>
  );
}
