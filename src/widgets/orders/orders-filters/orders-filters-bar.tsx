import {
  canonicalStateStatusCodesKey,
  canonicalMultiCodesKey,
  type OrdersFiltersState,
  type OrdersListUrlState,
} from "@/features/orders/model/orders-url";
import type { OrderFilterKey } from "@/entities/user/model/types";
import type { ActionStatusCode, OrderTableGroup, PaymentStatusCode, StateStatusCode } from "@/shared/config/order-static";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Search } from "lucide-react";

import { useClickOutside } from "@/shared/lib/use-click-outside";
import { useDebouncedValue } from "@/shared/lib/use-debounced-value";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { NativeSelect } from "@/shared/ui/native-select/native-select";
import { Input } from "@/shared/ui/input";

type OrdersFiltersBarProps = {
  state: Pick<
    OrdersListUrlState,
    | "search"
    | "tableGroup"
    | "city"
    | "paymentStatus"
    | "actionStatusCodes"
    | "stateStatusCodes"
    | "assemblyStatusCodes"
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
  assemblyStatusOptions: Array<{ value: string; label: string }>;
};

/** Выпадающий мультивыбор: одна колонка, строки в стиле списка NativeSelect */
function CheckboxMultiDropdown({
  options,
  value,
  onValueChange,
  emptySummaryLabel,
}: {
  options: Array<{ value: string; label: string }>;
  value: string[];
  onValueChange: (next: string[]) => void;
  emptySummaryLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useClickOutside(rootRef, open, () => setOpen(false));

  const labelByCode = useMemo(() => new Map(options.map((o) => [o.value, o.label])), [options]);

  const summary = useMemo(() => {
    if (!value.length) return emptySummaryLabel;
    if (value.length === 1) return labelByCode.get(value[0]) ?? value[0];
    const joined = value.map((c) => labelByCode.get(c) ?? c).join(", ");
    if (joined.length <= 40) return joined;
    return `Выбрано: ${value.length}`;
  }, [value, labelByCode, emptySummaryLabel]);

  const toggle = (code: string, checked: boolean) => {
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
          className="absolute left-0 top-full z-50 mt-1 min-w-full max-w-[min(100vw-1rem,400px)] rounded-md border bg-card p-1.5 shadow-lg"
          role="listbox"
          aria-multiselectable
        >
          <div className="max-h-64 overflow-y-auto overflow-x-hidden py-0.5">
            {options.map((opt) => {
              const checked = value.includes(opt.value);
              return (
                <label
                  key={opt.value}
                  className="flex w-full cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-left text-sm hover:bg-accent"
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 shrink-0 rounded border-input accent-primary"
                    checked={checked}
                    onChange={(e) => toggle(opt.value, e.target.checked)}
                  />
                  <span className="min-w-0 flex-1 break-words leading-snug">{opt.label}</span>
                </label>
              );
            })}
          </div>
          {value.length > 0 ? (
            <div className="mt-1 border-t border-border/80 pt-1">
              <button
                type="button"
                className="flex w-full items-center justify-center rounded-md px-2 py-2 text-xs text-muted-foreground hover:bg-muted/60 hover:text-foreground"
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
  assemblyStatusOptions,
}: OrdersFiltersBarProps) {
  const [searchDraft, setSearchDraft] = useState(state.search ?? "");
  const [tableGroupDraft, setTableGroupDraft] = useState(state.tableGroup ?? "");
  const [cityDraft, setCityDraft] = useState(state.city ?? "");
  const [paymentStatusDraft, setPaymentStatusDraft] = useState(state.paymentStatus ?? "");
  const [actionStatusCodesDraft, setActionStatusCodesDraft] = useState<ActionStatusCode[]>(state.actionStatusCodes ?? []);
  const [stateStatusCodesDraft, setStateStatusCodesDraft] = useState<StateStatusCode[]>(state.stateStatusCodes ?? []);
  const [assemblyStatusCodesDraft, setAssemblyStatusCodesDraft] = useState<string[]>(state.assemblyStatusCodes ?? []);

  const debouncedInput = useMemo(
    () => ({
      search: searchDraft,
      tableGroup: tableGroupDraft,
      city: cityDraft,
      paymentStatus: paymentStatusDraft,
      actionStatusCodes: actionStatusCodesDraft,
      stateStatusCodes: stateStatusCodesDraft,
      assemblyStatusCodes: assemblyStatusCodesDraft,
    }),
    [
      searchDraft,
      tableGroupDraft,
      cityDraft,
      paymentStatusDraft,
      actionStatusCodesDraft,
      stateStatusCodesDraft,
      assemblyStatusCodesDraft,
    ],
  );

  const debouncedDrafts = useDebouncedValue(debouncedInput, 350);
  const isVisible = (key: OrderFilterKey) => visibleFilters.includes(key);
  const showStateStatusFilter = isVisible("stateStatuses") || isVisible("orderStatuses");

  useEffect(() => {
    setSearchDraft(state.search ?? "");
    setTableGroupDraft(state.tableGroup ?? "");
    setCityDraft(state.city ?? "");
    setPaymentStatusDraft(state.paymentStatus ?? "");
  }, [state.city, state.paymentStatus, state.search, state.tableGroup]);

  const actionCodesUrlKey = canonicalMultiCodesKey(state.actionStatusCodes);
  useEffect(() => {
    setActionStatusCodesDraft(state.actionStatusCodes ?? []);
  }, [actionCodesUrlKey]);

  const stateCodesUrlKey = canonicalStateStatusCodesKey(state.stateStatusCodes);
  useEffect(() => {
    setStateStatusCodesDraft(state.stateStatusCodes ?? []);
  }, [stateCodesUrlKey]);

  const assemblyCodesUrlKey = canonicalMultiCodesKey(state.assemblyStatusCodes);
  useEffect(() => {
    setAssemblyStatusCodesDraft(state.assemblyStatusCodes ?? []);
  }, [assemblyCodesUrlKey]);

  useEffect(() => {
    onChange({
      search: debouncedDrafts.search.trim() || undefined,
      tableGroup: (debouncedDrafts.tableGroup || undefined) as OrderTableGroup | undefined,
      city: debouncedDrafts.city.trim() || undefined,
      paymentStatus: (debouncedDrafts.paymentStatus || undefined) as PaymentStatusCode | undefined,
      actionStatusCodes: debouncedDrafts.actionStatusCodes.length ? debouncedDrafts.actionStatusCodes : undefined,
      stateStatusCodes: debouncedDrafts.stateStatusCodes.length ? debouncedDrafts.stateStatusCodes : undefined,
      assemblyStatusCodes: debouncedDrafts.assemblyStatusCodes.length ? debouncedDrafts.assemblyStatusCodes : undefined,
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

          {isVisible("orderStatus") ? (
            <div className="w-full min-w-0 sm:min-w-[220px] sm:max-w-[260px]">
              <div className="space-y-1">
                <p className="px-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Статус действия</p>
                <CheckboxMultiDropdown
                  options={actionStatusOptions}
                  value={actionStatusCodesDraft}
                  onValueChange={(next) => setActionStatusCodesDraft(next as ActionStatusCode[])}
                  emptySummaryLabel="Любой статус действия"
                />
              </div>
            </div>
          ) : null}

          {showStateStatusFilter ? (
            <div className="w-full min-w-0 sm:min-w-[220px] sm:max-w-[260px]">
              <div className="space-y-1">
                <p className="px-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Статус состояния</p>
                <CheckboxMultiDropdown
                  options={stateStatusOptions}
                  value={stateStatusCodesDraft}
                  onValueChange={(next) => setStateStatusCodesDraft(next as StateStatusCode[])}
                  emptySummaryLabel="Любой статус состояния"
                />
              </div>
            </div>
          ) : null}

          {isVisible("assemblyStatuses") ? (
            <div className="w-full min-w-0 sm:min-w-[220px] sm:max-w-[260px]">
              <div className="space-y-1">
                <p className="px-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Статус сборки</p>
                <CheckboxMultiDropdown
                  options={assemblyStatusOptions}
                  value={assemblyStatusCodesDraft}
                  onValueChange={setAssemblyStatusCodesDraft}
                  emptySummaryLabel="Любой статус сборки"
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
