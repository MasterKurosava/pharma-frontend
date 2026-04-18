import { Loader2, Save } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { Button } from "@/shared/ui/button";
import { DrawerFormLayout } from "@/shared/ui/drawer-form-layout/drawer-form-layout";
import { Input } from "@/shared/ui/input";
import { NativeSelect } from "@/shared/ui/native-select/native-select";
import { DrawerFormSkeleton } from "@/shared/ui/skeleton/skeleton";
import { ErrorState } from "@/shared/ui/error-state";
import { cn } from "@/shared/lib/utils";
import { useProductsQuery } from "@/features/products/api/product-crud-hooks";
import { useOrderDetailQuery } from "@/features/orders/api/orders-queries";
import { useCreateOrderMutation, useUpdateOrderMutation } from "@/features/orders/api/order-save-mutations";
import { orderFormSchema, type OrderFormValues } from "@/features/orders/model/order-form-schema";
import { orderApiToFormValues, orderFormValuesToCreateDto, orderFormValuesToUpdateDto } from "@/features/orders/model/order-mappers";
import { useAuth } from "@/features/auth/model/use-auth";
import { PAYMENT_STATUS_OPTIONS } from "@/shared/config/order-static";
import { useDictionaryOptionsQuery } from "@/features/dictionaries/model/use-dictionary-options";
import { OrderDrawerHeader } from "@/widgets/orders/order-drawer/order-drawer-header";
import { OrderFormSection } from "@/widgets/orders/order-drawer/order-form-section";
import { toast } from "sonner";
import type { Product } from "@/entities/product/api/product-types";
import { ORDER_DEFAULT_CODES } from "@/features/orders/config/orders-ui-config";
import { useOrderFilterOptions } from "@/features/orders/model/use-order-filter-options";
import axios from "axios";

type OrderDrawerEditorProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId?: number | string;
  onCreated?: (orderId: number) => void;
};

type LabeledFieldProps = {
  label: string;
  hint?: string;
  error?: string;
  className?: string;
  children: ReactNode;
};

function LabeledField({ label, hint, error, className, children }: LabeledFieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="space-y-0.5">
        <p className="text-xs font-medium text-foreground">{label}</p>
        {hint ? <p className="text-[11px] text-muted-foreground">{hint}</p> : null}
        {error ? <p className="text-[11px] text-destructive whitespace-pre-line">{error}</p> : null}
      </div>
      {children}
    </div>
  );
}

const emptyOrderFormValues = (): OrderFormValues => ({
  clientPhone: "",
  clientFullName: "",
  city: undefined,
  address: undefined,
  actionStatusCode: ORDER_DEFAULT_CODES.actionStatusCode,
  stateStatusCode: ORDER_DEFAULT_CODES.stateStatusCode,
  assemblyStatusCode: undefined,
  paymentStatus: PAYMENT_STATUS_OPTIONS[0].value,
  deliveryPrice: 0,
  storagePlaceId: 0,
  orderStorage: "",
  description: "",
  productId: 0,
  quantity: 1,
  productPrice: 0,
  totalPrice: 0,
  remainingAmount: 0,
});

function formatMoney(value?: number | null) {
  if (value === null || typeof value === "undefined") return "—";
  return new Intl.NumberFormat("ru-RU", { style: "currency", currency: "KZT", maximumFractionDigits: 0 }).format(value);
}

function getProductUnitPrice(product: Product): number {
  return Number(product.price ?? 0);
}

