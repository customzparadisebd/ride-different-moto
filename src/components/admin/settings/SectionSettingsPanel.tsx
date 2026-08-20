import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Save, Settings2, Eye, EyeOff, LayoutGrid, Sliders, Hash, Type, Link as LinkIcon, ListOrdered, Tag, AlertCircle, RotateCcw, Monitor } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getSectionSettings, saveSectionSetting } from "@/lib/sections.functions";
import { SECTION_DEFAULTS, type SectionSetting } from "@/lib/sections.shared";
import { PRODUCT_CATEGORIES, categoryLabel } from "@/lib/products.shared";
import { SectionPreviewDialog } from "./SectionPreviewDialog";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


export function SectionSettingsPanel() {
  const queryClient = useQueryClient();
  const fetchSettings = useServerFn(getSectionSettings);
  const updateSettingFn = useServerFn(saveSectionSetting);

  const { data: sections = [], isLoading } = useQuery({
    queryKey: ["section-settings"],
    queryFn: () => fetchSettings(),
  });

  const mutation = useMutation({
    mutationFn: (data: SectionSetting) => updateSettingFn({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["section-settings"] });
      toast.success("Section settings updated successfully");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update section settings");
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2].map((i) => (
          <Card key={i} className="animate-pulse bg-card/50">
            <div className="h-48" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <Settings2 className="h-6 w-6 text-primary" />
          Homepage Section Controls
        </h2>
        <p className="text-muted-foreground mt-1">
          Manage how products are displayed in different sections on your homepage.
        </p>
      </div>

      <Alert className="bg-primary/10 border-primary/20 text-white">
        <AlertCircle className="h-4 w-4 text-primary" />
        <AlertTitle className="text-primary font-bold uppercase tracking-widest text-xs">Helpful Hint</AlertTitle>
        <AlertDescription className="text-sm text-white/80">
          Control limits, "See All" buttons, and categories for each homepage section here.
        </AlertDescription>
      </Alert>

      <div className="grid gap-8">
        {sections.map((section) => (
          <SectionCard
            key={section.id}
            section={section}
            onSave={(data) => mutation.mutate(data)}
            isSaving={mutation.isPending && mutation.variables?.id === section.id}
          />
        ))}
      </div>
    </div>
  );
}

function SectionCard({
  section,
  onSave,
  isSaving,
}: {
  section: SectionSetting;
  onSave: (data: SectionSetting) => void;
  isSaving: boolean;
}) {
  const [formData, setFormData] = React.useState<SectionSetting>(section);
  const [isPreviewing, setIsPreviewing] = React.useState(false);

  const handleChange = (field: keyof SectionSetting, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };


  const handleReset = () => {
    const defaults = SECTION_DEFAULTS[section.id];
    if (defaults) {
      const resetData = { ...formData, ...defaults };
      setFormData(resetData);
      toast.info(`Resetting ${section.name} to defaults. Click "Save Changes" to apply.`);
    }
  };

  const hasChanges = JSON.stringify(formData) !== JSON.stringify(section);

  return (
    <>
      <Card className="border-white/10 bg-black/40 backdrop-blur-sm overflow-hidden group">

      <div className={`h-1 w-full transition-colors ${formData.enabled ? 'bg-primary' : 'bg-muted'}`} />
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl flex items-center gap-2 text-white">
              {formData.name}
              {!formData.enabled && (
                <Badge variant="outline" className="text-[10px] uppercase tracking-wider border-red-500/50 text-red-500 bg-red-500/5">
                  Disabled
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="text-xs font-mono uppercase tracking-tighter text-muted-foreground/60">
              ID: {section.id}
            </CardDescription>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 mr-2">
              <Label htmlFor={`enable-${section.id}`} className="cursor-pointer">
                {formData.enabled ? (
                  <Eye className="h-4 w-4 text-emerald-500" />
                ) : (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                )}
              </Label>
              <Switch
                id={`enable-${section.id}`}
                checked={formData.enabled}
                onCheckedChange={(checked) => handleChange("enabled", checked)}
              />
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsPreviewing(true)}
              className="border-white/10 hover:bg-white/5 active:scale-95 transition-all h-8"
              title="Preview homepage section"
            >
              <Monitor className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleReset}
              className="border-white/10 hover:bg-white/5 active:scale-95 transition-all h-8"
              title="Reset to original defaults"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              disabled={!hasChanges || isSaving}
              onClick={() => onSave(formData)}
              className="shadow-3d-primary active:translate-y-[2px] transition-all"
            >
              {isSaving ? "Saving..." : "Save Changes"}
              <Save className="ml-2 h-3.5 w-3.5" />
            </Button>

          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-0">

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Basic Info */}
          <div className="space-y-4 p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <Type className="h-4 w-4 text-primary" />
              <h4 className="text-sm font-semibold text-white/80">Section Identity</h4>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Display Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                className="h-9 bg-black/20 border-white/10 focus:border-primary/50"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Display Order</Label>
              <div className="flex items-center gap-2">
                <ListOrdered className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => handleChange("sortOrder", parseInt(e.target.value))}
                  className="h-9 bg-black/20 border-white/10 focus:border-primary/50"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Product Category</Label>
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <Select
                  value={formData.productCategory || "all"}
                  onValueChange={(value) => handleChange("productCategory", value === "all" ? null : value)}
                >
                  <SelectTrigger className="h-9 bg-black/20 border-white/10 focus:border-primary/50 text-xs">
                    <SelectValue placeholder="All Products (Default)" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-white/10">
                    <SelectItem value="all">All Products (Default)</SelectItem>
                    {PRODUCT_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {categoryLabel(cat)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Display Limits */}
          <div className="space-y-4 p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <LayoutGrid className="h-4 w-4 text-primary" />
              <h4 className="text-sm font-semibold text-white/80">Content Rules</h4>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Homepage Product Limit</Label>
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  value={formData.displayLimit}
                  onChange={(e) => handleChange("displayLimit", parseInt(e.target.value))}
                  className="h-9 bg-black/20 border-white/10 focus:border-primary/50"
                />
              </div>
              <p className="text-[10px] text-muted-foreground/60 italic">
                Controls how many products appear initially.
              </p>
            </div>
            
            <div className="flex items-center justify-between pt-2">
              <div className="space-y-0.5">
                <Label className="text-xs text-white/80">Enable Slider Mode</Label>
                <p className="text-[10px] text-muted-foreground/60">Use carousel instead of grid</p>
              </div>
              <Switch
                checked={formData.isSlider}
                onCheckedChange={(checked) => handleChange("isSlider", checked)}
              />
            </div>

            {formData.isSlider && (
              <div className="space-y-2 pt-2 animate-in fade-in slide-in-from-top-1">
                <Label className="text-xs text-muted-foreground">Slider Items per View</Label>
                <div className="flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    value={formData.sliderItems || 4}
                    onChange={(e) => handleChange("sliderItems", parseInt(e.target.value))}
                    className="h-9 bg-black/20 border-white/10 focus:border-primary/50"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="space-y-4 p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <LinkIcon className="h-4 w-4 text-primary" />
                <h4 className="text-sm font-semibold text-white/80">"See All" Action</h4>
              </div>
              <Switch
                checked={formData.showSeeAll}
                onCheckedChange={(checked) => handleChange("showSeeAll", checked)}
              />
            </div>

            {formData.showSeeAll && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-1">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Button Text</Label>
                  <Input
                    value={formData.buttonText}
                    onChange={(e) => handleChange("buttonText", e.target.value)}
                    className="h-9 bg-black/20 border-white/10 focus:border-primary/50"
                    placeholder="e.g. Explore All Products"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Target URL</Label>
                  <Input
                    value={formData.buttonLink}
                    onChange={(e) => handleChange("buttonLink", e.target.value)}
                    className="h-9 bg-black/20 border-white/10 focus:border-primary/50"
                    placeholder="e.g. /shop"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
    </>
  );
}

