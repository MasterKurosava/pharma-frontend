import { z } from "zod";

export const productFormSchema = z.object({
  name: z.string().trim().min(1, "Название обязательно").max(200, "Слишком длинное название"),
  manufacturerId: z.number().int().positive("Выберите производителя"),
  activeSubstanceId: z.number().int().positive("Выберите действующее вещество"),
  productStatusId: z.number().int().positive("Выберите статус"),
  productOrderSourceId: z.number().int().positive("Выберите источник поступления"),
  stockQuantity: z.number().int().min(0, "Запас не может быть отрицательным"),
  reservedQuantity: z.number().int().min(0, "Резерв не может быть отрицательным"),
  imageUrl: z
    .string()
    .trim()
    .max(2000)
    .refine((v) => v.length === 0 || /^https?:\/\//.test(v), "Укажите корректный URL (http/https)"),
  description: z.string().trim().max(2000),
  isActive: z.boolean(),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;

