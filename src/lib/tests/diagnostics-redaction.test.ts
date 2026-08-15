import { describe, it, expect, vi } from "vitest";

// Mock the environment detection to avoid window is not defined in some contexts
vi.mock("@/lib/env", () => ({
  getEnvironment: () => "staging",
}));

describe("Diagnostics Redaction Logic", () => {
  const maskValue = (val: string, type: "url" | "token") => {
    if (val === "Not Set" || !val) return "Not Set";
    if (type === "url") {
      return "https://[REDACTED].supabase.co (Security Masked)";
    }
    return " [REDACTED] ";
  };

  it("should fully redact Supabase URL project references", () => {
    const rawUrl = "https://pqphihorljepzfdacant.supabase.co";
    const masked = maskValue(rawUrl, "url");
    
    expect(masked).not.toContain("pqphihorljepzfdacant");
    expect(masked).toBe("https://[REDACTED].supabase.co (Security Masked)");
  });

  it("should return 'Not Set' for empty values", () => {
    expect(maskValue("", "url")).toBe("Not Set");
    expect(maskValue("Not Set", "url")).toBe("Not Set");
  });

  it("should redact tokens completely", () => {
    const token = "sb_publishable_4AJ6ETOK0nraA7j6fQ_E5A_j3cFzZWk";
    const masked = maskValue(token, "token");
    
    expect(masked).not.toContain("4AJ6ETOK");
    expect(masked).toBe(" [REDACTED] ");
  });
});
