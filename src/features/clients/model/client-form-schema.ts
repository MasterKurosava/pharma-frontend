import { z } from "zod";

function normalizePhone(input: string) {
  const trimmed = input.trim();
  const withoutSpaces = trimmed.replace(/[\s()-]/g, "");
  return withoutSpaces;
}

export const clientFormSchema = z.object({
  name: z.string().trim().min(1, "Введите имя").max(120, "Максимум 120 символов"),
  phone: z
    .string()
    .trim()
    .min(7, "Слишком короткий номер")
    .max(20, "Слишком длинный номер")
    .transform((v) => normalizePhone(v))
    .refine((v) => /^[+]?\d{7,15}$/.test(v), "Неверный формат телефона (пример: +79991234567)"),
  clientStatusId: z.number().int().positive("Статус обязателен"),
});

export type ClientFormValues = z.infer<typeof clientFormSchema>;

