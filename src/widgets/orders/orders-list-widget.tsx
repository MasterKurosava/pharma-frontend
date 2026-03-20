import { useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

import { ordersUrlDefaults, parseOrdersSearchParams, serializeOrdersSearchParams, type OrdersFiltersState, type OrdersListUrlState } from "@/features/orders/model/orders-url";
import { useOrdersListQuery } from "@/features/orders/api/orders-queries";
import { useOrderFilterOptions } from "@/features/orders/model/use-order-filter-options";
import type { OrdersListParams } from "@/entities/order/api/order-types";

import { OrdersFiltersBar } from "@/widgets/orders/orders-filters/orders-filters-bar";
import { OrdersPagination } from "@/widgets/orders/orders-pagination/orders-pagination";
import { OrdersTable } from "@/widgets/orders/orders-table/orders-table";
import { OrderDrawerEditor } from "@/widgets/orders/order-drawer/order-drawer-editor";

export function OrdersListWidget() {
  const [searchParams, setSearchParams] = useSearchParams();

  const urlState = useMemo<OrdersListUrlState>(() => parseOrdersSearchParams(searchParams), [searchParams]);

  const ordersListParams = useMemo<OrdersListParams>(
    () => ({
      search: urlState.search,
      clientId: urlState.clientId,
      countryId: urlState.countryId,
      cityId: urlState.cityId,
      responsibleUserId: urlState.responsibleUserId,
      paymentStatusId: urlState.paymentStatusId,
      orderStatusId: urlState.orderStatusId,
      assemblyStatusId: urlState.assemblyStatusId,
      storagePlaceId: urlState.storagePlaceId,
      deliveryCompanyId: urlState.deliveryCompanyId,
      dateFrom: urlState.dateFrom,
      dateTo: urlState.dateTo,
      page: urlState.page,
      pageSize: urlState.pageSize,
      sortBy: urlState.sortBy,
      sortOrder: urlState.sortOrder,
    }),
    [urlState],
  );

  const listQuery = useOrdersListQuery(ordersListParams);

  const drawerOrderId = urlState.drawerOrderId;

  const options = useOrderFilterOptions(urlState.countryId);

  const maps = useMemo(() => {
    const toMap = (opts: Array<{ value: number; label: string }>) => new Map(opts.map((o) => [o.value, o.label]));
    return {
      countries: toMap(options.countries.options),
      cities: toMap(options.allCityOptions),
      clients: toMap(options.clientOptions),
      paymentStatuses: toMap(options.paymentStatuses.options),
      orderStatuses: toMap(options.orderStatuses.options),
      assemblyStatuses: toMap(options.assemblyStatuses.options),
      storagePlaces: toMap(options.storagePlaces.options),
      deliveryCompanies: toMap(options.deliveryCompanies.options),
    };
  }, [options]);

  const setUrl = (patch: Partial<OrdersListUrlState>) => {
    const next: OrdersListUrlState = {
      ...urlState,
      ...patch,
    };

    setSearchParams(serializeOrdersSearchParams(next), { replace: true });
  };

  const applyFilterPatch = (patch: Partial<OrdersFiltersState> & { sortBy?: OrdersListUrlState["sortBy"]; sortOrder?: OrdersListUrlState["sortOrder"]; pageSize?: number }) => {
    const hasPageSize = typeof patch.pageSize !== "undefined";
    const shouldResetPage =
      hasPageSize ||
      "search" in patch ||
      "clientId" in patch ||
      "countryId" in patch ||
      "cityId" in patch ||
      "responsibleUserId" in patch ||
      "paymentStatusId" in patch ||
      "orderStatusId" in patch ||
      "assemblyStatusId" in patch ||
      "storagePlaceId" in patch ||
      "deliveryCompanyId" in patch ||
      "dateFrom" in patch ||
      "dateTo" in patch ||
      "sortBy" in patch ||
      "sortOrder" in patch;

    setUrl({
      ...patch,
      page: shouldResetPage ? ordersUrlDefaults.page : urlState.page,
      pageSize: hasPageSize ? patch.pageSize ?? urlState.pageSize : urlState.pageSize,
    });
  };

  const onReset = () => {
    setSearchParams(
      serializeOrdersSearchParams({
        drawerOrderId: undefined,
        search: undefined,
        clientId: undefined,
        countryId: undefined,
        cityId: undefined,
        responsibleUserId: undefined,
        paymentStatusId: undefined,
        orderStatusId: undefined,
        assemblyStatusId: undefined,
        storagePlaceId: undefined,
        deliveryCompanyId: undefined,
        dateFrom: undefined,
        dateTo: undefined,
        page: ordersUrlDefaults.page,
        pageSize: ordersUrlDefaults.pageSize,
        sortBy: ordersUrlDefaults.sortBy,
        sortOrder: ordersUrlDefaults.sortOrder,
      }),
      { replace: true },
    );
  };

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
      <OrdersFiltersBar
        state={{
          search: urlState.search,
          clientId: urlState.clientId,
          countryId: urlState.countryId,
          cityId: urlState.cityId,
          paymentStatusId: urlState.paymentStatusId,
          orderStatusId: urlState.orderStatusId,
          assemblyStatusId: urlState.assemblyStatusId,
          deliveryCompanyId: urlState.deliveryCompanyId,
          dateFrom: urlState.dateFrom,
          dateTo: urlState.dateTo,
        }}
        onChange={(patch) => applyFilterPatch(patch)}
        onReset={onReset}
        countryOptions={options.countries.options}
        cityOptions={options.cityOptions}
        clientOptions={options.clientOptions}
        paymentStatusOptions={options.paymentStatuses.options}
        orderStatusOptions={options.orderStatuses.options}
        assemblyStatusOptions={options.assemblyStatuses.options}
        deliveryCompanyOptions={options.deliveryCompanies.options}
      />

      <OrdersTable
        orders={orders}
        loading={listQuery.isPending || listQuery.isFetching}
        emptyTitle="No orders found"
        emptyDescription="Try adjusting filters or search."
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
        open={Boolean(drawerOrderId)}
        onOpenChange={(open) => {
          if (!open) setUrl({ drawerOrderId: undefined });
        }}
        orderId={drawerOrderId}
      />
    </div>
  );
}

