import { useCallback, useEffect, useMemo, useState, type MouseEvent } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { Check, Plus } from "lucide-react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";

import { ordersUrlDefaults, parseOrdersSearchParams, serializeOrdersSearchParams, type OrdersFiltersState, type OrdersListUrlState } from "@/features/orders/model/orders-url";
import { useAuth } from "@/features/auth/model/use-auth";
import { useOrdersListQuery } from "@/features/orders/api/orders-queries";
import { useOrderFilterOptions } from "@/features/orders/model/use-order-filter-options";
import type { Order, OrdersListParams } from "@/entities/order/api/order-types";
import { useOptimisticBulkUpdateOrdersStatusMutation, useOptimisticUpdateOrderStatusMutation } from "@/features/orders/api/order-save-mutations";
import type { OrderUpdateFieldKey } from "@/entities/user/model/types";
import type { DeliveryStatusCode, PaymentStatusCode } from "@/shared/config/order-static";
import {
  applyFixedOrderFilters,
  ORDER_DEFAULT_VISIBLE_FILTERS,
  ORDER_EMPTY_FILTERS_STATE,
  ORDER_FILTER_PATCH_RESET_PAGE_KEYS,
} from "@/features/orders/config/orders-access-config";

import { OrdersFiltersBar } from "@/widgets/orders/orders-filters/orders-filters-bar";
import { OrdersPagination } from "@/widgets/orders/orders-pagination/orders-pagination";
import { OrdersTable } from "@/widgets/orders/orders-table/orders-table";
import { OrderDrawerEditor } from "@/widgets/orders/order-drawer/order-drawer-editor";
import type { OrderStatusCode } from "@/shared/config/order-static";
import { Button } from "@/shared/ui/button";
import { NativeSelect } from "@/shared/ui/native-select/native-select";

type OrdersListWidgetProps = {
  forcedOrderStatuses?: OrderStatusCode[];
};

type BulkStatusField = "orderStatus" | "deliveryStatus" | "paymentStatus";
const EMPTY_ORDERS: Order[] = [];

