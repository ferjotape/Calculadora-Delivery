import { z } from "zod";

export const deliveryPlatformSchema = z.object({
  name: z.string().trim().min(1, "Informe um nome"),
  fee_pct: z.number().min(0, "Deve ser >= 0").max(100, "Deve ser <= 100"),
});

export type DeliveryPlatformInput = z.infer<typeof deliveryPlatformSchema>;

export const PLATFORM_PRESETS = ["iFood", "99Food", "Keeta"] as const;
