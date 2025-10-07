import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RateLimitCheck {
  query_type: string;
  user_id?: string;
}

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

    const { query_type }: RateLimitCheck = await req.json();

    // Get or create rate limit record
    const { data: existingLimit, error: fetchError } = await supabase
      .from('query_rate_limits')
      .select('*')
      .eq('user_id', user.id)
      .eq('query_type', query_type)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching rate limit:', fetchError);
      throw fetchError;
    }

    const now = new Date();
    let hourlyCount = 0;
    let dailyCount = 0;
    let shouldReset = false;

    if (existingLimit) {
      // Check if we need to reset counters
      const hourlyReset = new Date(existingLimit.hourly_reset_at);
      const dailyReset = new Date(existingLimit.daily_reset_at);

      if (now >= hourlyReset) {
        hourlyCount = 1;
        shouldReset = true;
      } else {
        hourlyCount = existingLimit.hourly_count + 1;
      }

      if (now >= dailyReset) {
        dailyCount = 1;
        shouldReset = true;
      } else {
        dailyCount = existingLimit.daily_count + 1;
      }

      // Get rate limits from settings
      const { data: settings } = await supabase
        .from('affiliate_settings')
        .select('max_emails_per_hour, max_emails_per_day')
        .single();

      const hourlyLimit = query_type === 'public_posts' ? 100 : (settings?.max_emails_per_hour || 10);
      const dailyLimit = query_type === 'public_posts' ? 1000 : (settings?.max_emails_per_day || 50);

      // Check if rate limit exceeded
      if (hourlyCount > hourlyLimit || dailyCount > dailyLimit) {
        // Log to fraud_alerts if public_posts
        if (query_type === 'public_posts') {
          await supabase.from('fraud_alerts').insert({
            user_id: user.id,
            alert_type: 'rate_limit_exceeded',
            severity: 'medium',
            details: {
              query_type,
              hourly_count: hourlyCount,
              daily_count: dailyCount,
              hourly_limit: hourlyLimit,
              daily_limit: dailyLimit
            }
          });
        }

        return new Response(
          JSON.stringify({
            allowed: false,
            error: 'Rate limit exceeded',
            hourly_count: hourlyCount,
            daily_count: dailyCount,
            reset_at: shouldReset ? new Date(now.getTime() + 3600000).toISOString() : existingLimit.hourly_reset_at
          }),
          {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Update rate limit
      await supabase
        .from('query_rate_limits')
        .update({
          hourly_count: hourlyCount,
          daily_count: dailyCount,
          hourly_reset_at: shouldReset ? new Date(now.getTime() + 3600000).toISOString() : existingLimit.hourly_reset_at,
          daily_reset_at: now >= new Date(existingLimit.daily_reset_at) ? new Date(now.getTime() + 86400000).toISOString() : existingLimit.daily_reset_at,
          updated_at: now.toISOString()
        })
        .eq('id', existingLimit.id);
    } else {
      // Create new rate limit record
      await supabase
        .from('query_rate_limits')
        .insert({
          user_id: user.id,
          query_type,
          hourly_count: 1,
          daily_count: 1,
          hourly_reset_at: new Date(now.getTime() + 3600000).toISOString(),
          daily_reset_at: new Date(now.getTime() + 86400000).toISOString()
        });
    }

    return new Response(
      JSON.stringify({
        allowed: true,
        hourly_count: hourlyCount || 1,
        daily_count: dailyCount || 1
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error: any) {
    console.error('Rate limit check error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: error.message === 'Unauthorized' ? 401 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
