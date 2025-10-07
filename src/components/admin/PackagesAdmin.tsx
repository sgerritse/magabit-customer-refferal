import { useState } from 'react';
import { useAllPackages } from '@/hooks/usePackages';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Loader2, Users } from 'lucide-react';

export const PackagesAdmin = () => {
  const { data: packages, refetch } = useAllPackages();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<any>(null);
  const [showCustomerManagement, setShowCustomerManagement] = useState(false);
  const [packageCustomers, setPackageCustomers] = useState<any[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    billing_period: 'monthly',
    trial_days: '0',
    trial_price: '0',
    regular_price: '',
    stripe_price_id: '',
    woocommerce_product_id: '',
    is_active: true,
    show_on_plans_page: true,
    features: '',
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      billing_period: 'monthly',
      trial_days: '0',
      trial_price: '0',
      regular_price: '',
      stripe_price_id: '',
      woocommerce_product_id: '',
      is_active: true,
      show_on_plans_page: true,
      features: '',
    });
    setEditingPackage(null);
  };

  const handleEdit = (pkg: any) => {
    setEditingPackage(pkg);
    setFormData({
      name: pkg.name,
      description: pkg.description || '',
      price: pkg.price.toString(),
      billing_period: pkg.billing_period,
      trial_days: pkg.trial_days.toString(),
      trial_price: pkg.trial_price.toString(),
      regular_price: pkg.regular_price?.toString() || '',
      stripe_price_id: pkg.stripe_price_id || '',
      woocommerce_product_id: pkg.woocommerce_product_id || '',
      is_active: pkg.is_active,
      show_on_plans_page: pkg.show_on_plans_page ?? true,
      features: Array.isArray(pkg.features) ? pkg.features.join('\n') : '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const featuresArray = formData.features
      .split('\n')
      .map((f) => f.trim())
      .filter((f) => f.length > 0);

    const packageData = {
      name: formData.name,
      description: formData.description || null,
      price: parseFloat(formData.price),
      billing_period: formData.billing_period,
      trial_days: parseInt(formData.trial_days),
      trial_price: parseFloat(formData.trial_price),
      regular_price: formData.regular_price ? parseFloat(formData.regular_price) : null,
      stripe_price_id: formData.stripe_price_id || null,
      woocommerce_product_id: formData.woocommerce_product_id || null,
      is_active: formData.is_active,
      show_on_plans_page: formData.show_on_plans_page,
      features: featuresArray,
    };

    try {
      if (editingPackage) {
        const { error } = await supabase
          .from('packages')
          .update(packageData)
          .eq('id', editingPackage.id);

        if (error) throw error;
        toast.success('Package updated successfully');
      } else {
        const { error } = await supabase.from('packages').insert(packageData);

        if (error) throw error;
        toast.success('Package created successfully');
      }

      setIsDialogOpen(false);
      resetForm();
      refetch();
    } catch (error) {
      console.error('Error saving package:', error);
      toast.error('Failed to save package');
    }
  };

  const handleViewCustomers = async (pkg: any) => {
    setLoadingCustomers(true);
    setShowCustomerManagement(true);
    setEditingPackage(pkg);
    
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select(`
          id,
          user_id,
          status,
          created_at,
          profiles:user_id (display_name, user_id)
        `)
        .eq('package_id', pkg.id);

      if (error) throw error;
      setPackageCustomers(data || []);
    } catch (error) {
      console.error('Error loading customers:', error);
      toast.error('Failed to load customers');
    } finally {
      setLoadingCustomers(false);
    }
  };

  const handleRemovePlan = async (subscriptionId: string) => {
    if (!confirm('Are you sure you want to remove this subscription?')) return;

    try {
      const { error } = await supabase
        .from('user_subscriptions')
        .delete()
        .eq('id', subscriptionId);

      if (error) throw error;
      toast.success('Subscription removed successfully');
      handleViewCustomers(editingPackage);
      refetch();
    } catch (error) {
      console.error('Error removing subscription:', error);
      toast.error('Failed to remove subscription');
    }
  };

  const handleSwitchPlan = async (subscriptionId: string) => {
    const targetPackageId = prompt('Enter the package ID to switch to:');
    if (!targetPackageId) return;

    try {
      const { error } = await supabase
        .from('user_subscriptions')
        .update({ package_id: targetPackageId })
        .eq('id', subscriptionId);

      if (error) throw error;
      toast.success('Subscription switched successfully');
      handleViewCustomers(editingPackage);
      refetch();
    } catch (error) {
      console.error('Error switching subscription:', error);
      toast.error('Failed to switch subscription');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { data: subscriptions, error: checkError } = await supabase
        .from('user_subscriptions')
        .select('id')
        .eq('package_id', id)
        .limit(1);

      if (checkError) throw checkError;

      if (subscriptions && subscriptions.length > 0) {
        toast.error(
          'Cannot delete package with active subscriptions. Please deactivate it instead.',
          { duration: 5000 }
        );
        return;
      }

      if (!confirm('Are you sure you want to delete this package?')) return;

      const { error } = await supabase.from('packages').delete().eq('id', id);

      if (error) throw error;
      toast.success('Package deleted successfully');
      refetch();
    } catch (error) {
      console.error('Error deleting package:', error);
      toast.error('Failed to delete package');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">App-Specific Packages</h2>
          <p className="text-sm text-muted-foreground">
            Manage internal packages for special features or testing. Main subscription plans come from WooCommerce.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Package
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingPackage ? 'Edit Package' : 'Create New Package'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Package Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Price (USD)</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="billing_period">Billing Period</Label>
                  <Select
                    value={formData.billing_period}
                    onValueChange={(value) => setFormData({ ...formData, billing_period: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="trial">Trial</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="trial_days">Trial Days</Label>
                  <Input
                    id="trial_days"
                    type="number"
                    value={formData.trial_days}
                    onChange={(e) => setFormData({ ...formData, trial_days: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="trial_price">Trial Price (USD)</Label>
                  <Input
                    id="trial_price"
                    type="number"
                    step="0.01"
                    value={formData.trial_price}
                    onChange={(e) => setFormData({ ...formData, trial_price: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="stripe_price_id">Stripe Price ID</Label>
                <Input
                  id="stripe_price_id"
                  value={formData.stripe_price_id}
                  onChange={(e) => setFormData({ ...formData, stripe_price_id: e.target.value })}
                  placeholder="price_xxxxx"
                />
              </div>

              <div>
                <Label htmlFor="features">Features (one per line)</Label>
                <Textarea
                  id="features"
                  value={formData.features}
                  onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                  rows={5}
                  placeholder="Access to all features&#10;Cancel anytime&#10;24/7 support"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="show_on_plans_page"
                  checked={formData.show_on_plans_page}
                  onCheckedChange={(checked) => setFormData({ ...formData, show_on_plans_page: checked })}
                />
                <Label htmlFor="show_on_plans_page">Show on Plans Page</Label>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingPackage ? 'Update Package' : 'Create Package'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {packages?.map((pkg) => (
          <Card key={pkg.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-xl font-bold">{pkg.name}</CardTitle>
                <Badge variant="default" className="bg-muted text-foreground">App Package</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={pkg.is_active ? 'default' : 'secondary'}>
                  {pkg.is_active ? 'Active' : 'Inactive'}
                </Badge>
                <Badge variant={pkg.show_on_plans_page ? 'default' : 'outline'}>
                  {pkg.show_on_plans_page ? 'Visible on Plans' : 'Hidden from Plans'}
                </Badge>
                <Button variant="outline" size="sm" onClick={() => handleViewCustomers(pkg)}>
                  <Users className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleEdit(pkg)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(pkg.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Price</p>
                  <p className="font-semibold">
                    ${pkg.price.toFixed(2)} / {pkg.billing_period}
                  </p>
                </div>
                {pkg.trial_days > 0 && (
                  <div>
                    <p className="text-muted-foreground">Trial</p>
                    <p className="font-semibold">
                      ${pkg.trial_price.toFixed(2)} for {pkg.trial_days} days
                    </p>
                  </div>
                )}
                {pkg.stripe_price_id && (
                  <div>
                    <p className="text-muted-foreground">Stripe Price ID</p>
                    <p className="font-mono text-xs">{pkg.stripe_price_id}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showCustomerManagement} onOpenChange={setShowCustomerManagement}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Customers - {editingPackage?.name}</DialogTitle>
          </DialogHeader>
          {loadingCustomers ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : packageCustomers.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No customers subscribed to this package</p>
          ) : (
            <div className="space-y-4">
              {packageCustomers.map((sub) => (
                <Card key={sub.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold">{sub.profiles?.display_name || 'Unknown User'}</p>
                        <p className="text-sm text-muted-foreground">Status: {sub.status}</p>
                        <p className="text-xs text-muted-foreground">
                          Subscribed: {new Date(sub.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSwitchPlan(sub.id)}
                        >
                          Switch Plan
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRemovePlan(sub.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
