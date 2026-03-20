import { ChevronDown } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";

import { sidebarNavGroups, sidebarRootItems } from "@/shared/config/navigation";
import { cn } from "@/shared/lib/utils";

export function AppSidebar() {
  const location = useLocation();

  const isPathInGroup = (paths: string[]) => paths.some((p) => location.pathname === p || location.pathname.startsWith(`${p}/`));

  return (
    <div className="flex h-full flex-col">
      <div className="mb-6 px-2">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Pharma Admin</p>
        <h2 className="mt-1 text-xl font-semibold">Панель управления</h2>
      </div>

      <nav className="space-y-3">
        <div className="space-y-1">
          {sidebarRootItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </div>

        <div className="space-y-2">
          {sidebarNavGroups.map((group) => {
            const openByDefault = isPathInGroup(group.items.map((it) => it.to));
            return (
              <details key={group.label} className="rounded-lg border bg-card/30" open={openByDefault}>
                <summary className="flex cursor-pointer list-none items-center justify-between rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent/50">
                  <span className="inline-flex items-center gap-2">
                    <group.icon className="h-4 w-4 text-muted-foreground" />
                    {group.label}
                  </span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform details-open:rotate-180" />
                </summary>

                <div className="space-y-1 px-2 pb-2">
                  {group.items.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.to === "/"}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-2 rounded-md px-2.5 py-2 text-sm transition-colors",
                          isActive
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                        )
                      }
                    >
                      <item.icon className="h-3.5 w-3.5" />
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              </details>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
