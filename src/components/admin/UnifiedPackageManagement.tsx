import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Package, ShoppingCart, Edit, Trash2, GripVertical, DollarSign, Calendar, Gift } from "lucide-react";
import { useWooCommerceProducts } from "@/hooks/useWooCommerceProducts";
import { usePlanDisplayConfigs, useCreatePlanConfig, useUpdatePlanConfig, useDeletePlanConfig, PlanDisplayConfig } from "@/hooks/usePlanDisplayConfigs";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Helper functions to extract pricing information
const extractPricingInfo = (config: PlanDisplayConfig) => {
  const data = config.original_data;
  if (!data) return null;

  if (config.product_source === 'woocommerce') {
    return {
      price: data.price,
      regularPrice: data.regular_price,
      salePrice: data.sale_price,
      signupFee: data.subscription_sign_up_fee,
      trialLength: data.subscription_trial_length,
      trialPeriod: data.subscription_trial_period,
      billingCycle: data.billing_cycle,
    };
  } else {
    // Internal package
    return {
      price: data.price,
      regularPrice: data.regular_price,
      trialDays: data.trial_days,
      trialPrice: data.trial_price,
      billingPeriod: data.billing_period,
    };
  }
};

interface SortableCardProps {
  config: PlanDisplayConfig;
  onEdit: (config: PlanDisplayConfig) => void;
  onDelete: (id: string) => void;
  getDisplayTitle: (config: PlanDisplayConfig) => string;
  getDisplayDescription: (config: PlanDisplayConfig) => string;
}

