import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { getCorsHeaders } from "../_shared/cors.ts";

// Security headers
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { ...corsHeaders, ...securityHeaders } });
  }

  try {
    logStep("Webhook request received");

    // Get webhook secret from database
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { data: settings } = await supabaseAdmin
      .from('stripe_settings')
      .select('stripe_secret_key, webhook_secret, enabled')
      .maybeSingle();

    if (!settings?.enabled) {
      logStep("Stripe integration not enabled");
      return new Response(JSON.stringify({ received: false, error: "Stripe not enabled" }), {
        status: 200,
        headers: { ...corsHeaders, ...securityHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!settings.stripe_secret_key || !settings.webhook_secret) {
      logStep("Missing Stripe credentials");
      return new Response(JSON.stringify({ received: false, error: "Missing credentials" }), {
        status: 400,
        headers: { ...corsHeaders, ...securityHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify webhook signature
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      logStep("No signature provided");
      return new Response(JSON.stringify({ error: "No signature" }), {
        status: 400,
        headers: { ...corsHeaders, ...securityHeaders, 'Content-Type': 'application/json' },
      });
    }

    const stripe = new Stripe(settings.stripe_secret_key, {
      apiVersion: '2023-10-16',
    });

    const body = await req.text();
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, settings.webhook_secret);
      logStep("Webhook signature verified", { type: event.type });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      logStep("Signature verification failed", { error: errorMessage });
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 400,
        headers: { ...corsHeaders, ...securityHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Process webhook events
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        logStep(`Processing ${event.type}`, { 
          subscriptionId: subscription.id,
          customerId: subscription.customer,
          status: subscription.status 
        });

        // Get user by customer email
        const customer = await stripe.customers.retrieve(subscription.customer as string) as Stripe.Customer;
        const { data: users } = await supabaseAdmin.auth.admin.listUsers();
        const user = users.users.find(u => u.email === customer.email);

        if (!user) {
          logStep("User not found for customer", { email: customer.email });
          break;
        }

        // Extract WooCommerce product IDs from metadata
        const metadata = subscription.metadata || {};
        const wooProductId = metadata.woocommerce_product_id || null;
        const parentProductId = metadata.parent_product_id ? parseInt(metadata.parent_product_id) : null;
        const variationId = metadata.variation_id ? parseInt(metadata.variation_id) : null;

        logStep("WooCommerce metadata extracted", { wooProductId, parentProductId, variationId });

        // Upsert subscription with WooCommerce product tracking
        const { error: subError } = await supabaseAdmin
          .from('user_subscriptions')
          .upsert({
            user_id: user.id,
            stripe_subscription_id: subscription.id,
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            trial_ends_at: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
            woocommerce_product_id: wooProductId,
            woocommerce_parent_product_id: parentProductId,
            woocommerce_variation_id: variationId,
          }, {
            onConflict: 'stripe_subscription_id'
          });

        if (subError) {
          logStep("Error upserting subscription", { error: subError });
        } else {
          logStep("Subscription upserted successfully with WooCommerce tracking");
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Processing subscription deletion", { subscriptionId: subscription.id });

        const { error: deleteError } = await supabaseAdmin
          .from('user_subscriptions')
          .update({ status: 'canceled' })
          .eq('stripe_subscription_id', subscription.id);

        if (deleteError) {
          logStep("Error updating canceled subscription", { error: deleteError });
        } else {
          logStep("Subscription marked as canceled");
        }
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        logStep("Payment succeeded", { 
          paymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount 
        });
        // Payment tracking can be added here
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        logStep("Payment failed", { 
          paymentIntentId: paymentIntent.id,
          error: paymentIntent.last_payment_error?.message 
        });
        // Notify user of payment failure
        break;
      }

      case 'customer.created':
      case 'customer.updated': {
        const customer = event.data.object as Stripe.Customer;
        logStep(`Processing ${event.type}`, { customerId: customer.id });

        // Find user by email
        const { data: users } = await supabaseAdmin.auth.admin.listUsers();
        const user = users.users.find(u => u.email === customer.email);

        if (user && customer.invoice_settings?.default_payment_method) {
          // Get payment method details
          const paymentMethod = await stripe.paymentMethods.retrieve(
            customer.invoice_settings.default_payment_method as string
          );

          if (paymentMethod.type === 'card' && paymentMethod.card) {
            // Update billing info
            await supabaseAdmin
              .from('billing_info')
              .upsert({
                user_id: user.id,
                card_type: paymentMethod.card.brand,
                card_last_four: paymentMethod.card.last4,
                card_expiry_month: paymentMethod.card.exp_month,
                card_expiry_year: paymentMethod.card.exp_year,
              }, {
                onConflict: 'user_id'
              });

            logStep("Billing info updated");
          }
        }
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, ...securityHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    logStep("ERROR", { message: errorMessage, stack: errorStack });
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, ...securityHeaders, 'Content-Type': 'application/json' },
    });
  }
});
