import {
  canonicalStateStatusCodesKey,
  type OrdersFiltersState,
  type OrdersListUrlState,
} from "@/features/orders/model/orders-url";
import type { OrderFilterKey } from "@/entities/user/model/types";
import type { ActionStatusCode, OrderTableGroup, PaymentStatusCode, StateStatusCode } from "@/shared/config/order-static";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";

import { useDebouncedValue } from "@/shared/lib/use-debounced-value";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { NativeSelect } from "@/shared/ui/native-select/native-select";
import { Input } from "@/shared/ui/input";

type OrdersFiltersBarProps = {
  state: Pick<
    OrdersListUrlState,
    "search" | "tableGroup" | "city" | "paymentStatus" | "actionStatusCode" | "stateStatusCodes"
  >;
  onChange: (patch: Partial<OrdersFiltersState>) => void;
  onReset: () => void;
  visibleFilters: OrderFilterKey[];
  fixedFilters?: {
    city?: string;
    orderStatus?: string;
    tableGroup?: string;
  };
  tableGroupOptions: Array<{ value: string; label: string }>;
  paymentStatusOptions: Array<{ value: string; label: string }>;
  actionStatusOptions: Array<{ value: string; label: string }>;
  stateStatusOptions: Array<{ value: string; label: string }>;
};

