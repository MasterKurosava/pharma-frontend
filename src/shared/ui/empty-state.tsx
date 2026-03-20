import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";

type EmptyStateAction = {
  label: string;
  onClick: () => void;
};

type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: EmptyStateAction;
  className?: string;
  variant?: "default" | "compact";
};

export function EmptyState({ title, description, icon, action, className, variant = "default" }: EmptyStateProps) {
  const padding = variant === "compact" ? "p-6" : "p-10";

  return (
    <div className={cn("rounded-xl border border-dashed bg-card text-center", padding, className)}>
      {icon ? <div className="mx-auto">{icon}</div> : <Inbox className="mx-auto h-8 w-8 text-muted-foreground" />}
      <h3 className={cn("mt-3 font-medium", variant === "compact" ? "text-base" : "text-lg")}>{title}</h3>
      {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      {action ? (
        <div className="mt-4 flex justify-center">
          <Button variant="outline" onClick={action.onClick}>
            {action.label}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
