import { useState, useRef } from "react";
import { Camera, Loader2, Upload, User } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { updateAdminProfile } from "@/lib/admin.functions";

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

export function UserProfileWidget({ access }: UserProfileWidgetProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedGender, setSelectedGender] = useState<string>(access.gender || "male");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const roleLabel = access.primaryRole ? ROLE_LABELS[access.primaryRole as keyof typeof ROLE_LABELS] : "Staff";
  
  // Use DiceBear Adventurer for 3D-like illustrated avatars
  const defaultAvatar = `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(access.fullName || access.email || access.userId)}&flip=${selectedGender === "female"}`;
  const currentAvatar = access.avatarUrl || defaultAvatar;

  const handleUpdateProfile = async (updates: { gender?: string; avatarUrl?: string }) => {
    setIsUpdating(true);
    try {
      await updateAdminProfile({ data: updates });
      await queryClient.invalidateQueries({ queryKey: ["admin-context"] });
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Update error:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("File size must be less than 2MB");
      return;
    }

    setIsUpdating(true);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${access.userId}/${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      await handleUpdateProfile({ avatarUrl: publicUrl });
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleResetAvatar = () => {
    handleUpdateProfile({ avatarUrl: "" });
  };

  return (
    <>
      <div 
        className="flex items-center gap-3 px-2 py-3 cursor-pointer hover:bg-muted/50 rounded-lg transition-colors group"
        onClick={() => setIsDialogOpen(true)}
      >
        <div className="relative shrink-0">
          <div className="h-10 w-10 rounded-full border-2 border-primary/20 overflow-hidden bg-muted flex items-center justify-center">
            {currentAvatar ? (
              <img src={currentAvatar} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              <User className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
          <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-primary rounded-full border-2 border-background flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera className="h-3 w-3 text-primary-foreground" />
          </div>
        </div>
        
        <div className="min-w-0 flex-1 leading-tight group-data-[collapsible=icon]:hidden">
          <p className="font-bold text-sm truncate text-foreground">
            {access.fullName || "User Account"}
          </p>
          <p className="text-xs text-muted-foreground font-medium">
            {roleLabel}
          </p>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Profile Settings</DialogTitle>
            <DialogDescription>
              Customize your admin profile and avatar.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-6 py-4">
            <div className="relative">
              <div className="h-32 w-32 rounded-full border-4 border-primary/10 overflow-hidden bg-muted flex items-center justify-center">
                {currentAvatar ? (
                  <img src={currentAvatar} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-16 w-16 text-muted-foreground" />
                )}
              </div>
              {isUpdating && (
                <div className="absolute inset-0 bg-background/60 flex items-center justify-center rounded-full">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}
            </div>

            <div className="grid w-full gap-4">
              <div className="space-y-3">
                <Label>Dynamic Avatar Style (Based on Gender)</Label>
                <RadioGroup 
                  value={selectedGender} 
                  onValueChange={(val) => {
                    setSelectedGender(val);
                    handleUpdateProfile({ gender: val });
                  }}
                  className="flex gap-4"
                  disabled={isUpdating}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="male" id="male" />
                    <Label htmlFor="male">Male Style</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="female" id="female" />
                    <Label htmlFor="female">Female Style</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="flex flex-wrap gap-2 justify-center pt-2">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleFileUpload}
                />
                <Button 
                  variant="steel" 
                  size="sm" 
                  className="gap-2"
                  disabled={isUpdating}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4" />
                  Upload Photo
                </Button>
                {access.avatarUrl && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    disabled={isUpdating}
                    onClick={handleResetAvatar}
                  >
                    Reset to 3D Default
                  </Button>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="steel" onClick={() => setIsDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
