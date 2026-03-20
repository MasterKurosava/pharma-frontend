import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo } from "react";

import { Button } from "@/shared/ui/button";
import { ModalShell } from "@/shared/ui/modal-shell";
import { cn } from "@/shared/lib/utils";

export type ModalFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  onSubmit?: () => Promise<void> | void;
  saveLabel?: string;
  cancelLabel?: string;
  isSubmitting?: boolean;
  className?: string;
};

export function ModalForm({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  onSubmit,
  saveLabel = "Save",
  cancelLabel = "Cancel",
  isSubmitting = false,
  className,
}: ModalFormProps) {
  const defaultFooter = useMemo(() => {
    if (!onSubmit) return null;

    return (
      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
          {cancelLabel}
        </Button>
        <Button
          onClick={async () => {
            await onSubmit();
          }}
          disabled={isSubmitting}
          className="min-w-28"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {saveLabel}...
            </>
          ) : (
            saveLabel
          )}
        </Button>
      </div>
    );
  }, [cancelLabel, isSubmitting, onOpenChange, onSubmit, saveLabel]);

  return (
    <ModalShell open={open} onOpenChange={onOpenChange} title={title} className={className}>
      <div className="flex flex-col">
        {description ? <div className="text-sm text-muted-foreground">{description}</div> : null}

        <div className="mt-4">{children}</div>

        <div
          className={cn(
            "sticky bottom-0 mt-6 border-t bg-background/95 p-4 backdrop-blur",
            footer ? null : "justify-end",
          )}
        >
          {footer ?? defaultFooter}
        </div>

        {isSubmitting ? <div className="sr-only">Submitting</div> : null}
      </div>
    </ModalShell>
  );
}

