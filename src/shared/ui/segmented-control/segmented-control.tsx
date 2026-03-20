import { Button } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";

export type SegmentedOption<T extends string> = {
  value: T;
  label: string;
};

type SegmentedControlProps<T extends string> = {
  value: T;
  options: Array<SegmentedOption<T>>;
  onChange: (value: T) => void;
  className?: string;
};

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  className,
}: SegmentedControlProps<T>) {
  return (
    <div className={cn("inline-flex overflow-hidden rounded-xl border bg-card", className)}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Button
            key={opt.value}
            type="button"
            size={active ? "default" : "sm"}
            variant={active ? "default" : "outline"}
            className={cn(
              "!rounded-none border-0 shadow-none",
              active ? "bg-primary text-primary-foreground" : null,
            )}
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </Button>
        );
      })}
    </div>
  );
}

