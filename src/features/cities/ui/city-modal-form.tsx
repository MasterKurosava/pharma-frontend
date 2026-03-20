import { zodResolver } from "@hookform/resolvers/zod";
import type { ReactNode } from "react";
import { useEffect, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";

import { toast } from "sonner";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { NativeSelect } from "@/shared/ui/native-select/native-select";
import { ModalForm } from "@/shared/ui/modal-form/modal-form";
import { DrawerFormSkeleton } from "@/shared/ui/skeleton/skeleton";
import type { CityFormValues } from "@/features/cities/model/city-form-schema";
import { cityFormSchema } from "@/features/cities/model/city-form-schema";
import { useCountryOptionsQuery } from "@/features/cities/model/use-country-options";
import { useCreateCityMutation, useUpdateCityMutation, useCityDetailQuery } from "@/features/cities/api/city-crud-hooks";
import type { UpdateCityDto } from "@/entities/city/api/city-types";

type CityModalFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  cityId?: number | string;
};

export function CityModalForm({ open, onOpenChange, mode, cityId }: CityModalFormProps) {
  const isEdit = mode === "edit";

  const defaultValues: CityFormValues = useMemo(
    () => ({
      name: "",
      countryId: 0,
      isActive: true,
    }),
    [],
  );

  const cityDetailQuery = useCityDetailQuery(cityId, open && isEdit);

  const { options: countryOptions, isPending: isCountriesPending } = useCountryOptionsQuery();

  const form = useForm<CityFormValues>({
    resolver: zodResolver(cityFormSchema),
    defaultValues,
    mode: "onSubmit",
  });

  const createMutation = useCreateCityMutation();
  const updateMutation = useUpdateCityMutation();

  useEffect(() => {
    if (!open) {
      form.reset(defaultValues);
      return;
    }

    if (!isEdit) {
      form.reset(defaultValues);
      return;
    }

    if (cityDetailQuery.data) {
      form.reset({
        name: cityDetailQuery.data.name,
        countryId: cityDetailQuery.data.countryId,
        isActive: cityDetailQuery.data.isActive,
      });
    }
  }, [cityDetailQuery.data, defaultValues, form, isEdit, open]);

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const isLoading = (isEdit && cityDetailQuery.isPending) || isCountriesPending;

  const title = isEdit ? "Редактировать город" : "Создать город";

  const onSubmit = async (values: CityFormValues) => {
    if (isEdit) {
      if (!cityId) return;
      const dto: UpdateCityDto = {
        name: values.name,
        countryId: values.countryId,
        isActive: values.isActive,
      };
      await updateMutation.mutateAsync({ id: cityId, dto });
      toast.success("Город обновлен");
      onOpenChange(false);
      return;
    }

    const dto = {
      name: values.name,
      countryId: values.countryId,
      isActive: values.isActive,
    };

    await createMutation.mutateAsync(dto);
    toast.success("Город создан");
    onOpenChange(false);
  };

  const footer = (
    <div className="flex items-center justify-between gap-4">
      <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
        Отмена
      </Button>
      <Button
        onClick={() => {
          // ModalForm renders footer outside the <form>, so we trigger handleSubmit manually.
          void form.handleSubmit(onSubmit)();
        }}
        disabled={isSubmitting || isLoading}
        className="min-w-28"
      >
        {isSubmitting ? "Сохранение..." : isEdit ? "Сохранить" : "Создать"}
      </Button>
    </div>
  );

  const body: ReactNode = isLoading ? (
    <DrawerFormSkeleton />
  ) : (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-sm font-medium" htmlFor="city-name">
          Название
        </label>
        <Input id="city-name" placeholder="Например, Москва" {...form.register("name")} disabled={isSubmitting} />
        {form.formState.errors.name ? (
          <p className="text-xs text-destructive">{String(form.formState.errors.name.message)}</p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium" htmlFor="city-country">
          Страна
        </label>
        <Controller
          control={form.control}
          name="countryId"
          render={({ field }) => (
            <NativeSelect
              value={field.value || 0}
              options={countryOptions}
              onValueChange={(next) => field.onChange(next === "" ? 0 : next)}
              placeholder="Выберите страну"
              disabled={isSubmitting}
            />
          )}
        />
        {form.formState.errors.countryId ? (
          <p className="text-xs text-destructive">{String(form.formState.errors.countryId.message)}</p>
        ) : null}
      </div>

      <div className="flex items-center gap-3 rounded-xl border bg-card p-3">
        <Controller
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <input
              type="checkbox"
              className="h-5 w-5 rounded border-input text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              checked={field.value}
              disabled={isSubmitting}
              onChange={(e) => field.onChange(e.target.checked)}
            />
          )}
        />
        <div className="space-y-0.5">
          <p className="text-sm font-medium">Активен</p>
          <p className="text-xs text-muted-foreground">Виден в системе</p>
        </div>
      </div>
    </div>
  );

  return (
    <ModalForm open={open} onOpenChange={onOpenChange} title={title} footer={footer}>
      {body}
    </ModalForm>
  );
}

