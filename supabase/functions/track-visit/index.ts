import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
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
const TrackVisitSchema = z.object({
  referralCode: z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/, "Invalid referral code format"),
  visitorIp: z.string().ip(),
  userAgent: z.string().max(500).optional(),
  referrer: z.string().url().max(2000).optional().or(z.literal("")),
  landingPageUrl: z.string().url().max(2000).optional(),
});

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Validate input
    const body = await req.json();
    const validationResult = TrackVisitSchema.safeParse(body);
    
    if (!validationResult.success) {
      console.error("[Track Visit] Validation failed:", validationResult.error.issues);
      return new Response(
        JSON.stringify({ 
          error: "Invalid input data", 
          details: validationResult.error.issues.map(i => ({ path: i.path, message: i.message }))
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { referralCode, visitorIp, userAgent, referrer, landingPageUrl } = validationResult.data;

    console.log(`[Track Visit] Processing referral code: ${referralCode}`);

    // Find the referral link
    const { data: link, error: linkError } = await supabase
      .from("referral_links")
      .select("id, user_id, link_type")
      .eq("referral_code", referralCode)
      .eq("is_active", true)
      .single();

    if (linkError || !link) {
      console.error("[Track Visit] Invalid referral code:", referralCode);
      return new Response(
        JSON.stringify({ error: "Invalid referral code" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check for duplicate visit (same IP within 24 hours)
    const { data: recentVisit } = await supabase
      .from("referral_visits")
      .select("id")
      .eq("referral_link_id", link.id)
      .eq("visitor_ip", visitorIp)
      .gte("visited_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .single();

    if (recentVisit) {
      console.log("[Track Visit] Duplicate visit detected, skipping");
      return new Response(
        JSON.stringify({ message: "Visit already tracked" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check velocity limits
    const { data: settings } = await supabase
      .from("affiliate_settings")
      .select("velocity_limits_enabled, max_referrals_per_hour, max_referrals_per_day, max_signups_per_ip_per_day")
      .single();

    if (settings?.velocity_limits_enabled) {
      // Check hourly limit
      const { count: hourlyCount } = await supabase
        .from("referral_visits")
        .select("*", { count: "exact", head: true })
        .eq("referrer_user_id", link.user_id)
        .gte("visited_at", new Date(Date.now() - 60 * 60 * 1000).toISOString());

      if (hourlyCount && hourlyCount >= (settings.max_referrals_per_hour || 10)) {
        console.log("[Track Visit] Hourly velocity limit exceeded");
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check IP-based signup limit
      const { count: ipCount } = await supabase
        .from("referral_visits")
        .select("*", { count: "exact", head: true })
        .eq("visitor_ip", visitorIp)
        .gte("visited_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (ipCount && ipCount >= (settings.max_signups_per_ip_per_day || 3)) {
        console.log("[Track Visit] IP-based signup limit exceeded");
        return new Response(
          JSON.stringify({ error: "Too many signups from this IP" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Hash IP and truncate user agent for privacy
    const { data: hashedIp, error: hashError } = await supabase
      .rpc('hash_ip_address', { ip: visitorIp });
    
    if (hashError) {
      console.error("[Track Visit] IP hashing error:", hashError);
      return new Response(
        JSON.stringify({ error: "Failed to process visit data" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: truncatedUa, error: truncateError } = await supabase
      .rpc('truncate_user_agent', { ua: userAgent || '' });
    
    if (truncateError) {
      console.error("[Track Visit] User agent truncation error:", truncateError);
      return new Response(
        JSON.stringify({ error: "Failed to process visit data" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Record the visit with privacy-enhanced data
    const { data: visit, error: visitError } = await supabase
      .from("referral_visits")
      .insert({
        referral_link_id: link.id,
        referrer_user_id: link.user_id,
        visitor_ip: visitorIp, // Keep for fraud detection (protected by RLS)
        ip_address_hash: hashedIp, // Hashed version for privacy
        visitor_user_agent: userAgent, // Keep for fraud detection (protected by RLS)
        user_agent_truncated: truncatedUa, // Truncated for privacy
        referrer_url: referrer,
        landing_page_url: landingPageUrl,
        link_type: link.link_type,
        country_code: null, // Will be populated by geolocation if needed
        state_code: null, // Optional
      })
      .select()
      .single();

    if (visitError) {
      console.error("[Track Visit] Error recording visit:", visitError);
      throw visitError;
    }

    // Update link click count
    await supabase.rpc("increment", {
      table_name: "referral_links",
      row_id: link.id,
      column_name: "clicks",
    }).catch(() => {
      // Fallback if RPC doesn't exist
      supabase
        .from("referral_links")
        .update({ clicks: link.clicks + 1 })
        .eq("id", link.id);
    });

    console.log(`[Track Visit] Visit recorded successfully: ${visit.id}`);

    // Set cookie for attribution (365 days)
    const { data: cookieDays } = await supabase
      .from("affiliate_settings")
      .select("cookie_attribution_days")
      .single();

    const attributionDays = cookieDays?.cookie_attribution_days || 365;

    return new Response(
      JSON.stringify({ 
        success: true, 
        visitId: visit.id,
        setCookie: `dadderup_ref=${referralCode}; Max-Age=${attributionDays * 24 * 60 * 60}; Path=/; SameSite=Lax`
      }),
      { 
        status: 200, 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json",
          "Set-Cookie": `dadderup_ref=${referralCode}; Max-Age=${attributionDays * 24 * 60 * 60}; Path=/; SameSite=Lax`
        } 
      }
    );

  } catch (error) {
    console.error("[Track Visit] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
