import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { computeAverageMonthlyRevenue } from "@/lib/monthly-revenue";
import type { DeliveryCostSettingsInput } from "@/lib/validation/delivery-cost-settings";
import { DeliveryCostForm } from "./DeliveryCostForm";
import { ScreenHeader } from "@/components/ScreenHeader";

export default async function CustoMotoboyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const year = new Date().getFullYear();

  const [{ data: deliveryCostSettings }, { data: monthlyRevenueRows }] = await Promise.all([
    supabase.from("delivery_cost_settings").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("monthly_revenue").select("value").eq("user_id", user.id).eq("year", year),
  ]);

  const avgMonthlyRevenue = computeAverageMonthlyRevenue(monthlyRevenueRows ?? []);

  const defaultValues: DeliveryCostSettingsInput = {
    monthly_orders: deliveryCostSettings?.monthly_orders ?? 0,
    delivery_value: deliveryCostSettings?.delivery_value ?? 0,
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-3 p-4 sm:p-6">
      <ScreenHeader
        title="Custo Motoboy"
        description="Calcule o ticket médio e o custo real do programa de entrega grátis."
      />

      <DeliveryCostForm defaultValues={defaultValues} avgMonthlyRevenue={avgMonthlyRevenue} />
    </div>
  );
}
