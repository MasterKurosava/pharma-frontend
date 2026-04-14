import { PageContainer } from "@/shared/ui/page-container";
import { OrderStatusesManagementSection } from "@/widgets/order-statuses/order-statuses-management-section";

export function ActionOrderStatusesPage() {
  return (
    <PageContainer>
      <OrderStatusesManagementSection
        type="ACTION"
        title="Статусы действия"
        emptyDescription="Нет статусов действия."
      />
    </PageContainer>
  );
}

export function StateOrderStatusesPage() {
  return (
    <PageContainer>
      <OrderStatusesManagementSection
        type="STATE"
        title="Статусы состояния"
        emptyDescription="Нет статусов состояния."
      />
    </PageContainer>
  );
}
