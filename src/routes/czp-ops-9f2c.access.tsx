import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { site } from "@/data/site";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/auth")({
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
      { name: "robots", content: "noindex" },
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

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) void navigate({ to: "/admin", replace: true });
    });
    void supabase.auth.getSession().then(({ data: s }) => {
      if (s.session) void navigate({ to: "/admin", replace: true });
    });
    return () => data.subscription.unsubscribe();
  }, [navigate]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/auth" },
        });
        if (error) throw error;
        if (!data.session) {
          setSentEmail(true);
          toast.success("Check your email to confirm the account.");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Authentication failed.");
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/auth",
    });
    if (result.error) {
      toast.error("Google sign-in failed. Please try again.");
      setBusy(false);
      return;
    }
    if (result.redirected) return;
    void navigate({ to: "/admin", replace: true });
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
            <Input
              id="password"
              type="password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 h-11"
            />
          </div>
          <Button type="submit" variant="red" size="touch" className="w-full" disabled={busy}>
            {mode === "signup" ? "Create account" : "Sign in"}
          </Button>
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
    </section>
  );
}