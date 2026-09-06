"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Ticket } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { validateInviteCode } from "../actions";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" aria-hidden>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

export default function SignUpPage() {
  const [step, setStep] = useState<"code" | "auth">("code");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCodeSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await validateInviteCode(code);
    setLoading(false);
    if (result.valid) {
      setStep("auth");
    } else {
      setError(result.error ?? "Invalid code.");
    }
  }

  async function handleGoogle() {
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-[3rem] text-charcoal text-center tracking-tight leading-none mb-3">
          trust me
        </h1>
        <p className="text-center text-sm text-muted mb-10">
          {step === "code" ? "You need an invite to join." : "Almost there."}
        </p>

        {step === "code" && (
          <form onSubmit={handleCodeSubmit} className="flex flex-col gap-3">
            <div className="flex items-center gap-3 bg-white border border-black/12 rounded-2xl px-4 shadow-sm shadow-black/4">
              <Ticket size={18} className="text-muted flex-shrink-0" strokeWidth={1.75} />
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="TRUST-XXXXXX"
                autoFocus
                autoCapitalize="characters"
                autoComplete="off"
                className="flex-1 text-base text-charcoal bg-transparent py-4 focus:outline-none placeholder:text-muted/40 font-mono tracking-widest"
              />
            </div>

            {error && (
              <p className="text-sm text-rose-500 leading-relaxed">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="flex items-center justify-center gap-2 w-full bg-sage text-white font-semibold text-base py-4 rounded-2xl shadow-sm shadow-sage/20 active:scale-[0.98] transition-transform disabled:opacity-50"
            >
              {loading ? "Checking…" : (
                <>
                  Continue
                  <ArrowRight size={18} strokeWidth={2} />
                </>
              )}
            </button>
          </form>
        )}

        {step === "auth" && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 mb-1 px-1">
              <Check size={15} className="text-sage" strokeWidth={2.5} />
              <p className="text-xs text-muted font-medium">Invite code accepted</p>
            </div>

            <button
              onClick={handleGoogle}
              disabled={loading}
              className="flex items-center justify-center gap-3 w-full bg-sage text-white font-semibold text-base py-4 rounded-2xl shadow-sm shadow-sage/20 active:scale-[0.98] transition-transform disabled:opacity-60"
            >
              <GoogleIcon />
              Continue with Google
            </button>

            {error && (
              <p className="text-sm text-rose-500 text-center">{error}</p>
            )}
          </div>
        )}

        <p className="text-center text-sm text-muted mt-10">
          Already have an account?{" "}
          <Link href="/sign-in" className="text-sage font-semibold">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
