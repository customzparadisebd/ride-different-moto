// ============================================================
// CITY & DELIVERY ZONES — COMPLETED (admin UI)
// Purpose: Add, rename, enable/disable, reorder and remove the
//          city/district options shown in the checkout dropdown.
// Security: Writes go through server functions that require the
//          zones.manage permission.
// ============================================================
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  deleteCity,
  listCheckoutConfig,
  reorderCities,
  saveCity,
} from "@/lib/checkout-config.functions";
import type { City } from "@/lib/checkout-config.shared";

export function CitiesPanel({ canManage }: { canManage: boolean }) {
  const queryClient = useQueryClient();
  const load = useServerFn(listCheckoutConfig);
  const save = useServerFn(saveCity);
  const remove = useServerFn(deleteCity);
  const reorder = useServerFn(reorderCities);

  const configQuery = useQuery({ queryKey: ["checkout-admin-config"], queryFn: () => load() });
  const cities = configQuery.data?.cities ?? [];
  const [newCity, setNewCity] = useState("");
  const [search, setSearch] = useState("");

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["checkout-admin-config"] });
    void queryClient.invalidateQueries({ queryKey: ["checkout-config"] });
  };

  const onError = (error: Error) => toast.error(error.message || "Could not save the city.");

  const saveMutation = useMutation({
    mutationFn: save,
    onSuccess: () => {
      toast.success("City saved");
      setNewCity("");
      refresh();
    },
    onError,
  });

  const removeMutation = useMutation({
    mutationFn: remove,
    onSuccess: () => {
      toast.success("City removed");
      refresh();
    },
    onError,
  });

  const reorderMutation = useMutation({ mutationFn: reorder, onSuccess: refresh, onError });

  const move = (index: number, direction: -1 | 1) => {
    const next = [...cities];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    const a = next[index]!;
    const b = next[target]!;
    next[index] = b;
    next[target] = a;
    reorderMutation.mutate({ data: { ids: next.map((city) => city.id) } });
  };

  const visible = search
    ? cities.filter((city) => city.name.toLowerCase().includes(search.toLowerCase()))
    : cities;

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-card">
      <h2 className="font-display text-sm font-bold uppercase">Cities / districts</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        These are the options customers choose from at checkout.
      </p>

      <div className="mt-3 flex flex-wrap items-end gap-2">
        <div className="min-w-[180px] flex-1">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Add city</Label>
          <Input
            className="mt-1.5 h-11"
            value={newCity}
            placeholder="e.g. Dhaka"
            onChange={(event) => setNewCity(event.target.value)}
          />
        </div>
        <Button
          type="button"
          variant="red"
          size="touch"
          disabled={!canManage || !newCity.trim() || saveMutation.isPending}
          onClick={() =>
            saveMutation.mutate({
              data: { name: newCity.trim(), isActive: true, sortOrder: cities.length + 1 },
            })
          }
        >
          <Plus className="size-4" /> Add
        </Button>
        <div className="min-w-[160px] flex-1">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Search</Label>
          <Input
            className="mt-1.5 h-11"
            value={search}
            placeholder="Find a city"
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </div>

      {configQuery.isLoading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Loading cities…</p>
      ) : (
        <ul className="mt-4 max-h-96 space-y-2 overflow-y-auto pr-1">
          {visible.map((city) => (
            <CityRow
              key={city.id}
              city={city}
              canManage={canManage}
              onMoveUp={() => move(cities.indexOf(city), -1)}
              onMoveDown={() => move(cities.indexOf(city), 1)}
              onSave={(values) => saveMutation.mutate({ data: values })}
              onRemove={() => removeMutation.mutate({ data: { id: city.id } })}
            />
          ))}
          {!visible.length ? (
            <li className="py-4 text-center text-xs text-muted-foreground">No cities found.</li>
          ) : null}
        </ul>
      )}
    </div>
  );
}

function CityRow({
  city,
  canManage,
  onMoveUp,
  onMoveDown,
  onSave,
  onRemove,
}: {
  city: City;
  canManage: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onSave: (values: { id: string; name: string; isActive: boolean; sortOrder: number }) => void;
  onRemove: () => void;
}) {
  const [name, setName] = useState(city.name);

  return (
    <li className="flex flex-wrap items-center gap-2 rounded-md border border-border px-2 py-2">
      <Input
        className="h-10 min-w-[140px] flex-1"
        value={name}
        onChange={(event) => setName(event.target.value)}
        onBlur={() => {
          if (name.trim() && name.trim() !== city.name) {
            onSave({
              id: city.id,
              name: name.trim(),
              isActive: city.isActive,
              sortOrder: city.sortOrder,
            });
          }
        }}
        disabled={!canManage}
      />
      <label className="flex items-center gap-2 text-xs">
        <input
          type="checkbox"
          className="h-4 w-4"
          checked={city.isActive}
          disabled={!canManage}
          onChange={(event) =>
            onSave({
              id: city.id,
              name: city.name,
              isActive: event.target.checked,
              sortOrder: city.sortOrder,
            })
          }
        />
        Active
      </label>
      <div className="flex items-center gap-1">
        <Button type="button" variant="ghost" size="icon" disabled={!canManage} onClick={onMoveUp} aria-label="Move up">
          <ArrowUp className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={!canManage}
          onClick={onMoveDown} aria-label="Move down">
          <ArrowDown className="size-4" />
        </Button>
        <Button aria-label="Delete"
          type="button"
          variant="ghost"
          size="icon"
          disabled={!canManage}
          onClick={() => {
            if (window.confirm(`Remove ${city.name}?`)) onRemove();
          }}
        >
          <Trash2 className="size-4 text-destructive" />
        </Button>
      </div>
    </li>
  );
}
