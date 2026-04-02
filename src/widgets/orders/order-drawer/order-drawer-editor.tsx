import { Loader2, Save } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as AlertDialog from "@radix-ui/react-alert-dialog";

import { Button } from "@/shared/ui/button";
import { DrawerFormLayout } from "@/shared/ui/drawer-form-layout/drawer-form-layout";
import { Input } from "@/shared/ui/input";
import { NativeSelect } from "@/shared/ui/native-select/native-select";
import { DrawerFormSkeleton } from "@/shared/ui/skeleton/skeleton";
import { ErrorState } from "@/shared/ui/error-state";
import { cn } from "@/shared/lib/utils";

import { useDictionaryOptionsQuery } from "@/features/dictionaries/model/use-dictionary-options";
import { useProductsQuery } from "@/features/products/api/product-crud-hooks";

import { useOrderDetailQuery } from "@/features/orders/api/orders-queries";
import { useCreateOrderMutation, useUpdateOrderMutation } from "@/features/orders/api/order-save-mutations";
import { orderFormSchema, type OrderFormValues } from "@/features/orders/model/order-form-schema";
import { orderApiToFormValues, orderFormValuesToCreateDto, orderFormValuesToUpdateDto } from "@/features/orders/model/order-mappers";
import { useAuth } from "@/features/auth/model/use-auth";
import { DELIVERY_STATUS_OPTIONS, ORDER_STATUS_OPTIONS, PAYMENT_STATUS_OPTIONS } from "@/shared/config/order-static";

import { OrderDrawerHeader } from "@/widgets/orders/order-drawer/order-drawer-header";
import { OrderFormSection } from "@/widgets/orders/order-drawer/order-form-section";
import { OrderItemsEditor } from "@/widgets/orders/order-drawer/order-items-editor";
import { OrderFinanceBlock } from "@/widgets/orders/order-drawer/order-finance-block";
import { toast } from "sonner";

type OrderDrawerEditorProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId?: number | string;
  onCreated?: (orderId: number) => void;
};

const emptyOrderFormValues = (): OrderFormValues => ({
  clientPhone: "",
  countryId: 0,
  city: "",
  address: "",

  deliveryStatus: DELIVERY_STATUS_OPTIONS[0].value,
  deliveryPrice: 0,
  storagePlaceId: 0,

  paymentStatus: PAYMENT_STATUS_OPTIONS[0].value,
  orderStatus: ORDER_STATUS_OPTIONS[0].value,

  paidAmount: 0,
  description: "",

  totalPrice: 0,
  remainingAmount: 0,

  items: [{ productId: 0, quantity: 1 }],
});

function formatMoney(value?: number | null) {
  if (value === null || typeof value === "undefined") return "—";
  return new Intl.NumberFormat("ru-RU", { style: "currency", currency: "KZT", maximumFractionDigits: 0 }).format(value);
}

