"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  deliveryPlatformSchema,
  type DeliveryPlatformInput,
} from "@/lib/validation/delivery-platform";
import type { DeliveryPlatform } from "@/lib/types/database";

export type PlatformActionResult = {
  success: boolean;
  error?: string;
  platform?: DeliveryPlatform;
};

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function createPlatform(input: DeliveryPlatformInput): Promise<PlatformActionResult> {
  const parsed = deliveryPlatformSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Dados inválidos. Revise os campos e tente novamente." };
  }

  const { supabase, user } = await requireUser();
  if (!user) {
    return { success: false, error: "Sessão expirada. Faça login novamente." };
  }

  const { data, error } = await supabase
    .from("delivery_platforms")
    .insert({
      user_id: user.id,
      name: parsed.data.name,
      fee_pct: parsed.data.fee_pct,
    })
    .select("*")
    .single();

  if (error) {
    return { success: false, error: "Não foi possível adicionar a plataforma." };
  }

  revalidatePath("/plataformas");
  return { success: true, platform: data };
}

export async function updatePlatform(
  id: string,
  input: DeliveryPlatformInput
): Promise<PlatformActionResult> {
  const parsed = deliveryPlatformSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Dados inválidos. Revise os campos e tente novamente." };
  }

  const { supabase, user } = await requireUser();
  if (!user) {
    return { success: false, error: "Sessão expirada. Faça login novamente." };
  }

  const { data, error } = await supabase
    .from("delivery_platforms")
    .update({
      name: parsed.data.name,
      fee_pct: parsed.data.fee_pct,
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error) {
    return { success: false, error: "Não foi possível salvar a plataforma." };
  }

  revalidatePath("/plataformas");
  return { success: true, platform: data };
}

export async function setPlatformActive(
  id: string,
  isActive: boolean
): Promise<PlatformActionResult> {
  const { supabase, user } = await requireUser();
  if (!user) {
    return { success: false, error: "Sessão expirada. Faça login novamente." };
  }

  const { data, error } = await supabase
    .from("delivery_platforms")
    .update({ is_active: isActive })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error) {
    return { success: false, error: "Não foi possível atualizar a plataforma." };
  }

  revalidatePath("/plataformas");
  return { success: true, platform: data };
}

export async function deletePlatform(id: string): Promise<PlatformActionResult> {
  const { supabase, user } = await requireUser();
  if (!user) {
    return { success: false, error: "Sessão expirada. Faça login novamente." };
  }

  const { error } = await supabase
    .from("delivery_platforms")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: "Não foi possível remover a plataforma." };
  }

  revalidatePath("/plataformas");
  return { success: true };
}
