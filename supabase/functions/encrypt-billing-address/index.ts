import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { getCorsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { 
      address_line1, 
      address_line2, 
      city, 
      state, 
      postal_code, 
      country, 
      user_id 
    } = await req.json();

    // Verify user can only update their own address
    if (user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: 'Forbidden - can only update own address' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Encrypt sensitive fields using database function
    const { data: encrypted1, error: err1 } = await supabaseClient
      .rpc('encrypt_sensitive_data', { data: address_line1 || '' });
    const { data: encrypted2, error: err2 } = await supabaseClient
      .rpc('encrypt_sensitive_data', { data: address_line2 || '' });
    const { data: encryptedCity, error: err3 } = await supabaseClient
      .rpc('encrypt_sensitive_data', { data: city || '' });
    const { data: encryptedState, error: err4 } = await supabaseClient
      .rpc('encrypt_sensitive_data', { data: state || '' });
    const { data: encryptedPostal, error: err5 } = await supabaseClient
      .rpc('encrypt_sensitive_data', { data: postal_code || '' });

    if (err1 || err2 || err3 || err4 || err5) {
      console.error('Encryption error:', err1 || err2 || err3 || err4 || err5);
      return new Response(
        JSON.stringify({ error: 'Encryption failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if address exists
    const { data: existing } = await supabaseClient
      .from('billing_addresses')
      .select('id')
      .eq('user_id', user_id)
      .maybeSingle();

    const addressData = {
      user_id,
      address_line1_encrypted: encrypted1,
      address_line2_encrypted: encrypted2,
      city_encrypted: encryptedCity,
      state_encrypted: encryptedState,
      postal_code_encrypted: encryptedPostal,
      country: country || 'United States',
    };

    if (existing) {
      // Update existing address
      const { error: updateError } = await supabaseClient
        .from('billing_addresses')
        .update(addressData)
        .eq('user_id', user_id);

      if (updateError) {
        console.error('Update error:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to update address' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      // Insert new address
      const { error: insertError } = await supabaseClient
        .from('billing_addresses')
        .insert([addressData]);

      if (insertError) {
        console.error('Insert error:', insertError);
        return new Response(
          JSON.stringify({ error: 'Failed to create address' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in encrypt-billing-address:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});