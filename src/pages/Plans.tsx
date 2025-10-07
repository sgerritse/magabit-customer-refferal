import { useState, useEffect } from "react";
import { useVisiblePlans } from "@/hooks/usePlanDisplayConfigs";
import { usePlansPageSettings } from "@/hooks/usePlansPageSettings";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check } from "lucide-react";
import dadderUpLogo from "@/assets/dadderup-logo-white.png";
import DOMPurify from "dompurify";

// Convert YouTube URL to embed format
const getYouTubeEmbedUrl = (url: string) => {
  if (!url) return null;
  
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  
  if (match && match[2].length === 11) {
    return `https://www.youtube.com/embed/${match[2]}`;
  }
  return null;
};

const Plans = () => {
  const { data: plans, isLoading } = useVisiblePlans();
  const { settings: plansPageSettings } = usePlansPageSettings();
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [showPlans, setShowPlans] = useState(false);
  const [userTriggered, setUserTriggered] = useState(false);

  // Timer delay effect
  useEffect(() => {
    const enableDelay = plansPageSettings?.enable_delay || false;
    const delaySeconds = plansPageSettings?.delay_seconds || 0;
    const hasCtaButton = plansPageSettings?.enable_cta_button || false;
    
    // If CTA button is enabled, wait for user to click
    if (hasCtaButton) {
      setShowPlans(false);
      return;
    }
    
    // Otherwise use timer delay if enabled
    if (enableDelay && delaySeconds > 0) {
      setShowPlans(false);
      const timer = setTimeout(() => {
        setShowPlans(true);
      }, delaySeconds * 1000);

      return () => clearTimeout(timer);
    } else {
      setShowPlans(true);
    }
  }, [plansPageSettings?.enable_delay, plansPageSettings?.delay_seconds, plansPageSettings?.enable_cta_button]);

  const handleCtaClick = () => {
    setUserTriggered(true);
    setShowPlans(true);
  };

  const handleSelectPackage = async () => {
    if (!selectedPlanId) return;

    setProcessing(true);
    try {
      const selectedPlan = plans?.find((p) => p.id === selectedPlanId);
      if (!selectedPlan) {
        throw new Error("Selected plan not found");
      }

      // Use original data for checkout
      const productData = selectedPlan.original_data;
      
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          product: productData,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
        toast({
          title: "Redirecting to Checkout",
          description: "Opening Stripe Checkout in a new tab...",
        });
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error: any) {
      console.error("Error creating checkout:", error);
      toast({
        title: "Checkout Error",
        description: error.message || "Failed to create checkout session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const getDisplayTitle = (plan: any) => {
    return plan.custom_title || plan.original_data?.name || 'Untitled Plan';
  };

  const getDisplayDescription = (plan: any) => {
    return plan.custom_description || plan.original_data?.short_description || plan.original_data?.description || '';
  };

  const getPrice = (plan: any) => {
    // Use sale_price as the main price
    return plan.original_data?.sale_price || plan.original_data?.subscription_price || plan.original_data?.price || '0';
  };

  const getOriginalPrice = (plan: any) => {
    // Get the original price for crossed-out display
    return plan.original_data?.regular_price || null;
  };

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
            <div className="h-2 w-20 bg-green-500 rounded-full"></div>
            <div className="h-2 w-20 bg-white rounded-full"></div>
          </div>
        </div>

        {/* Video Bridge Section */}
        {plansPageSettings?.show_video && plansPageSettings?.video_url && (
          <div className="max-w-4xl mx-auto mb-12 px-2 sm:px-0">
            <Card className="bg-white/95 backdrop-blur">
              <CardContent className="p-6 sm:p-8">
                {plansPageSettings.video_heading && (
                  <div 
                    className="text-2xl sm:text-3xl font-bold text-center mb-6 prose prose-lg max-w-none"
                    dangerouslySetInnerHTML={{ 
                      __html: DOMPurify.sanitize(plansPageSettings.video_heading, {
                        ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'span', 'b', 'i'],
                        ALLOWED_ATTR: ['class'],
                      })
                    }}
                  />
                )}
                
                <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                  <iframe
                    className="absolute top-0 left-0 w-full h-full rounded-lg"
                    src={getYouTubeEmbedUrl(plansPageSettings.video_url) || ''}
                    title="Plans Introduction Video"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                
                {plansPageSettings.video_description && (
                  <p className="text-center text-gray-600 mt-6 text-sm sm:text-base">
                    {plansPageSettings.video_description}
                  </p>
                )}

                {plansPageSettings.enable_cta_button && !userTriggered && (
                  <div className="mt-8 text-center">
                    <Button 
                      onClick={handleCtaClick}
                      size="lg"
                      className="px-8 py-6 text-lg font-semibold"
                    >
                      {plansPageSettings.cta_button_text || "Continue to Plans"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
        
        {showPlans && (
          <>
            <div className="text-center mb-12">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3">Choose Your Plan</h1>
              <p className="text-base sm:text-lg text-white px-4">Select the perfect plan for your DadderUp journey</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-8 px-2 sm:px-0 justify-items-center max-w-5xl mx-auto">
            {plans?.map((plan) => {
              const isSelected = selectedPlanId === plan.id;
              return (
                <Card
                  key={plan.id}
                  onClick={() => setSelectedPlanId(plan.id)}
                  className={`relative transition-all duration-300 hover:shadow-2xl flex flex-col bg-white w-full max-w-md cursor-pointer ${
                    isSelected 
                      ? "ring-4 ring-white shadow-2xl scale-105" 
                      : "shadow-lg hover:scale-[1.02]"
                  }`}
                >
                  {isSelected && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-blue-600 text-white px-4 py-1 shadow-lg">
                        Selected Plan
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className="text-center pb-4">
                    <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{getDisplayTitle(plan)}</CardTitle>
                    <CardDescription className="text-sm sm:text-base text-gray-600">
                      {getDisplayDescription(plan)}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="flex-1 flex flex-col">
                    <div className="text-center mb-6 pb-6 border-b border-gray-200">
                      {getOriginalPrice(plan) && (
                        <div className="text-lg sm:text-xl text-gray-400 line-through mb-1">
                          ${parseFloat(getOriginalPrice(plan)).toFixed(0)}
                        </div>
                      )}
                      <div className="text-4xl sm:text-5xl font-bold text-gray-900 mb-1">
                        ${parseFloat(getPrice(plan)).toFixed(0)}
                      </div>
                      <div className="text-sm sm:text-base text-gray-600">
                        {plan.original_data?.billing_cycle ? `per ${plan.original_data.billing_cycle}` : "one-time"}
                      </div>
                    </div>

                    <div className="space-y-4 mb-6 flex-1">
                      {plan.original_data?.has_trial && plan.original_data?.trial_info && (
                        <div className="bg-green-50 rounded-lg p-3 text-center border border-green-200">
                          <span className="text-base font-semibold text-green-700">
                            🎉 7 days of access, just pay $1 today!
                          </span>
                        </div>
                      )}

                      {plan.custom_features && plan.custom_features.length > 0 && (
                        <div className="space-y-3">
                          <p className="font-semibold text-sm uppercase tracking-wide text-gray-500">
                            What's Included
                          </p>
                          <ul className="space-y-2">
                            {plan.custom_features.map((feature: string, idx: number) => (
                              <li key={idx} className="flex items-start gap-2">
                                <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                                <span className="text-sm text-gray-700">{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <Button
                      size="lg"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPlanId(plan.id);
                      }}
                      className={`w-full mt-auto py-4 sm:py-6 text-sm sm:text-base font-semibold transition-colors ${
                        isSelected 
                          ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                          : 'border-2 border-gray-300 bg-white text-gray-900 hover:bg-accent hover:text-accent-foreground hover:border-accent'
                      }`}
                      variant={isSelected ? "default" : "outline"}
                    >
                      {isSelected ? "✓ Selected" : "Select Plan"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
            </div>

            {selectedPlanId && (
              <div className="flex justify-center px-2 sm:px-0 mb-8">
                <Button
                  size="lg"
                  onClick={handleSelectPackage}
                  disabled={processing}
                  className="w-full max-w-md py-6 text-lg font-semibold bg-green-600 hover:bg-green-700 text-white"
                >
                  {processing ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Continue to Checkout"
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Plans;
