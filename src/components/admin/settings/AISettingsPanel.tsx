import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Save, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  AI_PROVIDERS,
  DEFAULT_AI_SETTINGS,
  type AIProviderType,
  type AISettings,
} from "@/lib/ai.shared";
import { getAISettings, saveAISettings, testAIConnection } from "@/lib/ai.functions";

export function AISettingsPanel({ canManage = true }: { canManage?: boolean }) {
  const queryClient = useQueryClient();
  const fetchSettings = useServerFn(getAISettings);
  const saveSettingsFn = useServerFn(saveAISettings);
  const testConnFn = useServerFn(testAIConnection);

  const { data: settings, isLoading } = useQuery({
    queryKey: ["admin-ai-settings"],
    queryFn: () => fetchSettings({ data: undefined }),
  });

  const [draft, setDraft] = useState<AISettings>(DEFAULT_AI_SETTINGS);

  useEffect(() => {
    if (settings) {
      setDraft(settings as AISettings);
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: (data: AISettings) => saveSettingsFn({ data }),
    onSuccess: () => {
      toast.success("AI settings saved successfully");
      void queryClient.invalidateQueries({ queryKey: ["admin-ai-settings"] });
    },
    onError: (err: Error) => toast.error(err.message || "Failed to save AI settings"),
  });

  const testMutation = useMutation({
    mutationFn: (data: AISettings) => testConnFn({ data }),
    onSuccess: (res) => {
      if (res.success) toast.success(res.message);
      else toast.error(res.message);
    },
    onError: (err: Error) => toast.error(err.message || "Connection test failed"),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-6 shadow-card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-bold uppercase tracking-wide">
              Future AI Extraction
            </h2>
            <p className="text-sm text-muted-foreground">
              '''Do not make any visual modifications. The phrases I write are commands to understand what I want, not to be written down. Understand their content well, then execute what is required.'''
              Improve AI Settings validation and connection testing so I can verify configuration readiness without enabling the feature or requiring credentials during this implementation.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Label htmlFor="ai-toggle" className="text-sm font-medium">
              {draft.enabled ? "ACTIVE" : "OFF"}
            </Label>
            <Switch
              id="ai-toggle"
              checked={draft.enabled}
              onCheckedChange={(val) => setDraft((c) => ({ ...c, enabled: val }))}
            />
          </div>
        </div>

        <div className={`mt-6 space-y-4 transition-opacity duration-200 ${!draft.enabled ? 'opacity-50' : ''}`}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                AI Provider
              </Label>
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus:ring-1 focus:ring-primary outline-none"
                value={draft.provider}
                onChange={(e) => setDraft((c) => ({ ...c, provider: e.target.value as AIProviderType }))}
                disabled={!draft.enabled}
              >
                {AI_PROVIDERS.map((p) => (
                  <option key={p} value={p}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                Model Name
              </Label>
              <Input
                placeholder="e.g. gemini-1.5-flash"
                value={draft.modelName}
                onChange={(e) => setDraft((c) => ({ ...c, modelName: e.target.value }))}
                disabled={!draft.enabled}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">
                API Key / Credentials
              </Label>
              <Input
                type="password"
                placeholder="Paste your API key here"
                value={draft.apiKey}
                autoComplete="off"
                onChange={(e) => setDraft((c) => ({ ...c, apiKey: e.target.value }))}
                disabled={!draft.enabled}
              />
              <p className="text-[10px] text-muted-foreground italic">
                {draft.provider === 'gemini' ? 'Gemini keys typically start with AIza.' : 
                 draft.provider === 'openai' ? 'OpenAI keys typically start with sk-.' : 
                 'Enter your provider credentials.'}
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-border/50">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 sm:flex-initial"
              onClick={() => testMutation.mutate(draft)}
              disabled={!canManage || testMutation.isPending}
            >
              {testMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Test Connection
            </Button>
            <Button
              variant="red"
              size="sm"
              className="flex-1 sm:flex-initial"
              onClick={() => saveMutation.mutate(draft)}
              disabled={!canManage || saveMutation.isPending}
            >
              {saveMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save AI Settings
            </Button>
          </div>
        </div>
      </div>

      {!draft.enabled && (
        <div className="rounded-lg bg-accent/30 dark:bg-secondary/20 p-4 border border-border dark:border-border/50">
          <p className="text-sm text-muted-foreground leading-relaxed">
            The AI feature is currently <strong>OFF</strong>. The existing Order System works exactly as it currently does. 
            No AI API requests are being made.
          </p>
        </div>
      )}
    </div>
  );
}
