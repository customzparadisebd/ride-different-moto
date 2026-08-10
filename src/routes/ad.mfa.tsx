// ============================================================
// ADMIN MFA STEP-UP / ENROLMENT
// Purpose: Second factor between password sign-in and the panel:
//          Email + Password → TOTP verification → Admin Panel.
//          Also enrols a first authenticator for accounts where
//          MFA is required but not yet configured.
// Status: COMPLETED
// Security: The gate that sends users here is server-side (it reads
//          the assurance level from the verified token), so this
//          page cannot be skipped by navigating directly to the
//          panel. TOTP secrets are held by the auth provider, never
//          in our database. Recovery uses hashed one-time codes.
// Future: None.
// ============================================================
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { completeMfaEnrolment, recoverWithBackupCode } from "@/lib/admin.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/czp-ops-9f2c/mfa")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Two-factor verification" },
      { name: "description", content: "Restricted staff area." },
      { property: "og:title", content: "Two-factor verification" },
      { property: "og:description", content: "Restricted staff area." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow, noarchive" },
    ],
  }),
  component: MfaPage,
});

function MfaPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"loading" | "challenge" | "enrol" | "recovery">("loading");
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [codes, setCodes] = useState<string[] | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void (async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        void navigate({ to: "/czp-ops-9f2c/access", replace: true });
        return;
      }
      const { data } = await supabase.auth.mfa.listFactors();
      const verified = (data?.totp ?? []).find((f) => f.status === "verified");
      if (verified) {
        setFactorId(verified.id);
        setMode("challenge");
      } else {
        const enrol = await supabase.auth.mfa.enroll({
          factorType: "totp",
          friendlyName: `Authenticator ${Date.now()}`,
        });
        if (enrol.error) {
          toast.error(enrol.error.message);
          return;
        }
        setFactorId(enrol.data.id);
        setQr(enrol.data.totp.qr_code);
        setMode("enrol");
      }
    })();
  }, [navigate]);

  const verify = async () => {
    if (!factorId) return;
    setBusy(true);
    try {
      const challenge = await supabase.auth.mfa.challenge({ factorId });
      if (challenge.error) throw challenge.error;
      const result = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.data.id,
        code: code.trim(),
      });
      if (result.error) throw result.error;
      if (mode === "enrol") {
        const issued = await completeMfaEnrolment({});
        setCodes(issued.codes);
        setBusy(false);
        return;
      }
      void navigate({ to: "/czp-ops-9f2c", replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "That code was not accepted.");
      setBusy(false);
    }
  };

  const useRecoveryCode = async () => {
    setBusy(true);
    try {
      await recoverWithBackupCode({ data: { code } });
      toast.success("Authenticator removed. Set up a new one now.");
      setCode("");
      window.location.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "That recovery code is not valid.");
      setBusy(false);
    }
  };

  if (codes) {
    return (
      <section className="mx-auto max-w-md px-4 py-16">
        <h1 className="font-display text-2xl font-bold uppercase tracking-wide">
          Save your recovery codes
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Shown only once. Store them offline — each code works a single time.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2 rounded-md border border-border bg-card p-3 font-mono text-sm">
          {codes.map((c) => (
            <span key={c}>{c}</span>
          ))}
        </div>
        <Button
          variant="red"
          size="touch"
          className="mt-4 w-full"
          onClick={() => void navigate({ to: "/czp-ops-9f2c", replace: true })}
        >
          I have saved them — continue
        </Button>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-display text-2xl font-bold uppercase tracking-wide">
        {mode === "enrol" ? "Set up two-factor" : "Two-factor verification"}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {mode === "recovery"
          ? "Enter one of your saved recovery codes."
          : mode === "enrol"
            ? "Your role requires an authenticator app. Scan the code, then enter the 6-digit code."
            : "Enter the 6-digit code from your authenticator app."}
      </p>

      {mode === "enrol" && qr ? (
        <img src={qr} alt="MFA setup QR code" className="mt-4 h-44 w-44 rounded-md bg-white p-2" />
      ) : null}

      <div className="mt-4">
        <Label htmlFor="code">{mode === "recovery" ? "Recovery code" : "6-digit code"}</Label>
        <Input
          id="code"
          autoComplete="one-time-code"
          inputMode={mode === "recovery" ? "text" : "numeric"}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="mt-1.5 h-11"
        />
      </div>

      <Button
        variant="red"
        size="touch"
        className="mt-4 w-full"
        disabled={busy || !code.trim()}
        onClick={() => void (mode === "recovery" ? useRecoveryCode() : verify())}
      >
        {mode === "recovery" ? "Use recovery code" : "Verify"}
      </Button>

      {mode === "challenge" ? (
        <button
          type="button"
          className="mt-4 text-xs text-muted-foreground underline"
          onClick={() => setMode("recovery")}
        >
          Lost your device? Use a recovery code
        </button>
      ) : null}
      {mode === "recovery" ? (
        <button
          type="button"
          className="mt-4 text-xs text-muted-foreground underline"
          onClick={() => setMode("challenge")}
        >
          Back to authenticator code
        </button>
      ) : null}
    </section>
  );
}