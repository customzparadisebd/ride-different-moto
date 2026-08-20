import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { 
  AlertCircle, 
  Check, 
  Eye, 
  Image as ImageIcon, 
  Link as LinkIcon, 
  RotateCcw, 
  Trash2, 
  Upload 
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { listLogos, resetLogo, updateLogo, uploadLogoFile } from "@/lib/logos.functions";
import { 
  LOGO_CATEGORY_LABELS, 
  LOGO_RECOMMENDATIONS, 
  SiteLogo, 
  LogoCategory 
} from "@/lib/logos.shared";
import { cn } from "@/lib/utils";

export function LogoSettingsPanel({ canManage }: { canManage: boolean }) {
  const queryClient = useQueryClient();
  const list = useServerFn(listLogos);
  const update = useServerFn(updateLogo);
  const upload = useServerFn(uploadLogoFile);
  const reset = useServerFn(resetLogo);

  const { data: logos, isLoading } = useQuery({
    queryKey: ["site-logos"],
    queryFn: () => list(),
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => update({ data }),
    onSuccess: () => {
      toast.success("Logo settings updated");
      void queryClient.invalidateQueries({ queryKey: ["site-logos"] });
    },
    onError: (err: any) => toast.error(err.message || "Failed to update logo"),
  });

  const uploadMutation = useMutation({
    mutationFn: (data: any) => upload({ data }),
    onSuccess: () => {
      toast.success("Logo uploaded successfully");
      void queryClient.invalidateQueries({ queryKey: ["site-logos"] });
    },
    onError: (err: any) => toast.error(err.message || "Failed to upload logo"),
  });

  const resetMutation = useMutation({
    mutationFn: (data: any) => reset({ data }),
    onSuccess: () => {
      toast.success("Logo reset to default");
      void queryClient.invalidateQueries({ queryKey: ["site-logos"] });
    },
    onError: (err: any) => toast.error(err.message || "Failed to reset logo"),
  });


  if (isLoading) return <div className="py-10 text-center text-muted-foreground animate-pulse">Loading logos...</div>;

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-3xl font-bold uppercase tracking-wide">Logo Management</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Manage all website logos, icons, and social sharing images dynamically.
        </p>
      </div>

      <div className="grid gap-8">
        {logos?.map((logo) => (
          <LogoItem 
            key={logo.category} 
            logo={logo} 
            canManage={canManage}
            isUpdating={updateMutation.isPending || uploadMutation.isPending || resetMutation.isPending}
            onUpdate={(updates) => updateMutation.mutate({ ...updates, category: logo.category })}
            onUpload={(file) => {
              const reader = new FileReader();
              reader.onload = (e) => {
                const base64 = e.target?.result as string;
                uploadMutation.mutate({
                  category: logo.category,
                  fileData: base64.split(",")[1],
                  fileName: file.name,
                  contentType: file.type,
                });
              };
              reader.readAsDataURL(file);
            }}
            onReset={() => resetMutation.mutate({ category: logo.category })}
          />
        ))}
      </div>
    </div>
  );
}

