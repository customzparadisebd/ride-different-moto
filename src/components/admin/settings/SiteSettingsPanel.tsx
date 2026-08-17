import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Globe, Shield, Info, Clock, Share2, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getSiteSettings, saveSiteSettings } from "@/lib/site-settings.functions";
import { DEFAULT_SITE_SETTINGS, type SiteSettings } from "@/lib/settings.shared";

export function SiteSettingsPanel({ canManage }: { canManage: boolean }) {
  const queryClient = useQueryClient();
  const load = useServerFn(getSiteSettings);
  const save = useServerFn(saveSiteSettings);

  const { data: current, isLoading } = useQuery({
    queryKey: ["site-settings"],
    queryFn: () => load(),
  });

  const [draft, setDraft] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);

  useEffect(() => {
    if (current) setDraft(current);
  }, [current]);

  const mutation = useMutation({
    mutationFn: save,
    onSuccess: () => {
      toast.success("Site settings saved");
      void queryClient.invalidateQueries({ queryKey: ["site-settings"] });
    },
    onError: (error: Error) => toast.error(error.message || "Could not save settings."),
  });

  const updateField = (field: keyof SiteSettings, value: any) => {
    setDraft((c) => ({ ...c, [field]: value }));
  };

  if (isLoading) return null;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-4 shadow-card">
        <div className="flex items-center gap-2">
          <Globe className="size-4 text-primary" />
          <h2 className="font-display text-sm font-bold uppercase tracking-wide">Business Identity</h2>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">Manage your brand name, domain and branch information.</p>
        
        <div className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="businessName" className="text-xs font-bold uppercase tracking-wide">Business Name</Label>
              <Input
                id="businessName"
                value={draft.businessName}
                onChange={(e) => updateField("businessName", e.target.value)}
                disabled={!canManage || mutation.isPending}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="productionDomain" className="text-xs font-bold uppercase tracking-wide">Production Domain</Label>
              <Input
                id="productionDomain"
                value={draft.productionDomain}
                onChange={(e) => updateField("productionDomain", e.target.value)}
                disabled={!canManage || mutation.isPending}
                placeholder="customparadisebd.com"
              />
              <p className="text-[10px] text-muted-foreground italic">Used for canonical URLs and sitemaps.</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tagline" className="text-xs font-bold uppercase tracking-wide">Tagline</Label>
            <Input
              id="tagline"
              value={draft.tagline}
              onChange={(e) => updateField("tagline", e.target.value)}
              disabled={!canManage || mutation.isPending}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="businessDescription" className="text-xs font-bold uppercase tracking-wide">Global Description</Label>
            <Textarea
              id="businessDescription"
              value={draft.businessDescription}
              onChange={(e) => updateField("businessDescription", e.target.value)}
              disabled={!canManage || mutation.isPending}
              className="min-h-[100px]"
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 shadow-card">
        <div className="flex items-center gap-2">
          <Info className="size-4 text-primary" />
          <h2 className="font-display text-sm font-bold uppercase tracking-wide">Branch & Relationship</h2>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">Define your relationship with the main branch in India.</p>

        <div className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="mainBranchInfo" className="text-xs font-bold uppercase tracking-wide">Main Branch (India) Info</Label>
            <Input
              id="mainBranchInfo"
              value={draft.mainBranchInfo}
              onChange={(e) => updateField("mainBranchInfo", e.target.value)}
              disabled={!canManage || mutation.isPending}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="branchRelationship" className="text-xs font-bold uppercase tracking-wide">Branch Relationship Text</Label>
            <Textarea
              id="branchRelationship"
              value={draft.branchRelationship}
              onChange={(e) => updateField("branchRelationship", e.target.value)}
              disabled={!canManage || mutation.isPending}
              placeholder="e.g. Customz Paradise BD is the official Bangladesh partner of Custom Paradise India."
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 shadow-card">
        <div className="flex items-center gap-2">
          <Search className="size-4 text-primary" />
          <h2 className="font-display text-sm font-bold uppercase tracking-wide">SEO & Meta Defaults</h2>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">Default settings for search engines when page-specific SEO is missing.</p>

        <div className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="defaultMetaTitle" className="text-xs font-bold uppercase tracking-wide">Default Meta Title</Label>
            <Input
              id="defaultMetaTitle"
              value={draft.defaultMetaTitle}
              onChange={(e) => updateField("defaultMetaTitle", e.target.value)}
              disabled={!canManage || mutation.isPending}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="defaultMetaDescription" className="text-xs font-bold uppercase tracking-wide">Default Meta Description</Label>
            <Textarea
              id="defaultMetaDescription"
              value={draft.defaultMetaDescription}
              onChange={(e) => updateField("defaultMetaDescription", e.target.value)}
              disabled={!canManage || mutation.isPending}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          variant="red"
          size="lg"
          onClick={() => mutation.mutate({ data: draft as any })}
          disabled={!canManage || mutation.isPending}
          className="min-w-[150px] font-bold uppercase tracking-wider"
        >
          {mutation.isPending ? "Saving..." : "Save SEO Settings"}
        </Button>
      </div>
    </div>
  );
}