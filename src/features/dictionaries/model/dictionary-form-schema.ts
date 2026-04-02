import { z } from "zod";

import type { DictionaryResourceName } from "@/entities/dictionary/api/dictionary-types";
import { getSimpleDictionaryConfig } from "@/features/dictionaries/model/simple-dictionaries-config";

export type DictionaryFormValues = {
  label: string;
  code?: string;
  color?: string;
  isActive?: boolean;
};

export function getDictionaryFormSchema(resource: DictionaryResourceName) {
  const config = getSimpleDictionaryConfig(resource);

  return z
    .object({
      label: z.string().trim().min(1, "Name is required").max(120, "Max 120 characters"),
      code: z.string().trim().max(32, "Max 32 characters").optional(),
      color: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/, "Use HEX color like #22C55E").optional(),
      isActive: z.boolean().optional(),
    })
    .superRefine((values, ctx) => {
      if (config.supportsCode) {
        if (!values.code || values.code.trim().length < 2) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["code"],
            message: "Code is required",
          });
        }
      }

      if (config.supportsColor && !values.color) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["color"],
          message: "Color is required",
        });
      }

    });
}

