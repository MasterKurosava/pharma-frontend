import { Loader2, Save } from "lucide-react";
import { useEffect, useMemo } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { ConfirmDialog } from "@/shared/ui/confirm-dialog";
import { Button } from "@/shared/ui/button";
import { DrawerFormLayout } from "@/shared/ui/drawer-form-layout/drawer-form-layout";
import { Input } from "@/shared/ui/input";
import { NativeSelect } from "@/shared/ui/native-select/native-select";
import { StatusBadge } from "@/shared/ui/status-badge";
import { DrawerFormSkeleton } from "@/shared/ui/skeleton/skeleton";
import { useDictionaryOptionsQuery } from "@/features/dictionaries/model/use-dictionary-options";
import { useProductDetailQuery, useCreateProductMutation, useUpdateProductMutation } from "@/features/products/api/product-crud-hooks";
import type { Product } from "@/entities/product/api/product-types";
import { type ProductFormValues, productFormSchema } from "@/features/products/model/product-form-schema";
import { productApiToFormValues, productFormValuesToCreateDto, productFormValuesToUpdateDto } from "@/features/products/model/product-mappers";
import { PRODUCT_AVAILABILITY_OPTIONS } from "@/shared/config/product-availability";

type ProductDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  productId?: number | string;
};

function defaultCreateValues(): ProductFormValues {
  return {
    name: "",
    price: 0,
    manufacturerId: 0,
    activeSubstanceId: 0,
    availabilityStatus: PRODUCT_AVAILABILITY_OPTIONS[2].value,
    productOrderSourceId: 0,
    storagePlaceId: 0,
    stockQuantity: 0,
    reservedQuantity: 0,
    imageUrl: "",
    description: "",
    isActive: true,
  };
}

