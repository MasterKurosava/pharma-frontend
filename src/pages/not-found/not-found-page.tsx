import { useNavigate } from "react-router-dom";

import { EmptyState } from "@/shared/ui/empty-state";
import { PageContainer } from "@/shared/ui/page-container";

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <PageContainer className="max-w-xl">
        <EmptyState
          variant="compact"
          title="Nothing to show"
          description="Go back to the dashboard and continue working."
          action={{ label: "Back to dashboard", onClick: () => navigate("/") }}
        />
      </PageContainer>
    </div>
  );
}
