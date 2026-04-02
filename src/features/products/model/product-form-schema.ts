import { z } from "zod";
const productAvailabilitySchema = z.union([
  z.literal("OUT_OF_STOCK"),
  z.literal("ON_REQUEST"),
  z.literal("IN_STOCK"),
]);

export const productFormSchema = z.object({
  name: z.string().trim().min(1, "Название обязательно").max(200, "Слишком длинное название"),
  manufacturerId: z.number().int().positive("Выберите производителя"),
  activeSubstanceId: z.number().int().positive("Выберите действующее вещество"),
  availabilityStatus: productAvailabilitySchema,
  productOrderSourceId: z.number().int().nonnegative(),
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

