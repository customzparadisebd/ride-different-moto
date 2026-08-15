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
import animationAsset from "@/assets/login-animation.mp4.asset.json";
import {
  checkLoginAllowed,
  recordSignIn,
  reportLoginFailure,
  reportLoginSuccess,
} from "@/lib/admin.functions";
import { createLoginApproval, getLoginApprovalStatus } from "@/lib/login-approvals.functions";
import { format } from "date-fns";

export const Route = createFileRoute("/ad/log")({
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
      toast.error("Those sign-in details are not valid.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-svh flex-col md:flex-row bg-[#0a0a0a]">
      {/* Left side: Animation */}
      <div className="relative hidden w-full md:flex md:w-1/2 overflow-hidden bg-black items-center justify-center">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 h-full w-full object-cover opacity-60 pointer-events-none"
        >
          <source src={animationAsset.url} type="video/mp4" />
        </video>
        <div className="relative z-10 p-12 text-center">
          <h2 className="font-display text-4xl font-black uppercase tracking-tighter text-white sm:text-6xl">
            RIDE DIFFERENT.
            <br />
            <span className="text-primary">BE DIFFERENT.</span>
          </h2>
        </div>
      </div>

      {/* Right side: Login Panel */}
      <div className="flex w-full flex-col items-center justify-center px-6 py-12 md:w-1/2 md:px-12 bg-gradient-onyx">
        <div className="w-full max-w-sm space-y-8">
          <div className="flex flex-col items-center">
            <Logo priority className="h-16" />
            <div className="mt-6 text-center">
              <h1 className="font-display text-2xl font-bold uppercase tracking-[0.2em] text-white">
                Admin Panel
              </h1>
              <p className="mt-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Customz Paradise BD Internal Access
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 border-white/5 bg-white/5 font-medium transition-all focus:border-primary/50 focus:ring-primary/20"
                placeholder="admin@customzparadise.com"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  Password
                </Label>
              </div>
              <PasswordInput
                id="password"
                autoComplete="current-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 border-white/5 bg-white/5 transition-all focus:border-primary/50 focus:ring-primary/20"
                placeholder="••••••••"
              />
            </div>
            
            <div className="pt-2">
              <Button
                type="submit"
                variant="red"
                size="touch"
                className="w-full h-12 text-sm font-black uppercase tracking-widest shadow-3d-red active:translate-y-0.5 active:shadow-none transition-all"
                disabled={busy || locked}
              >
                {locked
                  ? `Locked — retry in ${Math.floor(lockSeconds / 60)}:${String(lockSeconds % 60).padStart(2, "0")}`
                  : "Log In"}
              </Button>
            </div>
          </form>

          <div className="mt-12 text-center">
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground/40">
              © {new Date().getFullYear()} Customz Paradise BD. All rights reserved.
            </p>
          </div>
        </div>
      </div>

      {/* Mobile-only background video overlay */}
      <div className="fixed inset-0 -z-10 md:hidden overflow-hidden pointer-events-none">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="h-full w-full object-cover opacity-20"
        >
          <source src={animationAsset.url} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/60" />
      </div>
    </div>
  );
}
