import { X } from "lucide-react";

import { useMemo } from "react";

import { DrawerShell } from "@/shared/ui/drawer-shell";
import { Button } from "@/shared/ui/button";
import { StatusBadge } from "@/shared/ui/status-badge";

import { DrawerFormSkeleton } from "@/shared/ui/skeleton/skeleton";
import type { Order } from "@/entities/order/api/order-types";

type OrderPreviewDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId?: number;
  options: {
    countries: Map<number, string>;
    paymentStatuses: Map<string, string>;
    orderStatuses: Map<string, string>;
    deliveryStatuses: Map<string, string>;
    storagePlaces: Map<number, string>;
  };
  orderDetail?: Order;
  isLoading: boolean;
};

function formatMoney(value?: number | null) {
  if (value === null || typeof value === "undefined") return "—";
  return new Intl.NumberFormat("ru-RU", { style: "currency", currency: "KZT", maximumFractionDigits: 0 }).format(value);
}

export function OrderPreviewDrawer({
  open,
  onOpenChange,
  orderId,
  options,
  orderDetail,
  isLoading,
}: OrderPreviewDrawerProps) {
  const title = useMemo(() => `Заказ #${orderId ?? ""}`, [orderId]);

  return (
    <DrawerShell
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description="Предпросмотр заказа (редактор будет добавлен на следующем этапе)."
      className="w-[92vw] max-w-5xl"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <StatusBadge label="Предпросмотр" tone="neutral" />
        </div>
        <Button variant="outline" size="icon" onClick={() => onOpenChange(false)} aria-label="Закрыть предпросмотр">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {isLoading ? (
        <div className="mt-4">
          <DrawerFormSkeleton />
        </div>
      ) : !orderDetail ? (
        <div className="mt-4">
          <p className="text-sm text-muted-foreground">Заказ не найден.</p>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <section className="rounded-xl border bg-card p-4">
            <h3 className="text-sm font-semibold">Основное</h3>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Телефон клиента</p>
                <p className="mt-1 text-sm font-medium">{orderDetail.clientPhone ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Адрес</p>
                <p className="mt-1 text-sm font-medium">{orderDetail.address ?? "—"}</p>
                <p className="text-xs text-muted-foreground">
                  {(options.countries.get(orderDetail.countryId ?? -1) ?? null) ? `${options.countries.get(orderDetail.countryId ?? -1)}` : ""}
                  {orderDetail.city ? `, ${orderDetail.city}` : ""}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-xl border bg-card p-4">
            <h3 className="text-sm font-semibold">Статусы и суммы</h3>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Статус заказа</p>
                <StatusBadge
                  label={orderDetail.orderStatus ? options.orderStatuses.get(orderDetail.orderStatus) ?? "—" : "—"}
                  tone="neutral"
                />
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Статус оплаты</p>
                <StatusBadge
                  label={orderDetail.paymentStatus ? options.paymentStatuses.get(orderDetail.paymentStatus) ?? "—" : "—"}
                  tone="neutral"
                />
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Куда собрать</p>
                <StatusBadge
                  label={orderDetail.deliveryStatus ? options.deliveryStatuses.get(orderDetail.deliveryStatus) ?? "—" : "—"}
                  tone="neutral"
                />
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Место хранения</p>
                <StatusBadge
                  label={orderDetail.storagePlaceId ? options.storagePlaces.get(orderDetail.storagePlaceId) ?? "—" : "—"}
                  tone="neutral"
                />
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-xl border bg-background/50 p-3">
                <p className="text-xs text-muted-foreground">Итоговая сумма</p>
                <p className="mt-1 text-sm font-semibold">{formatMoney(orderDetail.totalPrice ?? null)}</p>
              </div>
              <div className="rounded-xl border bg-background/50 p-3">
                <p className="text-xs text-muted-foreground">Оплачено</p>
                <p className="mt-1 text-sm font-semibold">{formatMoney(orderDetail.paidAmount ?? null)}</p>
              </div>
              <div className="rounded-xl border bg-background/50 p-3">
                <p className="text-xs text-muted-foreground">Остаток</p>
                <p className="mt-1 text-sm font-semibold">
                  {formatMoney(orderDetail.remainingAmount ?? null)}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-xl border bg-card p-4">
            <h3 className="text-sm font-semibold">Позиции</h3>
            <div className="mt-3">
              <p className="text-sm text-muted-foreground">
                Предпросмотр позиций не полностью реализован на этом этапе. Общее количество позиций: {orderDetail.items?.length ?? orderDetail.itemsCount ?? "—"}.
              </p>
              <div className="mt-3 rounded-xl border bg-background/40 p-3 text-sm text-muted-foreground">
                Форма редактирования заказа и редактирование позиций будут подключены на следующем этапе.
              </div>
            </div>
          </section>
        </div>
      )}
    </DrawerShell>
  );
}