export function ProductDrawer({ open, onOpenChange, mode, productId }: ProductDrawerProps) {
  const isEdit = mode === "edit";

  const productDetailQuery = useProductDetailQuery(isEdit ? productId : undefined);

  const { options: manufacturerOptions, isPending: isManufacturersPending } = useDictionaryOptionsQuery("manufacturers", {
    params: { isActive: true, search: undefined },
  });
  const { options: activeSubstanceOptions, isPending: isActiveSubstancesPending } = useDictionaryOptionsQuery(
    "active-substances",
    { params: { isActive: true, search: undefined } },
  );
  const { options: productOrderSourceOptions, isPending: isProductOrderSourcesPending } = useDictionaryOptionsQuery(
    "product-order-sources",
    { params: { search: undefined } },
  );
  const { options: storagePlaceOptions, isPending: isStoragePlacesPending } = useDictionaryOptionsQuery("storage-places", {
    params: { isActive: true, search: undefined },
  });

  const isDictionariesPending =
    isManufacturersPending || isActiveSubstancesPending || isProductOrderSourcesPending || isStoragePlacesPending;

  const defaultValues = useMemo(() => defaultCreateValues(), []);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues,
    mode: "onChange",
  });

  useEffect(() => {
    if (!open) {
      form.reset(defaultValues);
      return;
    }

    if (!isEdit) {
      form.reset(defaultValues);
      return;
    }

    const product = productDetailQuery.data as Product | undefined;
    if (product) {
      form.reset(productApiToFormValues(product));
    }
  }, [defaultValues, form, isEdit, open, productDetailQuery.data]);

  const [stockQuantity, reservedQuantity] = useWatch({
    control: form.control,
    name: ["stockQuantity", "reservedQuantity"],
  });
  const watchedAvailabilityStatus = useWatch({
    control: form.control,
    name: "availabilityStatus",
  });
  const availableQuantity = stockQuantity - reservedQuantity;

  const isOnRequestStatus = watchedAvailabilityStatus === "ON_REQUEST";

  useEffect(() => {
    if (isOnRequestStatus) return;
    if (form.getValues("productOrderSourceId") !== 0) {
      form.setValue("productOrderSourceId", 0, { shouldDirty: true, shouldValidate: true });
    }
    form.clearErrors("productOrderSourceId");
  }, [form, isOnRequestStatus]);

  const createMutation = useCreateProductMutation();
  const updateMutation = useUpdateProductMutation();

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const isDirty = form.formState.isDirty;
  const isValid = form.formState.isValid;
  const canSave = isDirty && isValid && !isSubmitting;

  const onSubmit = async (values: ProductFormValues) => {
    if (!open) return;

    if (isOnRequestStatus && values.productOrderSourceId <= 0) {
      form.setError("productOrderSourceId", { message: "Выберите источник поступления" });
      return;
    }

    try {
      if (!isEdit) {
        const dto = productFormValuesToCreateDto(values);
        await createMutation.mutateAsync(dto);
        toast.success("Препарат создан");
        onOpenChange(false);
        return;
      }

      if (typeof productId === "undefined") return;
      const dto = productFormValuesToUpdateDto(values);
      await updateMutation.mutateAsync({ id: productId, dto });
      toast.success("Препарат обновлен");
      onOpenChange(false);
    } catch {
      // Errors are already toasted in mutations (onError),
      // but we keep a catch to avoid unhandled promise rejections.
    }
  };

  const resetAndClose = () => {
    form.reset(defaultValues);
    onOpenChange(false);
  };

  const cancelButton = isDirty ? (
    <ConfirmDialog
      trigger={
        <Button variant="outline" disabled={isSubmitting}>
          Отменить
        </Button>
      }
      title="Несохраненные изменения"
      description="Закрыть форму без сохранения?"
      confirmLabel="Не сохранять"
      cancelLabel="Назад"
      confirmVariant="destructive"
      isConfirming={isSubmitting}
      onConfirm={() => {
        resetAndClose();
      }}
    />
  ) : (
    <Button variant="outline" onClick={resetAndClose} disabled={isSubmitting}>
      Отменить
    </Button>
  );

  const footer = (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        {isDirty ? (
          <p className="truncate text-xs text-muted-foreground">Есть несохраненные изменения</p>
        ) : (
          <p className="text-xs text-muted-foreground">&nbsp;</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {cancelButton}
        <Button
          onClick={() => {
            void form.handleSubmit(onSubmit)();
          }}
          disabled={!canSave}
          className="min-w-28"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Сохранение...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Сохранить
            </>
          )}
        </Button>
      </div>
    </div>
  );

  const title = isEdit ? `Редактировать продукт` : "Создать продукт";
  const meta =
    isEdit && productDetailQuery.data ? (
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <StatusBadge label={`ID: ${productDetailQuery.data.id}`} tone="neutral" />
        <StatusBadge label={productDetailQuery.data.isActive ? "Активен" : "Неактивен"} tone={productDetailQuery.data.isActive ? "success" : "neutral"} />
      </div>
    ) : null;

  const isLoading = (isEdit && productDetailQuery.isPending) || isDictionariesPending;

  return (
    <DrawerFormLayout
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description="Редактируйте поля сразу — изменения можно сохранить без переключений."
      meta={meta}
      isSubmitting={isSubmitting}
      isDirty={isDirty}
      footer={footer}
      className="max-w-5xl w-[92vw]"
      contentClassName="bg-muted/40"
    >
      {isLoading ? (
        <DrawerFormSkeleton />
      ) : (
        <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="space-y-3 rounded-xl border bg-muted/30 p-4">
            <h3 className="text-sm font-semibold">Основное</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="product-name">
                  Название
                </label>
                <Input
                  id="product-name"
                  placeholder="Например, Амоксициллин"
                  {...form.register("name")}
                  disabled={isSubmitting}
                />
                {form.formState.errors.name ? (
                  <p className="text-xs text-destructive">{String(form.formState.errors.name.message)}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="product-price">
                  Цена
                </label>
                <Input
                  id="product-price"
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="0"
                  {...form.register("price", {
                    setValueAs: (v) => {
                      if (v === "" || v === null || v === undefined) return 0;
                      const n = typeof v === "number" ? v : Number(v);
                      return Number.isNaN(n) ? 0 : n;
                    },
                  })}
                  disabled={isSubmitting}
                />
                {form.formState.errors.price ? (
                  <p className="text-xs text-destructive">{String(form.formState.errors.price.message)}</p>
                ) : null}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="product-description">
                  Описание
                </label>
                <textarea
                  id="product-description"
                  rows={1}
                  className="flex h-10 min-h-10 w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  {...form.register("description")}
                  disabled={isSubmitting}
                />
                {form.formState.errors.description ? (
                  <p className="text-xs text-destructive">{String(form.formState.errors.description.message)}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="product-image">
                  URL препарата
                </label>
                <Input
                  id="product-image"
                  placeholder="https://..."
                  {...form.register("imageUrl")}
                  disabled={isSubmitting}
                />
                {form.formState.errors.imageUrl ? (
                  <p className="text-xs text-destructive">{String(form.formState.errors.imageUrl.message)}</p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="space-y-3 rounded-xl border bg-muted/30 p-4">
            <h3 className="text-sm font-semibold">Классификация</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Производитель</label>
                <Controller
                  control={form.control}
                  name="manufacturerId"
                  render={({ field }) => (
                    <NativeSelect
                      value={field.value === 0 ? "" : field.value}
                      options={manufacturerOptions}
                      onValueChange={(next) => field.onChange(next === "" ? 0 : next)}
                      placeholder="Выберите производителя"
                      disabled={isSubmitting}
                    />
                  )}
                />
                {form.formState.errors.manufacturerId ? (
                  <p className="text-xs text-destructive">{String(form.formState.errors.manufacturerId.message)}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Действующее вещество</label>
                <Controller
                  control={form.control}
                  name="activeSubstanceId"
                  render={({ field }) => (
                    <NativeSelect
                      value={field.value === 0 ? "" : field.value}
                      options={activeSubstanceOptions}
                      onValueChange={(next) => field.onChange(next === "" ? 0 : next)}
                      placeholder="Выберите вещество"
                      disabled={isSubmitting}
                    />
                  )}
                />
                {form.formState.errors.activeSubstanceId ? (
                  <p className="text-xs text-destructive">{String(form.formState.errors.activeSubstanceId.message)}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Статус продукта</label>
                <Controller
                  control={form.control}
                  name="availabilityStatus"
                  render={({ field }) => (
                    <NativeSelect
                      value={field.value}
                      options={PRODUCT_AVAILABILITY_OPTIONS}
                      onValueChange={(next) => field.onChange(next)}
                      placeholder="Выберите статус"
                      disabled={isSubmitting}
                    />
                  )}
                />
                {form.formState.errors.availabilityStatus ? (
                  <p className="text-xs text-destructive">{String(form.formState.errors.availabilityStatus.message)}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Источник поступления</label>
                <Controller
                  control={form.control}
                  name="productOrderSourceId"
                  render={({ field }) => (
                    <NativeSelect
                      value={field.value === 0 ? "" : field.value}
                      options={productOrderSourceOptions}
                      onValueChange={(next) => field.onChange(next === "" ? 0 : next)}
                      placeholder={isOnRequestStatus ? "Выберите источник" : "Недоступно для обычного статуса"}
                      disabled={isSubmitting || !isOnRequestStatus}
                    />
                  )}
                />
                {form.formState.errors.productOrderSourceId ? (
                  <p className="text-xs text-destructive">{String(form.formState.errors.productOrderSourceId.message)}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Место хранения</label>
                <Controller
                  control={form.control}
                  name="storagePlaceId"
                  render={({ field }) => (
                    <NativeSelect
                      value={field.value === 0 ? "" : field.value}
                      options={storagePlaceOptions}
                      onValueChange={(next) => field.onChange(next === "" ? 0 : next)}
                      placeholder="Не выбрано"
                      disabled={isSubmitting}
                    />
                  )}
                />
                {form.formState.errors.storagePlaceId ? (
                  <p className="text-xs text-destructive">{String(form.formState.errors.storagePlaceId.message)}</p>
                ) : null}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Controller
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <label className="flex cursor-pointer items-center gap-3 rounded-xl border bg-white p-3">
                      <input
                        type="checkbox"
                        checked={field.value}
                        disabled={isSubmitting}
                        onChange={(e) => field.onChange(e.target.checked)}
                      />
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium">Активен</p>
                        <p className="text-xs text-muted-foreground">Показывать в доступных списках</p>
                      </div>
                    </label>
                  )}
                />
              </div>
            </div>
          </div>

          <div className="space-y-3 rounded-xl border bg-muted/30 p-4">
            <h3 className="text-sm font-semibold">Остатки</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="stock-quantity">
                  Запас
                </label>
                <Input
                  id="stock-quantity"
                  type="number"
                  {...form.register("stockQuantity", { valueAsNumber: true })}
                  disabled={isSubmitting}
                />
                {form.formState.errors.stockQuantity ? (
                  <p className="text-xs text-destructive">{String(form.formState.errors.stockQuantity.message)}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="reserved-quantity">
                  Резерв
                </label>
                <Input
                  id="reserved-quantity"
                  type="number"
                  {...form.register("reservedQuantity", { valueAsNumber: true })}
                  disabled={isSubmitting}
                />
                {form.formState.errors.reservedQuantity ? (
                  <p className="text-xs text-destructive">{String(form.formState.errors.reservedQuantity.message)}</p>
                ) : null}
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium" htmlFor="available-quantity">
                  Доступно
                </label>
                <div id="available-quantity" className="flex items-center justify-between gap-3 rounded-xl border bg-muted/30 p-3">
                  <p className="text-sm text-muted-foreground">stock - reserved</p>
                  <StatusBadge
                    label={`${availableQuantity}`}
                    tone={availableQuantity <= 0 ? "danger" : availableQuantity < 5 ? "warning" : "success"}
                  />
                </div>
              </div>
            </div>
          </div>
        </form>
      )}
    </DrawerFormLayout>
  );
}

