import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

// Input validation schema
const ProductSchema = z.object({
  id: z.union([z.string(), z.number()]),
  name: z.string().min(1).max(255),
  price: z.string().or(z.number()).optional(),
  subscription_price: z.string().or(z.number()).optional(),
  subscription_sign_up_fee: z.string().or(z.number()).optional(),
  subscription_trial_length: z.string().or(z.number()).optional(),
  subscription_period: z.enum(['day', 'week', 'month', 'year']).optional(),
  subscription_period_interval: z.string().or(z.number()).optional(),
  currency: z.string().length(3).optional(),
  short_description: z.string().max(500).optional(),
  description: z.string().max(2000).optional(),
  parent_product_id: z.union([z.string(), z.number()]).optional(),
  variation_id: z.union([z.string(), z.number()]).optional(),
});

const CheckoutSchema = z.object({
  product: ProductSchema,
});

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    logStep("Function started");

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Validate input
    const body = await req.json();
    const validationResult = CheckoutSchema.safeParse(body);
    
    if (!validationResult.success) {
      logStep("Validation failed", validationResult.error.issues);
      return new Response(
        JSON.stringify({ 
          error: "Invalid product data", 
          details: validationResult.error.issues.map(i => ({ path: i.path, message: i.message }))
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { product } = validationResult.data;
    logStep("Product received", { productName: product.name, productId: product.id });

    // Get or create Stripe customer
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("Stripe not configured");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing Stripe customer found", { customerId });
    } else {
      const customer = await stripe.customers.create({ email: user.email });
      customerId = customer.id;
      logStep("New Stripe customer created", { customerId });
    }

    // Prepare line items for Stripe
    const price = parseFloat(String(product.subscription_price || product.price || '0'));
    const signupFee = parseFloat(String(product.subscription_sign_up_fee || '0'));
    const trialLength = parseInt(String(product.subscription_trial_length || '0'));
    
    // Determine billing interval
    let interval: 'day' | 'week' | 'month' | 'year' = 'month';
    const period = product.subscription_period?.toLowerCase();
    if (period === 'day') interval = 'day';
    else if (period === 'week') interval = 'week';
    else if (period === 'year') interval = 'year';
    
    const intervalCount = parseInt(String(product.subscription_period_interval || '1'));
    const currency = product.currency?.toLowerCase() || 'usd';

    const lineItems: any[] = [
      {
        price_data: {
          currency: currency,
          product_data: {
            name: product.name,
            description: product.short_description || product.description || '',
            metadata: {
              woocommerce_product_id: product.id.toString(),
              parent_product_id: product.parent_product_id?.toString() || '',
              variation_id: product.variation_id?.toString() || '',
            },
          },
          unit_amount: Math.round(price * 100),
          recurring: {
            interval: interval,
            interval_count: intervalCount,
          },
        },
        quantity: 1,
      },
    ];

    // Add signup fee as one-time payment if present
    if (signupFee > 0) {
      lineItems.push({
        price_data: {
          currency: currency,
          product_data: {
            name: `${product.name} - Sign-up Fee`,
          },
          unit_amount: Math.round(signupFee * 100),
        },
        quantity: 1,
      });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: lineItems,
      mode: 'subscription',
      success_url: `${req.headers.get("origin")}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/plans`,
      metadata: {
        user_id: user.id,
        woocommerce_product_id: product.id.toString(),
        parent_product_id: product.parent_product_id?.toString() || '',
        variation_id: product.variation_id?.toString() || '',
      },
      subscription_data: trialLength > 0 ? {
        trial_period_days: trialLength,
        metadata: {
          woocommerce_product_id: product.id.toString(),
        },
      } : {
        metadata: {
          woocommerce_product_id: product.id.toString(),
        },
      },
    });

    logStep("Checkout session created", { sessionId: session.id });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    logStep("ERROR", { message: error.message, stack: error.stack });
    console.error('Full error details:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: error.toString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
