/**
 * §8.3 Customers Page
 *
 * Single-column card list (no tables — §1.2 anti-pattern).
 * §6.1: Search input with label above.
 * §7.2: Empty state with icon + CTA.
 * §7.1: Skeleton loading.
 *
 * Supports add, edit, and delete via BottomSheet and confirmation dialog
 * (matching the ServicesSection pattern in settings).
 */
import { useState } from "react";
import { Outlet, useMatch, useNavigate } from "react-router-dom";
import { MousePointerClick, Pencil, Plus, Search, Trash2, Users } from "lucide-react";
import { clsx } from "clsx";
import Dialog from "@/components/ui/Dialog";
import NotificationBell from "@/components/NotificationBell";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import { ListRowSkeleton } from "@/components/ui/Skeleton";
import BottomSheet from "@/components/ui/BottomSheet";
import { useCustomers } from "@/pages/customers/hooks/useCustomers";
import {
  useCreateCustomer,
  useUpdateCustomer,
  useDeleteCustomer,
} from "@/hooks/useCustomerMutations";
import { useUiStore } from "@/store/ui.store";
import { timeAgo } from "@/lib/format";
import type { Customer } from "@/lib/schemas";
import Pagination from "@/components/ui/Pagination";

// ─── Form schema (mirrors backend validation) ────────────────────────────────

const CustomerFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  phone: z
    .string()
    .min(10, "Phone number is required")
    .transform((val) => {
      // Convert 07xx/01xx → 2547xx/2541xx
      const cleaned = val.replace(/[^0-9]/g, "");
      if (cleaned.startsWith("0")) return `254${cleaned.slice(1)}`;
      if (cleaned.startsWith("7") || cleaned.startsWith("1"))
        return `254${cleaned}`;
      return cleaned;
    })
    .refine(
      (val) => /^254[17]\d{8}$/.test(val),
      "Invalid Kenyan phone number (e.g. 0712345678)",
    ),
  email: z
    .string()
    .email("Invalid email address")
    .optional()
    .or(z.literal("")),
});

type CustomerFormData = z.infer<typeof CustomerFormSchema>;

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

