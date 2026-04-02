import { Controller, type Control, type FieldErrors } from "react-hook-form";

import { Input } from "@/shared/ui/input";
import type { OrderFormValues } from "@/features/orders/model/order-form-schema";

type OrderFinanceBlockProps = {
  control: Control<OrderFormValues>;
  errors: FieldErrors<OrderFormValues>;
  totalPrice: number;
  remainingAmount: number;
  formatMoney: (value?: number | null) => string;
  disabled?: boolean;
};

export function OrderFinanceBlock({
  control,
  errors,
  totalPrice,
  remainingAmount,
  formatMoney,
  disabled = false,
}: OrderFinanceBlockProps) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      <div className="rounded-lg border bg-muted/10 p-3">
        <p className="text-xs text-muted-foreground">Итого</p>
        <p className="mt-1 text-lg font-semibold tracking-tight">{formatMoney(totalPrice)}</p>
      </div>

      <div className="rounded-lg border bg-muted/10 p-3">
        <p className="text-xs text-muted-foreground">Остаток</p>
        <p className="mt-1 text-lg font-semibold tracking-tight">{formatMoney(remainingAmount)}</p>
      </div>

      <div className="rounded-lg border bg-muted/10 p-3">
        <p className="text-xs text-muted-foreground">Оплачено</p>
        <div className="mt-2">
          <Controller
            control={control}
            name="paidAmount"
            render={({ field }) => (
              <Input
                type="number"
                min={0}
                value={field.value}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  field.onChange(Number.isFinite(n) ? n : 0);
                }}
                className="bg-white"
                disabled={disabled}
              />
            )}
          />
        </div>
        {errors.paidAmount ? <p className="mt-2 text-xs text-destructive">{String(errors.paidAmount.message)}</p> : null}
      </div>
    </div>
  );
}
