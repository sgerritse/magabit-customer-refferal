import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Check if user is admin
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!roleData) {
      // Not an admin, no tracking needed
      return new Response(
        JSON.stringify({ success: true, message: 'Not an admin' }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get IP address from headers
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                      req.headers.get('x-real-ip') || 
                      'unknown';

    // In production, you would use a geolocation service like ip-api.com or MaxMind
    // For now, we'll use a simple approach
    let country = 'Unknown';
    let city = 'Unknown';

    try {
      // Free geolocation API (rate limited to 45 requests/minute)
      const geoResponse = await fetch(`http://ip-api.com/json/${ipAddress}`);
      if (geoResponse.ok) {
        const geoData = await geoResponse.json();
        country = geoData.country || 'Unknown';
        city = geoData.city || 'Unknown';
      }
    } catch (geoError) {
      console.error('Geolocation lookup failed:', geoError);
    }

    // Check if this location exists for this admin
    const { data: existingLocation, error: fetchError } = await supabase
      .from('admin_access_locations')
      .select('*')
      .eq('admin_user_id', user.id)
      .eq('country', country)
      .eq('city', city)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching location:', fetchError);
    }

    if (existingLocation) {
      // Update existing location
      await supabase
        .from('admin_access_locations')
        .update({
          last_seen_at: new Date().toISOString(),
          access_count: existingLocation.access_count + 1,
          ip_address: ipAddress
        })
        .eq('id', existingLocation.id);
    } else {
      // New location detected - create alert
      const { error: insertError } = await supabase
        .from('admin_access_locations')
        .insert({
          admin_user_id: user.id,
          ip_address: ipAddress,
          country,
          city,
          is_flagged: true,
          flagged_reason: 'New location detected for admin user'
        });

      if (insertError) {
        console.error('Error inserting location:', insertError);
      }

      // Create fraud alert for new location
      await supabase
        .from('fraud_alerts')
        .insert({
          user_id: user.id,
          alert_type: 'new_admin_location',
          severity: 'medium',
          details: {
            ip_address: ipAddress,
            country,
            city,
            message: 'Admin accessed system from new location'
          }
        });

      console.log(`New admin location detected: ${city}, ${country} for user ${user.id}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        location: { country, city },
        is_new: !existingLocation
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error: any) {
    console.error('Location tracking error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: error.message === 'Unauthorized' ? 401 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
