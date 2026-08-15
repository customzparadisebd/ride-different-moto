import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Star, Trash2, Edit2, GripVertical } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { getReviews, createReview, updateReview, deleteReview } from "@/lib/reviews.functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/ad/reviews")({
  component: ReviewsPage,
});

function ReviewsPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<any>(null);

  const fetchReviews = useServerFn(getReviews);
  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["admin", "reviews"],
    queryFn: () => fetchReviews({ data: { admin: true } }),
  });

  const createMutation = useMutation({
    mutationFn: useServerFn(createReview),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "reviews"] });
      toast.success("Review created");
      setIsDialogOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: useServerFn(updateReview),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "reviews"] });
      toast.success("Review updated");
      setIsDialogOpen(false);
      setEditingReview(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: useServerFn(deleteReview),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "reviews"] });
      toast.success("Review deleted");
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: any = {
      customer_name: formData.get("customer_name") as string,
      rating: parseInt(formData.get("rating") as string),
      comment: formData.get("comment") as string,
      bike_model: formData.get("bike_model") as string,
      is_active: formData.get("is_active") === "on",
      sort_order: parseInt(formData.get("sort_order") as string) || 0,
    };

    if (editingReview) {
      updateMutation.mutate({ data: { id: editingReview.id, updates: data } });
    } else {
      createMutation.mutate({ data });
    }
  };

  return (
    <div className="flex flex-col gap-8 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold uppercase tracking-tight">
            Customer Reviews
          </h1>
          <p className="text-muted-foreground">Manage testimonials shown on the homepage.</p>
        </div>
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) setEditingReview(null);
          }}
        >
          <DialogTrigger asChild>
            <Button className="font-bold uppercase tracking-wide">
              <Plus className="mr-2 size-4" />
              Add Review
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingReview ? "Edit Review" : "Add New Review"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="customer_name">Customer Name</Label>
                  <Input
                    id="customer_name"
                    name="customer_name"
                    defaultValue={editingReview?.customer_name}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rating">Rating (1-5)</Label>
                  <Input
                    id="rating"
                    name="rating"
                    type="number"
                    min="1"
                    max="5"
                    defaultValue={editingReview?.rating || 5}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bike_model">Bike Model (Optional)</Label>
                <Input
                  id="bike_model"
                  name="bike_model"
                  defaultValue={editingReview?.bike_model}
                  placeholder="e.g. Pulsar N160"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="comment">Comment</Label>
                <Textarea
                  id="comment"
                  name="comment"
                  defaultValue={editingReview?.comment}
                  rows={4}
                  required
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="sort_order">Sort Order</Label>
                  <Input
                    id="sort_order"
                    name="sort_order"
                    type="number"
                    defaultValue={editingReview?.sort_order || 0}
                  />
                </div>
                <div className="flex items-center gap-3 pt-8">
                  <Switch
                    id="is_active"
                    name="is_active"
                    defaultChecked={editingReview ? editingReview.is_active : true}
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {editingReview ? "Update Review" : "Save Review"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          [1, 2, 3].map((i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />)
        ) : reviews.length === 0 ? (
          <div className="rounded-3xl border border-dashed py-20 text-center">
            <p className="text-muted-foreground">No reviews found.</p>
          </div>
        ) : (
          reviews.map((review: any) => (
            <Card key={review.id} className="overflow-hidden border-border bg-card shadow-sm">
              <CardContent className="flex items-center gap-6 p-6">
                <div className="hidden cursor-move sm:block">
                  <GripVertical className="size-5 text-muted-foreground/30" />
                </div>
                <div className="flex-grow space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{review.customer_name}</span>
                    {review.is_active ? (
                      <Badge
                        variant="outline"
                        className="border-green-500/30 bg-green-500/5 text-green-500 text-[10px] h-4"
                      >
                        Active
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="border-red-500/30 bg-red-500/5 text-red-500 text-[10px] h-4"
                      >
                        Inactive
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "size-3",
                          i < review.rating ? "fill-yellow-500 text-yellow-500" : "text-muted",
                        )}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-1 italic">
                    "{review.comment}"
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={() = aria-label="Edit"> {
                      setEditingReview(review);
                      setIsDialogOpen(true);
                    }}
                  >
                    <Edit2 className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() = aria-label="Delete"> {
                      if (confirm("Are you sure you want to delete this review?")) {
                        deleteMutation.mutate(review.id);
                      }
                    }}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
