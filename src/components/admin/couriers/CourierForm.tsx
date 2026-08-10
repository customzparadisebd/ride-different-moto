// ============================================================
// COURIER FORM
// Purpose: Add or edit a courier — name, code, logo, base URL,
//          inside/outside charges, COD %, extra config fields and
//          the API credentials.
// Status: COMPLETED
// Security: Credential inputs are write-only. Stored values are
//          never loaded back into the form; the field shows
//          "saved" and a blank submit keeps the stored value.
// ============================================================
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/PasswordInput";
import {
  CLEAR_SECRET,
  COURIER_PROVIDERS,
  courierInput,
  type CourierInput,
  type CourierSummary,
} from "@/lib/couriers.shared";

const inputClass =
  "mt-1 h-11 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground";

const CREDENTIAL_FIELDS = [
  { key: "apiKey", label: "API key / client id" },
  { key: "apiSecret", label: "API secret / client secret" },
  { key: "username", label: "Username" },
  { key: "password", label: "Password" },
  { key: "token", label: "Access token" },
] as const;

export function CourierForm({
  initial,
  existing,
  isPending,
  onSubmit,
  onCancel,
}: {
  initial: CourierInput;
  existing?: CourierSummary | undefined;
  isPending: boolean;
  onSubmit: (value: CourierInput) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<CourierInput>(initial);
  const [errors, setErrors] = useState<string[]>([]);

  const set = <K extends keyof CourierInput>(key: K, value: CourierInput[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  const submit = () => {
    const parsed = courierInput.safeParse(draft);
    if (!parsed.success) {
      setErrors(parsed.error.issues.map((issue) => issue.message));
      return;
    }
    setErrors([]);
    onSubmit(parsed.data);
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-card">
      <h2 className="font-display text-lg font-bold uppercase tracking-wide">
        {existing ? `Edit ${existing.name}` : "Add courier"}
      </h2>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block text-xs uppercase tracking-wider text-muted-foreground">
          Courier name
          <input
            className={inputClass}
            value={draft.name}
            maxLength={80}
            onChange={(event) => set("name", event.target.value)}
          />
        </label>
        <label className="block text-xs uppercase tracking-wider text-muted-foreground">
          Provider code
          <select
            className={inputClass}
            value={COURIER_PROVIDERS.some((p) => p.slug === draft.slug) ? draft.slug : "custom"}
            onChange={(event) => set("slug", event.target.value)}
          >
            {COURIER_PROVIDERS.map((provider) => (
              <option key={provider.slug} value={provider.slug}>
                {provider.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs uppercase tracking-wider text-muted-foreground">
          Logo URL (optional)
          <input
            className={inputClass}
            value={draft.logoUrl ?? ""}
            onChange={(event) => set("logoUrl", event.target.value)}
          />
        </label>
        <label className="block text-xs uppercase tracking-wider text-muted-foreground">
          Support phone (optional)
          <input
            className={inputClass}
            value={draft.phone ?? ""}
            onChange={(event) => set("phone", event.target.value)}
          />
        </label>
        <label className="block text-xs uppercase tracking-wider text-muted-foreground sm:col-span-2">
          API base URL
          <input
            className={inputClass}
            placeholder="https://portal.packzy.com/api/v1"
            value={draft.baseUrl ?? ""}
            onChange={(event) => set("baseUrl", event.target.value)}
          />
        </label>
        <label className="block text-xs uppercase tracking-wider text-muted-foreground">
          Inside Dhaka charge (৳)
          <input
            type="number"
            min={0}
            className={inputClass}
            value={draft.insideCharge}
            onChange={(event) => set("insideCharge", Number(event.target.value))}
          />
        </label>
        <label className="block text-xs uppercase tracking-wider text-muted-foreground">
          Outside Dhaka charge (৳)
          <input
            type="number"
            min={0}
            className={inputClass}
            value={draft.outsideCharge}
            onChange={(event) => set("outsideCharge", Number(event.target.value))}
          />
        </label>
        <label className="block text-xs uppercase tracking-wider text-muted-foreground">
          COD charge (%)
          <input
            type="number"
            min={0}
            max={100}
            step="0.1"
            className={inputClass}
            value={draft.codPercent}
            onChange={(event) => set("codPercent", Number(event.target.value))}
          />
        </label>
        <label className="block text-xs uppercase tracking-wider text-muted-foreground">
          Display order
          <input
            type="number"
            min={0}
            className={inputClass}
            value={draft.sortOrder}
            onChange={(event) => set("sortOrder", Number(event.target.value))}
          />
        </label>
      </div>

      <label className="mt-3 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          className="h-5 w-5 accent-primary"
          checked={draft.isActive}
          onChange={(event) => set("isActive", event.target.checked)}
        />
        Courier is switched on and can be used for bookings
      </label>

      {/* ---- Extra provider settings (store_id, weight, etc.) ---- */}
      <div className="mt-5 border-t border-border pt-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-sm font-bold uppercase">Extra settings</h3>
          <Button
            variant="steel"
            size="sm"
            type="button"
            onClick={() => set("extraFields", [...draft.extraFields, { key: "", value: "" }])}
          >
            Add field
          </Button>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Non-secret values the provider needs, e.g. <code>store_id</code>,{" "}
          <code>pickup_store_id</code>, <code>item_weight</code>.
        </p>
        <div className="mt-2 space-y-2">
          {draft.extraFields.map((field, index) => (
            <div key={index} className="flex gap-2">
              <input
                className="h-11 w-1/3 rounded-lg border border-border bg-background px-3 text-sm"
                placeholder="key"
                value={field.key}
                onChange={(event) =>
                  set(
                    "extraFields",
                    draft.extraFields.map((f, i) =>
                      i === index ? { ...f, key: event.target.value } : f,
                    ),
                  )
                }
              />
              <input
                className="h-11 flex-1 rounded-lg border border-border bg-background px-3 text-sm"
                placeholder="value"
                value={field.value}
                onChange={(event) =>
                  set(
                    "extraFields",
                    draft.extraFields.map((f, i) =>
                      i === index ? { ...f, value: event.target.value } : f,
                    ),
                  )
                }
              />
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={() =>
                  set(
                    "extraFields",
                    draft.extraFields.filter((_, i) => i !== index),
                  )
                }
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* ---- Credentials (write-only) ---- */}
      <div className="mt-5 border-t border-border pt-4">
        <h3 className="font-display text-sm font-bold uppercase">API credentials</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Stored on the server only — never shown again, not even to you. Leave a field blank to
          keep the saved value.
        </p>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          {CREDENTIAL_FIELDS.map((field) => {
            const saved = existing?.credentialsSet[field.key] ?? false;
            const value = draft.credentials[field.key] ?? "";
            return (
              <div key={field.key}>
                <label className="block text-xs uppercase tracking-wider text-muted-foreground">
                  {field.label} {saved ? <span className="text-green-500">· saved</span> : null}
                </label>
                <PasswordInput
                  value={value === CLEAR_SECRET ? "" : value}
                  autoComplete="new-password"
                  placeholder={saved ? "•••••••• (kept)" : "Not set"}
                  onChange={(event) =>
                    set("credentials", {
                      ...draft.credentials,
                      [field.key]: event.target.value,
                    })
                  }
                />
                {saved && (
                  <button
                    type="button"
                    className="mt-1 text-xs text-destructive underline"
                    onClick={() =>
                      set("credentials", { ...draft.credentials, [field.key]: CLEAR_SECRET })
                    }
                  >
                    {value === CLEAR_SECRET ? "Will be removed on save" : "Remove stored value"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {errors.length > 0 && (
        <ul className="mt-4 list-disc space-y-1 pl-5 text-xs text-destructive">
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        <Button variant="red" size="touch" disabled={isPending} onClick={submit}>
          {isPending ? "Saving…" : existing ? "Save changes" : "Add courier"}
        </Button>
        <Button variant="steel" size="touch" type="button" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
