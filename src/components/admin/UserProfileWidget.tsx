import { useState, useRef, useCallback } from "react";
import {
  Camera,
  Loader2,
  Upload,
  User,
  Pencil,
  X,
  Check,
  Info,
  Image as ImageIcon,
  ChevronRight,
  UserCircle,
  Scissors,
} from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import Cropper, { Area } from "react-easy-crop";

import { ROLE_LABELS } from "@/lib/admin.shared";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { updateAdminProfile } from "@/lib/admin.functions";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getCroppedImg } from "@/lib/cropImage";
import { Slider } from "@/components/ui/slider";

interface UserProfileWidgetProps {
  access: {
    userId: string;
    email: string | null;
    fullName: string | null;
    gender: string | null;
    avatarUrl: string | null;
    primaryRole: any;
  };
}

const PRESET_AVATARS = [
  {
    id: "adventurer-1",
    label: "Explorer",
    url: "https://api.dicebear.com/9.x/adventurer/svg?seed=Felix",
  },
  {
    id: "adventurer-2",
    label: "Visionary",
    url: "https://api.dicebear.com/9.x/adventurer/svg?seed=Aneka",
  },
  {
    id: "adventurer-3",
    label: "Strategist",
    url: "https://api.dicebear.com/9.x/adventurer/svg?seed=Toby",
  },
  { id: "bottts-1", label: "Tech Lead", url: "https://api.dicebear.com/9.x/bottts/svg?seed=Pixel" },
  {
    id: "bottts-2",
    label: "System Architect",
    url: "https://api.dicebear.com/9.x/bottts/svg?seed=Data",
  },
  {
    id: "avataaars-1",
    label: "Professional M",
    url: "https://api.dicebear.com/9.x/avataaars/svg?seed=George",
  },
  {
    id: "avataaars-2",
    label: "Professional F",
    url: "https://api.dicebear.com/9.x/avataaars/svg?seed=Liza",
  },
  {
    id: "miniavs-1",
    label: "Minimalist 1",
    url: "https://api.dicebear.com/9.x/miniavs/svg?seed=Zen",
  },
  {
    id: "miniavs-2",
    label: "Minimalist 2",
    url: "https://api.dicebear.com/9.x/miniavs/svg?seed=Art",
  },
  {
    id: "lorelei-1",
    label: "Creative",
    url: "https://api.dicebear.com/9.x/lorelei/svg?seed=Spark",
  },
];

