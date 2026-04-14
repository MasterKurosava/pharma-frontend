import type { OrdersListUrlState, OrdersFiltersState } from "@/features/orders/model/orders-url";
import type { OrderFilterKey } from "@/entities/user/model/types";
import type { ActionStatusCode, OrderTableGroup, PaymentStatusCode, StateStatusCode } from "@/shared/config/order-static";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";

import { useDebouncedValue } from "@/shared/lib/use-debounced-value";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { NativeSelect } from "@/shared/ui/native-select/native-select";
import { Input } from "@/shared/ui/input";

type OrdersFiltersBarProps = {
  state: Pick<
    OrdersListUrlState,
    "search" | "tableGroup" | "city" | "paymentStatus" | "actionStatusCode" | "stateStatusCode"
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
  const [stateStatusDraft, setStateStatusDraft] = useState(state.stateStatusCode ?? "");
  const [actionStatusDraft, setActionStatusDraft] = useState(state.actionStatusCode ?? "");
  const debouncedDrafts = useDebouncedValue(
    {
      search: searchDraft,
      tableGroup: tableGroupDraft,
      city: cityDraft,
      paymentStatus: paymentStatusDraft,
      stateStatusCode: stateStatusDraft,
      actionStatusCode: actionStatusDraft,
    },
    350,
  );
  const isVisible = (key: OrderFilterKey) => visibleFilters.includes(key);

  useEffect(() => {
    setSearchDraft(state.search ?? "");
    setTableGroupDraft(state.tableGroup ?? "");
    setCityDraft(state.city ?? "");
    setPaymentStatusDraft(state.paymentStatus ?? "");
    setStateStatusDraft(state.stateStatusCode ?? "");
    setActionStatusDraft(state.actionStatusCode ?? "");
  }, [
    state.actionStatusCode,
    state.city,
    state.paymentStatus,
    state.search,
    state.stateStatusCode,
    state.tableGroup,
  ]);

  useEffect(() => {
    onChange({
      search: debouncedDrafts.search.trim() || undefined,
      tableGroup: (debouncedDrafts.tableGroup || undefined) as OrderTableGroup | undefined,
      city: debouncedDrafts.city.trim() || undefined,
      paymentStatus: (debouncedDrafts.paymentStatus || undefined) as PaymentStatusCode | undefined,
      stateStatusCode: (debouncedDrafts.stateStatusCode || undefined) as StateStatusCode | undefined,
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
                placeholder="Поиск по заказу, городу, адресу..."
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

          {isVisible("orderStatuses") ? (
            <div className="w-full sm:w-[190px]">
              <div className="space-y-1">
                <p className="px-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Статус состояния</p>
                <NativeSelect
                  value={stateStatusDraft}
                  options={[{ value: "", label: "Любой статус состояния" }, ...stateStatusOptions]}
                  onValueChange={(next) => setStateStatusDraft(String(next || ""))}
                  placeholder=""
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

