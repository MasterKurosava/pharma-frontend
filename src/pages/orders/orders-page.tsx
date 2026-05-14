import { PageContainer } from "@/shared/ui/page-container";
import { OrdersListWidget } from "@/widgets/orders/orders-list-widget";
import type { OrderTableGroup } from "@/shared/config/order-static";

type OrdersPageProps = {
  forcedTableGroup?: OrderTableGroup;
};

export function OrdersPage({ forcedTableGroup }: OrdersPageProps) {
  return (
    <PageContainer>
      <OrdersListWidget forcedTableGroup={forcedTableGroup} />
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
