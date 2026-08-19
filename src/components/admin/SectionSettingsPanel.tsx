import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Save, LayoutGrid, List } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  getSectionSettings, 
  updateSectionSetting 
} from "@/lib/settings.functions";

export function SectionSettingsPanel() {
  const queryClient = useQueryClient();
  const fetchSettings = useServerFn(getSectionSettings);
  const updateSettingFn = useServerFn(updateSectionSetting);

  const { data: settings = [], isLoading } = useQuery({
    queryKey: ["section-settings"],
    queryFn: () => fetchSettings(),
  });

  const mutation = useMutation({
    mutationFn: (vars: { sectionKey: string; data: any }) => 
      updateSettingFn({ data: vars }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["section-settings"] });
      toast.success("Settings updated");
    },
    onError: (err: any) => toast.error(err.message || "Failed to save"),
  });

  const handleUpdate = (sectionKey: string, field: string, value: any) => {
    const existing = settings.find(s => s.sectionKey === sectionKey);
    const newData = { ...(existing?.data || {}), [field]: value };
    mutation.mutate({ sectionKey, data: newData });
  };

  if (isLoading) return <div className="p-8 text-center text-muted-foreground italic">Loading section settings...</div>;

  const featured = settings.find(s => s.sectionKey === "featured")?.data || { limit: 8, title: "Featured Products" };
  const allProducts = settings.find(s => s.sectionKey === "all_products")?.data || { limit: 12, title: "All Products" };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="bg-zinc-900/50 border-white/10">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <LayoutGrid className="size-4 text-primary" />
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Homepage Featured</CardTitle>
          </div>
          <CardDescription>Control the top featured section limits</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Display Limit</Label>
            <Input 
              type="number" 
              defaultValue={featured.limit} 
              onBlur={(e) => handleUpdate("featured", "limit", parseInt(e.target.value) || 8)}
              className="bg-black/20"
            />
          </div>
          <div className="space-y-2">
            <Label>Section Title</Label>
            <Input 
              defaultValue={featured.title} 
              onBlur={(e) => handleUpdate("featured", "title", e.target.value)}
              className="bg-black/20"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-zinc-900/50 border-white/10">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <List className="size-4 text-primary" />
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">All Products Grid</CardTitle>
          </div>
          <CardDescription>Control the main browse section limits</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Display Limit</Label>
            <Input 
              type="number" 
              defaultValue={allProducts.limit} 
              onBlur={(e) => handleUpdate("all_products", "limit", parseInt(e.target.value) || 12)}
              className="bg-black/20"
            />
          </div>
          <div className="space-y-2">
            <Label>Section Title</Label>
            <Input 
              defaultValue={allProducts.title} 
              onBlur={(e) => handleUpdate("all_products", "title", e.target.value)}
              className="bg-black/20"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
