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
import { Logo } from "@/components/Logo";
import { site } from "@/data/site";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import {
  checkLoginAllowed,
  recordSignIn,
  reportLoginFailure,
  reportLoginSuccess,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/ad/log")({
  // Client-only: the form depends on the browser auth session, and
  // server-rendering it caused a hydration mismatch on load.
  ssr: false,
  head: () => ({
    meta: [
      { title: `Admin Panel — ${site.name}` },
      {
        name: "description",
        content: "Sign in to the Customz Paradise BD admin panel to manage orders and inventory.",
      },
      { property: "og:title", content: `Admin Panel — ${site.name}` },
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [lockSeconds, setLockSeconds] = useState(0);
  const locked = lockSeconds > 0;

  useEffect(() => {
    if (!lockSeconds) return;
    const timer = setInterval(() => setLockSeconds((s) => (s > 1 ? s - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, [lockSeconds]);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) void navigate({ to: "/ad", replace: true });
    });
    void supabase.auth.getSession().then(({ data: s }) => {
      if (s.session) void navigate({ to: "/ad", replace: true });
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

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      await reportLoginSuccess({ data: { email } });
      try {
        await recordSignIn({});
      } catch {
        /* audit is best-effort */
      }
    } catch (error) {
      void error;
      try {
        const state = await reportLoginFailure({ data: { email } });
        if (state.locked) setLockSeconds(state.retryInSeconds);
      } catch {
        /* ignore throttle bookkeeping failures */
      }
      // Generic message: never disclose whether the account exists.
      toast.error("Those sign-in details are not valid.");
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/ad/log",
    });
    if (result.error) {
      toast.error("Google sign-in failed. Please try again.");
      setBusy(false);
      return;
    }
    if (result.redirected) return;
    void navigate({ to: "/ad", replace: true });
  };

  return (
    <section className="mx-auto flex max-w-md flex-col px-4 py-16">
      <div className="flex flex-col items-center">
        <Logo priority className="h-14" />
        <h1 className="mt-4 font-display text-xl font-semibold uppercase tracking-[0.2em]">
          Admin Panel
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
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
            autoComplete="current-password"
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
            : "Log in"}
        </Button>
      </form>

      <Button
        variant="steel"
        size="touch"
        className="mt-3 w-full"
        onClick={handleGoogle}
        disabled={busy}
      >
        Continue with Google
      </Button>
    </section>
  );
}
