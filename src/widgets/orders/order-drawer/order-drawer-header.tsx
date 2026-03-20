import { X } from "lucide-react";

import { Button } from "@/shared/ui/button";
import { StatusBadge } from "@/shared/ui/status-badge";

type OrderDrawerHeaderProps = {
  orderId?: number | string;
  orderStatusLabel?: string;
  readonlyOrder?: boolean;
  onClose: () => void;
};

export function OrderDrawerHeader({
  orderId,
  orderStatusLabel,
  readonlyOrder = false,
  onClose,
}: OrderDrawerHeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b bg-background/95 px-6 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <h2 className="truncate text-lg font-semibold tracking-tight">
            {orderId ? `Заказ #${orderId}` : "Редактирование заказа"}
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs text-muted-foreground">ID: {orderId ?? "—"}</p>
            {orderStatusLabel ? <StatusBadge label={orderStatusLabel} tone="neutral" /> : null}
            {readonlyOrder ? <StatusBadge label="Только чтение" tone="neutral" /> : null}
          </div>
          <p className="text-xs text-muted-foreground">
            Изменения сохраняются одной операцией.
          </p>
        </div>

        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Закрыть drawer">
          <X className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
