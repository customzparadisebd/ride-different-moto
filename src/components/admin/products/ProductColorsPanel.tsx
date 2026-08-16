// ============================================================
// ADMIN PRODUCT COLOR MANAGEMENT
// Purpose: Add, edit, enable/disable, price, image, reorder and
//          remove the colour variations customers can choose.
// Status: COMPLETED
// Security: Every write goes through products.manage server checks;
//          this panel only renders and submits.
// ============================================================
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatBDT } from "@/lib/format";
import {
  deleteProductColor,
  listProductColors,
  reorderProductColors,
  saveProductColor,
} from "@/lib/products.functions";

type ColorRow = {
  id: string;
  name: string;
  swatch: string;
  price_delta: number | string;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
};

type Draft = {
  id?: string;
  name: string;
  swatch: string;
  priceDelta: string;
  imageUrl: string;
  isActive: boolean;
};

const emptyDraft: Draft = {
  name: "",
  swatch: "#c62828",
  priceDelta: "0",
  imageUrl: "",
  isActive: true,
};

export function ProductColorsPanel({
  productId,
  productName,
  basePrice,
  canManage,
  onClose,
}: {
  productId: string;
  productName: string;
  basePrice: number;
  canManage: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const fetchColors = useServerFn(listProductColors);
  const save = useServerFn(saveProductColor);
  const remove = useServerFn(deleteProductColor);
  const reorder = useServerFn(reorderProductColors);
  const [draft, setDraft] = useState<Draft>(emptyDraft);

  const colorsQuery = useQuery({
    queryKey: ["admin-product-colors", productId],
    queryFn: () => fetchColors({ data: { productId } }),
  });
  const rows = (colorsQuery.data?.rows ?? []) as unknown as ColorRow[];

  const refresh = () =>
    void queryClient.invalidateQueries({ queryKey: ["admin-product-colors", productId] });
  const onError = (error: Error) => toast.error(error.message || "That action failed.");

  const saveMutation = useMutation({
    mutationFn: save,
    onSuccess: () => {
      toast.success("Colour saved");
      setDraft(emptyDraft);
      refresh();
    },
    onError,
  });
  const removeMutation = useMutation({
    mutationFn: remove,
    onSuccess: () => {
      toast.success("Colour removed");
      refresh();
    },
    onError,
  });
  const reorderMutation = useMutation({ mutationFn: reorder, onSuccess: refresh, onError });

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (draft.name.trim().length < 1) return toast.error("Enter the colour name.");
    saveMutation.mutate({
      data: {
        ...(draft.id ? { id: draft.id } : {}),
        productId,
        name: draft.name.trim(),
        swatch: draft.swatch,
        priceDelta: Number(draft.priceDelta) || 0,
        imageUrl: draft.imageUrl.trim(),
        isActive: draft.isActive,
        sortOrder: rows.length,
      } as never,
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
            Colours — {productName}
          </h2>
          <p className="text-xs text-muted-foreground">
            Base price {formatBDT(basePrice)} · a colour price difference is added on top.
          </p>
        </div>
        <Button variant="steel" size="sm" onClick={onClose}>
          Close
        </Button>
      </div>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="py-2">Colour</th>
              <th className="py-2 text-right">Price difference</th>
              <th className="py-2 text-right">Customer pays</th>
              <th className="py-2">Status</th>
              <th className="py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {colorsQuery.isLoading ? (
              <tr>
                <td colSpan={5} className="py-4 text-center text-muted-foreground">
                  Loading colours…
                </td>
              </tr>
            ) : null}
            {!colorsQuery.isLoading && rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-4 text-center text-muted-foreground">
                  No colour options yet — this product is sold in a single finish.
                </td>
              </tr>
            ) : null}
            {rows.map((row, index) => (
              <tr key={row.id} className="border-b border-border last:border-0">
                <td className="py-2">
                  <span className="flex items-center gap-2">
                    <span
                      className="size-5 shrink-0 rounded-full border border-border"
                      style={{ backgroundColor: row.swatch }}
                      aria-hidden="true"
                    />
                    <span className="font-semibold">{row.name}</span>
                  </span>
                </td>
                <td className="py-2 text-right">{formatBDT(Number(row.price_delta))}</td>
                <td className="py-2 text-right font-semibold">
                  {formatBDT(Math.max(0, basePrice + Number(row.price_delta)))}
                </td>
                <td className="py-2">{row.is_active ? "Active" : "Inactive"}</td>
                <td className="py-2">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-9"
                      aria-label={`Move ${row.name} up`}
                      disabled={!canManage || index === 0}
                      onClick={() => move(index, -1)}
                    >
                      <ArrowUp />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-9"
                      aria-label={`Move ${row.name} down`}
                      disabled={!canManage || index === rows.length - 1}
                      onClick={() => move(index, 1)}
                    >
                      <ArrowDown />
                    </Button>
                    <Button
                      variant="steel"
                      size="sm"
                      disabled={!canManage}
                      onClick={() =>
                        saveMutation.mutate({
                          data: {
                            id: row.id,
                            productId,
                            name: row.name,
                            swatch: row.swatch,
                            priceDelta: Number(row.price_delta),
                            imageUrl: row.image_url ?? "",
                            isActive: !row.is_active,
                            sortOrder: row.sort_order,
                          } as never,
                        })
                      }
                    >
                      {row.is_active ? "Disable" : "Enable"}
                    </Button>
                    <Button
                      variant="steel"
                      size="sm"
                      disabled={!canManage}
                      onClick={() =>
                        setDraft({
                          id: row.id,
                          name: row.name,
                          swatch: row.swatch,
                          priceDelta: String(Number(row.price_delta)),
                          imageUrl: row.image_url ?? "",
                          isActive: row.is_active,
                        })
                      }
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-9 text-destructive"
                      aria-label={`Remove ${row.name}`}
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
          className="mt-4 grid gap-3 border-t border-border pt-4 sm:grid-cols-2"
        >
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              Colour name
            </Label>
            <Input
              className="mt-1.5 h-11"
              placeholder="Cosmic Orange"
              value={draft.name}
              onChange={(event) => setDraft({ ...draft, name: event.target.value })}
            />
          </div>
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              Colour code
            </Label>
            <div className="mt-1.5 flex gap-2">
              <input
                type="color"
                aria-label="Pick colour"
                className="h-11 w-14 rounded-md border border-input bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                value={draft.swatch}
                onChange={(event) => setDraft({ ...draft, swatch: event.target.value })}
              />
              <Input
                className="h-11"
                value={draft.swatch}
                onChange={(event) => setDraft({ ...draft, swatch: event.target.value })}
              />
            </div>
          </div>
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              Price difference (৳)
            </Label>
            <Input
              className="mt-1.5 h-11"
              inputMode="numeric"
              value={draft.priceDelta}
              onChange={(event) => setDraft({ ...draft, priceDelta: event.target.value })}
            />
          </div>
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              Colour image URL (optional)
            </Label>
            <Input
              className="mt-1.5 h-11"
              value={draft.imageUrl}
              onChange={(event) => setDraft({ ...draft, imageUrl: event.target.value })}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
            <Button type="submit" variant="red" size="touch" disabled={saveMutation.isPending}>
              {draft.id ? "Save colour" : "Add colour"}
            </Button>
            {draft.id ? (
              <Button
                type="button"
                variant="steel"
                size="touch"
                onClick={() => setDraft(emptyDraft)}
              >
                Cancel edit
              </Button>
            ) : null}
          </div>
        </form>
      ) : null}
    </div>
  );
}
