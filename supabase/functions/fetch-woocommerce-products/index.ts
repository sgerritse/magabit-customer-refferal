import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const siteUrl = Deno.env.get("WOOCOMMERCE_SITE_URL");
    const apiKey = Deno.env.get("WOOCOMMERCE_API_KEY");

    if (!siteUrl || !apiKey) {
      throw new Error('WooCommerce integration not configured');
    }

    // Handle webhook events (purchase tracking)
    if (req.method === 'POST') {
      const body = await req.json();
      
      console.log('[WooCommerce Webhook] Received event:', body);

      // Extract order data
      const orderId = body.order_id || body.id;
      const userId = body.user_id || body.customer_id;
      const total = parseFloat(body.total || 0);
      const lineItems = body.line_items || [];

      // Get referral code from order meta or cookies
      const referralCode = body.meta_data?.find((m: any) => m.key === 'dadderup_ref')?.value;

      if (referralCode && userId) {
        // Track conversion
        const conversionResponse = await fetch(
          `${Deno.env.get('SUPABASE_URL')}/functions/v1/track-conversion`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': Deno.env.get('SUPABASE_ANON_KEY') || '',
            },
            body: JSON.stringify({
              userId: String(userId),
              referralCode,
              orderValue: total,
              productId: lineItems[0]?.product_id ? String(lineItems[0].product_id) : null,
            }),
          }
        );

        const conversionData = await conversionResponse.json();
        console.log('[WooCommerce Webhook] Conversion tracked:', conversionData);

        return new Response(JSON.stringify({ success: true, conversion: conversionData }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      }

      return new Response(JSON.stringify({ success: true, message: 'No referral tracking needed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Handle GET request (fetch products)
    const response = await fetch(
      `${siteUrl}/wp-json/dadderup-app/v1/woo-subscriptions/`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch products from WooCommerce');
    }

    const data = await response.json();
    
    return new Response(JSON.stringify(data.products), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    console.error('[WooCommerce] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});