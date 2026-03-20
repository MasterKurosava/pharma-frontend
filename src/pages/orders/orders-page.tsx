import { PageContainer } from "@/shared/ui/page-container";
import { OrdersListWidget } from "@/widgets/orders/orders-list-widget";

export function OrdersPage() {
  return (
    <PageContainer>
      <OrdersListWidget />
    </PageContainer>
  );
}
