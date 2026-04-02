import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";

import { toast } from "sonner";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { ModalForm } from "@/shared/ui/modal-form/modal-form";
import { type DictionaryItem, type DictionaryResourceName } from "@/entities/dictionary/api/dictionary-types";
import { getApiErrorMessage } from "@/shared/lib/get-api-error-message";
import { cn } from "@/shared/lib/utils";
import { getDictionaryFormSchema, type DictionaryFormValues } from "@/features/dictionaries/model/dictionary-form-schema";
import { getSimpleDictionaryConfig } from "@/features/dictionaries/model/simple-dictionaries-config";
import { useCreateDictionaryMutation, useUpdateDictionaryMutation } from "@/features/dictionaries/api/dictionary-crud-hooks";
import type { DictionaryCreateDto, DictionaryUpdateDto } from "@/entities/dictionary/api/dictionary-types";

type DictionaryModalFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resource: DictionaryResourceName;
  mode: "create" | "edit";
  initialItem?: DictionaryItem | null;
  readOnly?: boolean;
};

export function DictionaryModalForm({ open, onOpenChange, resource, mode, initialItem, readOnly = false }: DictionaryModalFormProps) {
  const config = getSimpleDictionaryConfig(resource);

  const schema = useMemo(() => getDictionaryFormSchema(resource), [resource]);

  const defaultValues = useMemo<DictionaryFormValues>(
    () => ({
      label: initialItem?.name ?? initialItem?.label ?? "",
      code: config.supportsCode ? initialItem?.code ?? "" : undefined,
      color: config.supportsColor ? initialItem?.color ?? "#64748B" : undefined,
      isActive: config.supportsActive ? initialItem?.isActive ?? true : undefined,
    }),
    [config.supportsActive, config.supportsCode, config.supportsColor, initialItem],
  );

  const form = useForm<DictionaryFormValues>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: "onSubmit",
  });

  useEffect(() => {
    if (!open) return;
    form.reset(defaultValues);
  }, [defaultValues, form, open]);

  const createMutation = useCreateDictionaryMutation(resource);
  const updateMutation = useUpdateDictionaryMutation(resource);

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const title = mode === "create" ? `Создать ${config.singularLabel}` : `Редактировать ${config.singularLabel}`;
  const submitLabel = mode === "create" ? "Создать" : "Сохранить";

  const onSubmit = async (values: DictionaryFormValues) => {
    if (readOnly) return;

    try {
      if (mode === "create") {
        const payload: DictionaryCreateDto = {
          name: values.label,
          code: config.supportsCode ? values.code : undefined,
          color: config.supportsColor ? values.color : undefined,
          isActive: config.supportsActive ? values.isActive : undefined,
        };

        await createMutation.mutateAsync(payload);
        toast.success(`${config.singularLabel} создан`);
        onOpenChange(false);
        return;
      }

      if (!initialItem) return;

      const payload: DictionaryUpdateDto = {
        name: values.label,
        code: config.supportsCode ? values.code : undefined,
        color: config.supportsColor ? values.color : undefined,
        isActive: config.supportsActive ? values.isActive : undefined,
      };

      await updateMutation.mutateAsync({ id: initialItem.id, dto: payload });
      toast.success(`${config.singularLabel} обновлен`);
      onOpenChange(false);
    } catch (error) {
      // Errors for mutations are already toasted in hooks, but keep a fallback for unexpected shapes.
      toast.error(getApiErrorMessage(error, "Что-то пошло не так"));
    }
  };

  return (
    <ModalForm
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={mode === "create" ? `Добавить новый ${config.singularLabel.toLowerCase()}.` : `Обновить детали ${config.singularLabel.toLowerCase()}.`}
      footer={
        <div className="flex items-center justify-between gap-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Отмена
          </Button>
          <Button
            onClick={() => {
              void form.handleSubmit(onSubmit)();
            }}
            disabled={isSubmitting || readOnly}
            className="min-w-28"
          >
            {readOnly ? "Только просмотр" : isSubmitting ? "Работа..." : submitLabel}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="dict-label">
            Название
          </label>
          <Input id="dict-label" placeholder={`${config.singularLabel} название`} {...form.register("label")} disabled={readOnly} />
            {form.formState.errors.label ? (
              <p className="text-xs text-destructive">{String(form.formState.errors.label.message)}</p>
            ) : null}
        </div>

        {config.supportsCode ? (
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="dict-code">
              Код
            </label>
            <Input id="dict-code" placeholder="e.g. US" {...form.register("code")} disabled={readOnly} />
            {form.formState.errors.code ? (
              <p className="text-xs text-destructive">{String(form.formState.errors.code.message)}</p>
            ) : null}
          </div>
        ) : null}

        {config.supportsColor ? (
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="dict-color">
              Цвет
            </label>
            <div className="flex items-center gap-3">
              <Input id="dict-color" type="color" {...form.register("color")} disabled={readOnly} className="h-10 w-16 p-1" />
              <Input
                id="dict-color-text"
                placeholder="#22C55E"
                value={form.watch("color") ?? ""}
                onChange={(e) => form.setValue("color", e.target.value, { shouldValidate: true })}
                disabled={readOnly}
              />
            </div>
            {form.formState.errors.color ? (
              <p className="text-xs text-destructive">{String(form.formState.errors.color.message)}</p>
            ) : null}
          </div>
        ) : null}

        {config.supportsActive ? (
          <div className="flex items-center justify-between rounded-xl border bg-card p-3">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">Активный</p>
              <p className="text-xs text-muted-foreground">Видимый в системе</p>
            </div>
            <Controller
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <input
                  type="checkbox"
                  className={cn(
                    "h-5 w-5 rounded border-input text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    field.value ? "bg-primary" : "bg-background",
                  )}
                  checked={Boolean(field.value)}
                  disabled={readOnly}
                  onChange={(e) => field.onChange(e.target.checked)}
                />
              )}
            />
          </div>
        ) : null}
      </div>
    </ModalForm>
  );
}