import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UnifiedPackageManagement } from "./UnifiedPackageManagement";
import { StripeSettings } from "./StripeSettings";
import { WooCommerceSettings } from "./WooCommerceSettings";
import { PlansPageCustomization } from "./PlansPageCustomization";
import { Package, CreditCard, ShoppingCart, Settings } from "lucide-react";

export const PackageManagement = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Package Management</h2>
        <p className="text-sm">
          Manage subscription packages, payment integrations, and e-commerce settings
        </p>
      </div>

      <Tabs defaultValue="packages" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger 
            value="packages" 
            className="flex items-center gap-2"
          >
            <Package className="w-4 h-4" />
            Packages
          </TabsTrigger>
          <TabsTrigger 
            value="stripe" 
            className="flex items-center gap-2"
          >
            <CreditCard className="w-4 h-4" />
            Stripe
          </TabsTrigger>
          <TabsTrigger 
            value="woocommerce" 
            className="flex items-center gap-2"
          >
            <ShoppingCart className="w-4 h-4" />
            WooCommerce
          </TabsTrigger>
          <TabsTrigger 
            value="customize" 
            className="flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Customize Plans Page
          </TabsTrigger>
        </TabsList>

        <TabsContent value="packages" className="mt-6">
          <UnifiedPackageManagement />
        </TabsContent>

        <TabsContent value="stripe" className="mt-6">
          <StripeSettings />
        </TabsContent>

        <TabsContent value="woocommerce" className="mt-6">
          <WooCommerceSettings />
        </TabsContent>

        <TabsContent value="customize" className="mt-6">
          <PlansPageCustomization />
        </TabsContent>
      </Tabs>
    </div>
  );
};