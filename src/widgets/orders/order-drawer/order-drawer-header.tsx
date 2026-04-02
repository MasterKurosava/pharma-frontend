import { X } from "lucide-react";

import { Button } from "@/shared/ui/button";

type OrderDrawerHeaderProps = {
  orderId?: number | string;
  isCreateMode?: boolean;
  onClose: () => void;
};

export function OrderDrawerHeader({
  orderId,
  isCreateMode,
  onClose,
}: OrderDrawerHeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b bg-background/95 px-6 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <h2 className="truncate text-lg font-semibold tracking-tight">
            {isCreateMode ? "Создание заказа" : orderId ? `Заказ #${orderId}` : "Редактирование заказа"}
          </h2>
        </div>

        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Закрыть drawer">
          <X className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
