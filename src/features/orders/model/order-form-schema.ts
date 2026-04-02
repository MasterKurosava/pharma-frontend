import { z } from "zod";
import { DELIVERY_STATUS_OPTIONS, ORDER_STATUS_OPTIONS, PAYMENT_STATUS_OPTIONS } from "@/shared/config/order-static";

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
    clientPhone: z.string().trim().min(3, "Введите телефон клиента").max(50, "Слишком длинный номер"),
    countryId: z.number().int().positive("Выберите страну"),
    city: z.string().trim().min(1, "Введите город").max(120, "Слишком длинный город"),
    address: z.string().trim().min(1, "Адрес обязателен").max(500, "Адрес слишком длинный"),

    deliveryStatus: z.enum(DELIVERY_STATUS_OPTIONS.map((item) => item.value) as [string, ...string[]]),
    deliveryPrice: z.number().min(0, "Цена не может быть отрицательной"),
    storagePlaceId: z.number().int().nonnegative(),

    paymentStatus: z.enum(PAYMENT_STATUS_OPTIONS.map((item) => item.value) as [string, ...string[]]),
    orderStatus: z.enum(ORDER_STATUS_OPTIONS.map((item) => item.value) as [string, ...string[]]),

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

