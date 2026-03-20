import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { useCallback } from "react";

import { Button } from "@/shared/ui/button";
import { DrawerShell } from "@/shared/ui/drawer-shell";
import { ErrorState } from "@/shared/ui/error-state";
import { cn } from "@/shared/lib/utils";

export type DrawerFormLayoutProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  side?: "left" | "right";
  hideShellHeader?: boolean;
  meta?: ReactNode;
  children: ReactNode;
  /**
   * Called when user clicks save.
   * If not provided, default footer won't be rendered.
   */
  onSubmit?: () => Promise<void> | void;
  saveLabel?: string;
  cancelLabel?: string;
  isSubmitting?: boolean;
  isDirty?: boolean;
  error?: ReactNode;
  footer?: ReactNode;
  className?: string;
  contentClassName?: string;
  footerClassName?: string;
};

export function DrawerFormLayout({
  open,
  onOpenChange,
  title,
  description,
  side = "right",
  hideShellHeader = false,
  meta,
  children,
  onSubmit,
  saveLabel = "Save",
  cancelLabel = "Cancel",
  isSubmitting = false,
  isDirty = false,
  error,
  footer,
  className,
  contentClassName,
  footerClassName,
}: DrawerFormLayoutProps) {
  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      onOpenChange(nextOpen);
    },
    [onOpenChange],
  );

  const handleCancel = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const handleSubmit = useCallback(async () => {
    if (!onSubmit) return;
    await onSubmit();
  }, [onSubmit]);

  const defaultFooter = onSubmit ? (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        {isDirty ? (
          <p className="truncate text-xs text-muted-foreground">You have unsaved changes.</p>
        ) : (
          <p className="text-xs text-muted-foreground">&nbsp;</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={handleCancel} disabled={isSubmitting}>
          {cancelLabel}
        </Button>
        <Button onClick={handleSubmit} disabled={isSubmitting} className="min-w-28">
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
    </div>
  ) : null;

  return (
    <DrawerShell
      open={open}
      onOpenChange={handleOpenChange}
      title={title}
      description={description}
      side={side}
      hideHeader={hideShellHeader}
      className={className}
    >
      <div className="relative flex h-full flex-col overflow-hidden">
        {error ? (
          <div className="flex-1 overflow-auto">
            <ErrorState title="Unable to save changes" description={typeof error === "string" ? error : undefined} />
          </div>
        ) : null}

        <div className={cn("flex-1 overflow-auto", error ? "hidden" : null, contentClassName)}>
          {meta ? (
            <div className="mb-6 rounded-xl border bg-card p-4">
              {meta}
            </div>
          ) : null}
          {children}
        </div>

        <div className={cn("border-t bg-background/95 p-4 backdrop-blur", footerClassName)}>
          {footer ?? defaultFooter}
        </div>

        {isSubmitting ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50">
            <div className="flex items-center gap-2 rounded-xl border bg-card px-4 py-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </div>
          </div>
        ) : null}
      </div>
    </DrawerShell>
  );
}

