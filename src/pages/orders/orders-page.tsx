import { PageContainer } from "@/shared/ui/page-container";
import { OrdersListWidget } from "@/widgets/orders/orders-list-widget";
import type { OrderStatusCode } from "@/shared/config/order-static";

type OrdersPageProps = {
  forcedOrderStatuses?: OrderStatusCode[];
};

export function OrdersPage({ forcedOrderStatuses }: OrdersPageProps) {
  return (
    <PageContainer>
      <OrdersListWidget forcedOrderStatuses={forcedOrderStatuses} />
    </PageContainer>
  );
}

export function OrdersDeliveryPage() {
  return (
    <OrdersPage forcedOrderStatuses={["DELIVERY_REGISTRATION", "ADDRESS_REQUIRED"]} />
  );
}

export function OrdersAssemblyPage() {
  return (
    <OrdersPage forcedOrderStatuses={["ASSEMBLY_REQUIRED", "ASSEMBLED_WRITTEN_OFF", "PACKED"]} />
  );
}
