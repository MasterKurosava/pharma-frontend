import { z } from "zod";
import { PAYMENT_STATUS_OPTIONS } from "@/shared/config/order-static";

export const orderFormSchema = z
  .object({
    clientPhone: z.string().trim().min(3, "Введите телефон клиента").max(50, "Слишком длинный номер"),
    clientFullName: z.string().trim().max(255, "Слишком длинное имя").optional(),
    city: z.string().trim().max(120, "Слишком длинный город").optional(),
    address: z.string().trim().max(500, "Адрес слишком длинный").optional(),

    actionStatusCode: z.string().trim().min(1, "Выберите статус действия"),
    stateStatusCode: z.string().trim().min(1, "Выберите статус состояния"),
    assemblyStatusCode: z.string().trim().max(80, "Слишком длинный статус сборки").optional(),
    paymentStatus: z.enum(PAYMENT_STATUS_OPTIONS.map((item) => item.value) as [string, ...string[]]),
    deliveryPrice: z.number().min(0, "Цена не может быть отрицательной"),
    storagePlaceId: z.number().int().nonnegative(),
    orderStorage: z.string().trim().max(255, "Слишком длинное значение").optional(),

    description: z.string().trim().max(2000, "Слишком длинное описание").optional(),

    productId: z.number().int().positive("Выберите препарат"),
    quantity: z.number().int().positive("Количество должно быть больше 0"),
    productPrice: z.number().min(0, "Цена не может быть отрицательной"),
    totalPrice: z.number().min(0, "Итоговая сумма не может быть отрицательной"),
    remainingAmount: z.number().min(0, "Остаток не может быть отрицательным"),
  });

export type OrderFormValues = z.infer<typeof orderFormSchema>;

