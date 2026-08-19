import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save, Plus, Trash2, Calendar, Clock, Percent, Banknote, Package } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { flashSaleInput, type FlashSaleInput } from "@/lib/flash.shared";
import { Card, CardContent } from "@/components/ui/card";
import { MultiSelect } from "@/components/ui/multi-select";

interface FlashSaleFormProps {
  initialData?: Partial<FlashSaleInput>;
  onSubmit: (data: FlashSaleInput) => Promise<void>;
  products: { id: string; name: string }[];
  isSubmitting?: boolean;
}

export function FlashSaleForm({ initialData, onSubmit, products, isSubmitting }: FlashSaleFormProps) {
  const form = useForm<FlashSaleInput>({
    resolver: zodResolver(flashSaleInput),
    defaultValues: {
      name: "",
      description: "",
      discountType: "percentage",
      discountValue: 0,
      isActive: false,
      priority: 0,
      productIds: [],
      ...initialData,
    },
  });

  const productOptions = products.map(p => ({
    label: p.name,
    value: p.id,
  }));

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <Card className="bg-zinc-900/50 border-white/10">
              <CardContent className="pt-6 space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Flash Sale Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Eid Ultimate Sale" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Optional marketing text..." 
                          className="resize-none"
                          {...field} 
                          value={field.value || ""} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-center justify-between p-4 rounded-lg bg-black/20 border border-white/5">
                  <div className="space-y-0.5">
                    <Label>Active Status</Label>
                    <p className="text-xs text-muted-foreground">Turn offer ON/OFF globally</p>
                  </div>
                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900/50 border-white/10">
              <CardContent className="pt-6 space-y-6">
                <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-tighter text-sm">
                  <Package className="size-4" />
                  Product Selection
                </div>
                
                <FormField
                  control={form.control}
                  name="productIds"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Products</FormLabel>
                      <FormControl>
                        <MultiSelect
                          options={productOptions}
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          placeholder="Select products for this sale..."
                          variant="inverted"
                        />
                      </FormControl>
                      <FormDescription>
                        Only selected products will receive Flash Sale pricing.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="bg-zinc-900/50 border-white/10">
              <CardContent className="pt-6 space-y-6">
                <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-tighter text-sm">
                  <Calendar className="size-4" />
                  Schedule (Optional)
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground italic">
                  All times are in Asia/Dhaka (UTC+6). If left blank, offer is active immediately when ON.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900/50 border-white/10">
              <CardContent className="pt-6 space-y-6">
                <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-tighter text-sm">
                  <Percent className="size-4" />
                  Pricing Configuration
                </div>

                <FormField
                  control={form.control}
                  name="discountType"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Discount Method</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex gap-4"
                        >
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="percentage" />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">
                              Percentage (%)
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="fixed" />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">
                              Fixed Sale Price (৳)
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="discountValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Value</FormLabel>
                      <FormControl>
                        <div className="relative">
                          {form.watch("discountType") === "percentage" ? (
                            <Percent className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                          ) : (
                            <Banknote className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                          )}
                          <Input 
                            type="number" 
                            className="pl-9" 
                            {...field} 
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} 
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        {form.watch("discountType") === "percentage" 
                          ? "Enter the % to deduct from original price." 
                          : "Enter the final Flash Sale price in ৳."}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-white/10">
          <Button type="submit" disabled={isSubmitting} className="shadow-3d-primary active:translate-y-0.5">
            {isSubmitting ? "Saving..." : "Save Flash Sale"}
            <Save className="ml-2 size-4" />
          </Button>
        </div>
      </form>
    </Form>
  );
}
