"use server";

import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/server";

export async function validateInviteCode(
  code: string
): Promise<{ valid: boolean; error?: string }> {
  const normalized = code.trim().toUpperCase();

  if (!normalized) {
    return { valid: false, error: "Please enter an invite code." };
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("invite_codes")
    .select("id, used_by")
    .eq("code", normalized)
    .single();

  if (error || !data) {
    return {
      valid: false,
      error: "That code isn't recognized. Ask whoever invited you for a fresh one.",
    };
  }

  if (data.used_by) {
    return {
      valid: false,
      error: "That code has already been used. Ask for a new one.",
    };
  }

  const cookieStore = await cookies();
  cookieStore.set("pending-invite", normalized, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60,
    path: "/",
  });

  return { valid: true };
}
