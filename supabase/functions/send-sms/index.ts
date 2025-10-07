import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

// Security headers
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

// Input validation schema
const SendSmsSchema = z.object({
  phoneNumbers: z.string().min(1).max(2000).regex(/^[\d,+\s()-]+$/, "Invalid phone number format"),
  message: z.string().min(1).max(1600),
  userId: z.string().uuid().optional(),
});

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { ...corsHeaders, ...securityHeaders } });
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

    // Verify admin using secure user_roles table
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error('Unauthorized');
    }

    const { data: userRole } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (userRole?.role !== 'admin') {
      throw new Error('Admin access required');
    }

    // Validate input
    const body = await req.json();
    const validationResult = SendSmsSchema.safeParse(body);
    
    if (!validationResult.success) {
      console.error('SMS validation failed:', validationResult.error.issues);
      return new Response(
        JSON.stringify({ 
          error: "Invalid input data", 
          details: validationResult.error.issues.map(i => ({ path: i.path, message: i.message }))
        }),
        { status: 400, headers: { ...corsHeaders, ...securityHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { phoneNumbers, message, userId } = validationResult.data;

    // SECURITY: Get credentials from secure environment variables
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      throw new Error('SMS service not configured. Please contact administrator.');
    }

    // Get non-sensitive settings from database
    const { data: settings, error: settingsError } = await supabaseClient
      .from('sms_notification_settings')
      .select('enabled')
      .single();

    if (settingsError || !settings) {
      throw new Error('SMS settings not configured');
    }

    if (!settings.enabled) {
      throw new Error('SMS notifications are disabled');
    }

    // Get affiliate settings for rate limits
    const { data: affiliateSettings } = await supabaseClient
      .from('affiliate_settings')
      .select('max_sms_per_hour, max_sms_per_day')
      .single();

    const maxHourly = affiliateSettings?.max_sms_per_hour || 5;
    const maxDaily = affiliateSettings?.max_sms_per_day || 20;

    // Check rate limits if userId provided
    if (userId) {
      const now = new Date();
      
      // Get or create rate limit record
      const { data: rateLimits } = await supabaseClient
        .from('sms_rate_limits')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (rateLimits) {
        // Check hourly limit
        if (new Date(rateLimits.hourly_reset_at) > now && rateLimits.hourly_count >= maxHourly) {
          throw new Error(`SMS hourly limit exceeded (${maxHourly}/hour). Resets at ${rateLimits.hourly_reset_at}`);
        }

        // Check daily limit
        if (new Date(rateLimits.daily_reset_at) > now && rateLimits.daily_count >= maxDaily) {
          throw new Error(`SMS daily limit exceeded (${maxDaily}/day). Resets at ${rateLimits.daily_reset_at}`);
        }
      }

      // Update rate limits
      const hourlyResetAt = rateLimits && new Date(rateLimits.hourly_reset_at) > now 
        ? rateLimits.hourly_reset_at 
        : new Date(now.getTime() + 60 * 60 * 1000).toISOString();
      
      const dailyResetAt = rateLimits && new Date(rateLimits.daily_reset_at) > now
        ? rateLimits.daily_reset_at
        : new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

      const hourlyCount = (rateLimits && new Date(rateLimits.hourly_reset_at) > now ? rateLimits.hourly_count : 0) + 1;
      const dailyCount = (rateLimits && new Date(rateLimits.daily_reset_at) > now ? rateLimits.daily_count : 0) + 1;

      await supabaseClient
        .from('sms_rate_limits')
        .upsert({
          user_id: userId,
          hourly_count: hourlyCount,
          daily_count: dailyCount,
          hourly_reset_at: hourlyResetAt,
          daily_reset_at: dailyResetAt,
        });

      console.log(`[SMS Rate Limit] User ${userId}: ${hourlyCount}/${maxHourly} hourly, ${dailyCount}/${maxDaily} daily`);
    }

    // Parse phone numbers (comma-separated)
    const phones = phoneNumbers.split(',').map((p: string) => p.trim()).filter(Boolean);

    if (phones.length === 0) {
      throw new Error('No valid phone numbers provided');
    }

    // Send SMS to each number
    const results = [];
    for (const phone of phones) {
      try {
        const response = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
          {
            method: 'POST',
            headers: {
              'Authorization': 'Basic ' + btoa(`${twilioAccountSid}:${twilioAuthToken}`),
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              To: phone,
              From: twilioPhoneNumber,
              Body: message,
            }),
          }
        );

        const data = await response.json();

        if (response.ok) {
          console.log(`SMS sent to ${phone}:`, data.sid);
          results.push({ phone, success: true, sid: data.sid });
        } else {
          console.error(`Failed to send SMS to ${phone}:`, data);
          results.push({ phone, success: false, error: data.message });
        }
      } catch (error) {
        console.error(`Error sending SMS to ${phone}:`, error);
        results.push({ phone, success: false, error: error.message });
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, ...securityHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error in send-sms function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, ...securityHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
