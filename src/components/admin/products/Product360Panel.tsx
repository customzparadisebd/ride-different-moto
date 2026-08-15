// ============================================================
// ADMIN PRODUCT 360 VIEWER MANAGEMENT
// Purpose: Upload and reorder the image sequence for the
//          360° product viewer.
// Status: COMPLETED
// Security: Every write goes through products.manage server checks.
// ============================================================
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowDown, ArrowUp, Trash2, Info, Play, Pause } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  deleteProduct360Image,
  listProduct360Images,
  reorderProduct360Images,
  saveProduct360Image,
  saveProduct360Sequence,
} from "@/lib/products.functions";
import { Bulk360Uploader } from "./Bulk360Uploader";

type Product360Row = {
  id: string;
  image_url: string;
  display_order: number;
};

type Draft = {
  id?: string;
  imageUrl: string;
};

const emptyDraft: Draft = {
  imageUrl: "",
};

export function Product360Panel({
  productId,
  productName,
  canManage,
  onClose,
}: {
  productId: string;
  productName: string;
  canManage: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const fetch360 = useServerFn(listProduct360Images);
  const save = useServerFn(saveProduct360Image);
  const remove = useServerFn(deleteProduct360Image);
  const reorder = useServerFn(reorderProduct360Images);
  const saveBulk = useServerFn(saveProduct360Sequence);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const playInterval = useRef<number | null>(null);

  const imagesQuery = useQuery({
    queryKey: ["admin-product-360", productId],
    queryFn: () => fetch360({ data: { productId } }),
  });
  const rows = (imagesQuery.data?.rows ?? []) as unknown as Product360Row[];

  useEffect(() => {
    if (isPlaying && rows.length > 0) {
      playInterval.current = window.setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % rows.length);
      }, 100);
    } else if (playInterval.current) {
      clearInterval(playInterval.current);
    }
    return () => {
      if (playInterval.current) clearInterval(playInterval.current);
    };
  }, [isPlaying, rows.length]);

  const refresh = () =>
    void queryClient.invalidateQueries({ queryKey: ["admin-product-360", productId] });
  const onError = (error: Error) => toast.error(error.message || "That action failed.");

  const saveMutation = useMutation({
    mutationFn: save,
    onSuccess: () => {
      toast.success("Image added to sequence");
      setDraft(emptyDraft);
      refresh();
    },
    onError,
  });
  const removeMutation = useMutation({
    mutationFn: remove,
    onSuccess: () => {
      toast.success("Image removed");
      refresh();
    },
    onError,
  });
  const reorderMutation = useMutation({ mutationFn: reorder, onSuccess: refresh, onError });
  const bulkMutation = useMutation({
    mutationFn: saveBulk,
    onSuccess: () => {
      toast.success("Bulk sequence saved");
      refresh();
    },
    onError,
  });

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (draft.imageUrl.trim().length < 1) return toast.error("Enter the image URL.");
    saveMutation.mutate({
      data: {
        ...(draft.id ? { id: draft.id } : {}),
        productId,
        imageUrl: draft.imageUrl.trim(),
        displayOrder: rows.length,
      },
    });
    return undefined;
  };

  const move = (index: number, direction: -1 | 1) => {
    const next = [...rows];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    const a = next[index];
    const b = next[target];
    if (!a || !b) return;
    next[index] = b;
    next[target] = a;
    reorderMutation.mutate({ data: { productId, ids: next.map((row) => row.id) } });
  };

  return (
    <div className="mt-4 rounded-xl border border-border bg-card p-4 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 className="truncate font-display text-lg font-bold uppercase">
            360° View Sequence — {productName}
          </h2>
          <p className="text-xs text-muted-foreground">
            Upload the product rotation sequence images here.
          </p>
        </div>
        <Button variant="steel" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>

      <div className="mt-4 grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg bg-blue-500/5 p-3 border border-blue-500/20">
          <div className="flex items-start gap-3">
            <Info className="size-5 shrink-0 text-blue-400 mt-0.5" />
            <div className="text-sm">
              <h3 className="font-semibold text-blue-400 uppercase tracking-wider text-xs">Image Guidelines</h3>
              <ul className="mt-1 list-disc list-inside text-muted-foreground space-y-1">
                <li>Recommended: <span className="text-foreground font-medium">24, 36, or 72 images</span> for smooth rotation.</li>
                <li>Dimensions: <span className="text-foreground font-medium">1000x1000px</span> (square).</li>
                <li>Format: <span className="text-foreground font-medium">WebP</span> highly recommended for performance.</li>
                <li>Max File Size: <span className="text-foreground font-medium">&lt; 150KB per image</span> (Total sequence should be &lt; 5MB).</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-black/40 p-3">
          <div className="flex items-center justify-between mb-2">
             <Label className="text-xs text-muted-foreground uppercase tracking-wider">Live Scrubber Preview</Label>
             <div className="flex items-center gap-2">
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="size-7 rounded-full text-white hover:bg-white/10"
                  onClick={() => setIsPlaying(!isPlaying)}
                  disabled={rows.length === 0}
                >
                  {isPlaying ? <Pause className="size-3" /> : <Play className="size-3" />}
                </Button>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {rows.length > 0 ? `${currentIndex + 1} / ${rows.length}` : "0 / 0"}
                </span>
             </div>
          </div>
          <div className="aspect-video w-full max-h-[160px] rounded bg-black overflow-hidden relative mb-3">
            {rows.length > 0 ? (
              <img 
                src={rows[currentIndex]?.image_url} 
                alt="Preview" 
                className="size-full object-contain"
              />
            ) : (
              <div className="size-full flex items-center justify-center text-muted-foreground/20 text-[10px] uppercase font-bold tracking-widest">
                No images
              </div>
            )}
          </div>
          <Slider 
            value={[currentIndex]} 
            max={Math.max(0, rows.length - 1)} 
            step={1}
            onValueChange={([val]) => {
              if (typeof val === 'number') {
                setCurrentIndex(val);
                setIsPlaying(false);
              }
            }}
            disabled={rows.length === 0}
          />
        </div>
      </div>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[600px] text-sm">
          <thead className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="py-2 w-16 text-center">Order</th>
              <th className="py-2 w-24">Preview</th>
              <th className="py-2">Image URL</th>
              <th className="py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {imagesQuery.isLoading ? (
              <tr>
                <td colSpan={4} className="py-4 text-center text-muted-foreground">
                  Loading sequence…
                </td>
              </tr>
            ) : null}
            {!imagesQuery.isLoading && rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-4 text-center text-muted-foreground">
                  No images in the 360° sequence yet.
                </td>
              </tr>
            ) : null}
            {rows.map((row, index) => (
              <tr key={row.id} className="border-b border-border last:border-0">
                <td className="py-2 text-center font-mono text-xs text-muted-foreground">
                  {index + 1}
                </td>
                <td className="py-2">
                  <div className="size-16 rounded border border-border bg-black overflow-hidden">
                    <img 
                      src={row.image_url} 
                      alt={`360 Frame ${index + 1}`} 
                      className="size-full object-contain"
                      loading="lazy"
                    />
                  </div>
                </td>
                <td className="py-2">
                  <div className="max-w-md truncate font-mono text-xs text-muted-foreground">
                    {row.image_url}
                  </div>
                </td>
                <td className="py-2">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-9"
                      aria-label="Move up"
                      disabled={!canManage || index === 0}
                      onClick={() => move(index, -1)}
                    >
                      <ArrowUp />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-9"
                      aria-label="Move down"
                      disabled={!canManage || index === rows.length - 1}
                      onClick={() => move(index, 1)}
                    >
                      <ArrowDown />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-9 text-destructive"
                      aria-label="Remove"
                      disabled={!canManage}
                      onClick={() => removeMutation.mutate({ data: { id: row.id } })}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {canManage ? (
        <form
          onSubmit={submit}
          className="mt-4 grid gap-3 border-t border-border pt-4 sm:grid-cols-1"
        >
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              Add Image URL to Sequence
            </Label>
            <div className="mt-1.5 flex gap-2">
              <Input
                className="h-11"
                placeholder="https://.../360-frame-01.webp"
                value={draft.imageUrl}
                onChange={(event) => setDraft({ ...draft, imageUrl: event.target.value })}
              />
              <Button type="submit" variant="red" size="touch" disabled={saveMutation.isPending}>
                Add to sequence
              </Button>
            </div>
            <p className="mt-1.5 text-[10px] text-muted-foreground">
              Tip: Upload your images to the Assets folder first, then paste URLs here in sequence.
            </p>
          </div>
        </form>
      ) : null}

      {canManage && (
        <Bulk360Uploader 
          productId={productId} 
          currentCount={rows.length}
          isPending={bulkMutation.isPending}
          onSave={async (items) => {
            await bulkMutation.mutateAsync({ data: { productId, items } as any });
          }}
        />
      )}
    </div>
  );
}
