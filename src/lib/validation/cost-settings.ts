import { z } from "zod";

export const fixedCostSchema = z.object({
  name: z.string().trim().min(1, "Informe um nome"),
  value: z.number().min(0, "Valor deve ser positivo"),
});

export const costSettingsSchema = z.object({
  fixed_costs: z.array(fixedCostSchema),
  card_fee_pct: z.number().min(0, "Deve ser >= 0").max(100, "Deve ser <= 100"),
  packaging_pct: z.number().min(0, "Deve ser >= 0").max(100, "Deve ser <= 100"),
  free_delivery_pct: z.number().min(0, "Deve ser >= 0").max(100, "Deve ser <= 100"),
  desired_profit_pct: z.number().min(0, "Deve ser >= 0").max(100, "Deve ser <= 100"),
  avg_monthly_revenue: z.number().min(0).nullable(),
});

export type CostSettingsInput = z.infer<typeof costSettingsSchema>;