export function OrdersListWidget({ forcedOrderStatuses }: OrdersListWidgetProps) {
  const { user } = useAuth();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedOrderIds, setSelectedOrderIds] = useState<number[]>([]);
  const [selectionAnchorId, setSelectionAnchorId] = useState<number | null>(null);
  const [bulkModalField, setBulkModalField] = useState<BulkStatusField | null>(null);
  const [bulkStatusValue, setBulkStatusValue] = useState("");
  const inlineStatusMutation = useOptimisticUpdateOrderStatusMutation();
  const bulkStatusMutation = useOptimisticBulkUpdateOrdersStatusMutation();

  const urlState = useMemo<OrdersListUrlState>(() => parseOrdersSearchParams(searchParams), [searchParams]);
  const orderPolicy = user?.accessPolicy?.orders;
  const visibleFilters = orderPolicy?.visibleFilters ?? ORDER_DEFAULT_VISIBLE_FILTERS;
  const fixedFilters = orderPolicy?.fixedFilters ?? {};
  const editableFields = useMemo(
    () => new Set<OrderUpdateFieldKey>(orderPolicy?.editableFields ?? []),
    [orderPolicy?.editableFields],
  );
  const effectiveState = useMemo(() => applyFixedOrderFilters(urlState, fixedFilters), [fixedFilters, urlState]);

  const ordersListParams = useMemo<OrdersListParams>(
    () => ({
      search: effectiveState.search,
      countryId: effectiveState.countryId,
      city: effectiveState.city,
      paymentStatus: effectiveState.paymentStatus,
      orderStatus: effectiveState.orderStatus,
      orderStatuses: forcedOrderStatuses,
      deliveryStatus: effectiveState.deliveryStatus,
      page: effectiveState.page,
      pageSize: effectiveState.pageSize,
      sortBy: effectiveState.sortBy,
      sortOrder: effectiveState.sortOrder,
    }),
    [effectiveState, forcedOrderStatuses],
  );
  const effectiveVisibleFilters = useMemo(() => {
    const isSpecialPage = location.pathname === "/orders-delivery" || location.pathname === "/orders-assembly";
    if (!isSpecialPage) {
      return forcedOrderStatuses?.length ? visibleFilters.filter((key) => key !== "orderStatus") : visibleFilters;
    }
    return ["search", "countryId", "city", "paymentStatus", "deliveryStatus"] as typeof visibleFilters;
  }, [forcedOrderStatuses, location.pathname, visibleFilters]);


  const listQuery = useOrdersListQuery(ordersListParams);

  const drawerOrderId = urlState.drawerOrderId;
  const isDrawerOpen = typeof drawerOrderId !== "undefined";

  const options = useOrderFilterOptions(effectiveState.countryId);

  const maps = useMemo(() => {
    const toMap = (opts: Array<{ value: number; label: string }>) => new Map(opts.map((o) => [o.value, o.label]));
    const toStatusMap = (opts: Array<{ value: string; label: string; color?: string }>) =>
      new Map(opts.map((o) => [o.value, { label: o.label, color: o.color }]));
    return {
      countries: toMap(options.countries.options),
      paymentStatuses: toStatusMap(options.paymentStatuses),
      orderStatuses: toStatusMap(options.orderStatuses),
      deliveryStatuses: toStatusMap(options.deliveryStatuses),
      storagePlaces: toMap(options.storagePlaces.options),
    };
  }, [options]);

  const setUrl = useCallback((patch: Partial<OrdersListUrlState>) => {
    const next: OrdersListUrlState = {
      ...urlState,
      ...patch,
    };

    setSearchParams(serializeOrdersSearchParams(next), { replace: true });
  }, [setSearchParams, urlState]);

  const applyFilterPatch = useCallback((patch: Partial<OrdersFiltersState> & { sortBy?: OrdersListUrlState["sortBy"]; sortOrder?: OrdersListUrlState["sortOrder"]; pageSize?: number }) => {
    const changedKeys = Object.keys(patch).filter((key) => {
      const patchValue = patch[key as keyof typeof patch];
      const currentValue = urlState[key as keyof OrdersListUrlState];
      return patchValue !== currentValue;
    });
    if (changedKeys.length === 0) return;

    const hasPageSize = typeof patch.pageSize !== "undefined";
    const shouldResetPage =
      hasPageSize ||
      ORDER_FILTER_PATCH_RESET_PAGE_KEYS.some((key) => key in patch && patch[key] !== urlState[key]) ||
      "sortBy" in patch ||
      "sortOrder" in patch;

    setUrl({
      ...patch,
      page: shouldResetPage ? ordersUrlDefaults.page : urlState.page,
      pageSize: hasPageSize ? patch.pageSize ?? urlState.pageSize : urlState.pageSize,
    });
  }, [setUrl, urlState]);

  const onReset = useCallback(() => {
    setSearchParams(
      serializeOrdersSearchParams({
        drawerOrderId: undefined,
        ...ORDER_EMPTY_FILTERS_STATE,
        page: ordersUrlDefaults.page,
        pageSize: ordersUrlDefaults.pageSize,
        sortBy: ordersUrlDefaults.sortBy,
        sortOrder: ordersUrlDefaults.sortOrder,
      }),
      { replace: true },
    );
  }, [setSearchParams]);

  const orders = listQuery.data?.items ?? EMPTY_ORDERS;
  const selectedOrderIdsSet = useMemo(() => new Set(selectedOrderIds), [selectedOrderIds]);
  const selectedCount = selectedOrderIds.length;

  const getBulkStatusOptions = useCallback(
    (field: BulkStatusField) => {
      if (field === "orderStatus") return options.orderStatuses;
      if (field === "paymentStatus") return options.paymentStatuses;
      return options.deliveryStatuses;
    },
    [options.deliveryStatuses, options.orderStatuses, options.paymentStatuses],
  );

  const openBulkModal = (field: BulkStatusField) => {
    const statusOptions = getBulkStatusOptions(field);
    const first = statusOptions[0]?.value ?? "";
    setBulkStatusValue(first);
    setBulkModalField(field);
  };

  const applyInlineStatusChange = useCallback(
    (payload: { id: number; field: BulkStatusField; value: string }) => {
      if (!editableFields.has(payload.field)) return;
      if (payload.field === "orderStatus") {
        inlineStatusMutation.mutate({
          id: payload.id,
          dto: { orderStatus: payload.value as OrderStatusCode },
        });
        return;
      }
      if (payload.field === "paymentStatus") {
        inlineStatusMutation.mutate({
          id: payload.id,
          dto: { paymentStatus: payload.value as PaymentStatusCode },
        });
        return;
      }
      inlineStatusMutation.mutate({
        id: payload.id,
        dto: { deliveryStatus: payload.value as DeliveryStatusCode },
      });
    },
    [editableFields, inlineStatusMutation],
  );

  const applyBulkStatusChange = useCallback(async () => {
    if (!bulkModalField || !bulkStatusValue || selectedOrderIds.length === 0) return;
    if (!editableFields.has(bulkModalField)) return;

    if (bulkModalField === "orderStatus") {
      await bulkStatusMutation.mutateAsync({
        orderIds: selectedOrderIds,
        dto: { orderStatus: bulkStatusValue as OrderStatusCode },
      });
    } else if (bulkModalField === "paymentStatus") {
      await bulkStatusMutation.mutateAsync({
        orderIds: selectedOrderIds,
        dto: { paymentStatus: bulkStatusValue as PaymentStatusCode },
      });
    } else {
      await bulkStatusMutation.mutateAsync({
        orderIds: selectedOrderIds,
        dto: { deliveryStatus: bulkStatusValue as DeliveryStatusCode },
      });
    }

    setSelectedOrderIds([]);
    setSelectionAnchorId(null);
    setBulkModalField(null);
  }, [bulkModalField, bulkStatusMutation, bulkStatusValue, editableFields, selectedOrderIds]);

  const handleToggleOrderSelection = useCallback(
    (orderId: number, event: MouseEvent<HTMLInputElement>) => {
      const isMulti = event.ctrlKey || event.metaKey;
      const isShift = event.shiftKey;

      if (isShift && selectionAnchorId !== null) {
        const idToIndex = new Map(orders.map((order, index) => [order.id, index]));
        const anchorIndex = idToIndex.get(selectionAnchorId);
        const targetIndex = idToIndex.get(orderId);
        if (typeof anchorIndex === "number" && typeof targetIndex === "number") {
          const [start, end] = anchorIndex <= targetIndex ? [anchorIndex, targetIndex] : [targetIndex, anchorIndex];
          const rangeIds = orders.slice(start, end + 1).map((order) => order.id);
          setSelectedOrderIds((prev) => {
            const next = new Set(prev);
            for (const id of rangeIds) next.add(id);
            return Array.from(next);
          });
          return;
        }
      }

      setSelectedOrderIds((prev) => {
        const next = new Set(prev);
        const hasCurrent = next.has(orderId);
        if (isMulti) {
          if (hasCurrent) {
            next.delete(orderId);
          } else {
            next.add(orderId);
          }
          return Array.from(next);
        }

        if (hasCurrent && prev.length === 1) {
          return [];
        }
        return [orderId];
      });

      setSelectionAnchorId(orderId);
    },
    [orders, selectionAnchorId],
  );

  const handleToggleAllVisible = useCallback(
    (checked: boolean) => {
      const visibleIds = orders.map((order) => order.id);
      if (checked) {
        setSelectedOrderIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
        return;
      }
      setSelectedOrderIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    },
    [orders],
  );

  useEffect(() => {
    if (!listQuery.data) return;
    if (urlState.page > listQuery.data.totalPages) {
      setSearchParams(
        serializeOrdersSearchParams({
          ...urlState,
          page: 1,
        }),
        { replace: true },
      );
    }
  }, [listQuery.data, setSearchParams, urlState]);

  useEffect(() => {
    const visibleIds = new Set(orders.map((order) => order.id));
    setSelectedOrderIds((prev) => {
      const next = prev.filter((id) => visibleIds.has(id));
      return next.length === prev.length ? prev : next;
    });
  }, [orders]);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setUrl({ drawerOrderId: 0 })}>
          <Plus className="mr-2 h-4 w-4" />
          Создать заказ
        </Button>
      </div>
      <OrdersFiltersBar
        state={{
          search: urlState.search,
          countryId: effectiveState.countryId,
          city: effectiveState.city,
          paymentStatus: effectiveState.paymentStatus,
          orderStatus: effectiveState.orderStatus,
          deliveryStatus: effectiveState.deliveryStatus,
        }}
        onChange={applyFilterPatch}
        onReset={onReset}
        visibleFilters={effectiveVisibleFilters}
        fixedFilters={fixedFilters}
        countryOptions={options.countries.options}
        paymentStatusOptions={options.paymentStatuses}
        orderStatusOptions={options.orderStatuses}
        deliveryStatusOptions={options.deliveryStatuses}
      />
      {selectedCount > 0 ? (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-card p-3 shadow-sm">
          <div className="mr-2 inline-flex items-center rounded-md bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
            <Check className="mr-1 h-3.5 w-3.5" />
            Выбрано: {selectedCount}
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={!editableFields.has("orderStatus")}
            onClick={() => openBulkModal("orderStatus")}
          >
            Поменять статус заказа
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!editableFields.has("deliveryStatus")}
            onClick={() => openBulkModal("deliveryStatus")}
          >
            Поменять статус доставки
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!editableFields.has("paymentStatus")}
            onClick={() => openBulkModal("paymentStatus")}
          >
            Поменять статус оплаты
          </Button>
        </div>
      ) : null}

      <OrdersTable
        orders={orders}
        loading={listQuery.isPending || listQuery.isFetching}
        emptyTitle="Заказы не найдены"
        emptyDescription="Попробуйте изменить фильтры или строку поиска."
        sortBy={urlState.sortBy}
        sortOrder={urlState.sortOrder}
        onSortChange={(sortBy, sortOrder) => {
          setUrl({ sortBy, sortOrder, page: 1 });
        }}
        onRowClick={(order) => {
          setUrl({ drawerOrderId: order.id });
        }}
        editableFields={editableFields}
        onInlineStatusChange={applyInlineStatusChange}
        selectedOrderIds={selectedOrderIdsSet}
        onToggleOrderSelection={handleToggleOrderSelection}
        onToggleAllVisible={handleToggleAllVisible}
        options={maps}
      />

      <OrdersPagination
        state={{ page: urlState.page, pageSize: urlState.pageSize }}
        response={listQuery.data}
        onPageChange={(nextPage) => {
          setUrl({ page: nextPage });
        }}
        onPageSizeChange={(nextPageSize) => {
          setUrl({ pageSize: nextPageSize, page: 1 });
        }}
      />

      <OrderDrawerEditor
        open={isDrawerOpen}
        onOpenChange={(open) => {
          if (!open) setUrl({ drawerOrderId: undefined });
        }}
        orderId={drawerOrderId}
        onCreated={(createdOrderId) => setUrl({ drawerOrderId: createdOrderId })}
      />

      <AlertDialog.Root open={bulkModalField !== null} onOpenChange={(next) => !next && setBulkModalField(null)}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/50" />
          <AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,420px)] -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-background p-5 shadow-lg">
            <AlertDialog.Title className="text-base font-semibold">
              {bulkModalField === "orderStatus"
                ? "Сменить статус заказа"
                : bulkModalField === "paymentStatus"
                  ? "Сменить статус оплаты"
                  : "Сменить статус доставки"}
            </AlertDialog.Title>
            <AlertDialog.Description className="mt-1 text-sm text-muted-foreground">
              Изменения применятся к {selectedCount} заказам.
            </AlertDialog.Description>

            {bulkModalField ? (
              <div className="mt-4">
                <NativeSelect
                  value={bulkStatusValue}
                  options={getBulkStatusOptions(bulkModalField)}
                  onValueChange={(next) => setBulkStatusValue(String(next || ""))}
                  placeholder="Выберите статус"
                />
              </div>
            ) : null}

            <div className="mt-5 flex justify-end gap-2">
              <AlertDialog.Cancel asChild>
                <Button variant="outline" disabled={bulkStatusMutation.isPending}>
                  Отмена
                </Button>
              </AlertDialog.Cancel>
              <Button
                onClick={() => {
                  void applyBulkStatusChange();
                }}
                disabled={!bulkStatusValue || bulkStatusMutation.isPending}
              >
                {bulkStatusMutation.isPending ? "Сохранение..." : "Сохранить"}
              </Button>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </div>
  );
}

