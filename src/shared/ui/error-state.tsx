import { AlertTriangle } from "lucide-react";

import { Button } from "@/shared/ui/button";

type ErrorStateProps = {
  title: string;
  description?: string;
  onRetry?: () => void;
};

export function ErrorState({ title, description, onRetry }: ErrorStateProps) {
  return (
    <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 text-destructive" />
        <div className="space-y-1">
          <h3 className="font-medium text-destructive">{title}</h3>
          {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
          {onRetry ? (
            <Button onClick={onRetry} variant="outline" size="sm" className="mt-3">
              Retry
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
