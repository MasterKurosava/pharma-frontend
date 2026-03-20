import type { OrdersListUrlState, OrdersFiltersState } from "@/features/orders/model/orders-url";

import { useEffect, useState } from "react";
import { ChevronDown, Search, SlidersHorizontal } from "lucide-react";
import { useDebouncedValue } from "@/shared/lib/use-debounced-value";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { NativeSelect } from "@/shared/ui/native-select/native-select";
import { Input } from "@/shared/ui/input";

type OrdersFiltersBarProps = {
  state: Pick<OrdersListUrlState, "search" | "clientId" | "countryId" | "cityId" | "paymentStatusId" | "orderStatusId" | "assemblyStatusId" | "deliveryCompanyId" | "dateFrom" | "dateTo">;
  onChange: (patch: Partial<OrdersFiltersState>) => void;
  onReset: () => void;
  countryOptions: Array<{ value: number; label: string }>;
  cityOptions: Array<{ value: number; label: string }>;
  clientOptions: Array<{ value: number; label: string }>;
  paymentStatusOptions: Array<{ value: number; label: string }>;
  orderStatusOptions: Array<{ value: number; label: string }>;
  assemblyStatusOptions: Array<{ value: number; label: string }>;
  deliveryCompanyOptions: Array<{ value: number; label: string }>;
};

export function OrdersFiltersBar({
  state,
  onChange,
  onReset,
  countryOptions,
  cityOptions,
  clientOptions,
  paymentStatusOptions,
  orderStatusOptions,
  assemblyStatusOptions,
  deliveryCompanyOptions,
}: OrdersFiltersBarProps) {
  const [searchDraft, setSearchDraft] = useState(state.search ?? "");
  const debouncedSearch = useDebouncedValue(searchDraft, 400);

  useEffect(() => {
    setSearchDraft(state.search ?? "");
  }, [state.search]);

  useEffect(() => {
    onChange({ search: debouncedSearch ? debouncedSearch : undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const additionalActiveCount =
    Number(Boolean(state.clientId)) +
    Number(Boolean(state.assemblyStatusId)) +
    Number(Boolean(state.deliveryCompanyId));

  return (
    <Card className="border-border/70 shadow-sm">
      <div className="space-y-3 p-3 md:p-4">
        <div className="flex flex-wrap items-end gap-2">
          <div className="relative min-w-[260px] flex-1 lg:max-w-[420px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              placeholder="Поиск по заказу, клиенту, адресу..."
              className="pl-9"
            />
          </div>

          <div className="w-full sm:w-[170px]">
            <NativeSelect
              value={state.countryId ?? ""}
              options={[{ value: 0, label: "Все страны" }, ...countryOptions]}
              onValueChange={(next) => onChange({ countryId: typeof next === "number" && next !== 0 ? next : undefined })}
              placeholder=""
            />
          </div>

          <div className="w-full sm:w-[170px]">
            <NativeSelect
              value={state.cityId ?? ""}
              options={[{ value: 0, label: "Все города" }, ...cityOptions]}
              onValueChange={(next) => onChange({ cityId: typeof next === "number" && next !== 0 ? next : undefined })}
              placeholder=""
              disabled={cityOptions.length === 0}
            />
          </div>

          <div className="w-full sm:w-[190px]">
            <NativeSelect
              value={state.orderStatusId ?? ""}
              options={[{ value: 0, label: "Любой статус заказа" }, ...orderStatusOptions]}
              onValueChange={(next) => onChange({ orderStatusId: typeof next === "number" && next !== 0 ? next : undefined })}
              placeholder=""
            />
          </div>

          <div className="w-full sm:w-[190px]">
            <NativeSelect
              value={state.paymentStatusId ?? ""}
              options={[{ value: 0, label: "Любой статус оплаты" }, ...paymentStatusOptions]}
              onValueChange={(next) => onChange({ paymentStatusId: typeof next === "number" && next !== 0 ? next : undefined })}
              placeholder=""
            />
          </div>

          <div className="w-full sm:w-[170px]">
            <div className="space-y-1">
              <p className="px-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">От</p>
              <Input type="date" value={state.dateFrom ?? ""} onChange={(e) => onChange({ dateFrom: e.target.value || undefined })} />
            </div>
          </div>

          <div className="w-full sm:w-[170px]">
            <div className="space-y-1">
              <p className="px-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">До</p>
              <Input type="date" value={state.dateTo ?? ""} onChange={(e) => onChange({ dateTo: e.target.value || undefined })} />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3">
          <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Управление списком
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={onReset}>
              Сбросить
            </Button>
          </div>
        </div>

        <details className="group rounded-lg border border-border/70 bg-muted/20 p-2.5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-md px-1 text-sm">
            <span className="inline-flex items-center gap-2 text-muted-foreground">
              <SlidersHorizontal className="h-4 w-4" />
              Дополнительные фильтры
              <span className="rounded-full bg-background px-2 py-0.5 text-xs font-medium text-foreground">
                {additionalActiveCount}
              </span>
            </span>
            <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
          </summary>

          <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
            <NativeSelect
              value={state.clientId ?? ""}
              options={[{ value: 0, label: "Любой клиент" }, ...clientOptions]}
              onValueChange={(next) => onChange({ clientId: typeof next === "number" && next !== 0 ? next : undefined })}
              placeholder=""
            />

            <NativeSelect
              value={state.assemblyStatusId ?? ""}
              options={[{ value: 0, label: "Любой статус сборки" }, ...assemblyStatusOptions]}
              onValueChange={(next) => onChange({ assemblyStatusId: typeof next === "number" && next !== 0 ? next : undefined })}
              placeholder=""
            />

            <NativeSelect
              value={state.deliveryCompanyId ?? ""}
              options={[{ value: 0, label: "Любая служба доставки" }, ...deliveryCompanyOptions]}
              onValueChange={(next) => onChange({ deliveryCompanyId: typeof next === "number" && next !== 0 ? next : undefined })}
              placeholder=""
            />
          </div>
        </details>
      </div>
    </Card>
  );
}