const SortableCard = ({ config, onEdit, onDelete, getDisplayTitle, getDisplayDescription }: SortableCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: config.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const pricing = extractPricingInfo(config);

  return (
    <Card ref={setNodeRef} style={style} className="relative">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2 flex-1">
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </div>
          <CardTitle className="text-lg">{getDisplayTitle(config)}</CardTitle>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => onEdit(config)}>
            <Edit className="w-4 h-4" />
          </Button>
          <Button variant="destructive" size="sm" onClick={() => onDelete(config.id)}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 text-sm">
          <p className="text-muted-foreground">{getDisplayDescription(config)}</p>
          
          {/* Pricing Information */}
          {pricing && (
            <div className="bg-muted/50 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary" />
                <span className="font-semibold text-base">
                  {pricing.salePrice || pricing.price ? (
                    <>
                      {pricing.salePrice && pricing.regularPrice && pricing.salePrice !== pricing.regularPrice ? (
                        <>
                          <span className="line-through text-muted-foreground mr-2">${pricing.regularPrice}</span>
                          <span className="text-primary">${pricing.salePrice}</span>
                        </>
                      ) : (
                        <span>${pricing.price || pricing.regularPrice}</span>
                      )}
                      {pricing.billingCycle && <span className="text-sm font-normal text-muted-foreground"> / {pricing.billingCycle}</span>}
                      {pricing.billingPeriod && <span className="text-sm font-normal text-muted-foreground"> / {pricing.billingPeriod}</span>}
                    </>
                  ) : (
                    <span className="text-muted-foreground">No price set</span>
                  )}
                </span>
              </div>

              {/* Trial Information */}
              {((pricing.trialLength && pricing.trialPeriod) || pricing.trialDays) && (
                <div className="flex items-center gap-2 text-xs">
                  <Gift className="w-3 h-3 text-accent" />
                  <span>
                    Trial: {pricing.trialLength} {pricing.trialPeriod || `${pricing.trialDays} days`}
                    {pricing.trialPrice !== undefined && ` at $${pricing.trialPrice}`}
                  </span>
                </div>
              )}

              {/* Signup Fee */}
              {pricing.signupFee && parseFloat(pricing.signupFee) > 0 && (
                <div className="flex items-center gap-2 text-xs">
                  <Calendar className="w-3 h-3 text-muted-foreground" />
                  <span>Signup Fee: ${pricing.signupFee}</span>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-4 text-xs flex-wrap">
            <span className="inline-flex items-center gap-1">
              {config.product_source === 'woocommerce' ? (
                <><ShoppingCart className="w-3 h-3" /> WooCommerce</>
              ) : (
                <><Package className="w-3 h-3" /> Internal</>
              )}
            </span>
            <span className="inline-flex items-center gap-1 font-mono bg-muted px-2 py-0.5 rounded">
              ID: {config.product_id}
            </span>
            <span className={config.show_on_plans_page ? "text-green-600" : "text-muted-foreground"}>
              {config.show_on_plans_page ? "Visible on Plans Page" : "Hidden from Plans Page"}
            </span>
          </div>
          
          {config.custom_features && config.custom_features.length > 0 && (
            <div className="mt-2">
              <p className="font-medium mb-1">Features:</p>
              <ul className="list-disc list-inside space-y-1">
                {config.custom_features.map((feature: string, idx: number) => (
                  <li key={idx} className="text-muted-foreground">{feature}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export const UnifiedPackageManagement = () => {
  const { data: planConfigs, isLoading } = usePlanDisplayConfigs();
  const { data: wooProducts } = useWooCommerceProducts();
  const createPlanConfig = useCreatePlanConfig();
  const updatePlanConfig = useUpdatePlanConfig();
  const deletePlanConfig = useDeletePlanConfig();
  const queryClient = useQueryClient();

  // Debug: Log WooCommerce products structure
  if (wooProducts && wooProducts.length > 0) {
    console.log('WooCommerce Products:', wooProducts.map(p => ({
      id: p.id,
      parent_product_id: p.parent_product_id,
      variation_id: p.variation_id,
      name: p.name,
      type: p.type
    })));
  }

  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = planConfigs?.findIndex((item) => item.id === active.id) ?? -1;
      const newIndex = planConfigs?.findIndex((item) => item.id === over.id) ?? -1;

      if (oldIndex !== -1 && newIndex !== -1 && planConfigs) {
        const newOrder = arrayMove(planConfigs, oldIndex, newIndex);
        
        // Update display_order for all affected items
        // Using direct Supabase calls to avoid multiple toast notifications
        try {
          for (let i = 0; i < newOrder.length; i++) {
            await supabase
              .from('plan_display_configs')
              .update({ display_order: i })
              .eq('id', newOrder[i].id);
          }
          // Invalidate queries to refresh the UI
          queryClient.invalidateQueries({ queryKey: ['plan-display-configs'] });
        } catch (error) {
          console.error("Failed to update display order", error);
        }
      }
    }
  };

  const handleImportSelected = async () => {
    if (selectedProducts.size === 0) {
      console.warn("Please select at least one product to import");
      return;
    }

    try {
      const productsToImport = wooProducts?.filter(p => {
        const productId = p.variation_id && p.parent_product_id 
          ? `${p.parent_product_id}-${p.variation_id}`
          : p.id.toString();
        return selectedProducts.has(productId);
      }) || [];

      for (const product of productsToImport) {
        const productId = product.variation_id && product.parent_product_id
          ? `${product.parent_product_id}-${product.variation_id}`
          : product.id.toString();
        
        await createPlanConfig.mutateAsync({
          product_source: 'woocommerce',
          product_id: productId,
          custom_title: null,
          custom_description: null,
          custom_features: [],
          show_on_plans_page: false,
          display_order: planConfigs?.length || 0,
          is_active: true,
          original_data: product,
          last_synced_at: new Date().toISOString(),
        });
      }

      console.log(`Imported ${productsToImport.length} product(s)`);
      setSelectedProducts(new Set());
      setSyncDialogOpen(false);
    } catch (error) {
      console.error("Error importing products:", error);
    }
  };

  const getExistingProductIds = () => {
    return new Set(
      planConfigs
        ?.filter(config => config.product_source === 'woocommerce')
        .map(config => config.product_id) || []
    );
  };

  const handleEdit = (config: PlanDisplayConfig) => {
    setEditingPlan({
      ...config,
      custom_features: config.custom_features.join('\n'),
    });
    setEditDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingPlan) return;

    try {
      const features = editingPlan.custom_features
        ? editingPlan.custom_features.split('\n').filter((f: string) => f.trim())
        : [];

      await updatePlanConfig.mutateAsync({
        id: editingPlan.id,
        updates: {
          custom_title: editingPlan.custom_title || null,
          custom_description: editingPlan.custom_description || null,
          custom_features: features.length > 0 ? features : [],
          show_on_plans_page: editingPlan.show_on_plans_page,
        },
      });

      setEditDialogOpen(false);
      setEditingPlan(null);
    } catch (error) {
      console.error("Error updating plan:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this plan configuration?")) {
      try {
        await deletePlanConfig.mutateAsync(id);
        // Hook will show a single toast; avoid duplicating here
      } catch (error) {
        console.error("Error deleting plan:", error);
      }
    }
  };

  const getDisplayTitle = (config: PlanDisplayConfig) => {
    if (config.custom_title) return config.custom_title;
    return config.original_data?.name || 'Untitled Package';
  };

  const getDisplayDescription = (config: PlanDisplayConfig) => {
    if (config.custom_description) return config.custom_description;
    return config.original_data?.description || config.original_data?.short_description || '';
  };

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">Membership Plans</h3>
              <p className="text-sm">
                Drag to reorder • Edit to customize titles, descriptions, and features
              </p>
            </div>
            <Button onClick={() => setSyncDialogOpen(true)} disabled={!wooProducts}>
              <ShoppingCart className="w-4 h-4 mr-2" />
              Import WooCommerce Products
            </Button>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={planConfigs?.map(c => c.id) || []}
              strategy={verticalListSortingStrategy}
            >
              <div className="grid gap-4">
                {planConfigs?.map((config) => (
                  <SortableCard
                    key={config.id}
                    config={config}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    getDisplayTitle={getDisplayTitle}
                    getDisplayDescription={getDisplayDescription}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </>
      )}

      {/* Import WooCommerce Products Dialog */}
      <Dialog open={syncDialogOpen} onOpenChange={setSyncDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Import WooCommerce Products</DialogTitle>
            <DialogDescription>
              Select which WooCommerce products to import as plan configurations
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {wooProducts && wooProducts.length > 0 ? (
              <div className="space-y-2">
                {wooProducts.map((product) => {
                  const productId = product.variation_id && product.parent_product_id
                    ? `${product.parent_product_id}-${product.variation_id}`
                    : product.id.toString();
                  const isExisting = getExistingProductIds().has(productId);
                  const isSelected = selectedProducts.has(productId);

                  return (
                    <div
                      key={productId}
                      className={`flex items-start space-x-3 p-3 border rounded-lg ${
                        isExisting ? 'bg-muted opacity-60' : ''
                      }`}
                    >
                      <Checkbox
                        id={productId}
                        checked={isSelected}
                        disabled={isExisting}
                        onCheckedChange={(checked) => {
                          const newSelected = new Set(selectedProducts);
                          if (checked) {
                            newSelected.add(productId);
                          } else {
                            newSelected.delete(productId);
                          }
                          setSelectedProducts(newSelected);
                        }}
                      />
                      <div className="flex-1">
                        <label
                          htmlFor={productId}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {product.name}
                          {isExisting && <span className="ml-2 text-xs text-muted-foreground">(Already imported)</span>}
                        </label>
                        <p className="text-sm text-muted-foreground mt-1">
                          {product.short_description || product.description}
                        </p>
                        <p className="text-sm font-medium mt-1">
                          ${product.price} / {product.billing_cycle || 'one-time'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No WooCommerce products available</p>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setSyncDialogOpen(false);
                setSelectedProducts(new Set());
              }}>
                Cancel
              </Button>
              <Button onClick={handleImportSelected} disabled={selectedProducts.size === 0}>
                Import {selectedProducts.size > 0 ? `(${selectedProducts.size})` : ''}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Plan Configuration Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Plan Configuration</DialogTitle>
            <DialogDescription>
              Customize the display of this plan on the Plans page
            </DialogDescription>
          </DialogHeader>
          {editingPlan && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="custom_title">Custom Title (optional)</Label>
                <Input
                  id="custom_title"
                  value={editingPlan.custom_title || ''}
                  onChange={(e) => setEditingPlan({ ...editingPlan, custom_title: e.target.value })}
                  placeholder="Leave empty to use original title"
                />
              </div>

              <div>
                <Label htmlFor="custom_description">Custom Description (optional)</Label>
                <Textarea
                  id="custom_description"
                  value={editingPlan.custom_description || ''}
                  onChange={(e) => setEditingPlan({ ...editingPlan, custom_description: e.target.value })}
                  placeholder="Leave empty to use original description"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="custom_features">Custom Features (one per line, optional)</Label>
                <Textarea
                  id="custom_features"
                  value={editingPlan.custom_features || ''}
                  onChange={(e) => setEditingPlan({ ...editingPlan, custom_features: e.target.value })}
                  placeholder="Enter each feature on a new line"
                  rows={5}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="show_on_plans_page"
                  checked={editingPlan.show_on_plans_page}
                  onCheckedChange={(checked) => setEditingPlan({ ...editingPlan, show_on_plans_page: checked })}
                />
                <Label htmlFor="show_on_plans_page">Show on Plans Page</Label>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
