export type PlanId = "gratuito" | "essencial" | "profissional" | "business";

export type PlanDefinition = {
  id: PlanId;
  name: string;
  priceCents: number;
  recipeLimit: number | null; // null = ilimitado
  hasCombos: boolean;
};

/** Mirror estático dos planos (tabela `plans`), usado na landing page para
 * manter a seção de preços estática/rápida sem round-trip ao Supabase. A
 * fonte da verdade para limite/preço realmente aplicado é a tabela `plans`
 * — se o preço mudar lá, atualize aqui também. */
export const PLANS: PlanDefinition[] = [
  { id: "gratuito", name: "Gratuito", priceCents: 0, recipeLimit: 2, hasCombos: false },
  { id: "essencial", name: "Essencial", priceCents: 2990, recipeLimit: 5, hasCombos: false },
  { id: "profissional", name: "Profissional", priceCents: 5990, recipeLimit: 10, hasCombos: false },
  { id: "business", name: "Business", priceCents: 9990, recipeLimit: null, hasCombos: true },
];
