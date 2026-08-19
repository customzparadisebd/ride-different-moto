import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { 
  Plus, 
  Flame, 
  Eye, 
  Trash2, 
  AlertCircle, 
  ChevronRight, 
  Calendar, 
  Clock, 
  Timer,
  Edit2,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { FlashSaleForm } from "@/components/admin/flash/FlashSaleForm";
import { FlashSalePreviewDialog } from "@/components/admin/flash/FlashSalePreviewDialog";
import { getFlashSales, saveFlashSale, deleteFlashSale } from "@/lib/flash.functions";
import { listProducts } from "@/lib/products.functions";
import type { FlashSale, FlashSaleInput } from "@/lib/flash.shared";

export const Route = createFileRoute("/_authenticated/ad/flash")({
  component: FlashSaleManager,
});

function FlashSaleManager() {
  const queryClient = useQueryClient();
  const fetchSales = useServerFn(getFlashSales);
  const fetchProducts = useServerFn(listProducts);
  const saveSaleFn = useServerFn(saveFlashSale);
  const deleteSaleFn = useServerFn(deleteFlashSale);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<FlashSale | null>(null);
  const [saleToDelete, setSaleToDelete] = useState<string | null>(null);
  const [previewSale, setPreviewSale] = useState<FlashSaleInput | null>(null);

  const { data: sales = [], isLoading } = useQuery({
    queryKey: ["flash-sales"],
    queryFn: () => fetchSales(),
  });

  const { data: productsData } = useQuery({
    queryKey: ["products", { page: 1, pageSize: 1000 }],
    queryFn: () => fetchProducts({ data: { page: 1, pageSize: 1000, search: "" } } as any),
  });

  const products = (productsData as any)?.rows || [];

  const saveMutation = useMutation({
    mutationFn: (data: FlashSaleInput) => saveSaleFn({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flash-sales"] });
      setIsFormOpen(false);
      setEditingSale(null);
      toast.success("Flash sale saved successfully");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to save flash sale");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteSaleFn({ data: id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flash-sales"] });
      setSaleToDelete(null);
      toast.success("Flash sale deleted");
    },
  });

  const handleEdit = (sale: FlashSale) => {
    setEditingSale(sale);
    setIsFormOpen(true);
  };

  const handlePreview = (data: FlashSaleInput) => {
    setPreviewSale(data);
  };

  return (
    <div className="space-y-8 p-6 lg:p-10 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-display font-black uppercase tracking-tighter text-white flex items-center gap-3">
            <Flame className="size-8 text-primary animate-pulse" />
            Flash Sale Center
          </h1>
          <p className="text-muted-foreground max-w-xl">
            Create and manage limited-time offers with custom schedules and pricing.
          </p>
        </div>
        <Button 
          onClick={() => {
            setEditingSale(null);
            setIsFormOpen(true);
          }}
          className="shadow-3d-primary active:translate-y-0.5"
        >
          <Plus className="mr-2 size-4" />
          Create Flash Sale
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-zinc-900/50 border-white/10 overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="size-4 text-emerald-500" />
              Active Now
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-display font-black text-white">
              {sales.filter(s => s.isActive).length}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-zinc-900/50 border-white/10 overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Clock className="size-4 text-primary" />
              Scheduled
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-display font-black text-white">
              {sales.filter(s => !s.isActive && (s.startDate || s.startTime)).length}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900/50 border-white/10 overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <AlertCircle className="size-4 text-yellow-500" />
              Expired
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-display font-black text-white">0</div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-black/40 border-white/10 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-lg font-bold uppercase tracking-tighter text-white">All Flash Sales</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-white/5">
                <TableHead className="text-white/60">Sale Name</TableHead>
                <TableHead className="text-white/60">Discount</TableHead>
                <TableHead className="text-white/60">Schedule</TableHead>
                <TableHead className="text-white/60">Products</TableHead>
                <TableHead className="text-white/60">Status</TableHead>
                <TableHead className="text-right text-white/60">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-32 bg-white/5" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20 bg-white/5" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-40 bg-white/5" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-12 bg-white/5" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20 bg-white/5" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto bg-white/5" /></TableCell>
                  </TableRow>
                ))
              ) : sales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground italic">
                    No flash sales created yet.
                  </TableCell>
                </TableRow>
              ) : (
                sales.map((sale) => (
                  <TableRow key={sale.id} className="group hover:bg-white/[0.02] border-white/5 transition-colors">
                    <TableCell className="font-bold text-white uppercase tracking-tight">
                      {sale.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                        {sale.discountType === "percentage" ? `${sale.discountValue}%` : `৳${sale.discountValue.toLocaleString()}`}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {sale.startDate ? (
                          <span className="text-xs text-white/80 flex items-center gap-1">
                            <Calendar className="size-3 text-primary" />
                            {sale.startDate} {sale.endDate && `→ ${sale.endDate}`}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">No dates set</span>
                        )}
                        {sale.startTime && (
                          <span className="text-[10px] text-white/60 flex items-center gap-1 font-mono uppercase">
                            <Clock className="size-3" />
                            {sale.startTime} {sale.endTime && `→ ${sale.endTime}`}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-white/10 text-white/60">
                        {sale.productIds.length} Products
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={sale.isActive ? "bg-emerald-500 text-white" : "bg-zinc-800 text-muted-foreground"}>
                        {sale.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="size-8 text-white/60 hover:text-primary"
                          onClick={() => handleEdit(sale)}
                        >
                          <Edit2 className="size-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="size-8 text-white/60 hover:text-red-500"
                          onClick={() => setSaleToDelete(sale.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-4xl bg-zinc-950 border-white/10 text-white max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl uppercase tracking-tighter">
              {editingSale ? "Edit Flash Sale" : "New Flash Sale"}
            </DialogTitle>
            <DialogDescription>
              Configure offer details, scheduling, and product selection.
            </DialogDescription>
          </DialogHeader>

          <FlashSaleForm 
            initialData={editingSale || {}} 
            products={products}
            isSubmitting={saveMutation.isPending}
            onSubmit={async (data) => {
              saveMutation.mutate(data);
            }}
          />
        </DialogContent>
      </Dialog>

      {previewSale && (
        <FlashSalePreviewDialog 
          open={!!previewSale} 
          onOpenChange={(open) => !open && setPreviewSale(null)} 
          sale={previewSale}
          products={products.map(p => ({
            id: p.id,
            name: p.name,
            price: p.price,
            imageUrl: p.imageUrl || undefined
          }))}
        />
      )}

      <AlertDialog open={!!saleToDelete} onOpenChange={(open) => !open && setSaleToDelete(null)}>
        <AlertDialogContent className="bg-zinc-900 border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              This will permanently delete the Flash Sale offer. Normal pricing will be restored for all affected products.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => saleToDelete && deleteMutation.mutate(saleToDelete)}
            >
              Delete Offer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
