import { useCallback, useEffect, useMemo } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { Plus } from "lucide-react";

import { ordersUrlDefaults, parseOrdersSearchParams, serializeOrdersSearchParams, type OrdersFiltersState, type OrdersListUrlState } from "@/features/orders/model/orders-url";
import { useAuth } from "@/features/auth/model/use-auth";
import { useOrdersListQuery } from "@/features/orders/api/orders-queries";
import { useOrderFilterOptions } from "@/features/orders/model/use-order-filter-options";
import type { OrdersListParams } from "@/entities/order/api/order-types";
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

type OrdersListWidgetProps = {
  forcedOrderStatuses?: OrderStatusCode[];
};

export function OrdersListWidget({ forcedOrderStatuses }: OrdersListWidgetProps) {
  const { user } = useAuth();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const urlState = useMemo<OrdersListUrlState>(() => parseOrdersSearchParams(searchParams), [searchParams]);
  const orderPolicy = user?.accessPolicy?.orders;
  const visibleFilters = orderPolicy?.visibleFilters ?? ORDER_DEFAULT_VISIBLE_FILTERS;
  const fixedFilters = orderPolicy?.fixedFilters ?? {};
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

  const orders = listQuery.data?.items ?? [];

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
    </div>
  );
}

