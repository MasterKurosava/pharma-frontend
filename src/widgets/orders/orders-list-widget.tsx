import { useCallback, useEffect, useMemo, useState, type MouseEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { Check, Plus } from "lucide-react";
import * as AlertDialog from "@radix-ui/react-alert-dialog";

import { ordersUrlDefaults, parseOrdersSearchParams, serializeOrdersSearchParams, type OrdersFiltersState, type OrdersListUrlState } from "@/features/orders/model/orders-url";
import { useAuth } from "@/features/auth/model/use-auth";
import { useOrdersListQuery } from "@/features/orders/api/orders-queries";
import { useOrderFilterOptions } from "@/features/orders/model/use-order-filter-options";
import type { Order, OrdersListParams } from "@/entities/order/api/order-types";
import { useOptimisticBulkUpdateOrdersStatusMutation, useOptimisticUpdateOrderStatusMutation } from "@/features/orders/api/order-save-mutations";
import type { OrderUpdateFieldKey } from "@/entities/user/model/types";
import {
  ORDER_TABLE_GROUP_LABELS,
  type ActionStatusCode,
  type OrderTableGroup,
  type PaymentStatusCode,
  type StateStatusCode,
} from "@/shared/config/order-static";
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
import { Button } from "@/shared/ui/button";
import { NativeSelect } from "@/shared/ui/native-select/native-select";
import { ORDER_TEXTS } from "@/features/orders/config/orders-ui-config";

type OrdersListWidgetProps = {
  forcedOrderStatuses?: ActionStatusCode[];
  forcedTableGroup?: OrderTableGroup;
};

type BulkStatusField = "actionStatusCode" | "stateStatusCode" | "paymentStatus";
type InlineStatusField = "actionStatusCode" | "stateStatusCode" | "assemblyStatusCode";
const EMPTY_ORDERS: Order[] = [];

export function OrdersListWidget({ forcedOrderStatuses, forcedTableGroup }: OrdersListWidgetProps) {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedOrderIds, setSelectedOrderIds] = useState<number[]>([]);
  const [selectionAnchorId, setSelectionAnchorId] = useState<number | null>(null);
  const [bulkModalField, setBulkModalField] = useState<BulkStatusField | null>(null);
  const [bulkStatusValue, setBulkStatusValue] = useState("");
  const inlineStatusMutation = useOptimisticUpdateOrderStatusMutation();
  const bulkStatusMutation = useOptimisticBulkUpdateOrdersStatusMutation();

  const urlState = useMemo<OrdersListUrlState>(() => parseOrdersSearchParams(searchParams), [searchParams]);
  const orderPolicy = user?.accessPolicy?.orders;
  const allowedTableGroups = orderPolicy?.allowedTableGroups ?? [];
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
      tableGroup: forcedTableGroup ?? effectiveState.tableGroup,
      city: effectiveState.city,
      paymentStatus: effectiveState.paymentStatus,
      actionStatusCode: effectiveState.actionStatusCode,
      actionStatusCodes: forcedOrderStatuses,
      stateStatusCode: effectiveState.stateStatusCode,
      page: effectiveState.page,
      pageSize: effectiveState.pageSize,
      sortBy: effectiveState.sortBy,
      sortOrder: effectiveState.sortOrder,
    }),
    [effectiveState, forcedOrderStatuses, forcedTableGroup],
  );

  const effectiveVisibleFilters = useMemo(() => {
    const base = forcedOrderStatuses?.length
      ? visibleFilters.filter((key) => key !== "orderStatus")
      : visibleFilters;
    return forcedTableGroup ? base.filter((key) => key !== "tableGroup") : base;
  }, [forcedOrderStatuses, forcedTableGroup, visibleFilters]);
  const tableGroupOptions = useMemo(() => {
    const groups = allowedTableGroups.length > 0
      ? allowedTableGroups
      : (Object.keys(ORDER_TABLE_GROUP_LABELS) as OrderTableGroup[]);
    return groups.map((value) => ({ value, label: ORDER_TABLE_GROUP_LABELS[value] }));
  }, [allowedTableGroups]);

  const listQuery = useOrdersListQuery(ordersListParams);

  const drawerOrderId = urlState.drawerOrderId;
  const isDrawerOpen = typeof drawerOrderId !== "undefined";

  const options = useOrderFilterOptions();

  const maps = useMemo(() => {
    const toMap = (opts: Array<{ value: number; label: string }>) => new Map(opts.map((o) => [o.value, o.label]));
    const toStatusMap = (opts: Array<{ value: string; label: string; color?: string }>) =>
      new Map(opts.map((o) => [o.value, { label: o.label, color: o.color }]));
    return {
      paymentStatuses: toStatusMap(options.paymentStatuses),
      actionStatuses: toStatusMap(options.actionStatuses),
      stateStatuses: toStatusMap(options.stateStatuses),
      assemblyStatuses: toStatusMap(options.assemblyStatuses),
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

  // Keep URL/state as the single source of truth for sort.

  useEffect(() => {
    if (allowedTableGroups.length === 0) return;
    if (urlState.tableGroup && !allowedTableGroups.includes(urlState.tableGroup)) {
      setUrl({ tableGroup: undefined, page: 1 });
    }
  }, [allowedTableGroups, setUrl, urlState.tableGroup]);

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
      if (field === "actionStatusCode") return options.actionStatuses;
      if (field === "paymentStatus") return options.paymentStatuses;
      return options.stateStatuses;
    },
    [options.actionStatuses, options.paymentStatuses, options.stateStatuses],
  );

  const openBulkModal = (field: BulkStatusField) => {
    const statusOptions = getBulkStatusOptions(field);
    const first = statusOptions[0]?.value ?? "";
    setBulkStatusValue(first);
    setBulkModalField(field);
  };

  const applyInlineStatusChange = useCallback(
    (payload: { id: number; field: InlineStatusField; value: string }) => {
      if (!editableFields.has(payload.field)) return;
      if (payload.field === "actionStatusCode") {
        inlineStatusMutation.mutate({
          id: payload.id,
          dto: { actionStatusCode: payload.value as ActionStatusCode },
        });
        return;
      }
      if (payload.field === "assemblyStatusCode") {
        inlineStatusMutation.mutate({
          id: payload.id,
          dto: { assemblyStatusCode: payload.value },
        });
        return;
      }
      inlineStatusMutation.mutate({
        id: payload.id,
        dto: { stateStatusCode: payload.value as StateStatusCode },
      });
    },
    [editableFields, inlineStatusMutation],
  );

  const applyBulkStatusChange = useCallback(async () => {
    if (!bulkModalField || !bulkStatusValue || selectedOrderIds.length === 0) return;
    if (!editableFields.has(bulkModalField)) return;

    if (bulkModalField === "actionStatusCode") {
      await bulkStatusMutation.mutateAsync({
        orderIds: selectedOrderIds,
        dto: { actionStatusCode: bulkStatusValue as ActionStatusCode },
      });
    } else if (bulkModalField === "paymentStatus") {
      await bulkStatusMutation.mutateAsync({
        orderIds: selectedOrderIds,
        dto: { paymentStatus: bulkStatusValue as PaymentStatusCode },
      });
    } else {
      await bulkStatusMutation.mutateAsync({
        orderIds: selectedOrderIds,
        dto: { stateStatusCode: bulkStatusValue as StateStatusCode },
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
          {ORDER_TEXTS.createButton}
        </Button>
      </div>
      <OrdersFiltersBar
        state={{
          search: urlState.search,
          tableGroup: effectiveState.tableGroup,
          city: effectiveState.city,
          paymentStatus: effectiveState.paymentStatus,
          actionStatusCode: effectiveState.actionStatusCode,
          stateStatusCode: effectiveState.stateStatusCode,
        }}
        onChange={applyFilterPatch}
        onReset={onReset}
        visibleFilters={effectiveVisibleFilters}
        fixedFilters={fixedFilters}
        tableGroupOptions={tableGroupOptions}
        paymentStatusOptions={options.paymentStatuses}
        actionStatusOptions={options.actionStatuses}
        stateStatusOptions={options.stateStatuses}
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
            disabled={!editableFields.has("actionStatusCode")}
            onClick={() => openBulkModal("actionStatusCode")}
          >
            Поменять статус действия
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!editableFields.has("stateStatusCode")}
            onClick={() => openBulkModal("stateStatusCode")}
          >
            Поменять статус состояния
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
        emptyTitle={ORDER_TEXTS.emptyTitle}
        emptyDescription={ORDER_TEXTS.emptyDescription}
        sortBy={ordersListParams.sortBy}
        sortOrder={ordersListParams.sortOrder}
        onSortChange={(sortBy, sortOrder) => {
          const normalizedOrder = sortBy === "createdAt" ? "desc" : sortOrder;
          setUrl({ sortBy, sortOrder: normalizedOrder, page: 1 });
        }}
        onEditClick={(order) => {
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
              {bulkModalField === "actionStatusCode"
                ? "Сменить статус действия"
                : bulkModalField === "paymentStatus"
                  ? "Сменить статус оплаты"
                  : "Сменить статус состояния"}
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

