// ============================================================
// ADMIN / STAFF LOGIN
// Purpose: Email + password entry point for the admin panel. After
//          a successful password step the server gate sends
//          privileged accounts to two-factor verification.
// Status: COMPLETED
// Security: Lockout counters live server-side (login_attempts), so
//          clearing browser storage does not reset them: 3 failed
//          attempts lock for 5 minutes and repeated failures extend
//          the lockout progressively. Error messages never reveal
//          whether an account exists. Every attempt is audited.
// Future: None.
// ============================================================
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/PasswordInput";
import { site } from "@/data/site";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import {
  checkLoginAllowed,
  recordSignIn,
  reportLoginFailure,
  reportLoginSuccess,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/czp-ops-9f2c/access")({
  // Client-only: the form depends on the browser auth session, and
  // server-rendering it caused a hydration mismatch on load.
  ssr: false,
  head: () => ({
    meta: [
      { title: `Staff Sign In — ${site.name}` },
      {
        name: "description",
        content: "Sign in to the Customz Paradise BD admin panel to manage orders and inventory.",
      },
      { property: "og:title", content: `Staff Sign In — ${site.name}` },
      { property: "og:description", content: "Admin access for Customz Paradise BD staff." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sentEmail, setSentEmail] = useState(false);
  const [lockSeconds, setLockSeconds] = useState(0);
  const locked = lockSeconds > 0;

  useEffect(() => {
    if (!lockSeconds) return;
    const timer = setInterval(() => setLockSeconds((s) => (s > 1 ? s - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, [lockSeconds]);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) void navigate({ to: "/czp-ops-9f2c", replace: true });
    });
    void supabase.auth.getSession().then(({ data: s }) => {
      if (s.session) void navigate({ to: "/czp-ops-9f2c", replace: true });
    });
    return () => data.subscription.unsubscribe();
  }, [navigate]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      // Server-side rate limit check before touching the auth provider.
      const gate = await checkLoginAllowed({ data: { email } });
      if (gate.locked) {
        setLockSeconds(gate.retryInSeconds);
        toast.error(
          `Too many failed attempts. Try again in about ${Math.ceil(gate.retryInSeconds / 60)} minute(s).`,
        );
        setBusy(false);
        return;
      }

      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/czp-ops-9f2c/access" },
        });
        if (error) throw error;
        if (!data.session) {
          setSentEmail(true);
          toast.success("Check your email to confirm the account.");
        } else {
          toast.success("Account created. Access must be approved by an admin.");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await reportLoginSuccess({ data: { email } });
        try {
          await recordSignIn({});
        } catch {
          /* audit is best-effort */
        }
      }
    } catch (error) {
      if (mode === "signin") {
        try {
          const state = await reportLoginFailure({ data: { email } });
          if (state.locked) setLockSeconds(state.retryInSeconds);
        } catch {
          /* ignore throttle bookkeeping failures */
        }
        // Generic message: never disclose whether the account exists.
        toast.error("Those sign-in details are not valid.");
      } else {
        toast.error(error instanceof Error ? error.message : "Could not create the account.");
      }
    } finally {
      setBusy(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error("Enter your email address first.");
      return;
    }
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/czp-ops-9f2c/reset-password",
    });
    // Same response regardless of whether the account exists.
    toast.success("If that account exists, a reset link is on its way.");
  };

  const handleGoogle = async () => {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/czp-ops-9f2c/access",
    });
    if (result.error) {
      toast.error("Google sign-in failed. Please try again.");
      setBusy(false);
      return;
    }
    if (result.redirected) return;
    void navigate({ to: "/czp-ops-9f2c", replace: true });
  };

  return (
    <section className="mx-auto flex max-w-md flex-col px-4 py-16">
      <h1 className="font-display text-3xl font-bold uppercase tracking-wide">Staff Sign In</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Admin panel access for {site.name}. Customers do not need an account.
      </p>

      {sentEmail ? (
        <p className="mt-6 rounded-lg border border-border bg-secondary p-4 text-sm">
          We sent a confirmation link to <strong>{email}</strong>. Confirm it, then sign in.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 h-11"
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <PasswordInput
              id="password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 h-11"
            />
          </div>
          <Button
            type="submit"
            variant="red"
            size="touch"
            className="w-full"
            disabled={busy || locked}
          >
            {locked
              ? `Locked — retry in ${Math.floor(lockSeconds / 60)}:${String(lockSeconds % 60).padStart(2, "0")}`
              : mode === "signup"
                ? "Create account"
                : "Sign in"}
          </Button>
          {mode === "signin" ? (
            <button
              type="button"
              className="text-xs text-muted-foreground underline"
              onClick={() => void handleForgotPassword()}
            >
              Forgot password?
            </button>
          ) : null}
        </form>
      )}

      <Button
        variant="steel"
        size="touch"
        className="mt-3 w-full"
        onClick={handleGoogle}
        disabled={busy}
      >
        Continue with Google
      </Button>

      <button
        type="button"
        className="mt-4 text-xs text-muted-foreground underline"
        onClick={() => {
          setSentEmail(false);
          setMode(mode === "signin" ? "signup" : "signin");
        }}
      >
        {mode === "signin" ? "Need an account? Sign up" : "Already have an account? Sign in"}
      </button>

      <p className="mt-6 text-xs text-muted-foreground">
        New staff accounts start as <strong>Pending</strong> and need Admin approval before the panel
        opens. Privileged accounts must also pass authenticator verification.
      </p>

      <p className="mt-2 text-xs text-muted-foreground">
        Owner account: if it has not been created yet, use <strong>Sign up</strong> once with the
        owner email — it is granted Super Admin automatically. If it already exists, use{" "}
        <strong>Forgot password?</strong> to set a new password by email. Passwords are stored only
        as hashes and cannot be looked up by anyone.
      </p>
    </section>
  );
}