// ============================================================
// ADMIN SECURITY CENTRE
// Purpose: MFA enrolment/removal, one-time backup codes, active
//          session review/revocation and the Super-Admin-only
//          Admin Access Information card.
// Status: COMPLETED
// Security: TOTP enrolment/verification is performed by the auth
//          provider (secret never touches our database); backup
//          codes are stored hashed and shown once. The access-info
//          card is gated by a server-side Super Admin check and
//          contains no keys, secrets or tokens.
// Future: None.
// ============================================================
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { adminHead } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import {
  completeMfaEnrolment,
  getAdminAccessInfo,
  getMfaOverview,
  listAdminSessions,
  regenerateBackupCodes,
  revokeAdminSession,
} from "@/lib/admin.functions";
import { PERMISSIONS } from "@/lib/admin.shared";

export const Route = createFileRoute("/_authenticated/czp-ops-9f2c/security")({
  head: () => adminHead("Security — CZP Ops"),
  component: SecurityPage,
});

type Factor = { id: string; status: string; friendly_name?: string };

function SecurityPage() {
  const { access } = Route.useRouteContext();
  const queryClient = useQueryClient();
  const [codes, setCodes] = useState<string[] | null>(null);
  const [enrolling, setEnrolling] = useState<{ factorId: string; qr: string } | null>(null);
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);

  const factors = useQuery({
    queryKey: ["mfa-factors"],
    queryFn: async () => {
      const { data } = await supabase.auth.mfa.listFactors();
      return (data?.totp ?? []) as Factor[];
    },
  });
  const overview = useQuery({ queryKey: ["mfa-overview"], queryFn: () => getMfaOverview({}) });
  const sessions = useQuery({ queryKey: ["admin-sessions"], queryFn: () => listAdminSessions({}) });
  const accessInfo = useQuery({
    queryKey: ["admin-access-info"],
    enabled: access.isSuperAdmin,
    queryFn: () => getAdminAccessInfo({}),
  });

  const verified = (factors.data ?? []).filter((f) => f.status === "verified");

  const startEnrol = async () => {
    setBusy(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: `Authenticator ${new Date().toISOString().slice(0, 10)}`,
      });
      if (error) throw error;
      setEnrolling({ factorId: data.id, qr: data.totp.qr_code });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not start MFA setup.");
    } finally {
      setBusy(false);
    }
  };

  const confirmEnrol = async () => {
    if (!enrolling) return;
    setBusy(true);
    try {
      const challenge = await supabase.auth.mfa.challenge({ factorId: enrolling.factorId });
      if (challenge.error) throw challenge.error;
      const verify = await supabase.auth.mfa.verify({
        factorId: enrolling.factorId,
        challengeId: challenge.data.id,
        code: otp.trim(),
      });
      if (verify.error) throw verify.error;
      const result = await completeMfaEnrolment({});
      setCodes(result.codes);
      setEnrolling(null);
      setOtp("");
      toast.success("Two-factor authentication is now active.");
      await queryClient.invalidateQueries();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "That code was not accepted.");
    } finally {
      setBusy(false);
    }
  };

  const removeFactor = async (factorId: string) => {
    setBusy(true);
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId });
      if (error) throw error;
      toast.success("Authenticator removed.");
      await queryClient.invalidateQueries();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not remove the authenticator.");
    } finally {
      setBusy(false);
    }
  };

  const newCodes = async () => {
    setBusy(true);
    try {
      const result = await regenerateBackupCodes({});
      setCodes(result.codes);
      toast.success("New recovery codes generated. Save them now.");
      await queryClient.invalidateQueries({ queryKey: ["mfa-overview"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not generate codes.");
    } finally {
      setBusy(false);
    }
  };

  const revoke = async (id: string) => {
    try {
      await revokeAdminSession({ data: { sessionRowId: id } });
      toast.success("Session revoked.");
      await queryClient.invalidateQueries({ queryKey: ["admin-sessions"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not revoke that session.");
    }
  };

  const panelUrl =
    typeof window === "undefined" ? "/czp-ops-9f2c" : `${window.location.origin}/czp-ops-9f2c`;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold uppercase tracking-wide">Security</h1>
        <p className="text-sm text-muted-foreground">
          Two-factor authentication, recovery codes and active sessions.
        </p>
      </div>

      {/* ---- Super Admin only: documented access instructions ---- */}
      {access.isSuperAdmin && accessInfo.data ? (
        <section className="rounded-lg border border-primary/40 bg-card p-4">
          <h2 className="font-display text-lg font-bold uppercase tracking-wide">
            Admin access information
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Visible to Super Admin only. Never share or publish this section.
          </p>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted-foreground">Panel URL</dt>
              <dd className="break-all font-mono text-xs">{panelUrl}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted-foreground">Login page</dt>
              <dd className="break-all font-mono text-xs">{panelUrl}/access</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                Login method
              </dt>
              <dd>Email + password, then authenticator code (TOTP)</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted-foreground">Owner account</dt>
              <dd className="break-all">{accessInfo.data.ownerEmail}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted-foreground">MFA status</dt>
              <dd>
                {accessInfo.data.mfaEnrolled ? "Enrolled & enforced" : "Not enrolled — set up below"}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wider text-muted-foreground">
                Recovery codes left
              </dt>
              <dd>{accessInfo.data.backupCodesRemaining}</dd>
            </div>
          </dl>
          <div className="mt-4 rounded-md bg-secondary p-3 text-xs leading-relaxed">
            <p className="font-semibold uppercase tracking-wider">Recovery instructions</p>
            <ol className="mt-1 list-decimal space-y-1 pl-4 text-muted-foreground">
              <li>Open the login page above and sign in with the owner email and password.</li>
              <li>
                Lost your authenticator? Choose “Use a recovery code” on the verification step and
                enter one saved backup code — it removes the old authenticator so you can enrol a new
                device here.
              </li>
              <li>
                Forgot the password? Use “Forgot password” on the login page; the reset link goes to
                the owner email only.
              </li>
              <li>
                Locked out after failed attempts? Wait for the displayed cool-down; lockouts get
                longer with repeated failures.
              </li>
              <li>Keep at least two unused recovery codes stored offline at all times.</li>
            </ol>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            A dedicated admin subdomain (e.g. admin.customzparadisebd.com) can be pointed at this
            same path once the custom domain is connected. TODO: connect the domain, then this URL
            updates automatically.
          </p>
        </section>
      ) : null}

      {/* ---- MFA ---- */}
      <section className="rounded-lg border border-border bg-card p-4">
        <h2 className="font-display text-lg font-bold uppercase tracking-wide">
          Two-factor authentication
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {overview.data?.mfaRequired
            ? "Required for your role — you cannot open the panel without it."
            : "Optional for your role, strongly recommended."}
        </p>

        {verified.length ? (
          <div className="mt-4 space-y-2">
            {verified.map((factor) => (
              <div
                key={factor.id}
                className="flex items-center justify-between rounded-md bg-secondary px-3 py-2 text-sm"
              >
                <span>{factor.friendly_name || "Authenticator app"} · verified</span>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={busy}
                  onClick={() => void removeFactor(factor.id)}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        ) : enrolling ? (
          <div className="mt-4 space-y-3">
            <p className="text-sm">
              Scan this QR code with Google Authenticator, Authy or 1Password, then enter the 6-digit
              code.
            </p>
            <img
              src={enrolling.qr}
              alt="MFA setup QR code"
              className="h-44 w-44 rounded-md bg-white p-2"
            />
            <div className="max-w-xs">
              <Label htmlFor="otp">6-digit code</Label>
              <Input
                id="otp"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="mt-1.5 h-11"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="red" disabled={busy} onClick={() => void confirmEnrol()}>
                Verify & activate
              </Button>
              <Button variant="ghost" onClick={() => setEnrolling(null)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="red" className="mt-4" disabled={busy} onClick={() => void startEnrol()}>
            Set up authenticator app
          </Button>
        )}

        {verified.length ? (
          <div className="mt-5 border-t border-border pt-4">
            <p className="text-sm">
              Recovery codes remaining: <strong>{overview.data?.backupCodes.remaining ?? 0}</strong>
            </p>
            <Button variant="steel" size="sm" className="mt-2" disabled={busy} onClick={() => void newCodes()}>
              Generate new recovery codes
            </Button>
          </div>
        ) : null}

        {codes ? (
          <div className="mt-4 rounded-md border border-primary/50 bg-secondary p-3">
            <p className="text-sm font-semibold">
              Save these recovery codes now — they are shown only once.
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2 font-mono text-sm sm:grid-cols-4">
              {codes.map((code) => (
                <span key={code}>{code}</span>
              ))}
            </div>
            <Button variant="ghost" size="sm" className="mt-2" onClick={() => setCodes(null)}>
              I have saved them
            </Button>
          </div>
        ) : null}
      </section>

      {/* ---- Sessions ---- */}
      <section className="rounded-lg border border-border bg-card p-4">
        <h2 className="font-display text-lg font-bold uppercase tracking-wide">Active sessions</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {access.isSuperAdmin
            ? "All admin sessions. Revoking one blocks it immediately."
            : "Your own sessions."}
        </p>
        <div className="mt-3 space-y-2">
          {(sessions.data ?? []).map((session) => (
            <div
              key={session.id}
              className="flex flex-col gap-1 rounded-md bg-secondary px-3 py-2 text-xs sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-sm">
                  {session.email ?? "Unknown"} {session.isCurrent ? "(this device)" : ""}
                </p>
                <p className="text-muted-foreground">
                  {session.ipAddress ?? "IP unavailable"} ·{" "}
                  {new Date(session.lastSeenAt).toLocaleString()} ·{" "}
                  {session.revokedAt ? "revoked" : "active"}
                </p>
                <p className="truncate text-muted-foreground">{session.userAgent ?? ""}</p>
              </div>
              {access.permissions.includes(PERMISSIONS.securityManage) && !session.revokedAt ? (
                <Button variant="ghost" size="sm" onClick={() => void revoke(session.id)}>
                  Revoke
                </Button>
              ) : null}
            </div>
          ))}
          {!sessions.data?.length ? (
            <p className="text-sm text-muted-foreground">No sessions recorded yet.</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}