import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

interface CreateUserPayload {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  password: string;
  date_of_birth?: string;
  father_type: 'blood_father' | 'flex_dad';
  how_many_kids?: number;
  agree_terms: 0 | 1;
  child_names?: string;
  child_ages?: string;
  due_date?: string;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: CreateUserPayload = await req.json();
    
    console.log('Creating WordPress user:', { email: payload.email });

    // Get WordPress credentials from environment
    const consumerKey = Deno.env.get('WOOCOMMERCE_CONSUMER_KEY');
    const consumerSecret = Deno.env.get('WOOCOMMERCE_CONSUMER_SECRET');
    const siteUrl = Deno.env.get('WOOCOMMERCE_SITE_URL') || 'https://dadderup.com';

    if (!consumerKey || !consumerSecret) {
      console.error('WooCommerce credentials not configured');
      return new Response(
        JSON.stringify({
          success: false,
          code: 'config_error',
          message: 'WordPress integration not configured. Please contact support.',
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create Basic Auth credentials
    const credentials = btoa(`${consumerKey}:${consumerSecret}`);
    let usedWooFallback = false;

    // Call WordPress API with Basic Authentication (try hyphenated endpoint first)
    console.log('Calling WordPress API:', { url: `${siteUrl}/wp-json/dadderup/v1/create-user` });
    
    let wpResponse = await fetch(
      `${siteUrl}/wp-json/dadderup/v1/create-user`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${credentials}`,
        },
        body: JSON.stringify(payload),
      }
    );

    // Fallback to underscore endpoint if hyphenated one returns 404
    if (wpResponse.status === 404) {
      console.log('Trying fallback endpoint with underscore:', { url: `${siteUrl}/wp-json/dadderup/v1/create_user` });
      wpResponse = await fetch(
        `${siteUrl}/wp-json/dadderup/v1/create_user`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${credentials}`,
          },
          body: JSON.stringify(payload),
        }
      );
    }

    // If both custom endpoints return 404, fallback to WooCommerce REST API (customers)
    if (wpResponse.status === 404) {
      try {
        console.log('Falling back to WooCommerce REST API: /wp-json/wc/v3/customers');
        usedWooFallback = true;
        const wooUrl = `${siteUrl}/wp-json/wc/v3/customers`;
        const wooBody: any = {
          email: payload.email,
          username: payload.email,
          password: payload.password,
          first_name: payload.first_name,
          last_name: payload.last_name,
          billing: {
            first_name: payload.first_name,
            last_name: payload.last_name,
            email: payload.email,
            phone: payload.phone || ''
          },
          meta_data: [
            { key: 'dadderup_father_type', value: payload.father_type },
            { key: 'dadderup_how_many_kids', value: payload.how_many_kids ?? 0 },
            { key: 'dadderup_agree_terms', value: payload.agree_terms },
            ...(payload.date_of_birth ? [{ key: 'dadderup_date_of_birth', value: payload.date_of_birth }] : []),
            ...(payload.due_date ? [{ key: 'dadderup_due_date', value: payload.due_date }] : []),
            ...(payload.child_names ? [{ key: 'dadderup_child_names', value: payload.child_names }] : []),
            ...(payload.child_ages ? [{ key: 'dadderup_child_ages', value: payload.child_ages }] : []),
          ],
        };

        wpResponse = await fetch(wooUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${credentials}`,
          },
          body: JSON.stringify(wooBody),
        });
      } catch (wooErr) {
        console.error('WooCommerce REST fallback failed:', wooErr);
      }
    }

    console.log('WordPress API response:', { 
      status: wpResponse.status,
      statusText: wpResponse.statusText,
      contentType: wpResponse.headers.get('content-type')
    });

    // Try to parse response as JSON, fall back to text if it fails
    let wpData: any;
    const contentType = wpResponse.headers.get('content-type') || '';
    
    try {
      wpData = await wpResponse.json();
    } catch (parseError) {
      const textResponse = await wpResponse.text();
      console.error('Failed to parse WordPress response as JSON:', { 
        status: wpResponse.status,
        text: textResponse.substring(0, 200)
      });
      
      // Return appropriate error based on status code (always HTTP 200 for proper error handling)
      if (wpResponse.status === 401 || wpResponse.status === 403) {
        return new Response(
          JSON.stringify({
            success: false,
            code: 'unauthorized',
            message: 'WordPress API authentication failed. Please contact support.',
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      } else if (wpResponse.status === 404) {
        return new Response(
          JSON.stringify({
            success: false,
            code: 'endpoint_not_found',
            message: 'WordPress registration endpoint not found. Please contact support.',
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      } else {
        return new Response(
          JSON.stringify({
            success: false,
            code: 'invalid_response',
            message: 'WordPress returned an invalid response. Please try again.',
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }

    if (!wpResponse.ok) {
      console.error('WordPress API error:', { 
        status: wpResponse.status,
        code: wpData.code,
        message: wpData.message
      });

      // Normalize common WooCommerce errors
      let normalizedCode = wpData.code || 'unknown_error';
      let normalizedMessage = wpData.message || 'An error occurred during registration.';
      if (usedWooFallback) {
        const codeStr = String(normalizedCode);
        if (codeStr.includes('registration-error-email-exists') || codeStr.includes('existing_user_email') || codeStr.includes('existing_user_login')) {
          normalizedCode = 'email_exists';
          normalizedMessage = 'An account with this email already exists.';
        } else if (wpResponse.status === 401 || wpResponse.status === 403) {
          normalizedCode = 'unauthorized';
          normalizedMessage = 'WordPress API authentication failed. Please contact support.';
        } else if (wpResponse.status === 404) {
          normalizedCode = 'endpoint_not_found';
          normalizedMessage = 'WordPress registration endpoint not found. Please contact support.';
        }
      }

      // If the error indicates the email already exists, try to fetch existing customer and sync
      const codeStrGlobal = String(normalizedCode || wpData.code || '');
      const isEmailExists = codeStrGlobal === 'email_exists' ||
        codeStrGlobal.includes('registration-error-email-exists') ||
        codeStrGlobal.includes('existing_user_email') ||
        codeStrGlobal.includes('existing_user_login');

      if (isEmailExists) {
        try {
          const siteUrl = Deno.env.get('WOOCOMMERCE_SITE_URL') || 'https://dadderup.com';
          const consumerKey = Deno.env.get('WOOCOMMERCE_CONSUMER_KEY');
          const consumerSecret = Deno.env.get('WOOCOMMERCE_CONSUMER_SECRET');
          const credentials = btoa(`${consumerKey}:${consumerSecret}`);

          // Look up existing WooCommerce customer by email
          const lookupResp = await fetch(
            `${siteUrl}/wp-json/wc/v3/customers?email=${encodeURIComponent(payload.email)}`,
            {
              headers: {
                'Authorization': `Basic ${credentials}`,
              },
            }
          );

          if (lookupResp.ok) {
            const customers = await lookupResp.json();
            const existing = Array.isArray(customers) && customers.length > 0 ? customers[0] : null;
            if (existing && (existing.id || existing.data?.id)) {
              const wpUserId = existing.id || existing.data?.id;

              // Extract optional meta if available
              const meta = Array.isArray(existing.meta_data) ? existing.meta_data : [];
              const metaMap: Record<string, string> = {};
              for (const m of meta) {
                if (m && m.key) metaMap[m.key] = m.value;
              }

              const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
              const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

              console.log('Syncing existing WordPress user to Supabase:', { wp_user_id: wpUserId, email: payload.email });
              const syncResp = await fetch(`${SUPABASE_URL}/functions/v1/sync-wordpress-user`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
                  'apikey': SERVICE_ROLE_KEY,
                },
                body: JSON.stringify({
                  user_id: wpUserId,
                  email: existing.email || payload.email,
                  password: payload.password, // use provided password to create Supabase auth user
                  first_name: existing.first_name || payload.first_name,
                  last_name: existing.last_name || payload.last_name,
                  phone: (existing.billing && existing.billing.phone) || existing.phone || payload.phone,
                  date_of_birth: metaMap['dadderup_date_of_birth'] || payload.date_of_birth,
                  father_type: (metaMap['dadderup_father_type'] as 'blood_father' | 'flex_dad') || payload.father_type,
                  how_many_kids: parseInt(metaMap['dadderup_how_many_kids'] || `${payload.how_many_kids ?? 0}`) || 0,
                  child_names: undefined,
                  child_ages: undefined,
                  due_date: metaMap['dadderup_due_date'] || payload.due_date,
                }),
              });

              const syncData = await syncResp.json().catch(() => ({}));
              console.log('Sync existing user response:', { status: syncResp.status, body: syncData });
              if (syncResp.ok && (syncData?.success || true)) {
                return new Response(
                  JSON.stringify({
                    success: true,
                    data: { wp_user_id: wpUserId },
                  }),
                  { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
              }
            }
          }
        } catch (syncExistingErr) {
          console.error('Failed to sync existing WP user:', syncExistingErr);
        }

        // Fall back to standardized email_exists error for the frontend to handle
        return new Response(
          JSON.stringify({
            success: false,
            code: 'email_exists',
            message: 'An account with this email already exists.',
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      return new Response(
        JSON.stringify({
          success: false,
          code: normalizedCode,
          message: normalizedMessage,
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('WordPress user created successfully');

    // If Woo REST fallback was used, sync to Supabase
    if (usedWooFallback) {
      try {
        const wpUserId = wpData?.id || wpData?.data?.id;
        const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
        const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

        console.log('Invoking sync-wordpress-user with wp_user_id:', wpUserId);
        const childNames = payload.child_names
          ? payload.child_names.split(',').map((s) => s.trim()).filter(Boolean)
          : undefined;
        const childAges = payload.child_ages
          ? payload.child_ages.split(',').map((s) => s.trim()).filter(Boolean)
          : undefined;

        const syncResp = await fetch(`${SUPABASE_URL}/functions/v1/sync-wordpress-user`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
            'apikey': SERVICE_ROLE_KEY,
          },
          body: JSON.stringify({
            user_id: wpUserId,
            email: payload.email,
            password: payload.password,
            first_name: payload.first_name,
            last_name: payload.last_name,
            phone: payload.phone,
            date_of_birth: payload.date_of_birth,
            father_type: payload.father_type,
            how_many_kids: payload.how_many_kids ?? 0,
            child_names: childNames,
            child_ages: childAges,
            due_date: payload.due_date,
          }),
        });

        const syncData = await syncResp.json().catch(() => ({}));
        console.log('Sync response:', { status: syncResp.status, body: syncData });

        if (!syncResp.ok || !syncData?.success) {
          return new Response(
            JSON.stringify({
              success: false,
              code: 'sync_failed',
              message: 'User created in WordPress but failed to sync to application. Please contact support.',
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200,
            }
          );
        }

        return new Response(
          JSON.stringify({
            success: true,
            data: { wp_user_id: wpUserId },
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      } catch (syncError) {
        console.error('Error invoking sync-wordpress-user:', syncError);
        return new Response(
          JSON.stringify({
            success: false,
            code: 'sync_failed',
            message: 'User created in WordPress but failed to sync to application. Please contact support.',
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      }
    }
    
    return new Response(
      JSON.stringify({
        success: wpData.success || true,
        data: wpData.data,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error in create-wordpress-user function:', error);
    return new Response(
      JSON.stringify({
        success: false,
        code: 'network_error',
        message: 'Unable to connect to registration service. Please try again.',
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