function LogoItem({ 
  logo, 
  canManage, 
  isUpdating,
  onUpdate, 
  onUpload, 
  onReset 
}: { 
  logo: SiteLogo; 
  canManage: boolean;
  isUpdating: boolean;
  onUpdate: (updates: any) => void;
  onUpload: (file: File) => void;
  onReset: () => void;
}) {
  const [urlInput, setUrlInput] = useState(logo.url || "");
  const rec = LOGO_RECOMMENDATIONS[logo.category];
  const activeUrl = logo.url;

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm transition-all hover:shadow-md">
      <div className="bg-muted/30 px-6 py-4 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="font-bold text-sm uppercase tracking-wider">{LOGO_CATEGORY_LABELS[logo.category]}</h3>
          <p className="text-[10px] text-muted-foreground font-medium mt-0.5">{logo.description}</p>
        </div>
        <div className="flex items-center gap-2">
          {!logo.is_active && (
            <span className="px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-500 text-[10px] font-bold uppercase">Disabled</span>
          )}
          {logo.is_active && (
            <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 text-[10px] font-bold uppercase flex items-center gap-1">
              <Check className="w-3 h-3" /> Active
            </span>
          )}
        </div>
      </div>

      <div className="p-6 grid gap-8 md:grid-cols-2">
        {/* Preview & Recommendations */}
        <div className="space-y-6">
          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Eye className="w-3 h-3" /> Live Preview
            </Label>
            <div className={cn(
              "relative aspect-video rounded-xl border-2 border-dashed border-border flex items-center justify-center overflow-hidden bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] dark:bg-[radial-gradient(#1f2937_1px,transparent_1px)]",
              !activeUrl && "bg-muted/20"
            )}>
              {activeUrl ? (
                <img 
                  src={activeUrl} 
                  alt={logo.label} 
                  className="max-h-[80%] max-w-[80%] object-contain drop-shadow-sm transition-transform hover:scale-105" 
                />
              ) : (
                <div className="text-center space-y-2">
                  <ImageIcon className="w-10 h-10 mx-auto text-muted-foreground/40" />
                  <p className="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground">No Logo Set</p>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-background/50 p-4 space-y-3">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-2">
              <AlertCircle className="w-3 h-3" /> Recommendations
            </h4>
            <div className="grid grid-cols-2 gap-y-2 gap-x-4">
              {rec.recommended_width && (
                <div className="text-[10px]">
                  <span className="text-muted-foreground block uppercase font-medium">Dimensions</span>
                  <span className="font-bold">{rec.recommended_width}x{rec.recommended_height}px</span>
                </div>
              )}
              {rec.aspect_ratio && (
                <div className="text-[10px]">
                  <span className="text-muted-foreground block uppercase font-medium">Aspect Ratio</span>
                  <span className="font-bold">{rec.aspect_ratio}</span>
                </div>
              )}
              {rec.recommended_format && (
                <div className="text-[10px]">
                  <span className="text-muted-foreground block uppercase font-medium">Preferred Formats</span>
                  <span className="font-bold uppercase">{rec.recommended_format.join(", ")}</span>
                </div>
              )}
              {rec.transparency_required && (
                <div className="text-[10px]">
                  <span className="text-muted-foreground block uppercase font-medium">Transparency</span>
                  <span className="font-bold text-green-500 uppercase">Required (PNG/WebP)</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Upload className="w-3 h-3" /> Manual Upload
              </Label>
              <div className="flex gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  disabled={!canManage || isUpdating}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onUpload(file);
                  }}
                  className="text-xs h-10 file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-bold file:uppercase file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                />
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-bold">
                <span className="bg-card px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <LinkIcon className="w-3 h-3" /> External URL
              </Label>
              <div className="flex gap-2">
                <Input
                  value={urlInput}
                  placeholder="https://example.com/logo.png"
                  disabled={!canManage || isUpdating}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="text-xs h-10"
                />
                <Button 
                  size="sm" 
                  variant="outline" 
                  disabled={!canManage || isUpdating || urlInput === logo.url}
                  onClick={() => onUpdate({ url: urlInput, storagePath: null })}
                >
                  Apply
                </Button>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-border flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                className="h-4 w-4 rounded accent-primary"
                checked={logo.is_active}
                disabled={!canManage || isUpdating}
                onChange={(e) => onUpdate({ isActive: e.target.checked })}
              />
              <span className="text-[10px] font-bold uppercase tracking-tight group-hover:text-primary transition-colors">Enabled</span>
            </label>

            <div className="flex-1" />

            <Button
              variant="ghost"
              size="sm"
              disabled={!canManage || isUpdating || (!logo.url && !logo.storage_path)}
              onClick={onReset}
              className="h-8 text-[10px] uppercase font-bold text-muted-foreground hover:text-primary"
            >
              <RotateCcw className="w-3 h-3 mr-1" /> Reset to Default
            </Button>

            <Button
              variant="ghost"
              size="sm"
              disabled={!canManage || isUpdating || (!logo.url && !logo.storage_path)}
              onClick={() => onUpdate({ url: null, storagePath: null })}
              className="h-8 text-[10px] uppercase font-bold text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="w-3 h-3 mr-1" /> Remove
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
