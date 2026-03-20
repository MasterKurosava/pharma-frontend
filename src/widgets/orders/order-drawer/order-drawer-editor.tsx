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

import { useDictionaryOptionsQuery } from "@/features/dictionaries/model/use-dictionary-options";
import { useCitiesQuery } from "@/features/cities/api/city-crud-hooks";
import { useClientsQuery } from "@/features/clients/api/client-crud-hooks";
import { useProductsQuery } from "@/features/products/api/product-crud-hooks";

import { useOrderDetailQuery, useOrderHistoryQuery } from "@/features/orders/api/orders-queries";
import { useUpdateOrderMutation } from "@/features/orders/api/order-save-mutations";
import { orderFormSchema, type OrderFormValues } from "@/features/orders/model/order-form-schema";
import { orderApiToFormValues, orderFormValuesToUpdateDto } from "@/features/orders/model/order-mappers";

import { OrderDrawerHeader } from "@/widgets/orders/order-drawer/order-drawer-header";
import { OrderFormSection } from "@/widgets/orders/order-drawer/order-form-section";
import { OrderItemsEditor } from "@/widgets/orders/order-drawer/order-items-editor";
import { OrderFinanceBlock } from "@/widgets/orders/order-drawer/order-finance-block";
import { OrderHistoryPanel } from "@/widgets/orders/order-drawer/order-history-panel";
import { toast } from "sonner";

type OrderDrawerEditorProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId?: number | string;
};

