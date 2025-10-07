import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
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
const EmailRequestSchema = z.object({
  recipients: z.array(z.string().email("Invalid email address")).min(1).max(100),
  subject: z.string().min(1).max(200),
  message: z.string().min(1).max(100000),
});

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { ...corsHeaders, ...securityHeaders } });
  }

  try {
    // Validate input
    const body = await req.json();
    const validationResult = EmailRequestSchema.safeParse(body);
    
    if (!validationResult.success) {
      console.error('Email validation failed:', validationResult.error.issues);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: "Invalid input data", 
          details: validationResult.error.issues.map(i => ({ path: i.path, message: i.message }))
        }),
        { status: 400, headers: { ...corsHeaders, ...securityHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { recipients, subject, message } = validationResult.data;

    // SECURITY: Get credentials from secure environment variables
    const mailgunApiKey = Deno.env.get('MAILGUN_API_KEY');
    const mailgunDomain = Deno.env.get('MAILGUN_DOMAIN');
    
    if (!mailgunApiKey || !mailgunDomain) {
      throw new Error("Email service not configured. Please contact administrator.");
    }

    // Get non-sensitive settings from database
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: settings, error: settingsError } = await supabase
      .from('email_notification_settings')
      .select('enabled, from_email, from_name')
      .single();

    if (settingsError || !settings) {
      throw new Error("Email settings not configured");
    }

    if (!settings.enabled) {
      throw new Error("Email notifications are disabled");
    }

    // Check rate limits for authenticated users
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      
      if (user) {
        // Get affiliate settings for limits
        const { data: affiliateSettings } = await supabase
          .from('affiliate_settings')
          .select('max_emails_per_hour, max_emails_per_day')
          .single();

        const maxHourly = affiliateSettings?.max_emails_per_hour || 10;
        const maxDaily = affiliateSettings?.max_emails_per_day || 50;

        // Check current rate limits
        const { data: rateLimits } = await supabase
          .from('email_rate_limits')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (rateLimits) {
          const now = new Date();
          const hourlyReset = new Date(rateLimits.hourly_reset_at);
          const dailyReset = new Date(rateLimits.daily_reset_at);

          // Check if limits exceeded
          if (now < hourlyReset && rateLimits.hourly_count >= maxHourly) {
            throw new Error(`Hourly email limit reached (${maxHourly} emails/hour)`);
          }
          if (now < dailyReset && rateLimits.daily_count >= maxDaily) {
            throw new Error(`Daily email limit reached (${maxDaily} emails/day)`);
          }

          // Increment counters
          const newHourlyCount = now < hourlyReset ? rateLimits.hourly_count + 1 : 1;
          const newDailyCount = now < dailyReset ? rateLimits.daily_count + 1 : 1;

          await supabase
            .from('email_rate_limits')
            .update({
              hourly_count: newHourlyCount,
              daily_count: newDailyCount,
              hourly_reset_at: now < hourlyReset ? rateLimits.hourly_reset_at : new Date(now.getTime() + 60 * 60 * 1000).toISOString(),
              daily_reset_at: now < dailyReset ? rateLimits.daily_reset_at : new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
            })
            .eq('user_id', user.id);
        } else {
          // Create initial rate limit record
          await supabase
            .from('email_rate_limits')
            .insert({
              user_id: user.id,
              hourly_count: 1,
              daily_count: 1,
              hourly_reset_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
              daily_reset_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            });
        }
      }
    }

    // Send email via Mailgun API using secure environment variables
    const mailgunUrl = `https://api.mailgun.net/v3/${mailgunDomain}/messages`;
    
    const formData = new FormData();
    formData.append('from', `${settings.from_name} <${settings.from_email}>`);
    recipients.forEach(email => formData.append('to', email));
    formData.append('subject', subject);
    formData.append('html', message);

    const mailgunResponse = await fetch(mailgunUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`api:${mailgunApiKey}`)}`,
      },
      body: formData,
    });

    if (!mailgunResponse.ok) {
      const errorText = await mailgunResponse.text();
      console.error('Mailgun error:', errorText);
      throw new Error(`Failed to send email: ${errorText}`);
    }

    const result = await mailgunResponse.json();
    console.log('Email sent successfully:', result);

    return new Response(
      JSON.stringify({ success: true, message: 'Email sent successfully', data: result }),
      { 
        status: 200, 
        headers: { ...corsHeaders, ...securityHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('Error in send-email function:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, ...securityHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
