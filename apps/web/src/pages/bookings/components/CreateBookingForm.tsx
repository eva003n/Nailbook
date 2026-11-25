import { useMemo, useState } from "react";
import { Check, Plus, ChevronLeft } from "lucide-react";
import NailSwatch from "@/components/ui/NailSwatch";
import { DateStrip, SlotGrid, StepIndicator } from "@/pages/bookings/components/SlotPicker";
import { nextDays } from "@/pages/bookings/components/dateOptions";
import { SERVICE_CATEGORY_META } from "@/lib/serviceCategory";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Avatar from "@/components/ui/Avatar";
import { useCustomers } from "@/pages/customers/hooks/useCustomers";
import { useAvailableSlots, useServices } from "@/hooks/useServices";
import { useCreateBooking } from "@/pages/bookings/hooks/useBookings";
import { useUiStore } from "@/store/ui.store";
import { formatKes, formatTime } from "@/lib/format";
import type { Customer } from "@/lib/schemas";
import { useAuthStore } from "@/store/auth.store";

interface CreateBookingFormProps {
  onSuccess: () => void;
  onRequestClose: () => void;
}

type Step = 1 | 2 | 3 | 4;

export default function CreateBookingForm({ onSuccess, onRequestClose }: CreateBookingFormProps) {
  const showToast = useUiStore((s) => s.showToast);
  const {user} = useAuthStore()
  const [step, setStep] = useState<Step>(1);

  // Step 1 — customer
  const [customerQuery, setCustomerQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [newCustomerMode, setNewCustomerMode] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const { data: customerResults } = useCustomers(customerQuery, 1, 10, !!customerQuery);

  // Step 2 — service (multi-select)
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const { data: services, isLoading: servicesLoading } = useServices();

  /*______ Caching and performance optimization _______ */
  const selectedServices = useMemo(
    () => (services ?? []).filter((s) => selectedServiceIds.includes(s.id)),
    [services, selectedServiceIds],
  );

  // Compute total duration & price from selected services
  const totalDuration = useMemo(
    () => selectedServices.reduce((sum, s) => sum + s.durationMinutes, 0),
    [selectedServices],
  );
  const totalPrice = useMemo(
    () => selectedServices.reduce((sum, s) => sum + s.priceKes, 0),
    [selectedServices],
  );

  // Step 3 — date/time
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const { data: slots, isLoading: slotsLoading } = useAvailableSlots(
      selectedServiceIds,
      selectedDate,
    );

  const dateOptions = useMemo(() => nextDays(14), []);

  const createMutation = useCreateBooking();

  const customerName = newCustomerMode ? newName : selectedCustomer?.name ?? "";
  const canGoStep2 = newCustomerMode ? newName.trim().length > 1 && newPhone.trim().length >= 9 : !!selectedCustomer;

  const handleConfirm = () => {
    if (selectedServiceIds.length === 0 || !selectedSlot) return;
    createMutation.mutate(
      {
        customerId: newCustomerMode ? undefined : selectedCustomer?.id,
        newCustomer: newCustomerMode ? { name: newName.trim(), phone: newPhone.trim() } : undefined,
        serviceIds: selectedServiceIds,
        appointmentAt: selectedSlot,
        stylist: user?.id
      },
      {
        onSuccess: (booking) => {
          showToast({ type: "success", message: `Booking created. Reference ${booking.reference}` });
          onSuccess();
        },
        onError: (err: unknown) => {
          const message =
            err instanceof Error ? err.message : "Couldn't create the booking. Please try again.";
          showToast({ type: "error", message });
        },
      },
    );
  };

  const toggleService = (id: string) => {
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  const servicesList = services ?? [];

  return (
    <div className="flex flex-col gap-5">
      <StepIndicator step={step} labels={["Customer", "Service", "Date", "Confirm"]} />

      {step === 1 && (
        <div className="flex flex-col gap-3">
          <h3 className="font-display text-lg font-semibold">
            Who's this for?
          </h3>
          {!newCustomerMode ? (
            <>
              <Input
                label="Customer"
                placeholder="Search by name or phone"
                value={customerQuery}
                onChange={(e) => {
                  setCustomerQuery(e.target.value);
                  setSelectedCustomer(null);
                }}
              />
              {customerQuery && (
                <div className="max-h-56 overflow-y-auto rounded-(--radius-md) border border-line bg-surface">
                  {(customerResults?.data ?? []).length === 0 ? (
                    <p className="px-3 py-3 text-sm text-ink-2">
                      No customers match. Add them as a new customer.
                    </p>
                  ) : (
                    customerResults?.data.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setSelectedCustomer(c);
                          setCustomerQuery(c.name);
                        }}
                        className={`flex w-full min-h-12 items-center gap-3 px-3 text-left hover:bg-paper ${
                          selectedCustomer?.id === c.id
                            ? "bg-petal"
                            : ""
                        }`}
                      >
                        <Avatar name={c.name} size="sm" />
                        <span className="text-[0.9375rem] font-semibold text-ink">
                          {c.name}
                        </span>
                        <span className="ml-auto text-[0.8125rem] text-ink-2">
                          {c.phone}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
              <button
                onClick={() => setNewCustomerMode(true)}
                className="inline-flex min-h-11 items-center gap-1.5 self-start text-sm font-semibold text-plum-deep"
              >
                <Plus size={16} aria-hidden="true" />
                New customer
              </button>
            </>
          ) : (
            <>
              <Input
                label="Full name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
              <Input
                label="Phone number"
                type="tel"
                placeholder="+254 7XX XXX XXX"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
              />
              <button
                onClick={() => setNewCustomerMode(false)}
                className="inline-flex min-h-11 items-center gap-1 self-start text-sm font-semibold text-plum-deep"
              >
                <ChevronLeft size={16} aria-hidden="true" />
                Search existing customers
              </button>
            </>
          )}
          <Button size="lg" fullWidth disabled={!canGoStep2} onClick={() => setStep(2)}>
            Continue
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-3">
          <h3 className="font-display text-lg font-semibold">
            Choose services
          </h3>
          {servicesLoading ? (
            <div className="flex flex-col gap-2">{[1, 2, 3].map((i) => <span key={i} className="h-16 animate-pulse rounded-(--radius-md) bg-petal" />)}</div>
          ) : (
            <div className="flex flex-col gap-2">
              {servicesList.map((s) => {
                const isSelected = selectedServiceIds.includes(s.id);
                return (
                  <button
                    key={s.id}
                    onClick={() => toggleService(s.id)}
                    role="checkbox"
                    aria-checked={isSelected}
                    className={`flex min-h-16 items-center gap-3 rounded-(--radius-md) border px-4 py-3 text-left transition-colors ${
                      isSelected
                        ? "border-plum bg-petal"
                        : "border-line bg-surface hover:border-mauve"
                    }`}
                  >
                    <NailSwatch color={SERVICE_CATEGORY_META[s.category]?.color ?? "var(--color-mauve)"} width={12} height={18} />
                    <span className="flex-1">
                      <span className="block text-[0.9375rem] font-semibold text-ink">
                        {s.name}
                      </span>
                      <span className="block text-[0.8125rem] text-ink-2">
                        {s.durationMinutes} min
                      </span>
                    </span>
                    {isSelected && <Check size={18} className="text-plum" aria-hidden="true" />}
                    <span className="text-[0.9375rem] font-semibold text-ink tabular-nums">
                      {formatKes(s.priceKes)}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
          {selectedServiceIds.length > 0 && (
            <p className="text-sm text-ink-2">
              {selectedServices.length} {selectedServices.length > 1 ? "services" : "service"}, {totalDuration} min, {formatKes(totalPrice)}
            </p>
          )}
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setStep(1)}>
              Back
            </Button>
            <Button
              fullWidth
              disabled={selectedServiceIds.length === 0}
              onClick={() => setStep(3)}
            >
              Continue
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-col gap-3">
          <h3 className="font-display text-lg font-semibold">
            Pick a day, then an open time
          </h3>
          <DateStrip
            days={dateOptions}
            value={selectedDate}
            onChange={(iso) => {
              setSelectedDate(iso);
              setSelectedSlot(null);
            }}
          />
          <SlotGrid slots={slots ?? []} value={selectedSlot} onChange={setSelectedSlot} loading={slotsLoading} />
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setStep(2)}>
              Back
            </Button>
            <Button
              fullWidth
              disabled={!selectedSlot}
              onClick={() => setStep(4)}
            >
              Continue
            </Button>
          </div>
        </div>
      )}

      {step === 4 && selectedServices.length > 0 && selectedSlot && (
        <div className="flex flex-col gap-4">
          <h3 className="font-display text-lg font-semibold">
            Review and confirm
          </h3>
          <div className="rounded-(--radius-lg) border border-line bg-paper p-5">
            <div className="flex items-center gap-3">
              <Avatar name={customerName} />
              <span className="text-base font-semibold text-ink">
                {customerName}
              </span>
            </div>
            <dl className="mt-4 space-y-3 text-[0.9375rem]">
              <div className="flex justify-between">
                <dt className="text-ink-2">Services</dt>
                <dd className="font-medium text-ink text-right">
                  {selectedServices.map((s) => (
                    <div key={s.id}>{s.name}</div>
                  ))}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-2">When</dt>
                <dd className="font-medium text-ink">
                  {new Date(selectedSlot).toLocaleDateString("en-KE", { weekday: "short", day: "numeric", month: "short" })}, {formatTime(selectedSlot)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-2">Duration</dt>
                <dd className="font-medium text-ink">
                  {totalDuration} min
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-2">Total</dt>
                <dd className="font-medium text-ink">
                  {formatKes(totalPrice)}
                </dd>
              </div>
            </dl>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" fullWidth onClick={() => setStep(3)}>
              Back
            </Button>
            <Button
              fullWidth
              onClick={handleConfirm}
              loading={createMutation.isPending}
            >
              <Check className="h-4 w-4" aria-hidden="true" />
              Confirm booking
            </Button>
          </div>
        </div>
      )}

      <button onClick={onRequestClose} className="sr-only">
        Close
      </button>
    </div>
  );
}