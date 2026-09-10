import { z } from "zod";

export const deliveryCostSettingsSchema = z.object({
  monthly_orders: z.number().min(0, "Deve ser >= 0"),
  delivery_value: z.number().min(0, "Deve ser >= 0"),
});

export type DeliveryCostSettingsInput = z.infer<typeof deliveryCostSettingsSchema>;
