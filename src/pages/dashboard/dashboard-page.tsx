import { PageContainer } from "@/shared/ui/page-container";
import { SectionCard } from "@/shared/ui/section-card";

export function DashboardPage() {
  return (
    <PageContainer>
      <div className="grid gap-4 md:grid-cols-3">
        <SectionCard title="Заказы сегодня" description="Placeholder KPI">
          <p className="text-3xl font-semibold">128</p>
        </SectionCard>
        <SectionCard title="Ожидают доставки" description="Кол-во заказов, ожидающих доставки">
          <p className="text-3xl font-semibold">42</p>
        </SectionCard>
        <SectionCard title="Новые клиенты" description="Кол-во новых клиентов">
          <p className="text-3xl font-semibold">16</p>
        </SectionCard>
      </div>
    </PageContainer>
  );
}
