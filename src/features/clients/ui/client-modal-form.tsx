import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";

import { toast } from "sonner";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { ModalForm } from "@/shared/ui/modal-form/modal-form";
import { NativeSelect } from "@/shared/ui/native-select/native-select";
import { DrawerFormSkeleton } from "@/shared/ui/skeleton/skeleton";

import { type ClientFormValues, clientFormSchema } from "@/features/clients/model/client-form-schema";
import { useClientStatusOptionsQuery } from "@/features/clients/model/use-client-status-options";
import { useCreateClientMutation, useClientDetailQuery, useUpdateClientMutation } from "@/features/clients/api/client-crud-hooks";
import type { UpdateClientDto } from "@/entities/client/api/client-types";
import { parseConflictErrorForField } from "@/shared/lib/parse-conflict-field-error";
import { getApiErrorMessage } from "@/shared/lib/get-api-error-message";

type ClientModalFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  clientId?: number | string;
};

export function ClientModalForm({ open, onOpenChange, mode, clientId }: ClientModalFormProps) {
  const isEdit = mode === "edit";

  const { options: statusOptions, isPending: isStatusesPending } = useClientStatusOptionsQuery();

  const cityDetailQuery = useClientDetailQuery(clientId, open && isEdit);

  const defaultValues = useMemo<ClientFormValues>(
    () => ({
      name: "",
      phone: "",
      clientStatusId: 0,
    }),
    [],
  );

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues,
    mode: "onSubmit",
  });

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
        phone: cityDetailQuery.data.phone,
        clientStatusId: cityDetailQuery.data.clientStatusId ?? 0,
      });
    }
  }, [cityDetailQuery.data, defaultValues, form, isEdit, open]);

  const createMutation = useCreateClientMutation();
  const updateMutation = useUpdateClientMutation();

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const isLoading = (isEdit && cityDetailQuery.isPending) || isStatusesPending;

  const title = isEdit ? "Редактировать клиента" : "Создать клиента";

  const onSubmit = async (values: ClientFormValues) => {
    try {
      if (isEdit) {
        if (!clientId) return;

        const dto: UpdateClientDto = {
          name: values.name,
          phone: values.phone,
          clientStatusId: values.clientStatusId,
        };

        await updateMutation.mutateAsync({ id: clientId, dto });
        toast.success("Клиент обновлен");
        onOpenChange(false);
        return;
      }

      await createMutation.mutateAsync({
        name: values.name,
        phone: values.phone,
        clientStatusId: values.clientStatusId,
      });

      toast.success("Клиент создан");
      onOpenChange(false);
    } catch (error) {
      const phoneConflict = parseConflictErrorForField(error, "phone");
      if (phoneConflict) {
        form.setError("phone", { message: phoneConflict.message });
        return;
      }

      toast.error(getApiErrorMessage(error, "Не удалось сохранить клиента"));
    }
  };

  const footer = (
    <div className="flex items-center justify-between gap-4">
      <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
        Отмена
      </Button>
      <Button
        onClick={() => {
          void form.handleSubmit(onSubmit)();
        }}
        disabled={isSubmitting || isLoading}
        className="min-w-28"
      >
        {isSubmitting ? "Сохранение..." : isEdit ? "Сохранить" : "Создать"}
      </Button>
    </div>
  );

  return (
    <ModalForm open={open} onOpenChange={onOpenChange} title={title} footer={footer}>
      {isLoading ? (
        <DrawerFormSkeleton />
      ) : (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="client-name">
              Имя
            </label>
            <Input id="client-name" placeholder="Имя клиента" {...form.register("name")} disabled={isSubmitting} />
            {form.formState.errors.name ? (
              <p className="text-xs text-destructive">{String(form.formState.errors.name.message)}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="client-phone">
              Телефон
            </label>
            <Input id="client-phone" placeholder="+79991234567" {...form.register("phone")} disabled={isSubmitting} />
            {form.formState.errors.phone ? (
              <p className="text-xs text-destructive">{String(form.formState.errors.phone.message)}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="client-status">
              Статус клиента
            </label>
            <Controller
              control={form.control}
              name="clientStatusId"
              render={({ field }) => (
                <NativeSelect
                  value={field.value === 0 ? "" : field.value}
                  options={statusOptions}
                  onValueChange={(next) => field.onChange(next === "" ? 0 : next)}
                  placeholder="Все статусы"
                  disabled={isSubmitting}
                />
              )}
            />
            {form.formState.errors.clientStatusId ? (
              <p className="text-xs text-destructive">{String(form.formState.errors.clientStatusId.message)}</p>
            ) : null}
          </div>
        </div>
      )}
    </ModalForm>
  );
}