function getProductUnitPrice(product: unknown): number {
  if (!product || typeof product !== "object") return 0;

  const record = product as Record<string, unknown>;
  const priceCandidate =
    record.price ??
    record.unitPrice ??
    record.salePrice ??
    record.sellingPrice ??
    record.retailPrice ??
    record.purchasePrice ??
    0;

  const numeric = Number(priceCandidate);
  return Number.isFinite(numeric) ? numeric : 0;
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

  const defaultValues = useMemo(() => emptyOrderFormValues(), []);

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderFormSchema),
    defaultValues,
    mode: "onChange",
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const watchedOrderStatus = useWatch({ control: form.control, name: "orderStatus" });
  const watchedItems = useWatch({ control: form.control, name: "items" });
  const watchedDeliveryPrice = useWatch({ control: form.control, name: "deliveryPrice" });
  const watchedPaidAmount = useWatch({ control: form.control, name: "paidAmount" });

  const countriesSelect = useDictionaryOptionsQuery("countries", { includeCodeInLabel: true });
  const paymentStatusOptions = useMemo(
    () => PAYMENT_STATUS_OPTIONS.map((item) => ({ value: item.value, label: item.label })),
    [],
  );
  const orderStatusOptions = useMemo(
    () => ORDER_STATUS_OPTIONS.map((item) => ({ value: item.value, label: item.label })),
    [],
  );
  const deliveryStatusOptions = useMemo(
    () => DELIVERY_STATUS_OPTIONS.map((item) => ({ value: item.value, label: item.label })),
    [],
  );
  const storagePlacesOptions = useDictionaryOptionsQuery("storage-places", { includeCodeInLabel: false });

  const productsQuery = useProductsQuery({ isActive: true });

  const productsOptions = useMemo(() => {
    const products = productsQuery.data ?? [];

    return products.map((p) => ({
      value: p.id,
      label: `${p.name} • доступно: ${p.availableQuantity}`,
    }));
  }, [productsQuery.data]);

  const orderStatusLabelMap = useMemo(() => new Map(orderStatusOptions.map((o) => [o.value, o.label])), [orderStatusOptions]);

  const isReadonlyOrder = useMemo(() => {
    const label = orderStatusLabelMap.get(watchedOrderStatus as (typeof ORDER_STATUS_OPTIONS)[number]["value"]) ?? "";
    const lowered = label.toLowerCase();
    return lowered.includes("отмен") || lowered.includes("закры") || lowered.includes("cancel");
  }, [orderStatusLabelMap, watchedOrderStatus]);

  const isOrderDraftStage = watchedOrderStatus === "ORDER";
  const isDeliveryPrepStage = watchedOrderStatus === "DELIVERY_REGISTRATION";
  const isAddressRequiredStage = watchedOrderStatus === "ADDRESS_REQUIRED";
  const isAssemblyRequiredStage = watchedOrderStatus === "ASSEMBLY_REQUIRED";
  const showAdvancedDeliveryFields =
    isAssemblyRequiredStage || (!isOrderDraftStage && !isDeliveryPrepStage && !isAddressRequiredStage);

  const editableFields = useMemo(
    () => new Set(user?.accessPolicy?.orders.editableFields ?? []),
    [user?.accessPolicy?.orders.editableFields],
  );
  const fixedFilters = user?.accessPolicy?.orders.fixedFilters;
  const canEditField = (field: string) => editableFields.has(field as never);

  const productPriceMap = useMemo(() => {
    const map = new Map<number, number>();
    for (const product of productsQuery.data ?? []) {
      map.set(product.id, getProductUnitPrice(product));
    }
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
    if (fixedFilters?.countryId !== undefined) {
      form.setValue("countryId", fixedFilters.countryId, { shouldDirty: false });
    }
  }, [fixedFilters?.countryId, form, open]);

  useEffect(() => {
    if (!open) return;

    const items = watchedItems ?? [];
    const itemTotal = items.reduce((sum, item) => {
      const productId = Number(item?.productId ?? 0);
      const quantity = Number(item?.quantity ?? 0);
      if (!Number.isFinite(productId) || productId <= 0 || !Number.isFinite(quantity) || quantity <= 0) return sum;

      const unitPrice = productPriceMap.get(productId) ?? 0;
      return sum + unitPrice * quantity;
    }, 0);

    const deliveryPrice = Number.isFinite(Number(watchedDeliveryPrice)) ? Number(watchedDeliveryPrice) : 0;
    const paidAmount = Number.isFinite(Number(watchedPaidAmount)) ? Number(watchedPaidAmount) : 0;

    const nextTotalPrice = Math.max(0, itemTotal + deliveryPrice);
    const nextRemainingAmount = Math.max(0, nextTotalPrice - paidAmount);

    const currentTotal = form.getValues("totalPrice");
    const currentRemaining = form.getValues("remainingAmount");

    if (currentTotal !== nextTotalPrice) {
      form.setValue("totalPrice", nextTotalPrice, { shouldDirty: false, shouldValidate: true });
    }

    if (currentRemaining !== nextRemainingAmount) {
      form.setValue("remainingAmount", nextRemainingAmount, { shouldDirty: false, shouldValidate: true });
    }
  }, [form, open, productPriceMap, watchedDeliveryPrice, watchedItems, watchedPaidAmount]);

  const onAttemptClose = () => {
    if (!form.formState.isDirty) {
      onOpenChange(false);
      return;
    }

    setPendingClose(true);
    setConfirmCloseOpen(true);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      onOpenChange(true);
      return;
    }

    onAttemptClose();
  };

  const isSubmitting = updateOrderMutation.isPending || createOrderMutation.isPending;
  const isDirty = form.formState.isDirty;
  const isValid = form.formState.isValid;
  const showValidation = form.formState.submitCount > 0;

  const clientPhoneError = showValidation ? form.formState.errors.clientPhone : undefined;
  const countryError = showValidation ? form.formState.errors.countryId : undefined;
  const cityError = showValidation ? form.formState.errors.city : undefined;
  const addressError = showValidation ? form.formState.errors.address : undefined;
  const paymentStatusError = showValidation ? form.formState.errors.paymentStatus : undefined;
  const orderStatusError = showValidation ? form.formState.errors.orderStatus : undefined;

  const canSave = (isCreateMode || isDirty) && isValid && !isSubmitting && open && !isReadonlyOrder && editableFields.size > 0;

  const submit = async (values: OrderFormValues) => {
    if (isReadonlyOrder) return;

    if (isCreateMode) {
      const createDto = orderFormValuesToCreateDto(values);
      const createdOrder = await createOrderMutation.mutateAsync(createDto);
      const mapped = orderApiToFormValues(createdOrder);
      serverValuesRef.current = mapped;
      form.reset(mapped, { keepErrors: false });
      onCreated?.(createdOrder.id);
      toast.success("Заказ создан");
      return;
    }

    if (!orderId) return;
    const dto = orderFormValuesToUpdateDto(values);
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
    form.reset(mapped, { keepErrors: false });

    toast.success("Заказ сохранен");
  };

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
        <Button
          variant="outline"
          disabled={isSubmitting}
          onClick={() => {
            if (!isDirty) return;
            form.reset(serverValuesRef.current, { keepErrors: false });
          }}
        >
          Отменить
        </Button>
        <Button
          onClick={() => {
            void form.handleSubmit(submit)();
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

  return (
    <>
      <DrawerFormLayout
        open={open}
        onOpenChange={handleOpenChange}
        title={isCreateMode ? "Создание заказа" : orderDetailQuery.data ? `Заказ #${orderDetailQuery.data.id}` : "Редактирование заказа"}
        footer={footer}
        isDirty={isDirty}
        isSubmitting={isSubmitting}
        side="right"
        hideShellHeader
        className="w-[92vw] max-w-[860px]"
        contentClassName="px-0 bg-muted/40"
        footerClassName="px-6 py-3"
      >
        {isEditLoading ? (
          <DrawerFormSkeleton />
        ) : orderDetailQuery.data || isCreateMode ? (
          <div className="min-h-full bg-muted/40">
            <OrderDrawerHeader
              orderId={orderDetailQuery.data?.id}
              isCreateMode={isCreateMode}
              onClose={onAttemptClose}
            />

            <form className="pb-6">
              <OrderFormSection>
                <div className="grid gap-4 md:grid-cols-2">
                  <Controller
                    control={form.control}
                    name="clientPhone"
                    render={({ field }) => (
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">Телефон клиента</label>
                        <Input
                          value={field.value}
                          onChange={(e) => field.onChange(e.target.value)}
                          placeholder="+7701..."
                          className={cn("bg-white", clientPhoneError ? "border-destructive ring-destructive/30" : null)}
                          disabled={isSubmitting || isReadonlyOrder || !canEditField("clientPhone")}
                        />
                        {clientPhoneError ? <p className="text-xs text-destructive">{String(clientPhoneError.message)}</p> : null}
                      </div>
                    )}
                  />

                  <Controller
                    control={form.control}
                    name="orderStatus"
                    render={({ field }) => (
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">Статус заказа</label>
                        <NativeSelect
                          value={field.value}
                          options={orderStatusOptions}
                          onValueChange={(next) => field.onChange(next)}
                          placeholder="Не выбрано"
                          className={cn(orderStatusError ? "border-destructive ring-destructive/30" : null)}
                          disabled={isSubmitting || isReadonlyOrder || !canEditField("orderStatus")}
                        />
                        {orderStatusError ? <p className="text-xs text-destructive">{String(orderStatusError.message)}</p> : null}
                      </div>
                    )}
                  />
                </div>
              </OrderFormSection>

              <OrderFormSection>
                <OrderItemsEditor
                  control={form.control}
                  errors={form.formState.errors}
                  fields={fields}
                  productOptions={productsOptions}
                  append={append}
                  remove={remove}
                  disabled={isSubmitting || isReadonlyOrder || !canEditField("items")}
                />
              </OrderFormSection>

              <OrderFormSection>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="md:col-span-2 grid gap-4 md:grid-cols-2">
                    <Controller
                      control={form.control}
                      name="countryId"
                      render={({ field }) => (
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium">Страна</label>
                          <NativeSelect
                            value={field.value}
                            options={countriesSelect.options}
                            onValueChange={(next) => field.onChange(next === "" ? 0 : next)}
                            placeholder="Выберите страну"
                            className={cn(countryError ? "border-destructive ring-destructive/30" : null)}
                            disabled={
                              isSubmitting ||
                              isReadonlyOrder ||
                              !canEditField("countryId") ||
                              fixedFilters?.countryId !== undefined
                            }
                          />
                          {countryError ? <p className="text-xs text-destructive">{String(countryError.message)}</p> : null}
                        </div>
                      )}
                    />

                    <Controller
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium">Город</label>
                          <Input
                            value={field.value}
                            onChange={(e) => field.onChange(e.target.value)}
                            placeholder="Введите город"
                            className={cn("bg-white", cityError ? "border-destructive ring-destructive/30" : null)}
                            disabled={isSubmitting || isReadonlyOrder || !canEditField("city")}
                          />
                          {cityError ? <p className="text-xs text-destructive">{String(cityError.message)}</p> : null}
                        </div>
                      )}
                    />

                  </div>

                  <Controller
                    control={form.control}
                    name="deliveryPrice"
                    render={({ field }) => (
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-sm font-medium">Цена доставки</label>
                        <Input
                          type="number"
                          min={0}
                          value={field.value}
                          onChange={(e) => {
                            const n = Number(e.target.value);
                            field.onChange(Number.isFinite(n) ? n : 0);
                          }}
                          className="bg-white"
                          disabled={isSubmitting || isReadonlyOrder || !canEditField("deliveryPrice")}
                        />
                      </div>
                    )}
                  />

                  <Controller
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-sm font-medium">Адрес</label>
                        <Input
                          value={field.value}
                          onChange={(e) => field.onChange(e.target.value)}
                          placeholder="Адрес доставки"
                          className={cn("bg-white", addressError ? "border-destructive focus-visible:ring-destructive/30" : null)}
                          disabled={isSubmitting || isReadonlyOrder || !canEditField("address")}
                        />
                        {addressError ? <p className="text-xs text-destructive">{String(addressError.message)}</p> : null}
                      </div>
                    )}
                  />
                </div>
              </OrderFormSection>

              {showAdvancedDeliveryFields ? (
                <OrderFormSection>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Controller
                      control={form.control}
                      name="storagePlaceId"
                      render={({ field }) => (
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium">Хранилище</label>
                          <NativeSelect
                            value={field.value === 0 ? "" : field.value}
                            options={storagePlacesOptions.options}
                            onValueChange={(next) => field.onChange(next === "" ? 0 : next)}
                            placeholder="Не выбрано"
                            disabled={isSubmitting || isReadonlyOrder || !canEditField("storagePlaceId")}
                          />
                        </div>
                      )}
                    />
                  </div>
                </OrderFormSection>
              ) : null}

              <OrderFormSection>
                <div className="grid gap-4 md:grid-cols-3 mb-4">
                  <Controller
                    control={form.control}
                    name="paymentStatus"
                    render={({ field }) => (
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">Статус оплаты</label>
                        <NativeSelect
                          value={field.value}
                          options={paymentStatusOptions}
                          onValueChange={(next) => field.onChange(next)}
                          placeholder="Не выбрано"
                          className={cn(paymentStatusError ? "border-destructive ring-destructive/30" : null)}
                          disabled={isSubmitting || isReadonlyOrder || !canEditField("paymentStatus")}
                        />
                        {paymentStatusError ? (
                          <p className="text-xs text-destructive">{String(paymentStatusError.message)}</p>
                        ) : null}
                      </div>
                    )}
                  />
                  {showAdvancedDeliveryFields ? (
                    <Controller
                      control={form.control}
                      name="deliveryStatus"
                      render={({ field }) => (
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium">Куда собрать</label>
                          <NativeSelect
                            value={field.value}
                            options={deliveryStatusOptions}
                            onValueChange={(next) => field.onChange(next)}
                            placeholder="Не выбрано"
                            disabled={isSubmitting || isReadonlyOrder || !canEditField("deliveryStatus")}
                          />
                        </div>
                      )}
                    />
                  ) : null}
                </div>
                <OrderFinanceBlock
                  control={form.control}
                  errors={form.formState.errors}
                  totalPrice={form.getValues().totalPrice}
                  remainingAmount={form.getValues().remainingAmount}
                  formatMoney={formatMoney}
                  disabled={isSubmitting || isReadonlyOrder || !canEditField("paidAmount")}
                />
              </OrderFormSection>

              <OrderFormSection>
                <Controller
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <textarea
                      className="min-h-[92px] w-full resize-none rounded-md border border-input bg-white px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50"
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value)}
                      disabled={isSubmitting || isReadonlyOrder || !canEditField("description")}
                    />
                  )}
                />
              </OrderFormSection>

            </form>
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
            <AlertDialog.Description className="mt-2 text-sm text-muted-foreground">
              Закрыть без сохранения?
            </AlertDialog.Description>
            <div className="mt-5 flex justify-end gap-2">
              <AlertDialog.Cancel asChild>
                <Button variant="outline" onClick={() => setConfirmCloseOpen(false)}>
                  Назад
                </Button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setConfirmCloseOpen(false);
                    if (pendingClose) {
                      form.reset(serverValuesRef.current, { keepErrors: false });
                      setPendingClose(false);
                      onOpenChange(false);
                    }
                  }}
                >
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