const emptyOrderFormValues = (): OrderFormValues => ({
  clientId: 0,
  countryId: 0,
  cityId: 0,
  address: "",

  deliveryCompanyId: 0,
  deliveryTypeId: 0,
  deliveryPrice: 0,
  storagePlaceId: 0,

  paymentStatusId: 0,
  orderStatusId: 0,
  assemblyStatusId: 0,
  responsibleUserId: 0,

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

export function OrderDrawerEditor({ open, onOpenChange, orderId }: OrderDrawerEditorProps) {
  const orderDetailQuery = useOrderDetailQuery(orderId);
  const orderHistoryQuery = useOrderHistoryQuery(orderId);
  const updateOrderMutation = useUpdateOrderMutation();

  const isEditLoading = (orderDetailQuery.isPending || orderHistoryQuery.isPending) && open;

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

  const watchedCountryId = useWatch({ control: form.control, name: "countryId" });
  const watchedOrderStatusId = useWatch({ control: form.control, name: "orderStatusId" });
  const watchedItems = useWatch({ control: form.control, name: "items" });

  const countriesSelect = useDictionaryOptionsQuery("countries", { includeCodeInLabel: true });
  const paymentStatusOptions = useDictionaryOptionsQuery("payment-statuses", { includeCodeInLabel: false });
  const orderStatusOptions = useDictionaryOptionsQuery("order-statuses", { includeCodeInLabel: false });
  const assemblyStatusOptions = useDictionaryOptionsQuery("assembly-statuses", { includeCodeInLabel: false });
  const deliveryCompaniesOptions = useDictionaryOptionsQuery("delivery-companies", { includeCodeInLabel: false });
  const deliveryTypesOptions = useDictionaryOptionsQuery("delivery-types", { includeCodeInLabel: false });
  const storagePlacesOptions = useDictionaryOptionsQuery("storage-places", { includeCodeInLabel: false });

  const citiesQuery = useCitiesQuery({
    countryId: watchedCountryId || undefined,
    isActive: true,
    search: undefined,
  });

  const clientsQuery = useClientsQuery({ search: undefined, clientStatusId: undefined });

  const productsQuery = useProductsQuery({ isActive: true });

  const productsOptions = useMemo(() => {
    const products = productsQuery.data ?? [];

    return products.map((p) => ({
      value: p.id,
      label: `${p.name} • доступно: ${p.availableQuantity}`,
    }));
  }, [productsQuery.data]);

  const productAvailableById = useMemo(() => {
    const products = productsQuery.data ?? [];
    return new Map<number, number>(products.map((p) => [p.id, p.availableQuantity]));
  }, [productsQuery.data]);

  const cityOptions = useMemo(() => {
    const items = citiesQuery.data ?? [];
    return items.map((c) => ({ value: c.id, label: c.name }));
  }, [citiesQuery.data]);

  const clientOptions = useMemo(() => {
    const items = clientsQuery.data ?? [];
    return items.map((c) => ({
      value: c.id,
      label: c.phone ? `${c.name} (${c.phone})` : c.name,
    }));
  }, [clientsQuery.data]);

  const orderStatusLabelMap = useMemo(() => new Map(orderStatusOptions.options.map((o) => [o.value, o.label])), [orderStatusOptions.options]);

  const isReadonlyOrder = useMemo(() => {
    const label = orderStatusLabelMap.get(watchedOrderStatusId) ?? "";
    const lowered = label.toLowerCase();
    return lowered.includes("отмен") || lowered.includes("закры") || lowered.includes("cancel");
  }, [orderStatusLabelMap, watchedOrderStatusId]);

  useEffect(() => {
    if (!open) return;

    if (orderDetailQuery.data) {
      const mapped = orderApiToFormValues(orderDetailQuery.data);
      serverValuesRef.current = mapped;
      form.reset(mapped);
    }
  }, [form, open, orderDetailQuery.data]);

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

  const isSubmitting = updateOrderMutation.isPending;
  const isDirty = form.formState.isDirty;
  const isValid = form.formState.isValid;

  const canSave = isDirty && isValid && !isSubmitting && open && !isReadonlyOrder;

  const submit = async (values: OrderFormValues) => {
    if (!orderId) return;

    if (isReadonlyOrder) return;

    const dto = orderFormValuesToUpdateDto(values);
    await updateOrderMutation.mutateAsync({ id: orderId, dto });

    const latest = await orderDetailQuery.refetch();
    if (latest.data) {
      const mapped = orderApiToFormValues(latest.data);
      serverValuesRef.current = mapped;
      form.reset(mapped, { keepErrors: false });
    }

    // refresh history as it depends on unified save
    await orderHistoryQuery.refetch();
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

  const currentOrderStatusLabel = orderStatusLabelMap.get(watchedOrderStatusId);

  return (
    <>
      <DrawerFormLayout
        open={open}
        onOpenChange={handleOpenChange}
        title={orderDetailQuery.data ? `Заказ #${orderDetailQuery.data.id}` : "Редактирование заказа"}
        footer={footer}
        isDirty={isDirty}
        isSubmitting={isSubmitting}
        side="right"
        hideShellHeader
        className="w-[92vw] max-w-[860px]"
        contentClassName="px-0"
        footerClassName="px-6 py-3"
      >
        {isEditLoading ? (
          <DrawerFormSkeleton />
        ) : orderDetailQuery.data ? (
          <div className="min-h-full bg-background">
            <OrderDrawerHeader
              orderId={orderDetailQuery.data.id}
              orderStatusLabel={currentOrderStatusLabel}
              readonlyOrder={isReadonlyOrder}
              onClose={onAttemptClose}
            />

            <form className="pb-6">
              <OrderFormSection title="Основное">
                <div className="grid gap-4 md:grid-cols-2">
                  <Controller
                    control={form.control}
                    name="clientId"
                    render={({ field }) => (
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">Клиент</label>
                        <NativeSelect
                          value={field.value}
                          options={clientOptions}
                          onValueChange={(next) => field.onChange(next === "" ? 0 : next)}
                          placeholder="Выберите клиента"
                          disabled={isSubmitting || isReadonlyOrder}
                        />
                      </div>
                    )}
                  />

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
                          disabled={isSubmitting || isReadonlyOrder}
                        />
                      </div>
                    )}
                  />

                  <Controller
                    control={form.control}
                    name="cityId"
                    render={({ field }) => (
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">Город</label>
                        <NativeSelect
                          value={field.value}
                          options={cityOptions}
                          onValueChange={(next) => field.onChange(next === "" ? 0 : next)}
                          placeholder="Выберите город"
                          disabled={isSubmitting || isReadonlyOrder || citiesQuery.isPending}
                        />
                      </div>
                    )}
                  />

                  <div />

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
                          disabled={isSubmitting || isReadonlyOrder}
                        />
                      </div>
                    )}
                  />
                </div>
              </OrderFormSection>

              <OrderFormSection title="Доставка">
                <div className="grid gap-4 md:grid-cols-2">
                  <Controller
                    control={form.control}
                    name="deliveryCompanyId"
                    render={({ field }) => (
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">Компания доставки</label>
                        <NativeSelect
                          value={field.value}
                          options={[{ value: 0, label: "—" }, ...deliveryCompaniesOptions.options]}
                          onValueChange={(next) => field.onChange(next === "" ? 0 : next)}
                          placeholder="—"
                          disabled={isSubmitting || isReadonlyOrder}
                        />
                      </div>
                    )}
                  />

                  <Controller
                    control={form.control}
                    name="deliveryTypeId"
                    render={({ field }) => (
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">Тип доставки</label>
                        <NativeSelect
                          value={field.value}
                          options={[{ value: 0, label: "—" }, ...deliveryTypesOptions.options]}
                          onValueChange={(next) => field.onChange(next === "" ? 0 : next)}
                          placeholder="—"
                          disabled={isSubmitting || isReadonlyOrder}
                        />
                      </div>
                    )}
                  />

                  <Controller
                    control={form.control}
                    name="deliveryPrice"
                    render={({ field }) => (
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">Цена доставки</label>
                        <Input
                          type="number"
                          min={0}
                          value={field.value}
                          onChange={(e) => {
                            const n = Number(e.target.value);
                            field.onChange(Number.isFinite(n) ? n : 0);
                          }}
                          disabled={isSubmitting || isReadonlyOrder}
                        />
                      </div>
                    )}
                  />

                  <Controller
                    control={form.control}
                    name="storagePlaceId"
                    render={({ field }) => (
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">Хранилище</label>
                        <NativeSelect
                          value={field.value}
                          options={[{ value: 0, label: "—" }, ...storagePlacesOptions.options]}
                          onValueChange={(next) => field.onChange(next === "" ? 0 : next)}
                          placeholder="—"
                          disabled={isSubmitting || isReadonlyOrder}
                        />
                      </div>
                    )}
                  />
                </div>
              </OrderFormSection>

              <OrderFormSection title="Статусы">
                <div className="grid gap-4 md:grid-cols-2">
                  <Controller
                    control={form.control}
                    name="paymentStatusId"
                    render={({ field }) => (
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">Статус оплаты</label>
                        <NativeSelect
                          value={field.value}
                          options={paymentStatusOptions.options}
                          onValueChange={(next) => field.onChange(next === "" ? 0 : next)}
                          placeholder="—"
                          disabled={isSubmitting || isReadonlyOrder}
                        />
                      </div>
                    )}
                  />

                  <Controller
                    control={form.control}
                    name="orderStatusId"
                    render={({ field }) => (
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">Статус заказа</label>
                        <NativeSelect
                          value={field.value}
                          options={orderStatusOptions.options}
                          onValueChange={(next) => field.onChange(next === "" ? 0 : next)}
                          placeholder="—"
                          disabled={isSubmitting || isReadonlyOrder}
                        />
                      </div>
                    )}
                  />

                  <Controller
                    control={form.control}
                    name="assemblyStatusId"
                    render={({ field }) => (
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">Статус сборки</label>
                        <NativeSelect
                          value={field.value}
                          options={[{ value: 0, label: "—" }, ...assemblyStatusOptions.options]}
                          onValueChange={(next) => field.onChange(next === "" ? 0 : next)}
                          placeholder="—"
                          disabled={isSubmitting || isReadonlyOrder}
                        />
                      </div>
                    )}
                  />

                  <Controller
                    control={form.control}
                    name="responsibleUserId"
                    render={({ field }) => (
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium">Ответственный</label>
                        <Input
                          type="number"
                          value={field.value}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          disabled
                        />
                        <p className="text-xs text-muted-foreground">Источник пользователей пока не подключен.</p>
                      </div>
                    )}
                  />
                </div>
              </OrderFormSection>

              <OrderFormSection title="Товары">
                <OrderItemsEditor
                  control={form.control}
                  errors={form.formState.errors}
                  fields={fields}
                  items={watchedItems}
                  productOptions={productsOptions}
                  productAvailableById={productAvailableById}
                  append={append}
                  remove={remove}
                  disabled={isSubmitting || isReadonlyOrder}
                />
              </OrderFormSection>

              <OrderFormSection title="Финансы">
                <OrderFinanceBlock
                  control={form.control}
                  errors={form.formState.errors}
                  totalPrice={form.getValues().totalPrice}
                  remainingAmount={form.getValues().remainingAmount}
                  formatMoney={formatMoney}
                  disabled={isSubmitting || isReadonlyOrder}
                />
              </OrderFormSection>

              <OrderFormSection title="Комментарий">
                <Controller
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <textarea
                      className="min-h-[92px] w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20 disabled:cursor-not-allowed disabled:opacity-50"
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value)}
                      disabled={isSubmitting || isReadonlyOrder}
                    />
                  )}
                />
              </OrderFormSection>

              <OrderFormSection title="История">
                <OrderHistoryPanel history={orderHistoryQuery.data ?? []} loading={orderHistoryQuery.isPending} />
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

