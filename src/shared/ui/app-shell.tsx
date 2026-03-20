import { Menu } from "lucide-react";
import { useState, type ReactNode } from "react";

import { Button } from "@/shared/ui/button";
import { DrawerShell } from "@/shared/ui/drawer-shell";

type AppShellProps = {
  sidebar: ReactNode;
  header: ReactNode;
  children: ReactNode;
};

export function AppShell({ sidebar, header, children }: AppShellProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex">
        <aside className="sticky top-0 hidden h-screen w-72 border-r bg-card/70 p-4 lg:block">{sidebar}</aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <div className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur">
            <div className="flex items-center gap-2 px-4 py-3 lg:hidden">
              <Button variant="outline" size="icon" onClick={() => setIsMobileMenuOpen(true)}>
                <Menu className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">Navigation</span>
            </div>
            {header}
          </div>

          <main className="flex-1 p-2 md:p-3">{children}</main>
        </div>
      </div>

      <DrawerShell
        title="Navigation"
        description="Go to section"
        open={isMobileMenuOpen}
        onOpenChange={setIsMobileMenuOpen}
      >
        {sidebar}
      </DrawerShell>
    </div>
  );
}
