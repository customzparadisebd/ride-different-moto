// ============================================================
// ADMIN PASSWORD RESET
// Purpose: Completes the "forgot password" flow — the recovery
//          link from the email lands here and the account owner
//          sets a new password.
// Status: COMPLETED
// Security: Public route by necessity (the user is not signed in
//          yet); the recovery token in the URL is what authorises
//          the change, and the auth provider verifies it. The
//          password is never logged, echoed or stored by the app,
//          and the change is written to the audit log. noindex.
// Future: None.
// ============================================================
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/PasswordInput";
import { site } from "@/data/site";
import { supabase } from "@/integrations/supabase/client";
import { recordPasswordReset } from "@/lib/admin.functions";

export const Route = createFileRoute("/ad/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: `Reset Password — ${site.name}` },
      { name: "description", content: "Set a new password for your staff account." },
      { property: "og:title", content: `Reset Password — ${site.name}` },
      { property: "og:description", content: "Set a new password for your staff account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow, noarchive" },
    ],
  }),
  component: ResetPasswordPage,
});

const MIN_LENGTH = 10;

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [hasRecovery, setHasRecovery] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  // The recovery link arrives as a URL fragment; the auth client turns it
  // into a short-lived recovery session before we can update the password.
  useEffect(() => {
    let active = true;
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      if (session) setHasRecovery(true);
    });
    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (data.session) setHasRecovery(true);
      setReady(true);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password.length < MIN_LENGTH) {
      toast.error(`Use at least ${MIN_LENGTH} characters.`);
      return;
    }
    if (password !== confirm) {
      toast.error("Both passwords must match.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast.error("Could not update the password. Request a new reset link and try again.");
        return;
      }
      // AUDIT: traceable password change (no password material recorded).
      try {
        await recordPasswordReset({});
      } catch {
        /* audit failure must not block the user's recovery */
      }
      await supabase.auth.signOut();
      setDone(true);
      toast.success("Password updated. Sign in with your new password.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mx-auto flex max-w-md flex-col px-4 py-16">
      <h1 className="font-display text-3xl font-bold uppercase tracking-wide">Reset Password</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Set a new password for your {site.name} staff account.
      </p>

      {!ready ? (
        <p className="mt-6 text-sm text-muted-foreground">Checking your reset link…</p>
      ) : done ? (
        <div className="mt-6 rounded-lg border border-border bg-secondary p-4 text-sm">
          <p>Your password has been updated.</p>
          <Button
            variant="red"
            size="touch"
            className="mt-4 w-full"
            onClick={() => void navigate({ to: "/ad/log", replace: true })}
          >
            Go to sign in
          </Button>
        </div>
      ) : !hasRecovery ? (
        <div className="mt-6 rounded-lg border border-border bg-secondary p-4 text-sm">
          <p>
            This reset link is missing or has expired. Open the staff sign-in page and use
            &ldquo;Forgot password?&rdquo; to request a new one.
          </p>
          <Button
            variant="steel"
            size="touch"
            className="mt-4 w-full"
            onClick={() => void navigate({ to: "/ad/log", replace: true })}
          >
            Back to sign in
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="new-password">New password</Label>
            <PasswordInput
              id="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              required
            />
            <p className="mt-1 text-xs text-muted-foreground">
              At least {MIN_LENGTH} characters. Use something unique to this account.
            </p>
          </div>
          <div>
            <Label htmlFor="confirm-password">Confirm new password</Label>
            <PasswordInput
              id="confirm-password"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              autoComplete="new-password"
              required
            />
          </div>
          <Button type="submit" variant="red" size="touch" className="w-full" disabled={busy}>
            {busy ? "Saving…" : "Update password"}
          </Button>
        </form>
      )}

      <p className="mt-6 text-xs text-muted-foreground">
        After signing in, privileged accounts still complete authenticator verification. If you also
        lost your authenticator, use a recovery code saved during setup.
      </p>
    </section>
  );
}