export function UserProfileWidget({ access }: UserProfileWidgetProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isCropOpen, setIsCropOpen] = useState(false);
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const roleLabel = access.primaryRole
    ? ROLE_LABELS[access.primaryRole as keyof typeof ROLE_LABELS]
    : "Staff";

  const defaultAvatar = `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(access.fullName || access.email || access.userId)}`;
  const currentAvatar = access.avatarUrl || defaultAvatar;

  const onCropComplete = useCallback((_area: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleUpdateProfile = async (updates: { avatarUrl: string }) => {
    setIsUpdating(true);
    try {
      await updateAdminProfile({ data: updates });
      await queryClient.invalidateQueries({ queryKey: ["admin-context"] });
      setPreviewUrl(null);
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Update error:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCropImage(reader.result as string);
      setIsCropOpen(true);
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsDataURL(file);
  };

  const handleCropSave = async () => {
    if (!cropImage || !croppedAreaPixels) return;

    setIsUpdating(true);
    setIsCropOpen(false);

    try {
      const croppedBlob = await getCroppedImg(cropImage, croppedAreaPixels);
      const fileName = `${access.userId}-${Date.now()}.webp`;
      const filePath = `${access.userId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, croppedBlob, {
          contentType: "image/webp",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath);

      await handleUpdateProfile({ avatarUrl: publicUrl });
      setCropImage(null);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to process and upload image");
      setIsCropOpen(true); // Reopen on failure
    } finally {
      setIsUpdating(false);
    }
  };

  const handleResetAvatar = () => {
    handleUpdateProfile({ avatarUrl: "" });
  };

  const handleSelectPreset = (url: string) => {
    handleUpdateProfile({ avatarUrl: url });
  };

  return (
    <>
      <button
        type="button"
        aria-label="Open profile management"
        className="flex w-full items-center gap-3 px-2 py-3 cursor-pointer text-left hover:bg-muted/50 rounded-lg transition-colors group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        onClick={() => setIsDialogOpen(true)}
      >
        <div className="relative shrink-0">
          <div className="h-10 w-10 rounded-full border-2 border-primary/20 overflow-hidden bg-muted flex items-center justify-center shadow-inner">
            <img
              src={currentAvatar}
              alt="Avatar"
              className="h-full w-full object-cover transition-transform group-hover:scale-110"
              key={currentAvatar}
            />
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 bg-primary rounded-full border-2 border-background flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Pencil className="h-2 w-2 text-primary-foreground" />
          </div>
        </div>

        <div className="min-w-0 flex-1 leading-tight group-data-[collapsible=icon]:hidden">
          <p className="font-bold text-sm truncate text-foreground group-hover:text-primary transition-colors">
            {access.fullName || "User Account"}
          </p>
          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest opacity-70">
            {roleLabel}
          </p>
        </div>
        <ChevronRight className="h-3 w-3 text-muted-foreground/30 group-data-[collapsible=icon]:hidden group-hover:text-primary transition-colors" />
      </button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-background border-border shadow-2xl">
          <DialogHeader className="p-6 bg-muted/30 border-b border-border">
            <DialogTitle className="font-display text-xl font-bold uppercase tracking-wider">
              Profile Management
            </DialogTitle>
            <DialogDescription className="text-xs uppercase tracking-widest font-bold opacity-60">
              Personalize your Admin Panel identity
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 space-y-8">
            {/* Live Preview Area */}
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="relative">
                <div className="size-24 rounded-full border-4 border-primary/10 overflow-hidden bg-muted flex items-center justify-center shadow-xl transition-all duration-500 hover:border-primary/30">
                  <img
                    src={previewUrl || currentAvatar}
                    alt="Avatar Preview"
                    className="h-full w-full object-cover"
                  />
                  {isUpdating && (
                    <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] flex items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 flex gap-1">
                  {access.avatarUrl && (
                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-7 w-7 rounded-full shadow-lg border-2 border-background"
                      onClick={handleResetAvatar}
                      disabled={isUpdating}
                      title="Remove custom avatar"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <Button
                    variant="steel"
                    size="icon"
                    className="h-7 w-7 rounded-full shadow-lg border-2 border-background"
                    onClick={() = aria-label="Change photo"> fileInputRef.current?.click()}
                    disabled={isUpdating}
                    title="Change image"
                  >
                    <Camera className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              <div className="text-center">
                <p className="font-bold text-lg">{access.fullName}</p>
                <Badge
                  variant="outline"
                  className="text-[10px] uppercase font-black tracking-widest border-primary/20 text-primary"
                >
                  {roleLabel}
                </Badge>
              </div>
            </div>

            <Tabs defaultValue="presets" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1">
                <TabsTrigger
                  value="presets"
                  className="text-[10px] font-bold uppercase tracking-widest"
                >
                  Presets
                </TabsTrigger>
                <TabsTrigger
                  value="upload"
                  className="text-[10px] font-bold uppercase tracking-widest"
                >
                  Manual Upload
                </TabsTrigger>
              </TabsList>

              <TabsContent
                value="presets"
                className="pt-4 animate-in fade-in slide-in-from-bottom-2"
              >
                <ScrollArea className="h-56 pr-4">
                  <div className="grid grid-cols-5 gap-3">
                    {PRESET_AVATARS.map((avatar) => (
                      <button
                        key={avatar.id}
                        onClick={() => handleSelectPreset(avatar.url)}
                        disabled={isUpdating}
                        className={cn(
                          "group relative aspect-square rounded-lg border-2 overflow-hidden transition-all hover:border-primary/50 hover:scale-105 active:scale-95 bg-muted/20",
                          access.avatarUrl === avatar.url
                            ? "border-primary bg-primary/10 shadow-lg"
                            : "border-transparent",
                        )}
                        title={avatar.label}
                      >
                        <img
                          src={avatar.url}
                          alt={avatar.label}
                          className="w-full h-full object-cover"
                        />
                        {access.avatarUrl === avatar.url && (
                          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                            <Check className="h-5 w-5 text-primary" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent
                value="upload"
                className="pt-4 space-y-4 animate-in fade-in slide-in-from-bottom-2"
              >
                <div className="rounded-lg border border-dashed border-border bg-muted/20 p-8 flex flex-col items-center justify-center gap-3 transition-colors hover:bg-muted/30">
                  <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Upload className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-xs font-bold uppercase tracking-wide">
                      Click or drag to upload
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Select a custom image from your device
                    </p>
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileUpload}
                  />
                  <Button
                    variant="steel"
                    size="sm"
                    className="mt-2 font-bold uppercase tracking-widest text-[10px]"
                    disabled={isUpdating}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Select Image
                  </Button>
                </div>

                <div className="rounded-md bg-primary/5 border border-primary/20 p-3 flex gap-3">
                  <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase text-primary tracking-widest">
                      Recommended Specs
                    </p>
                    <ul className="text-[9px] text-muted-foreground leading-normal font-bold list-disc pl-3">
                      <li>Dimensions: 400 x 400px (1:1 Ratio)</li>
                      <li>Formats: WebP, JPEG, PNG</li>
                      <li>Max Size: 1MB (Optimized for performance)</li>
                    </ul>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter className="p-4 bg-muted/30 border-t border-border gap-2">
            <Button
              variant="steel"
              className="text-[10px] font-bold uppercase tracking-widest w-full sm:w-auto"
              onClick={() => setIsDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 1:1 Crop Editor Dialog */}
      <Dialog open={isCropOpen} onOpenChange={setIsCropOpen}>
        <DialogContent className="sm:max-w-[500px] bg-background border-border p-0 overflow-hidden shadow-2xl">
          <DialogHeader className="p-6 bg-muted/30 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-primary/10">
                <Scissors className="h-4 w-4 text-primary" />
              </div>
              <div>
                <DialogTitle className="font-display text-lg font-bold uppercase tracking-wider">
                  Crop Avatar
                </DialogTitle>
                <DialogDescription className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                  Align to 1:1 aspect ratio
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div
            className="relative h-80 bg-neutral-900"
            aria-label="Avatar crop area. Use arrow keys to move the image."
          >
            {cropImage && (
              <Cropper
                image={cropImage}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
                cropShape="round"
                showGrid={false}
                keyboardStep={10}
              />
            )}
          </div>

          <div className="p-6 space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label
                  htmlFor="zoom-slider"
                  className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground"
                >
                  Zoom Level
                </Label>
                <span className="text-[10px] font-mono font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                  {zoom.toFixed(1)}x
                </span>
              </div>
              <Slider
                id="zoom-slider"
                aria-label="Adjust zoom level"
                value={[zoom]}
                min={1}
                max={3}
                step={0.1}
                onValueChange={(values) => {
                  const val = values[0];
                  if (typeof val === "number") {
                    setZoom(val);
                  }
                }}
                className="py-4 cursor-pointer"
              />
            </div>

            <div className="rounded-md bg-muted/50 p-3 border border-border flex gap-3">
              <Info className="h-4 w-4 text-primary shrink-0" />
              <p className="text-[9px] font-bold text-muted-foreground leading-relaxed">
                Position the image within the circular boundary. Your avatar will be automatically
                resized to 400x400px and optimized as WebP.
              </p>
            </div>
          </div>

          <DialogFooter className="p-4 bg-muted/30 border-t border-border flex gap-2">
            <Button
              variant="ghost"
              className="flex-1 text-[10px] font-bold uppercase tracking-widest"
              onClick={() => {
                setIsCropOpen(false);
                setCropImage(null);
              }}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              variant="red"
              className="flex-1 text-[10px] font-bold uppercase tracking-widest shadow-lg"
              onClick={handleCropSave}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-3 w-3" />
                  Save & Apply
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Badge({
  children,
  className,
  variant = "default",
}: {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "outline";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        variant === "outline"
          ? "ring-border text-foreground"
          : "bg-primary/10 text-primary ring-primary/20",
        className,
      )}
    >
      {children}
    </span>
  );
}
