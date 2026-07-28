import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

/**
 * Cliente com a service role key: ignora RLS. Uso exclusivo em contextos sem
 * sessão de usuário (ex: webhook do Stripe) — nunca importar em código que
 * roda no browser ou em Server Actions/rotas acessíveis diretamente por eles.
 */
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
