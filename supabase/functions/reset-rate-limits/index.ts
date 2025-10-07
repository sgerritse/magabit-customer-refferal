import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { getCorsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const now = new Date();
    
    // Reset expired hourly email limits
    const { data: expiredHourlyEmail } = await supabase
      .from('email_rate_limits')
      .update({
        hourly_count: 0,
        hourly_reset_at: new Date(now.getTime() + 60 * 60 * 1000).toISOString()
      })
      .lt('hourly_reset_at', now.toISOString())
      .select();

    // Reset expired daily email limits
    const { data: expiredDailyEmail } = await supabase
      .from('email_rate_limits')
      .update({
        daily_count: 0,
        daily_reset_at: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()
      })
      .lt('daily_reset_at', now.toISOString())
      .select();

    // Reset expired hourly SMS limits
    const { data: expiredHourlySMS } = await supabase
      .from('sms_rate_limits')
      .update({
        hourly_count: 0,
        hourly_reset_at: new Date(now.getTime() + 60 * 60 * 1000).toISOString()
      })
      .lt('hourly_reset_at', now.toISOString())
      .select();

    // Reset expired daily SMS limits
    const { data: expiredDailySMS } = await supabase
      .from('sms_rate_limits')
      .update({
        daily_count: 0,
        daily_reset_at: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()
      })
      .lt('daily_reset_at', now.toISOString())
      .select();

    console.log('[Reset Rate Limits] Reset counts:', {
      email_hourly: expiredHourlyEmail?.length || 0,
      email_daily: expiredDailyEmail?.length || 0,
      sms_hourly: expiredHourlySMS?.length || 0,
      sms_daily: expiredDailySMS?.length || 0,
    });

    return new Response(
      JSON.stringify({ 
        success: true,
        reset_counts: {
          email_hourly: expiredHourlyEmail?.length || 0,
          email_daily: expiredDailyEmail?.length || 0,
          sms_hourly: expiredHourlySMS?.length || 0,
          sms_daily: expiredDailySMS?.length || 0,
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[Reset Rate Limits] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
