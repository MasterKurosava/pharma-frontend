import { PageContainer } from "@/shared/ui/page-container";
import { OrdersListWidget } from "@/widgets/orders/orders-list-widget";
import type { ActionStatusCode, OrderTableGroup } from "@/shared/config/order-static";

type OrdersPageProps = {
  forcedOrderStatuses?: ActionStatusCode[];
  forcedTableGroup?: OrderTableGroup;
};

export function OrdersPage({ forcedOrderStatuses, forcedTableGroup }: OrdersPageProps) {
  return (
    <PageContainer>
      <OrdersListWidget forcedOrderStatuses={forcedOrderStatuses} forcedTableGroup={forcedTableGroup} />
    </PageContainer>
  );
}

export function OrdersRequestsPage() {
  return <OrdersPage forcedTableGroup="REQUESTS" />;
}

export function OrdersPickupPage() {
  return <OrdersPage forcedTableGroup="PICKUP" />;
}

export function OrdersAlmatyDeliveryPage() {
  return <OrdersPage forcedTableGroup="ALMATY_DELIVERY" />;
}

export function OrdersRkDeliveryPage() {
  return <OrdersPage forcedTableGroup="RK_DELIVERY" />;
}

export function OrdersArchivePage() {
  return <OrdersPage forcedTableGroup="ARCHIVE" />;
}