export function OrderDrawerEditor({ open, onOpenChange, orderId, onCreated }: OrderDrawerEditorProps) {
  const { user } = useAuth();
  const isCreateMode = Number(orderId ?? 0) === 0;
  const orderDetailQuery = useOrderDetailQuery(isCreateMode ? undefined : orderId);
  const createOrderMutation = useCreateOrderMutation();
  const updateOrderMutation = useUpdateOrderMutation();
  const isEditLoading = !isCreateMode && orderDetailQuery.isPending && open;
  const serverValuesRef = useRef<OrderFormValues>(emptyOrderFormValues());
  const [confirmCloseOpen, setConfirmCloseOpen] = useState(false);
  const [pendingClose, setPendingClose] = useState(false);

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: emptyOrderFormValues(),
    mode: "onChange",
  });

  const watchedProductId = useWatch({ control: form.control, name: "productId" });
  const watchedQuantity = useWatch({ control: form.control, name: "quantity" });
  const watchedDeliveryPrice = useWatch({ control: form.control, name: "deliveryPrice" });
  const watchedPaymentStatus = useWatch({ control: form.control, name: "paymentStatus" });
  const editableFields = useMemo(() => new Set(user?.accessPolicy?.orders.editableFields ?? []), [user?.accessPolicy?.orders.editableFields]);
  const canEditField = (field: string) => editableFields.has(field as never);
  const storagePlacesOptions = useDictionaryOptionsQuery("storage-places", { includeCodeInLabel: false });
  const statusOptions = useOrderFilterOptions();
  const productsQuery = useProductsQuery({ isActive: true });

  const productsOptions = useMemo(
    () =>
      (productsQuery.data ?? []).map((p) => ({
        value: p.id,
        label: `${p.name} • доступно: ${p.availableQuantity}`,
      })),
    [productsQuery.data],
  );
  const storagePlaceLabelMap = useMemo(() => {
    const map = new Map<number, string>();
    for (const option of storagePlacesOptions.options) {
      map.set(option.value, option.label);
    }
    return map;
  }, [storagePlacesOptions.options]);

  const productPriceMap = useMemo(() => {
    const map = new Map<number, number>();
    for (const product of productsQuery.data ?? []) map.set(product.id, getProductUnitPrice(product));
    return map;
  }, [productsQuery.data]);

  useEffect(() => {
    if (!open) return;
    if (isCreateMode) {
      const defaults = emptyOrderFormValues();
      serverValuesRef.current = defaults;
      form.reset(defaults);
      return;
    }
    if (orderDetailQuery.data) {
      const mapped = orderApiToFormValues(orderDetailQuery.data);
      serverValuesRef.current = mapped;
      form.reset(mapped);
    }
  }, [form, isCreateMode, open, orderDetailQuery.data]);

  useEffect(() => {
    if (!open) return;
    // If the product is not present in the "active products" list (or still loading),
    // keep the current productPrice instead of forcing 0 (otherwise totals/remaining become 0).
    const currentProductPrice = Number(form.getValues("productPrice") ?? 0);
    const resolvedProductPrice = productPriceMap.get(Number(watchedProductId));
    const unitPrice =
      typeof resolvedProductPrice === "number" && Number.isFinite(resolvedProductPrice)
        ? resolvedProductPrice
        : Number.isFinite(currentProductPrice)
          ? currentProductPrice
          : 0;
    const quantity = Math.max(0, Number(watchedQuantity || 0));
    const deliveryPrice = Number.isFinite(Number(watchedDeliveryPrice)) ? Number(watchedDeliveryPrice) : 0;
    const total = unitPrice * quantity + deliveryPrice;
    const paidRatio = watchedPaymentStatus === "PAID" ? 1 : watchedPaymentStatus === "PREPAID_50" ? 0.5 : 0;
    const remaining = Math.max(0, total - total * paidRatio);

    if (form.getValues("productPrice") !== unitPrice) form.setValue("productPrice", unitPrice, { shouldDirty: false });
    if (form.getValues("totalPrice") !== total) form.setValue("totalPrice", total, { shouldDirty: false });
    if (form.getValues("remainingAmount") !== remaining) form.setValue("remainingAmount", remaining, { shouldDirty: false });
  }, [form, open, productPriceMap, watchedDeliveryPrice, watchedPaymentStatus, watchedProductId, watchedQuantity]);

  const isSubmitting = updateOrderMutation.isPending || createOrderMutation.isPending;
  const isDirty = form.formState.isDirty;
  const isValid = form.formState.isValid;
  const remainingCardClass =
    watchedPaymentStatus === "PAID"
      ? "border-emerald-200 bg-emerald-50/80 text-emerald-900"
      : watchedPaymentStatus === "PREPAID_50"
        ? "border-amber-200 bg-amber-50/80 text-amber-900"
        : "border-rose-200 bg-rose-50/80 text-rose-900";

  const submit = async (values: OrderFormValues) => {
    form.clearErrors();
    const valuesWithStorage: OrderFormValues = {
      ...values,
      orderStorage: storagePlaceLabelMap.get(Number(values.storagePlaceId)),
    };
    try {
      if (isCreateMode) {
        const createdOrder = await createOrderMutation.mutateAsync(
          orderFormValuesToCreateDto(valuesWithStorage),
        );
        const mapped = orderApiToFormValues(createdOrder);
        serverValuesRef.current = mapped;
        form.reset(mapped);
        onCreated?.(createdOrder.id);
        toast.success("Заказ создан");
        return;
      }

      if (!orderId) return;
      const dto = orderFormValuesToUpdateDto(valuesWithStorage);
      const sanitizedDto = Object.fromEntries(
        Object.entries(dto).filter(([key, value]) => value !== undefined && canEditField(key)),
      );
      if (Object.keys(sanitizedDto).length === 0) {
        toast.error("Недостаточно прав для сохранения изменений");
        return;
      }
      const updatedOrder = await updateOrderMutation.mutateAsync({ id: orderId, dto: sanitizedDto });
      const mapped = orderApiToFormValues(updatedOrder);
      serverValuesRef.current = mapped;
      form.reset(mapped);
      toast.success("Заказ сохранен");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const data = error.response?.data as unknown;
        const fieldErrors =
          typeof data === "object" && data !== null && "fieldErrors" in data
            ? (data as { fieldErrors?: Record<string, string[]> }).fieldErrors
            : undefined;

        if (fieldErrors && typeof fieldErrors === "object") {
          let applied = 0;
          for (const [field, messages] of Object.entries(fieldErrors)) {
            const msg = Array.isArray(messages) ? messages.filter(Boolean).join("\n") : String(messages ?? "");
            if (!msg) continue;
            // We only set errors for known form fields; unknown paths fall back to toast.
            form.setError(field as never, { message: msg });
            applied += 1;
          }
          if (applied > 0) {
            toast.error("Проверьте поля формы");
            return;
          }
        }
      }
      // Fallback toast is already shown by mutations, but keep a generic one for safety.
      toast.error("Не удалось сохранить заказ");
    }
  };

  return (
    <>
      <DrawerFormLayout
        open={open}
        onOpenChange={(next) => {
          if (next || !isDirty) {
            onOpenChange(next);
            return;
          }
          setPendingClose(true);
          setConfirmCloseOpen(true);
        }}
        title={isCreateMode ? "Создание заказа" : orderDetailQuery.data ? `Заказ #${orderDetailQuery.data.id}` : "Редактирование заказа"}
        isDirty={isDirty}
        isSubmitting={isSubmitting}
        side="right"
        hideShellHeader
        className="w-[92vw] max-w-[860px]"
        contentClassName="px-0 bg-muted/40"
        footerClassName="px-6 py-3"
        footer={(
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" disabled={isSubmitting} onClick={() => form.reset(serverValuesRef.current)}>Отменить</Button>
            <Button onClick={() => void form.handleSubmit(submit)()} disabled={!(isCreateMode || isDirty) || !isValid || isSubmitting || editableFields.size === 0}>
              {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Сохранение...</> : <><Save className="mr-2 h-4 w-4" />Сохранить</>}
            </Button>
          </div>
        )}
      >
        {isEditLoading ? (
          <DrawerFormSkeleton />
        ) : orderDetailQuery.data || isCreateMode ? (
          <div className="min-h-full bg-muted/40">
            <OrderDrawerHeader orderId={orderDetailQuery.data?.id} isCreateMode={isCreateMode} onClose={() => onOpenChange(false)} />
            <div className="pb-6">
              <OrderFormSection
                title="Клиент"
                className="bg-sky-50/40"
                titleClassName="text-sky-700"
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <Controller control={form.control} name="clientPhone" render={({ field }) => (
                    <LabeledField label="Телефон" error={form.formState.errors.clientPhone?.message}>
                      <Input value={field.value} onChange={(e) => field.onChange(e.target.value)} placeholder="+7701..." className={cn("bg-white", form.formState.errors.clientPhone ? "border-destructive ring-destructive/30" : null)} disabled={isSubmitting || !canEditField("clientPhone")} />
                    </LabeledField>
                  )} />
                  <Controller control={form.control} name="clientFullName" render={({ field }) => (
                    <LabeledField label="Имя клиента" error={form.formState.errors.clientFullName?.message}>
                      <Input value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value)} placeholder="Имя и фамилия" className={cn("bg-white", form.formState.errors.clientFullName ? "border-destructive ring-destructive/30" : null)} disabled={isSubmitting || !canEditField("clientFullName")} />
                    </LabeledField>
                  )} />
                </div>
              </OrderFormSection>

              <OrderFormSection
                title="Препарат"
                className="bg-emerald-50/40"
                titleClassName="text-emerald-700"
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <Controller control={form.control} name="productId" render={({ field }) => (
                    <LabeledField label="Препарат" error={form.formState.errors.productId?.message}>
                      <NativeSelect value={field.value} options={productsOptions} onValueChange={(next) => field.onChange(Number(next || 0))} placeholder="Выберите препарат" disabled={isSubmitting || !canEditField("productId")} className={cn(form.formState.errors.productId ? "border-destructive ring-destructive/30" : null)} />
                    </LabeledField>
                  )} />
                  <Controller control={form.control} name="quantity" render={({ field }) => (
                    <LabeledField label="Количество" error={form.formState.errors.quantity?.message}>
                      <Input type="number" min={1} value={field.value} onChange={(e) => field.onChange(Number(e.target.value || 1))} className={cn("bg-white", form.formState.errors.quantity ? "border-destructive ring-destructive/30" : null)} disabled={isSubmitting || !canEditField("quantity")} />
                    </LabeledField>
                  )} />
                </div>
              </OrderFormSection>

              <OrderFormSection
                title="Доставка"
                className="bg-amber-50/40"
                titleClassName="text-amber-700"
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <Controller control={form.control} name="city" render={({ field }) => (
                    <LabeledField label="Город" error={form.formState.errors.city?.message}>
                      <Input value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value)} placeholder="Город" className={cn("bg-white", form.formState.errors.city ? "border-destructive ring-destructive/30" : null)} disabled={isSubmitting || !canEditField("city")} />
                    </LabeledField>
                  )} />
                  <Controller control={form.control} name="deliveryPrice" render={({ field }) => (
                    <LabeledField label="Стоимость доставки" error={form.formState.errors.deliveryPrice?.message}>
                      <Input type="number" min={0} value={field.value} onChange={(e) => field.onChange(Number(e.target.value || 0))} className={cn("bg-white", form.formState.errors.deliveryPrice ? "border-destructive ring-destructive/30" : null)} disabled={isSubmitting || !canEditField("deliveryPrice")} />
                    </LabeledField>
                  )} />
                  <Controller control={form.control} name="address" render={({ field }) => (
                    <LabeledField label="Адрес" className="md:col-span-2" error={form.formState.errors.address?.message}>
                      <Input value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value)} placeholder="Адрес" className={cn("bg-white", form.formState.errors.address ? "border-destructive ring-destructive/30" : null)} disabled={isSubmitting || !canEditField("address")} />
                    </LabeledField>
                  )} />
                </div>
              </OrderFormSection>

              <OrderFormSection
                title="Статусы и оплата"
                className="bg-violet-50/40"
                titleClassName="text-violet-700"
              >
                <div className="grid gap-4 md:grid-cols-3">
                  <Controller control={form.control} name="actionStatusCode" render={({ field }) => (
                    <LabeledField label="Статус действия" error={form.formState.errors.actionStatusCode?.message}>
                      <NativeSelect value={field.value} options={statusOptions.actionStatuses} onValueChange={(next) => field.onChange(next)} disabled={isSubmitting || !canEditField("actionStatusCode")} className={cn(form.formState.errors.actionStatusCode ? "border-destructive ring-destructive/30" : null)} />
                    </LabeledField>
                  )} />
                  <Controller control={form.control} name="stateStatusCode" render={({ field }) => (
                    <LabeledField label="Статус состояния" error={form.formState.errors.stateStatusCode?.message}>
                      <NativeSelect value={field.value} options={statusOptions.stateStatuses} onValueChange={(next) => field.onChange(next)} disabled={isSubmitting || !canEditField("stateStatusCode")} className={cn(form.formState.errors.stateStatusCode ? "border-destructive ring-destructive/30" : null)} />
                    </LabeledField>
                  )} />
                  <Controller control={form.control} name="paymentStatus" render={({ field }) => (
                    <LabeledField label="Статус оплаты" error={form.formState.errors.paymentStatus?.message}>
                      <NativeSelect value={field.value} options={PAYMENT_STATUS_OPTIONS.map((s) => ({ value: s.value, label: s.label }))} onValueChange={(next) => field.onChange(next)} className={cn(form.formState.errors.paymentStatus ? "border-destructive ring-destructive/30" : null)} disabled={isSubmitting || !canEditField("paymentStatus")} />
                    </LabeledField>
                  )} />
                  <Controller control={form.control} name="assemblyStatusCode" render={({ field }) => (
                    <LabeledField label="Статус сборки" error={form.formState.errors.assemblyStatusCode?.message}>
                      <NativeSelect
                        value={field.value ?? ""}
                        options={statusOptions.assemblyStatuses}
                        onValueChange={(next) => field.onChange(String(next || "") || undefined)}
                        placeholder="Не выбрано"
                        disabled={isSubmitting || !canEditField("assemblyStatusCode")}
                        className={cn(form.formState.errors.assemblyStatusCode ? "border-destructive ring-destructive/30" : null)}
                      />
                    </LabeledField>
                  )} />
                  <Controller control={form.control} name="storagePlaceId" render={({ field }) => (
                    <LabeledField label="Место хранения заказа" error={form.formState.errors.storagePlaceId?.message}>
                      <NativeSelect value={field.value === 0 ? "" : field.value} options={storagePlacesOptions.options} onValueChange={(next) => field.onChange(next === "" ? 0 : next)} placeholder="Хранилище" disabled={isSubmitting || !canEditField("storagePlaceId")} className={cn(form.formState.errors.storagePlaceId ? "border-destructive ring-destructive/30" : null)} />
                    </LabeledField>
                  )} />
                  <div className={cn("rounded-md border p-3 text-sm md:col-span-2", remainingCardClass)}>
                    <p className="text-xs text-muted-foreground">Текущий остаток к оплате</p>
                    <p className="font-semibold">{formatMoney(form.getValues().remainingAmount)}</p>
                  </div>
                </div>
              </OrderFormSection>

              <OrderFormSection
                title="Комментарий"
                className="bg-slate-50/60"
                titleClassName="text-slate-700"
              >
                <Controller control={form.control} name="description" render={({ field }) => (
                  <div className="space-y-1">
                    <textarea className={cn("min-h-[92px] w-full resize-none rounded-md border border-input bg-white px-3 py-2 text-sm outline-none", form.formState.errors.description ? "border-destructive ring-destructive/30" : null)} placeholder="Например: клиент просил перезвонить после 18:00" value={field.value ?? ""} onChange={(e) => field.onChange(e.target.value)} disabled={isSubmitting || !canEditField("description")} />
                    {form.formState.errors.description?.message ? (
                      <p className="text-[11px] text-destructive whitespace-pre-line">{form.formState.errors.description.message}</p>
                    ) : null}
                  </div>
                )} />
              </OrderFormSection>
            </div>
          </div>
        ) : (
          <ErrorState title="Не удалось загрузить заказ" description="Попробуйте обновить страницу." />
        )}
      </DrawerFormLayout>

      <AlertDialog.Root open={confirmCloseOpen} onOpenChange={setConfirmCloseOpen}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
          <AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,520px)] -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-background p-6 shadow-lg">
            <AlertDialog.Title className="text-lg font-semibold">Есть несохраненные изменения</AlertDialog.Title>
            <AlertDialog.Description className="mt-2 text-sm text-muted-foreground">Закрыть без сохранения?</AlertDialog.Description>
            <div className="mt-5 flex justify-end gap-2">
              <AlertDialog.Cancel asChild><Button variant="outline">Назад</Button></AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <Button variant="destructive" onClick={() => { setConfirmCloseOpen(false); if (pendingClose) { form.reset(serverValuesRef.current); setPendingClose(false); onOpenChange(false); } }}>
                  Закрыть
                </Button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </>
  );
}
