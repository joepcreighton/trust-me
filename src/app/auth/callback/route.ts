import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (!code) {
    return NextResponse.redirect(new URL("/sign-in?error=missing_code", origin));
  }

  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL("/sign-in?error=auth_failed", origin));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // Mark pending invite code as used (only on first use)
    const pendingCode = cookieStore.get("pending-invite")?.value;
    if (pendingCode) {
      const admin = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
      );
      await admin
        .from("invite_codes")
        .update({ used_by: user.id, used_at: new Date().toISOString() })
        .eq("code", pendingCode)
        .is("used_by", null);
      cookieStore.delete("pending-invite");
    }

    // Route new users to onboarding
    const { data: profile } = await supabase
      .from("users")
      .select("onboarding_complete")
      .eq("id", user.id)
      .single();

    if (!profile?.onboarding_complete) {
      return NextResponse.redirect(new URL("/onboarding", origin));
    }
  }

  return NextResponse.redirect(new URL(next, origin));
}
