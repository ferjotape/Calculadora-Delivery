import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PlatformsManager } from "./PlatformsManager";
import { ScreenHeader } from "@/components/ScreenHeader";

export default async function PlatformsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: platforms } = await supabase
    .from("delivery_platforms")
    .select("*")
    .eq("user_id", user.id)
    .order("name", { ascending: true });

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-3 p-4 sm:p-6">
      <ScreenHeader
        title="Plataformas de delivery"
        description="Cadastre as plataformas que você usa (iFood, 99Food, Keeta, própria...) e a taxa cobrada por cada uma."
      />

      <PlatformsManager initialPlatforms={platforms ?? []} />

      <div className="flex shrink-0 justify-end border-t border-neutral-200 pt-3 dark:border-neutral-800">
        <Link
          href="/insumos"
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-active"
        >
          Continuar
        </Link>
      </div>
    </div>
  );
}
