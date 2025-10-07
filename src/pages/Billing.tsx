import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { NavigationBar } from "@/components/dashboard/NavigationBar";
import { NavigationDrawer } from "@/components/dashboard/NavigationDrawer";
import { AdminSwitchFooter } from "@/components/AdminSwitchFooter";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2, CreditCard, Calendar, DollarSign, MapPin } from "lucide-react";
import { format } from "date-fns";

const Billing = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);
  const [packageInfo, setPackageInfo] = useState<any>(null);
  const [billingAddress, setBillingAddress] = useState<any>(null);
  const [stripeCustomer, setStripeCustomer] = useState<any>(null);
  
  // Dialog states
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  
  // Address form state
  const [addressForm, setAddressForm] = useState({
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'United States',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      loadBillingData();
    }
  }, [user]);

  const loadBillingData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Load subscription
      const { data: subData, error: subError } = await supabase
        .from('user_subscriptions')
        .select('*, packages(*)')
        .eq('user_id', user.id)
        .maybeSingle();

      if (subError) throw subError;

      setSubscription(subData);
      setPackageInfo(subData?.packages);
      
      // Load billing address using secure decryption function
      const { data: billingData, error: billingError } = await supabase
        .rpc('get_billing_address_decrypted', { target_user_id: user.id })
        .maybeSingle();

      if (billingError && billingError.code !== 'PGRST116') {
        throw billingError;
      }

      setBillingAddress(billingData);

      // Load Stripe payment method info
      const { data: stripeData, error: stripeError } = await supabase
        .from('stripe_customers')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (stripeError && stripeError.code !== 'PGRST116') {
        console.error('Error loading Stripe customer:', stripeError);
      }

      setStripeCustomer(stripeData);
      
      // Sync payment method from Stripe
      try {
        const { data: syncData, error: syncError } = await supabase.functions.invoke('sync-payment-method');
        if (!syncError && syncData?.synced) {
          // Reload to show updated data
          const { data: updatedStripeData } = await supabase
            .from('stripe_customers')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();
          if (updatedStripeData) {
            setStripeCustomer(updatedStripeData);
          }
        }
      } catch (error) {
        console.log('Could not sync payment method:', error);
      }
      
      // Populate address form if data exists
      if (billingData) {
        setAddressForm({
          address_line1: billingData.address_line1 || '',
          address_line2: billingData.address_line2 || '',
          city: billingData.city || '',
          state: billingData.state || '',
          postal_code: billingData.postal_code || '',
          country: billingData.country || 'United States',
        });
      }
    } catch (error: any) {
      console.error('Error loading billing data:', error);
      toast({
        title: "Error",
        description: "Failed to load billing information",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = (planType: 'monthly' | 'yearly') => {
    toast({
      title: "Coming Soon",
      description: `Upgrade to ${planType} plan will be available soon!`,
    });
  };

  const openStripePortal = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to manage payment methods",
        variant: "destructive",
      });
      return;
    }
    
    try {
      toast({
        title: "Opening Stripe Customer Portal",
        description: "Redirecting you to securely manage your payment methods...",
      });

      const { data, error } = await supabase.functions.invoke('customer-portal');
      
      if (error) throw error;
      if (!data?.url) throw new Error('No portal URL returned');
      
      // Open Stripe Customer Portal in new tab
      window.open(data.url, '_blank');
    } catch (error) {
      console.error("Error opening Stripe portal:", error);
      toast({
        title: "Error",
        description: "Failed to open payment portal. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const handleCancelSubscription = async () => {
    // Use Stripe Customer Portal for cancellation
    await openStripePortal();
  };
  
  const handleUpdateAddress = async () => {
    if (!user) return;
    
    try {
      // Encrypt sensitive address fields before saving
      const { data: encryptedAddress, error: encryptError } = await supabase.functions.invoke(
        'encrypt-billing-address',
        {
          body: {
            address_line1: addressForm.address_line1,
            address_line2: addressForm.address_line2,
            city: addressForm.city,
            state: addressForm.state,
            postal_code: addressForm.postal_code,
            country: addressForm.country,
            user_id: user.id,
          }
        }
      );

      if (encryptError) throw encryptError;
      
      toast({
        title: "Success",
        description: "Billing address updated successfully",
      });
      
      setAddressDialogOpen(false);
      loadBillingData();
    } catch (error: any) {
      console.error('Error updating address:', error);
      toast({
        title: "Error",
        description: "Failed to update billing address",
        variant: "destructive",
      });
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <NavigationBar onMenuClick={() => setDrawerOpen(true)} />
      <NavigationDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 mt-16">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Billing & Subscription</h1>
          <p className="text-primary-foreground/80 mt-2">Manage your subscription and billing information</p>
        </div>

        {/* Current Subscription */}
        <Card className="card-gradient border-card-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Current Subscription
            </CardTitle>
            <CardDescription>Your active plan details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {subscription ? (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold">{packageInfo?.name || 'No Plan'}</h3>
                    <p className="text-sm text-muted-foreground">{packageInfo?.description}</p>
                  </div>
                  <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'}>
                    {subscription.status}
                  </Badge>
                </div>

                {/* Trial Information */}
                {packageInfo?.trial_days > 0 && (
                  <div className="bg-accent/10 border border-accent/20 rounded-lg p-4 mt-4">
                    <h4 className="font-semibold text-accent mb-2">Trial Period Active</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Trial Started:</span>
                        <span className="font-medium">
                          {format(new Date(subscription.created_at), 'MMM dd, yyyy')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Trial Duration:</span>
                        <span className="font-medium">{packageInfo.trial_days} days</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Trial Price:</span>
                        <span className="font-medium">${packageInfo.trial_price}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">After Trial:</span>
                        <span className="font-medium">${packageInfo.price}/month</span>
                      </div>
                    </div>
                  </div>
                )}

                {packageInfo && packageInfo.trial_days === 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Price</p>
                        <p className="font-semibold">${packageInfo.price} / {packageInfo.billing_period}</p>
                      </div>
                    </div>
                    
                    {subscription.current_period_end && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Next Billing Date</p>
                          <p className="font-semibold">
                            {format(new Date(subscription.current_period_end), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">You don't have an active subscription</p>
                <Button onClick={() => navigate('/register')}>
                  Choose a Plan
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Method */}
        {subscription && (
          <Card className="card-gradient border-card-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Method
              </CardTitle>
              <CardDescription>Manage your card and billing information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Payment Method - Managed via Stripe */}
              <div className="p-4 border rounded-lg bg-gradient-to-br from-primary/5 to-accent/5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <CreditCard className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">Secure Payment Method</p>
                    <p className="text-xs text-muted-foreground">
                      Managed through Stripe's PCI-compliant platform
                    </p>
                  </div>
                </div>
                
                {stripeCustomer?.card_last_four ? (
                  <div className="p-3 bg-background border rounded-lg mb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          {stripeCustomer.card_brand?.charAt(0).toUpperCase() + stripeCustomer.card_brand?.slice(1) || 'Card'} •••• {stripeCustomer.card_last_four}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Expires {stripeCustomer.card_exp_month}/{stripeCustomer.card_exp_year}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 text-green-600">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-xs font-medium">Verified</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-background border border-dashed rounded-lg mb-4">
                    <p className="text-sm text-muted-foreground">No payment method on file</p>
                  </div>
                )}
                
                <Button 
                  onClick={openStripePortal}
                  className="w-full"
                  variant="default"
                >
                  🔒 Manage Payment Methods
                </Button>
                
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Opens Stripe's secure portal. Your card data is never stored on our servers.
                </p>
              </div>

              {/* Billing Address */}
              <div className="space-y-4 mt-4">
                <div className="flex items-start justify-between p-4 border rounded-lg">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Billing Address</p>
                      {billingAddress?.address_line1 ? (
                        <>
                          <p className="text-sm text-muted-foreground mt-1">
                            {billingAddress.address_line1}
                          </p>
                          {billingAddress.address_line2 && (
                            <p className="text-sm text-muted-foreground">
                              {billingAddress.address_line2}
                            </p>
                          )}
                          <p className="text-sm text-muted-foreground">
                            {billingAddress.city}, {billingAddress.state} {billingAddress.postal_code}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {billingAddress.country}
                          </p>
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground mt-1">
                          No address on file
                        </p>
                      )}
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setAddressDialogOpen(true)}
                  >
                    {billingAddress?.address_line1 ? 'Update' : 'Add Address'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upgrade Options */}
        {subscription && (
          <Card className="card-gradient border-card-border">
            <CardHeader>
              <CardTitle>Upgrade Your Plan</CardTitle>
              <CardDescription>Get more value with our flexible plans</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6 h-full flex flex-col">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-2">Monthly Plan</h3>
                      <div className="mb-2">
                        <p className="text-sm text-muted-foreground line-through">$199/month</p>
                        <p className="text-3xl font-bold">$99<span className="text-sm font-normal text-muted-foreground">/month</span></p>
                      </div>
                      <p className="text-sm text-success mb-4">Save $100 per month!</p>
                    </div>
                    <Button 
                      onClick={() => handleUpgrade('monthly')} 
                      className="w-full"
                      variant="outline"
                    >
                      Switch to Monthly
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6 h-full flex flex-col">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-2">Yearly Plan</h3>
                      <div className="mb-2">
                        <p className="text-sm text-muted-foreground line-through">$2,388/year</p>
                        <p className="text-3xl font-bold">$829<span className="text-sm font-normal text-muted-foreground">/year</span></p>
                      </div>
                      <p className="text-sm text-success mb-4">Save $1,559 per year!</p>
                    </div>
                    <Button 
                      onClick={() => handleUpgrade('yearly')} 
                      className="w-full"
                    >
                      Switch to Yearly
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cancel Subscription */}
        {subscription && subscription.status === 'active' && (
          <Card className="card-gradient border-card-border">
            <CardHeader>
              <CardTitle>Cancel Subscription</CardTitle>
              <CardDescription>Need to cancel? We're here to help</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                If you cancel your subscription, you'll still have access until the end of your current billing period.
              </p>
              <Button 
                onClick={handleCancelSubscription}
                variant="destructive"
              >
                Cancel Subscription
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Update Address Dialog */}
      <Dialog open={addressDialogOpen} onOpenChange={setAddressDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Billing Address</DialogTitle>
            <DialogDescription>
              Enter your billing address information.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="address_line1">Address Line 1</Label>
              <Input
                id="address_line1"
                placeholder="123 Main Street"
                value={addressForm.address_line1}
                onChange={(e) => setAddressForm({...addressForm, address_line1: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address_line2">Address Line 2 (Optional)</Label>
              <Input
                id="address_line2"
                placeholder="Apt 4B"
                value={addressForm.address_line2}
                onChange={(e) => setAddressForm({...addressForm, address_line2: e.target.value})}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  placeholder="New York"
                  value={addressForm.city}
                  onChange={(e) => setAddressForm({...addressForm, city: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  placeholder="NY"
                  value={addressForm.state}
                  onChange={(e) => setAddressForm({...addressForm, state: e.target.value})}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="postal_code">Postal Code</Label>
                <Input
                  id="postal_code"
                  placeholder="10001"
                  value={addressForm.postal_code}
                  onChange={(e) => setAddressForm({...addressForm, postal_code: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  placeholder="United States"
                  value={addressForm.country}
                  onChange={(e) => setAddressForm({...addressForm, country: e.target.value})}
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddressDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateAddress}>
              Save Address
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <AdminSwitchFooter />
    </div>
  );
};

export default Billing;
