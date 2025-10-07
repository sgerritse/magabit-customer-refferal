import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { getCorsHeaders } from "../_shared/cors.ts";

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SYNC-PAYMENT-METHOD] ${step}${detailsStr}`);
};

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    
    // Get Stripe customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    if (customers.data.length === 0) {
      logStep("No Stripe customer found");
      return new Response(JSON.stringify({ synced: false, message: "No Stripe customer found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Get default payment method
    const customer = await stripe.customers.retrieve(customerId, {
      expand: ['invoice_settings.default_payment_method']
    });

    let paymentMethodInfo = null;

    if (customer.invoice_settings?.default_payment_method) {
      const pm = customer.invoice_settings.default_payment_method;
      
      if (typeof pm !== 'string' && pm.card) {
        paymentMethodInfo = {
          stripe_customer_id: customerId,
          stripe_payment_method_id: pm.id,
          card_last_four: pm.card.last4,
          card_brand: pm.card.brand,
          card_exp_month: pm.card.exp_month,
          card_exp_year: pm.card.exp_year,
        };
        logStep("Payment method found", paymentMethodInfo);
      }
    }

    if (paymentMethodInfo) {
      // Use the secure sync function
      const { error: syncError } = await supabaseClient.rpc(
        'sync_stripe_payment_method',
        {
          p_user_id: user.id,
          p_stripe_customer_id: paymentMethodInfo.stripe_customer_id,
          p_stripe_payment_method_id: paymentMethodInfo.stripe_payment_method_id,
          p_card_last_four: paymentMethodInfo.card_last_four,
          p_card_brand: paymentMethodInfo.card_brand,
          p_card_exp_month: paymentMethodInfo.card_exp_month,
          p_card_exp_year: paymentMethodInfo.card_exp_year,
        }
      );

      if (syncError) {
        logStep("Error syncing payment method", { error: syncError.message });
        throw syncError;
      }

      logStep("Payment method synced successfully");
      return new Response(JSON.stringify({ 
        synced: true, 
        paymentMethod: {
          brand: paymentMethodInfo.card_brand,
          last4: paymentMethodInfo.card_last_four,
          exp_month: paymentMethodInfo.card_exp_month,
          exp_year: paymentMethodInfo.card_exp_year,
        }
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } else {
      logStep("No default payment method found");
      return new Response(JSON.stringify({ 
        synced: false, 
        message: "No payment method on file" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
