import { Check, ChevronDown, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type SelectHTMLAttributes } from "react";

import { cn } from "@/shared/lib/utils";

export type NativeSelectOption<T extends string | number> = {
  value: T;
  label: string;
};

type NativeSelectProps<T extends string | number> = Omit<SelectHTMLAttributes<HTMLSelectElement>, "value" | "onChange"> & {
  value: T | "";
  options: Array<NativeSelectOption<T>>;
  onValueChange: (value: T | "") => void;
  placeholder?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
};

export function NativeSelect<T extends string | number>({
  value,
  options,
  onValueChange,
  placeholder,
  searchable = true,
  searchPlaceholder = "Поиск...",
  className,
  disabled,
  ...props
}: NativeSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const normalizedPlaceholder =
    typeof placeholder === "string" && placeholder.trim().length > 0 ? placeholder : "Выберите значение";

  const selectedOption = useMemo(
    () => options.find((opt) => String(opt.value) === String(value)),
    [options, value],
  );

  const filteredOptions = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return options;
    return options.filter((opt) => opt.label.toLowerCase().includes(term));
  }, [options, search]);

  if (!searchable) {
    return (
      <select
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        value={value as string}
        onChange={(e) => {
          const next = e.target.value;
          if (next === "") {
            onValueChange("");
            return;
          }

          const option = options.find((o) => String(o.value) === next);
          onValueChange(option ? option.value : (next as T));
        }}
        disabled={disabled}
        {...props}
      >
        {placeholder ? (
          <option value="" disabled={Boolean(value)}>
            {placeholder}
          </option>
        ) : null}
        {options.map((opt) => (
          <option key={String(opt.value)} value={String(opt.value)}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  }

  return (
    <div ref={rootRef} className={cn("relative w-full", className)}>
      <button
        type="button"
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-input bg-card px-3 py-2 text-left text-sm ring-offset-background transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          disabled ? "cursor-not-allowed opacity-50" : "hover:bg-accent/40",
        )}
        onClick={() => {
          if (disabled) return;
          setOpen((prev) => !prev);
        }}
        disabled={disabled}
      >
        <span className={cn("truncate", !selectedOption ? "text-muted-foreground" : null)}>
          {selectedOption?.label ?? normalizedPlaceholder}
        </span>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open ? "rotate-180" : null)} />
      </button>

      {open ? (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-card p-2 shadow-lg">
          <div className="relative mb-2">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-8 w-full rounded-md border border-input bg-card pl-7 pr-7 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>

          <div className="max-h-56 space-y-1 overflow-auto">
            {typeof placeholder === "string" && placeholder.trim().length > 0 ? (
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-md bg-muted/30 px-2 py-1.5 text-left text-sm hover:bg-accent"
                onClick={() => {
                  onValueChange("");
                  setOpen(false);
                }}
              >
                <span className="text-muted-foreground">{normalizedPlaceholder}</span>
                {value === "" ? <Check className="h-3.5 w-3.5" /> : null}
              </button>
            ) : null}

            {filteredOptions.length === 0 ? (
              <div className="rounded-md px-2 py-1.5 text-sm text-muted-foreground">Ничего не найдено</div>
            ) : (
              filteredOptions.map((opt) => (
                <button
                  key={String(opt.value)}
                  type="button"
                  className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent"
                  onClick={() => {
                    onValueChange(opt.value);
                    setOpen(false);
                  }}
                >
                  <span className="truncate">{opt.label}</span>
                  {String(value) === String(opt.value) ? <Check className="h-3.5 w-3.5" /> : null}
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

