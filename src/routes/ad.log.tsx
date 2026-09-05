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
import { useSiteLogos } from "@/hooks/use-site-logos";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/PasswordInput";
import { Logo } from "@/components/Logo";
import { site } from "@/data/site";
import { supabase } from "@/integrations/supabase/client";
import animationAsset from "@/assets/login-animation.mp4";
import logo3dAsset from "@/assets/czp-logo-3d.png";
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
  const { getLogo } = useSiteLogos();
  const loginLogo = getLogo("admin_login");

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [lockSeconds, setLockSeconds] = useState(0);
  const [approvalRequestId, setApprovalRequestId] = useState<string | null>(null);
  const [approvalStatus, setApprovalStatus] = useState<string>("pending");
  const [requestTime, setRequestTime] = useState<string>("");
  const locked = lockSeconds > 0;

  useEffect(() => {
    if (!lockSeconds) return;
    const timer = setInterval(() => setLockSeconds((s) => (s > 1 ? s - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, [lockSeconds]);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      // If signed in, check if we need approval or if we're already good
      if (event === "SIGNED_IN" && session) {
        handlePostAuth(session.user.id);
      }
    });

    supabase.auth.getSession().then(({ data: s }) => {
      if (s.session) handlePostAuth(s.session.user.id);
    });

    return () => data.subscription.unsubscribe();
  }, [navigate]);

  // Handle polling for approval
  useEffect(() => {
    if (!approvalRequestId || approvalStatus !== "pending") return;
    let notificationShown = false;

    const interval = setInterval(async () => {
      try {
        const result = await getLoginApprovalStatus({ data: approvalRequestId });
        if (result.status !== "pending") {
          setApprovalStatus(result.status);
          if (result.status === "approved" && !notificationShown) {
            notificationShown = true;
            toast.success("Login Approved!", {
              description:
                "Your session has been approved by an administrator. Redirecting to the dashboard...",
              duration: 5000,
            });
            clearInterval(interval);
            // Small delay to allow the user to read the success message
            setTimeout(() => {
              void navigate({ to: "/ad", replace: true });
            }, 1500);
          }
        }
      } catch (err) {
        console.error("Failed to check approval status", err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [approvalRequestId, approvalStatus, navigate]);

  const handlePostAuth = async (userId: string) => {
    setBusy(true);
    try {
      // Security: We fetch access state to see if MFA is satisfied before asking for approval
      const { getMyAccess } = await import("@/lib/orders.functions");
      const access = await getMyAccess({});

      // If MFA is required but not satisfied, we shouldn't show approval screen yet.
      // The route gate will handle redirection to /ad/mfa if they try to access /ad.
      // But if they are on /ad/log, we should let them finish MFA first.
      if (access.mfaRequired && !access.mfaSatisfied) {
        void navigate({ to: "/ad/mfa" });
        return;
      }

      const approval = await createLoginApproval({});
      if (approval.status === "approved") {
        void navigate({ to: "/ad", replace: true });
      } else {
        setApprovalRequestId(approval.requestId || null);
        setApprovalStatus("pending");
        setRequestTime(format(new Date(), "hh:mm:ss a"));
      }
    } catch (err) {
      console.error("Approval check failed", err);
      // We don't sign out automatically here because they might just need to finish MFA
      toast.error("Security check failed. Please ensure MFA is completed.");
    } finally {
      setBusy(false);
    }
  };

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
    } catch (error: any) {
      try {
        const state = await reportLoginFailure({ data: { email } });
        if (state.locked) setLockSeconds(state.retryInSeconds);
      } catch {
        /* ignore throttle bookkeeping failures */
      }
      toast.error(error.message || "Those sign-in details are not valid.");
    } finally {
      setBusy(false);
    }
  };

  if (approvalRequestId) {
    return (
      <div className="flex min-h-svh flex-col md:flex-row bg-[#0a0a0a]">
        {/* Left side: Same as login */}
        <div className="relative hidden w-full md:flex md:w-1/2 overflow-hidden bg-black items-center justify-center">
          <video
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 h-full w-full object-cover opacity-80 brightness-[1.1] contrast-[1.15] saturate-[1.1] pointer-events-none"
          >
            <source src={animationAsset} type="video/mp4" />
          </video>

          <div className="relative z-10 p-12 text-center">
            <h2 className="font-brush text-4xl font-bold uppercase tracking-wider text-white sm:text-6xl drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
              RIDE DIFFERENT
              <br />
              <span className="text-primary italic">BE DIFFERENT</span>
            </h2>
          </div>
        </div>

        {/* Right side: Waiting Screen */}
        <div className="flex w-full flex-col items-center justify-center px-6 py-12 md:w-1/2 md:px-12 bg-gradient-onyx">
          <div className="w-full max-w-sm space-y-8 text-center">
            <div className="flex flex-col items-center">
              <img 
                src={loginLogo} 

                alt={`${site.name} logo`} 
                className="h-auto w-full max-w-[200px] sm:max-w-[240px] lg:max-w-[340px] object-contain" 
                role="img"
              />
              <div className="mt-8 p-6 rounded-2xl border border-white/5 bg-white/5 space-y-6">
                {approvalStatus === "pending" ? (
                  <>
                    <div className="flex justify-center">
                      <div className="h-12 w-12 rounded-full border-t-2 border-primary animate-spin" />
                    </div>
                    <h1 className="font-display text-2xl font-bold uppercase tracking-widest text-white">
                      Login Request Pending
                    </h1>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Your identity has been verified via MFA. However, your account access is
                      currently <strong>Pending</strong>. An administrator must approve your login
                      session before you can access the panel.
                    </p>
                    <div className="space-y-3 pt-4 border-t border-white/5 text-left text-xs uppercase tracking-widest font-bold">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground/60">Status</span>
                        <span className="text-yellow-500">Pending</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground/60">Request Time</span>
                        <span className="text-white">{requestTime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground/60">Request ID</span>
                        <span className="text-white font-mono text-[10px]">
                          {approvalRequestId.slice(0, 8)}...
                        </span>
                      </div>
                    </div>
                  </>
                ) : approvalStatus === "rejected" ? (
                  <>
                    <div className="h-16 w-16 mx-auto rounded-full bg-red-500/20 flex items-center justify-center">
                      <span className="text-red-500 text-3xl">✕</span>
                    </div>
                    <h1 className="font-display text-2xl font-bold uppercase tracking-widest text-red-500">
                      Request Rejected
                    </h1>
                    <p className="text-sm text-muted-foreground">
                      Your login request was rejected by an administrator.
                    </p>
                    <Button
                      variant="outline"
                      className="w-full mt-4 focus-visible:ring-offset-2"
                      onClick={async () => {
                        await supabase.auth.signOut();
                        setApprovalRequestId(null);
                        setApprovalStatus("pending");
                      }}
                    >
                      Back to Login
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="h-16 w-16 mx-auto rounded-full bg-orange-500/20 flex items-center justify-center">
                      <span className="text-orange-500 text-3xl">!</span>
                    </div>
                    <h1 className="font-display text-2xl font-bold uppercase tracking-widest text-orange-500">
                      Request Expired
                    </h1>
                    <p className="text-sm text-muted-foreground">
                      Your login request has expired. Please try logging in again.
                    </p>
                    <Button
                      variant="outline"
                      className="w-full mt-4 focus-visible:ring-offset-2"
                      onClick={async () => {
                        await supabase.auth.signOut();
                        setApprovalRequestId(null);
                        setApprovalStatus("pending");
                      }}
                    >
                      Back to Login
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-svh flex-col md:flex-row bg-[#0a0a0a]">
      {/* Left side: Animation */}
      <div className="relative hidden w-full md:flex md:w-1/2 overflow-hidden bg-black items-center justify-center">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 h-full w-full object-cover opacity-80 brightness-[1.1] contrast-[1.15] saturate-[1.1] pointer-events-none"
        >
          <source src={animationAsset} type="video/mp4" />
        </video>
        <div className="relative z-10 p-12 text-center">
          <h2 className="font-brush text-4xl font-bold uppercase tracking-wider text-white sm:text-6xl drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
            RIDE DIFFERENT
            <br />
            <span className="text-primary italic">BE DIFFERENT</span>
          </h2>
        </div>
      </div>

      {/* Right side: Login Panel */}
      <div className="flex w-full flex-col items-center justify-center px-6 py-12 md:w-1/2 md:px-12 bg-gradient-onyx">
        <div className="w-full max-w-sm space-y-8">
          <div className="flex flex-col items-center">
            <img 
              src={loginLogo} 
              alt={`${site.name} logo`} 
              className="h-auto w-full max-w-[200px] sm:max-w-[240px] lg:max-w-[340px] object-contain" 
              role="img"
            />
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
              <Label
                htmlFor="email"
                className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground"
              >
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 border-white/5 bg-white/5 font-medium transition-all focus:border-primary/50 focus:ring-primary/20 text-white placeholder:text-white/20"
                placeholder="admin@customzparadise.com"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="password"
                  className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground"
                >
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
                className="h-12 border-white/5 bg-white/5 transition-all focus:border-primary/50 focus:ring-primary/20 text-white placeholder:text-white/20"
                placeholder="••••••••"
              />
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="red"
                size="touch"
                autoFocus
                className="w-full h-12 text-sm font-black uppercase tracking-widest shadow-3d-red active:translate-y-0.5 active:shadow-none transition-all focus-visible:ring-offset-2"
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
        <video autoPlay muted loop playsInline className="h-full w-full object-cover opacity-20">
          <source src={animationAsset} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/60" />
      </div>
    </div>
  );
}
