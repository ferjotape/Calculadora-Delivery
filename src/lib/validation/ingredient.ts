import { z } from "zod";

export const INGREDIENT_UNITS = ["kg", "g", "l", "ml", "un"] as const;
export type IngredientUnit = (typeof INGREDIENT_UNITS)[number];

export const ingredientSchema = z.object({
  name: z.string().trim().min(1, "Informe um nome"),
  price_paid: z.number().min(0, "Deve ser >= 0"),
  purchase_volume: z.number().gt(0, "Deve ser maior que 0"),
  unit: z.enum(INGREDIENT_UNITS),
  correction_factor: z.number().gt(0, "Deve ser maior que 0"),
});

export type IngredientInput = z.infer<typeof ingredientSchema>;