function StateStatusMultiDropdown({
  options,
  value,
  onValueChange,
}: {
  options: Array<{ value: string; label: string }>;
  value: StateStatusCode[];
  onValueChange: (next: StateStatusCode[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const labelByCode = useMemo(() => new Map(options.map((o) => [o.value, o.label])), [options]);

  const summary = useMemo(() => {
    if (!value.length) return "Любой статус состояния";
    if (value.length === 1) return labelByCode.get(value[0]) ?? value[0];
    const joined = value.map((c) => labelByCode.get(c) ?? c).join(", ");
    if (joined.length <= 44) return joined;
    return `Выбрано: ${value.length}`;
  }, [value, labelByCode]);

  const toggle = (code: StateStatusCode, checked: boolean) => {
    if (checked) {
      onValueChange(value.includes(code) ? value : [...value, code]);
    } else {
      onValueChange(value.filter((c) => c !== code));
    }
  };

  return (
    <div ref={rootRef} className="relative w-full">
      <button
        type="button"
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-input bg-card px-3 py-2 text-left text-sm ring-offset-background transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "hover:bg-accent/40",
        )}
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className={cn("min-w-0 flex-1 truncate", value.length === 0 ? "text-muted-foreground" : null)}>
          {summary}
        </span>
        <ChevronDown className={cn("ml-2 h-4 w-4 shrink-0 text-muted-foreground transition-transform", open ? "rotate-180" : null)} />
      </button>

      {open ? (
        <div
          className="absolute left-0 top-full z-50 mt-1 w-[min(100vw-1.5rem,380px)] rounded-md border bg-card p-2 shadow-lg sm:w-[min(100%,380px)]"
          role="listbox"
          aria-multiselectable
        >
          <div className="max-h-64 overflow-y-auto">
            <div className="grid gap-1.5 sm:grid-cols-2">
              {options.map((opt) => {
                const code = opt.value as StateStatusCode;
                const checked = value.includes(code);
                return (
                  <label
                    key={opt.value}
                    className="flex cursor-pointer items-start gap-2 rounded-md px-1.5 py-1 text-sm leading-tight hover:bg-accent/50"
                  >
                    <input
                      type="checkbox"
                      className="mt-0.5 shrink-0 rounded border-input accent-primary"
                      checked={checked}
                      onChange={(e) => toggle(code, e.target.checked)}
                    />
                    <span>{opt.label}</span>
                  </label>
                );
              })}
            </div>
          </div>
          {value.length > 0 ? (
            <div className="mt-2 border-t pt-2">
              <button
                type="button"
                className="w-full rounded-md py-1.5 text-center text-xs text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                onClick={() => {
                  onValueChange([]);
                }}
              >
                Сбросить выбор
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function OrdersFiltersBar({
  state,
  onChange,
  onReset,
  visibleFilters,
  fixedFilters,
  tableGroupOptions,
  paymentStatusOptions,
  actionStatusOptions,
  stateStatusOptions,
}: OrdersFiltersBarProps) {
  const [searchDraft, setSearchDraft] = useState(state.search ?? "");
  const [tableGroupDraft, setTableGroupDraft] = useState(state.tableGroup ?? "");
  const [cityDraft, setCityDraft] = useState(state.city ?? "");
  const [paymentStatusDraft, setPaymentStatusDraft] = useState(state.paymentStatus ?? "");
  const [stateStatusCodesDraft, setStateStatusCodesDraft] = useState<StateStatusCode[]>(state.stateStatusCodes ?? []);
  const [actionStatusDraft, setActionStatusDraft] = useState(state.actionStatusCode ?? "");

  const debouncedInput = useMemo(
    () => ({
      search: searchDraft,
      tableGroup: tableGroupDraft,
      city: cityDraft,
      paymentStatus: paymentStatusDraft,
      stateStatusCodes: stateStatusCodesDraft,
      actionStatusCode: actionStatusDraft,
    }),
    [searchDraft, tableGroupDraft, cityDraft, paymentStatusDraft, stateStatusCodesDraft, actionStatusDraft],
  );

  const debouncedDrafts = useDebouncedValue(debouncedInput, 350);
  const isVisible = (key: OrderFilterKey) => visibleFilters.includes(key);
  const showStateStatusFilter = isVisible("stateStatuses") || isVisible("orderStatuses");

  useEffect(() => {
    setSearchDraft(state.search ?? "");
    setTableGroupDraft(state.tableGroup ?? "");
    setCityDraft(state.city ?? "");
    setPaymentStatusDraft(state.paymentStatus ?? "");
    setActionStatusDraft(state.actionStatusCode ?? "");
  }, [state.actionStatusCode, state.city, state.paymentStatus, state.search, state.tableGroup]);

  const stateCodesUrlKey = canonicalStateStatusCodesKey(state.stateStatusCodes);
  useEffect(() => {
    setStateStatusCodesDraft(state.stateStatusCodes ?? []);
  }, [stateCodesUrlKey]);

  useEffect(() => {
    onChange({
      search: debouncedDrafts.search.trim() || undefined,
      tableGroup: (debouncedDrafts.tableGroup || undefined) as OrderTableGroup | undefined,
      city: debouncedDrafts.city.trim() || undefined,
      paymentStatus: (debouncedDrafts.paymentStatus || undefined) as PaymentStatusCode | undefined,
      stateStatusCodes: debouncedDrafts.stateStatusCodes.length ? debouncedDrafts.stateStatusCodes : undefined,
      actionStatusCode: (debouncedDrafts.actionStatusCode || undefined) as ActionStatusCode | undefined,
    });
  }, [debouncedDrafts, onChange]);

  return (
    <Card className="border-border/70 shadow-sm">
      <div className="space-y-3 p-3 md:p-4">
        <div className="flex flex-wrap items-end gap-2">
          {isVisible("search") ? (
            <div className="relative min-w-[260px] flex-1 lg:max-w-[420px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchDraft}
                onChange={(e) => setSearchDraft(e.target.value)}
                placeholder="Номер заказа, телефон, город, адрес..."
                className="pl-9"
              />
            </div>
          ) : null}

          {isVisible("tableGroup") ? (
            <div className="w-full sm:w-[170px]">
              <div className="space-y-1">
                <p className="px-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Группа</p>
                <NativeSelect
                  value={tableGroupDraft}
                  options={[{ value: "", label: "Все таблицы" }, ...tableGroupOptions]}
                  onValueChange={(next) => setTableGroupDraft(String(next || ""))}
                  placeholder=""
                  disabled={fixedFilters?.tableGroup !== undefined}
                />
              </div>
            </div>
          ) : null}

          {isVisible("city") ? (
            <div className="w-full sm:w-[170px]">
              <div className="space-y-1">
                <p className="px-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Город</p>
                <Input
                  value={cityDraft}
                  onChange={(e) => setCityDraft(e.target.value)}
                  placeholder="Любой город"
                  disabled={fixedFilters?.city !== undefined}
                />
              </div>
            </div>
          ) : null}

          {isVisible("paymentStatus") ? (
            <div className="w-full sm:w-[190px]">
              <div className="space-y-1">
                <p className="px-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Статус оплаты</p>
                <NativeSelect
                  value={paymentStatusDraft}
                  options={[{ value: "", label: "Любой статус оплаты" }, ...paymentStatusOptions]}
                  onValueChange={(next) => setPaymentStatusDraft(String(next || ""))}
                  placeholder=""
                />
              </div>
            </div>
          ) : null}

          {showStateStatusFilter ? (
            <div className="w-full sm:w-[190px]">
              <div className="space-y-1">
                <p className="px-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Статус состояния</p>
                <StateStatusMultiDropdown
                  options={stateStatusOptions}
                  value={stateStatusCodesDraft}
                  onValueChange={setStateStatusCodesDraft}
                />
              </div>
            </div>
          ) : null}

          {isVisible("orderStatus") ? (
            <div className="w-full sm:w-[190px]">
              <div className="space-y-1">
                <p className="px-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Статус действия</p>
                <NativeSelect
                  value={actionStatusDraft}
                  options={[{ value: "", label: "Любой статус действия" }, ...actionStatusOptions]}
                  onValueChange={(next) => setActionStatusDraft(String(next || ""))}
                  placeholder=""
                  disabled={fixedFilters?.orderStatus !== undefined}
                />
              </div>
            </div>
          ) : null}

          <div className="ml-auto">
            <Button variant="outline" size="sm" onClick={onReset}>
              Сбросить
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
