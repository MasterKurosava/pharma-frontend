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
  customColor?: string;
} & VariantProps<typeof statusBadgeVariants>;

function normalizeHexColor(value: string) {
  const color = value.trim();
  if (!color.startsWith("#")) return null;
  const hex = color.slice(1);
  if (!/^[0-9a-fA-F]+$/.test(hex)) return null;
  if (hex.length === 3) {
    const expanded = hex
      .split("")
      .map((ch) => ch + ch)
      .join("");
    return `#${expanded.toUpperCase()}`;
  }
  if (hex.length === 6) {
    return `#${hex.toUpperCase()}`;
  }
  return null;
}

function addHexAlpha(hexColor: string, alpha: string) {
  return `${hexColor}${alpha}`;
}

export function StatusBadge({ label, tone, customColor }: StatusBadgeProps) {
  const normalizedColor = typeof customColor === "string" ? normalizeHexColor(customColor) : null;
  const style = normalizedColor
    ? {
        borderColor: addHexAlpha(normalizedColor, "66"),
        backgroundColor: addHexAlpha(normalizedColor, "1A"),
        color: normalizedColor,
      }
    : undefined;

  return (
    <span className={statusBadgeVariants({ tone: normalizedColor ? "neutral" : tone })} style={style}>
      {label}
    </span>
  );
}
