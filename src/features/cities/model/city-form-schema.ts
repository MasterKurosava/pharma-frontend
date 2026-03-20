import { z } from "zod";

export const cityFormSchema = z.object({
  name: z.string().trim().min(1, "City name is required").max(120, "Max 120 characters"),
  countryId: z.number().int().positive("Country is required"),
  isActive: z.boolean(),
});

export type CityFormValues = z.infer<typeof cityFormSchema>;

