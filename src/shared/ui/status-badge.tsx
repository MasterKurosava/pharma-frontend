import { cva, type VariantProps } from "class-variance-authority";

const statusBadgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      tone: {
        default: "border-transparent bg-secondary text-secondary-foreground",
        neutral: "border-transparent bg-muted/50 text-foreground",
        success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
        warning: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
        danger: "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400",
        info: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-400",
      },
    },
    defaultVariants: {
      tone: "neutral",
    },
  },
);

export type StatusBadgeProps = {
  label: string;
} & VariantProps<typeof statusBadgeVariants>;

export function StatusBadge({ label, tone }: StatusBadgeProps) {
  return <span className={statusBadgeVariants({ tone })}>{label}</span>;
}
