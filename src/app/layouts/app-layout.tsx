import { Outlet } from "react-router-dom";

import { AppHeader } from "@/widgets/app-header/app-header";
import { AppSidebar } from "@/widgets/app-sidebar/app-sidebar";
import { AppShell } from "@/shared/ui/app-shell";

export function AppLayout() {
  return (
    <AppShell sidebar={<AppSidebar />} header={<AppHeader />}>
      <Outlet />
    </AppShell>
  );
}
