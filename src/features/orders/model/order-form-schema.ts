import { z } from "zod";

export type OrderItemFormValues = {
  productId: number;
  quantity: number;
};

export const orderItemFormSchema = z.object({
  productId: z.number().int().positive("Выберите продукт"),
  quantity: z.number().int().positive("Количество должно быть больше 0"),
});

export const orderFormSchema = z
  .object({
    clientId: z.number().int().positive("Выберите клиента"),
    countryId: z.number().int().positive("Выберите страну"),
    cityId: z.number().int().positive("Выберите город"),
    address: z.string().trim().min(1, "Адрес обязателен").max(500, "Адрес слишком длинный"),

    deliveryCompanyId: z.number().int().nonnegative(),
    deliveryTypeId: z.number().int().nonnegative(),
    deliveryPrice: z.number().min(0, "Цена не может быть отрицательной"),
    storagePlaceId: z.number().int().nonnegative(),

    paymentStatusId: z.number().int().positive("Выберите статус оплаты"),
    orderStatusId: z.number().int().positive("Выберите статус заказа"),
    assemblyStatusId: z.number().int().nonnegative(),
    responsibleUserId: z.number().int().nonnegative(),

    paidAmount: z.number().min(0, "Оплата не может быть отрицательной"),
    description: z.string().trim().max(2000, "Слишком длинное описание").optional(),

    totalPrice: z.number().min(0, "Итоговая сумма не может быть отрицательной"),
    remainingAmount: z.number().min(0, "Остаток не может быть отрицательным"),

    items: z.array(orderItemFormSchema).min(1, "Нужно минимум 1 позицию"),
  })
  .superRefine((values, ctx) => {
    if (Number.isFinite(values.totalPrice) && values.paidAmount > values.totalPrice) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["paidAmount"],
        message: "Оплаченная сумма не может быть больше итоговой",
      });
    }
  });

export type OrderFormValues = z.infer<typeof orderFormSchema>;

