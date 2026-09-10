"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { monthlyRevenueSchema, type MonthlyRevenueInput } from "@/lib/validation/monthly-revenue";

export type SaveMonthlyRevenueResult = {
  success: boolean;
  error?: string;
};

export async function saveMonthlyRevenue(
  input: MonthlyRevenueInput
): Promise<SaveMonthlyRevenueResult> {
  const parsed = monthlyRevenueSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, error: "Dados inválidos. Revise os valores e tente novamente." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Sessão expirada. Faça login novamente." };
  }

  // Nº de pedidos só existe pareado com o faturamento do mesmo mês (a coluna
  // "value" é obrigatória em monthly_revenue) — por isso só entra no upsert
  // quando o mês também tem faturamento preenchido; sem faturamento, o pedido
  // informado é ignorado (a tela já desabilita esse campo nesse caso).
  const filledMonths = parsed.data.values
    .map((value, index) => ({ month: index + 1, value, orders_count: parsed.data.orders[index] }))
    .filter(
      (row): row is { month: number; value: number; orders_count: number | null } =>
        row.value !== null
    );

  const emptyMonths = parsed.data.values
    .map((value, index) => ({ month: index + 1, value }))
    .filter((row) => row.value === null)
    .map((row) => row.month);

  if (filledMonths.length > 0) {
    const { error } = await supabase.from("monthly_revenue").upsert(
      filledMonths.map((row) => ({
        user_id: user.id,
        year: parsed.data.year,
        month: row.month,
        value: row.value,
        orders_count: row.orders_count,
        updated_at: new Date().toISOString(),
      })),
      { onConflict: "user_id,year,month" }
    );

    if (error) {
      return { success: false, error: "Não foi possível salvar o faturamento." };
    }
  }

  if (emptyMonths.length > 0) {
    const { error } = await supabase
      .from("monthly_revenue")
      .delete()
      .eq("user_id", user.id)
      .eq("year", parsed.data.year)
      .in("month", emptyMonths);

    if (error) {
      return { success: false, error: "Não foi possível salvar o faturamento." };
    }
  }

  revalidatePath("/custos");
  return { success: true };
}
