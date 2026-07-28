import { z } from "zod";

export const recipeSchema = z.object({
  name: z.string().trim().min(1, "Informe um nome"),
  loss_pct: z.number().min(0, "Deve ser >= 0").max(100, "Deve ser <= 100"),
});

export type RecipeInput = z.infer<typeof recipeSchema>;

export const recipeIngredientSchema = z.object({
  ingredient_id: z.string().uuid("Selecione um insumo"),
  quantity_used: z.number().gt(0, "Deve ser maior que 0"),
});

export type RecipeIngredientInput = z.infer<typeof recipeIngredientSchema>;
