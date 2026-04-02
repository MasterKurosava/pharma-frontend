import { Plus, Trash } from "lucide-react";
import { Controller, type Control, type FieldErrors, type UseFieldArrayAppend, type UseFieldArrayRemove } from "react-hook-form";

import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { NativeSelect } from "@/shared/ui/native-select/native-select";
import type { OrderFormValues } from "@/features/orders/model/order-form-schema";

type ItemOption = {
  value: number;
  label: string;
};

type OrderItemsEditorProps = {
  control: Control<OrderFormValues>;
  errors: FieldErrors<OrderFormValues>;
  fields: Array<{ id: string }>;
  productOptions: ItemOption[];
  append: UseFieldArrayAppend<OrderFormValues, "items">;
  remove: UseFieldArrayRemove;
  disabled?: boolean;
};

export function OrderItemsEditor({
  control,
  errors,
  fields,
  productOptions,
  append,
  remove,
  disabled = false,
}: OrderItemsEditorProps) {
  return (
    <div className="space-y-3">
      {fields.map((fieldItem, index) => {
        const productError = errors.items?.[index]?.productId;
        const quantityError = errors.items?.[index]?.quantity;

        return (
          <div
            key={fieldItem.id}
            className="grid gap-3 rounded-lg border border-border/70 bg-muted/20 p-3 transition-colors hover:border-border md:grid-cols-[1fr_112px_40px]"
          >
            <div className="space-y-1.5">
              <Controller
                control={control}
                name={`items.${index}.productId`}
                render={({ field }) => (
                  <NativeSelect
                    value={field.value || ""}
                    options={productOptions}
                    onValueChange={(next) => field.onChange(next === "" ? 0 : next)}
                    placeholder="Выберите препарат"
                    disabled={disabled}
                  />
                )}
              />
              {productError ? <p className="text-xs text-destructive">{String(productError.message)}</p> : null}
            </div>

            <div className="space-y-1.5">
              <Controller
                control={control}
                name={`items.${index}.quantity`}
                render={({ field }) => (
                  <Input
                    type="number"
                    min={1}
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
              {quantityError ? <p className="text-xs text-destructive">{String(quantityError.message)}</p> : null}
            </div>

            <div className="flex items-start justify-end">
              <Button
                type="button"
                size="icon"
                variant="destructive"
                className="mt-0.5 h-8 w-8 cursor-pointer"
                onClick={() => remove(index)}
                disabled={disabled || fields.length <= 1}
                aria-label="Удалить позицию"
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          </div>
        );
      })}

      <Button
        type="button"
        variant="outline"
        className="h-9"
        disabled={disabled || productOptions.length === 0}
        onClick={() => {
          append({
            productId: productOptions[0]?.value ?? 0,
            quantity: 1,
          });
        }}
      >
        <Plus className="mr-2 h-4 w-4" />
        Добавить позицию
      </Button>
    </div>
  );
}
