import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { usePackages, useCreateSubscription } from '@/hooks/usePackages';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import dadderUpLogo from '@/assets/dadderup-logo-white.png';

interface PackageSelectionProps {
  userId: string;
}

export const PackageSelection = ({ userId }: PackageSelectionProps) => {
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const { data: packages, isLoading } = usePackages();
  const createSubscription = useCreateSubscription();
  const navigate = useNavigate();

  const handleSelectPackage = async () => {
    if (!selectedPackage) {
      toast.error('Please select a package');
      return;
    }

    try {
      await createSubscription.mutateAsync({
        packageId: selectedPackage,
        userId,
      });

      // TODO: Redirect to Stripe checkout
      toast.success('Package selected! Redirecting to checkout...');
      
      // For now, redirect to dashboard
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Error creating subscription:', error);
      toast.error('Failed to create subscription');
    }
  };

  if (isLoading) {
    return <div className="text-center py-12">Loading packages...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#2C70B6' }}>
      <div className="w-full max-w-6xl">
        {/* Logo Header */}
        <div className="text-center mb-8">
          <img 
            src={dadderUpLogo} 
            alt="DadderUp Logo" 
            className="h-16 mx-auto"
          />
        </div>

        {/* Step Indicator */}
        <div className="text-center mb-6">
          <p className="text-sm font-semibold text-white mb-3">Step 2 of 2</p>
          <div className="flex gap-2 justify-center mb-8">
            <div className="h-2 w-20 bg-white rounded-full"></div>
            <div className="h-2 w-20 bg-white rounded-full"></div>
          </div>
        </div>
        
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3">Choose Your Plan</h1>
          <p className="text-base sm:text-lg text-white px-4">Select the perfect plan for your DadderUp journey</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-6 mb-8 sm:mb-10 px-2 sm:px-0">
          {packages?.map((pkg) => {
            const isSelected = selectedPackage === pkg.id;
            const isTrial = pkg.trial_days > 0;

            return (
              <Card
                key={pkg.id}
                className={`cursor-pointer transition-all hover:shadow-2xl bg-white ${
                  isSelected ? 'ring-4 ring-white shadow-2xl scale-105' : 'shadow-lg'
                }`}
                onClick={() => setSelectedPackage(pkg.id)}
              >
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900">{pkg.name}</CardTitle>
                  <CardDescription className="text-sm sm:text-base text-gray-600">{pkg.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    {isTrial ? (
                      <>
                        <div className="flex flex-col sm:flex-row items-center sm:items-baseline justify-center mb-2">
                          <span className="text-4xl sm:text-5xl font-bold text-gray-900">${pkg.trial_price.toFixed(0)}</span>
                          <span className="text-lg sm:text-xl text-gray-600 sm:ml-2">for {pkg.trial_days} days</span>
                        </div>
                        <div className="text-center text-sm text-gray-600">
                          Then ${pkg.price.toFixed(2)}/month
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-baseline justify-center mb-2">
                          <span className="text-4xl sm:text-5xl font-bold text-gray-900">${pkg.price.toFixed(0)}</span>
                          <span className="text-lg sm:text-xl text-gray-600">/{pkg.billing_period}</span>
                        </div>
                        {pkg.regular_price && pkg.regular_price > pkg.price && (
                          <div className="text-center text-sm text-gray-500 line-through">
                            Regular: ${pkg.regular_price.toFixed(2)}
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <ul className="space-y-3 mb-8">
                    {pkg.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    variant={isSelected ? 'default' : 'outline'}
                    className={`w-full py-4 sm:py-6 text-sm sm:text-base font-semibold ${
                      isSelected 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                        : 'border-2 border-gray-300 hover:border-blue-600 hover:text-blue-600'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPackage(pkg.id);
                    }}
                  >
                    {isSelected ? '✓ Selected' : 'Select Plan'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center px-4">
          <Button
            size="lg"
            onClick={handleSelectPackage}
            disabled={!selectedPackage || createSubscription.isPending}
            className="w-full sm:w-auto px-8 sm:px-12 py-5 sm:py-6 text-base sm:text-lg font-semibold bg-accent hover:bg-accent/90 text-accent-foreground disabled:bg-gray-400"
          >
            {createSubscription.isPending ? 'Processing...' : 'Continue to Checkout'}
          </Button>
        </div>
      </div>
    </div>
  );
};
