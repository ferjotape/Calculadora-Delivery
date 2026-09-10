import { z } from "zod";

export const monthlyRevenueSchema = z.object({
  year: z.number().int(),
  values: z.array(z.number().min(0).nullable()).length(12),
});

export type MonthlyRevenueInput = z.infer<typeof monthlyRevenueSchema>;
