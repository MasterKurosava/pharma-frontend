import type { OrdersListUrlState, OrdersFiltersState } from "@/features/orders/model/orders-url";
import type { OrderFilterKey } from "@/entities/user/model/types";
import type { DeliveryStatusCode, OrderStatusCode, PaymentStatusCode } from "@/shared/config/order-static";

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
    "search" | "countryId" | "city" | "paymentStatus" | "orderStatus" | "deliveryStatus"
  >;
  onChange: (patch: Partial<OrdersFiltersState>) => void;
  onReset: () => void;
  visibleFilters: OrderFilterKey[];
  fixedFilters?: {
    countryId?: number;
    city?: string;
    orderStatus?: string;
    deliveryStatuses?: string[];
  };
  countryOptions: Array<{ value: number; label: string }>;
  paymentStatusOptions: Array<{ value: string; label: string }>;
  orderStatusOptions: Array<{ value: string; label: string }>;
  deliveryStatusOptions: Array<{ value: string; label: string }>;
};

export function OrdersFiltersBar({
  state,
  onChange,
  onReset,
  visibleFilters,
  fixedFilters,
  countryOptions,
  paymentStatusOptions,
  orderStatusOptions,
  deliveryStatusOptions,
}: OrdersFiltersBarProps) {
  const [searchDraft, setSearchDraft] = useState(state.search ?? "");
  const [countryIdDraft, setCountryIdDraft] = useState<number | "">(state.countryId ?? "");
  const [cityDraft, setCityDraft] = useState(state.city ?? "");
  const [paymentStatusDraft, setPaymentStatusDraft] = useState(state.paymentStatus ?? "");
  const [deliveryStatusDraft, setDeliveryStatusDraft] = useState(state.deliveryStatus ?? "");
  const [orderStatusDraft, setOrderStatusDraft] = useState(state.orderStatus ?? "");
  const debouncedDrafts = useDebouncedValue(
    {
      search: searchDraft,
      countryId: countryIdDraft,
      city: cityDraft,
      paymentStatus: paymentStatusDraft,
      deliveryStatus: deliveryStatusDraft,
      orderStatus: orderStatusDraft,
    },
    350,
  );
  const isVisible = (key: OrderFilterKey) => visibleFilters.includes(key);

  useEffect(() => {
    setSearchDraft(state.search ?? "");
    setCountryIdDraft(state.countryId ?? "");
    setCityDraft(state.city ?? "");
    setPaymentStatusDraft(state.paymentStatus ?? "");
    setDeliveryStatusDraft(state.deliveryStatus ?? "");
    setOrderStatusDraft(state.orderStatus ?? "");
  }, [
    state.city,
    state.countryId,
    state.deliveryStatus,
    state.orderStatus,
    state.paymentStatus,
    state.search,
  ]);

  useEffect(() => {
    onChange({
      search: debouncedDrafts.search.trim() || undefined,
      countryId:
        typeof debouncedDrafts.countryId === "number" && debouncedDrafts.countryId > 0
          ? debouncedDrafts.countryId
          : undefined,
      city: debouncedDrafts.city.trim() || undefined,
      paymentStatus: (debouncedDrafts.paymentStatus || undefined) as PaymentStatusCode | undefined,
      deliveryStatus: (debouncedDrafts.deliveryStatus || undefined) as DeliveryStatusCode | undefined,
      orderStatus: (debouncedDrafts.orderStatus || undefined) as OrderStatusCode | undefined,
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

          {isVisible("countryId") ? (
            <div className="w-full sm:w-[170px]">
              <div className="space-y-1">
                <p className="px-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Страна</p>
                <NativeSelect
                  value={countryIdDraft}
                  options={[{ value: 0, label: "Все страны" }, ...countryOptions]}
                  onValueChange={(next) => setCountryIdDraft(typeof next === "number" && next !== 0 ? next : "")}
                  placeholder=""
                  disabled={fixedFilters?.countryId !== undefined}
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

          {isVisible("deliveryStatus") ? (
            <div className="w-full sm:w-[190px]">
              <div className="space-y-1">
                <p className="px-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Куда собрать</p>
                <NativeSelect
                  value={deliveryStatusDraft}
                  options={[{ value: "", label: "Любое направление сборки" }, ...deliveryStatusOptions]}
                  onValueChange={(next) => setDeliveryStatusDraft(String(next || ""))}
                  placeholder=""
                  disabled={Boolean(fixedFilters?.deliveryStatuses?.length)}
                />
              </div>
            </div>
          ) : null}

          {isVisible("orderStatus") ? (
            <div className="w-full sm:w-[190px]">
              <div className="space-y-1">
                <p className="px-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Статус заказа</p>
                <NativeSelect
                  value={orderStatusDraft}
                  options={[{ value: "", label: "Любой статус заказа" }, ...orderStatusOptions]}
                  onValueChange={(next) => setOrderStatusDraft(String(next || ""))}
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