export default function CustomersListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const { data: result, isLoading, error, refetch } = useCustomers(
    search || undefined,
    page,
    limit,
  );
  const customers: Customer[] = result?.data ?? [];
  const meta = result?.meta;

  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  const deleteCustomer = useDeleteCustomer();
  const showToast = useUiStore((s) => s.showToast);

  // BottomSheet state
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Delete confirmation state
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(
    null,
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(CustomerFormSchema),
    defaultValues: { name: "", phone: "", email: "" },
  });

  // ─── Handlers ───────────────────────────────────────────────────────────

  const openAddSheet = () => {
    setEditingCustomer(null);
    reset({ name: "", phone: "", email: "" });
    setSheetOpen(true);
  };

  const openEditSheet = (customer: Customer) => {
    setEditingCustomer(customer);
    reset({
      name: customer.name,
      phone: customer.phone,
      email: customer.email ?? "",
    });
    setSheetOpen(true);
  };

  const closeSheet = () => {
    setSheetOpen(false);
    setEditingCustomer(null);
    reset();
  };

  const onSubmit = (data: CustomerFormData) => {
    const payload = {
      name: data.name,
      phone: data.phone,
      email: data.email || undefined,
    };

    if (editingCustomer) {
      updateCustomer.mutate(
        { id: editingCustomer.id, ...payload },
        {
          onSuccess: () => {
            showToast({ type: "success", message: "Customer updated." });
            closeSheet();
          },
          onError: (err: unknown) => {
            const msg =
              extractErrorMessage(err) || "Failed to update customer.";
            showToast({ type: "error", message: msg });
          },
        },
      );
    } else {
      createCustomer.mutate(payload, {
        onSuccess: () => {
          showToast({ type: "success", message: "Customer added." });
          closeSheet();
        },
        onError: (err: unknown) => {
          const msg =
            extractErrorMessage(err) || "Failed to add customer.";
          showToast({ type: "error", message: msg });
        },
      });
    }
  };

  const confirmDelete = () => {
    if (!deletingCustomer) return;
    deleteCustomer.mutate(deletingCustomer.id, {
      onSuccess: () => {
        showToast({ type: "success", message: "Customer deleted." });
        setDeletingCustomer(null);
      },
      onError: (err: unknown) => {
        const msg =
          extractErrorMessage(err) || "Failed to delete customer.";
        showToast({ type: "error", message: msg });
        setDeletingCustomer(null);
      },
    });
  };

  const isFormPending =
    createCustomer.isPending || updateCustomer.isPending;

  // ─── Render ──────────────────────────────────────────────────────────────

  const detailMatch = useMatch("/admin/customers/:id/*");
  const selectedId = detailMatch?.params.id;

  // Group A–Z by first letter for sticky section headers
  const groups = new Map<string, Customer[]>();
  for (const c of [...customers].sort((a, b) => a.name.localeCompare(b.name))) {
    const letter = /[a-z]/i.test(c.name[0] ?? "") ? c.name[0].toUpperCase() : "#";
    groups.set(letter, [...(groups.get(letter) ?? []), c]);
  }

  return (
    <div className="flex min-h-full flex-1">
      <section
        className={clsx(
          "flex w-full flex-col gap-4 px-5 pt-6 pb-6 md:px-8 md:pt-8 lg:w-100 lg:shrink-0 lg:border-r lg:border-line lg:px-6 lg:pt-9",
          selectedId && "hidden lg:flex",
        )}
        aria-label="Customers list"
      >
        <div className="flex items-center justify-between gap-3">
          <h1 className="font-display text-[1.875rem] leading-9 font-bold tracking-[-0.02em] md:text-[2rem] md:leading-9.5">Customers</h1>
          <div className="flex items-center gap-2.5">
            <span className="lg:hidden">
              <NotificationBell />
            </span>
            <Button fullWidth={false} onClick={openAddSheet}>
              <Plus size={18} aria-hidden="true" />
              Add
            </Button>
          </div>
        </div>

        <label className="flex h-11 items-center gap-2.5 rounded-(--radius-md) border border-line bg-surface px-3.5 focus-within:border-plum">
          <Search size={18} className="text-ink-3" aria-hidden="true" />
          <span className="sr-only">Search customers by name or phone</span>
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by name or phone"
            className="h-full flex-1 bg-transparent text-[0.9375rem] text-ink placeholder:text-ink-3 focus:outline-none"
          />
        </label>

        {error ? (
          <ErrorState heading="Couldn't load customers" message="Check your connection and try again." onRetry={() => refetch()} />
        ) : isLoading ? (
          <div className="flex flex-col">
            <ListRowSkeleton />
            <ListRowSkeleton />
            <ListRowSkeleton />
          </div>
        ) : customers.length === 0 ? (
          <EmptyState
            icon={Users}
            heading={search ? "No customers match" : "No customers yet"}
            description={search ? "Try a different name or number." : "They appear after their first website booking, or add one now."}
          />
        ) : (
          <div className="flex flex-col">
            {[...groups.entries()].map(([letter, list]) => (
              <div key={letter}>
                <h2 className="sticky top-0 z-[1] bg-paper px-3 pt-3 pb-1 text-sm font-semibold text-ink-2">{letter}</h2>
                {list.map((c) => {
                  const on = c.id === selectedId;
                  return (
                    <div key={c.id} className={clsx("flex items-center gap-1 rounded-(--radius-lg) pr-1", on ? "bg-petal" : "hover:bg-surface")}>
                      <button
                        onClick={() => navigate(`/admin/customers/${c.id}`)}
                        aria-current={on ? "true" : undefined}
                        className="flex min-h-14 min-w-0 flex-1 items-center gap-3 px-3 py-2 text-left"
                      >
                        <Avatar name={c.name} size="sm" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[0.9375rem] font-semibold text-ink">{c.name}</span>
                          <span className="block truncate text-[0.8125rem] text-ink-2">
                            {c.lastBookingAt ? `Last visit ${timeAgo(c.lastBookingAt)}` : "No visits yet"}
                          </span>
                        </span>
                      </button>
                      <button
                        onClick={() => openEditSheet(c)}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-(--radius-md) text-ink-2 hover:bg-petal hover:text-plum-deep"
                        aria-label={`Edit ${c.name}`}
                      >
                        <Pencil size={16} aria-hidden="true" />
                      </button>
                      <button
                        onClick={() => setDeletingCustomer(c)}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-(--radius-md) text-ink-2 hover:bg-error-bg hover:text-error"
                        aria-label={`Delete ${c.name}`}
                      >
                        <Trash2 size={16} aria-hidden="true" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ))}
            {meta && meta.totalPages > 1 && (
              <div className="pt-4">
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
              </div>
            )}
          </div>
        )}
      </section>

      <section className={clsx("min-w-0 flex-1 bg-surface", selectedId ? "flex flex-col" : "hidden lg:flex lg:flex-col")}>
        {selectedId ? (
          <Outlet />
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <EmptyState icon={MousePointerClick} heading="Pick a customer" description="Their visits, spend and payments show up here." />
          </div>
        )}
      </section>

      {/* ─── Add / Edit sheet ─────────────────────────────────────── */}
      <BottomSheet open={sheetOpen} onClose={closeSheet} title={editingCustomer ? "Edit customer" : "Add customer"}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit(onSubmit)();
          }}
          className="flex flex-col gap-4"
        >
          <Input label="Full name" type="text" {...register("name")} error={errors.name?.message} />
          <Input
            label="Phone number"
            type="tel"
            inputMode="tel"
            placeholder="0712 345 678"
            {...register("phone")}
            error={errors.phone?.message}
          />
          <Input label="Email (optional)" type="email" inputMode="email" {...register("email")} error={errors.email?.message} />
          <div className="mt-2 flex flex-col-reverse gap-2.5 sm:flex-row">
            <Button variant="secondary" size="lg" className="sm:flex-1" type="button" onClick={closeSheet}>
              Cancel
            </Button>
            <Button type="submit" size="lg" className="sm:flex-1" loading={isFormPending}>
              {editingCustomer ? "Save changes" : "Add customer"}
            </Button>
          </div>
        </form>
      </BottomSheet>

      <Dialog
        open={deletingCustomer !== null}
        title="Delete customer?"
        description={deletingCustomer ? `${deletingCustomer.name} will be removed. This can't be undone.` : undefined}
        confirmLabel="Delete"
        destructive
        isConfirming={deleteCustomer.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setDeletingCustomer(null)}
      />
    </div>
  );
}
