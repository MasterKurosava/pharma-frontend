import {
  canonicalStateStatusCodesKey,
  type OrdersFiltersState,
  type OrdersListUrlState,
} from "@/features/orders/model/orders-url";
import type { OrderFilterKey } from "@/entities/user/model/types";
import type { ActionStatusCode, OrderTableGroup, PaymentStatusCode, StateStatusCode } from "@/shared/config/order-static";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";

import { useDebouncedValue } from "@/shared/lib/use-debounced-value";
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

  const toggleStateStatus = (code: StateStatusCode, checked: boolean) => {
    setStateStatusCodesDraft((prev) => {
      if (checked) {
        return prev.includes(code) ? prev : [...prev, code];
      }
      return prev.filter((c) => c !== code);
    });
  };

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
            <div className="w-full min-w-[200px] max-w-[min(100%,420px)]">
              <div className="space-y-1">
                <p className="px-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Статус состояния</p>
                <div className="max-h-40 overflow-y-auto rounded-md border bg-card px-2 py-2">
                  <div className="grid gap-1.5 sm:grid-cols-2">
                    {stateStatusOptions.map((opt) => {
                      const code = opt.value as StateStatusCode;
                      const checked = stateStatusCodesDraft.includes(code);
                      return (
                        <label key={opt.value} className="inline-flex items-center gap-2 text-sm leading-tight">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => toggleStateStatus(code, e.target.checked)}
                          />
                          <span>{opt.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
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
