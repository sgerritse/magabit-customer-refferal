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
const TrackConversionSchema = z.object({
  userId: z.string().uuid("Invalid user ID format"),
  referralCode: z.string().min(1).max(100).regex(/^[a-zA-Z0-9_-]+$/, "Invalid referral code").optional(),
  subscriptionId: z.string().max(255).optional(),
  productId: z.string().uuid().optional(),
  orderValue: z.number().min(0).max(1000000),
  billingCycle: z.number().int().min(1).max(120).default(1),
});

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Validate input
    const body = await req.json();
    const validationResult = TrackConversionSchema.safeParse(body);
    
    if (!validationResult.success) {
      console.error("[Track Conversion] Validation failed:", validationResult.error.issues);
      return new Response(
        JSON.stringify({ 
          error: "Invalid input data", 
          details: validationResult.error.issues.map(i => ({ path: i.path, message: i.message }))
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { 
      userId, 
      referralCode, 
      subscriptionId, 
      productId, 
      orderValue,
      billingCycle 
    } = validationResult.data;

    console.log(`[Track Conversion] Processing conversion for user: ${userId}`);

    // Find referral visit (by cookie or explicit code)
    let visit;
    if (referralCode) {
      const { data: link } = await supabase
        .from("referral_links")
        .select("id, user_id")
        .eq("referral_code", referralCode)
        .single();

      if (link) {
        const { data } = await supabase
          .from("referral_visits")
          .select("*")
          .eq("referral_link_id", link.id)
          .order("visited_at", { ascending: false })
          .limit(1)
          .single();
        
        visit = data;
      }
    }

    if (!visit) {
      console.log("[Track Conversion] No referral visit found");
      return new Response(
        JSON.stringify({ message: "No referral attribution found" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if already converted
    if (visit.converted) {
      console.log("[Track Conversion] Visit already converted");
      return new Response(
        JSON.stringify({ message: "Conversion already recorded" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get commission settings
    const { data: settings } = await supabase
      .from("affiliate_settings")
      .select("*")
      .single();

    // Check for user-specific override
    const { data: override } = await supabase
      .from("user_commission_overrides")
      .select("*")
      .eq("user_id", visit.referrer_user_id)
      .eq("is_active", true)
      .single();

    let commissionRate = settings?.default_commission_rate || 30;
    let commissionType = settings?.default_commission_type || "percentage";

    // Apply tiered commissions if enabled
    if (settings?.tiered_commissions_enabled) {
      const { data: tier } = await supabase
        .from("ambassador_tiers")
        .select("current_tier, monthly_conversions")
        .eq("user_id", visit.referrer_user_id)
        .single();

      if (tier) {
        switch (tier.current_tier) {
          case "gold":
            commissionRate = settings.gold_rate || 40;
            break;
          case "silver":
            commissionRate = settings.silver_rate || 35;
            break;
          case "bronze":
            commissionRate = settings.bronze_rate || 30;
            break;
        }
      }
    }

    // Apply override if exists
    if (override) {
      commissionRate = override.commission_rate;
      commissionType = override.commission_type;
    }

    // Calculate commission
    let commissionAmount = 0;
    if (commissionType === "percentage") {
      commissionAmount = (orderValue * commissionRate) / 100;
    } else {
      commissionAmount = commissionRate;
    }

    // Apply campaign boost if active
    let boostAmount = 0;
    if (settings?.campaign_boost_enabled) {
      const now = new Date();
      const start = settings.campaign_boost_start_date ? new Date(settings.campaign_boost_start_date) : null;
      const end = settings.campaign_boost_end_date ? new Date(settings.campaign_boost_end_date) : null;

      const isInCampaignPeriod = (!start || now >= start) && (!end || now <= end);

      if (isInCampaignPeriod) {
        // Check if user is in campaign boost list or if targeting all
        const { data: boostRecord } = await supabase
          .from("campaign_boost_ambassadors")
          .select("boost_amount")
          .eq("user_id", visit.referrer_user_id)
          .single();

        if (settings.campaign_boost_target === "all" || boostRecord) {
          boostAmount = boostRecord?.boost_amount || settings.campaign_boost_amount || 0;
        }
      }
    }

    const totalCommission = commissionAmount + boostAmount;

    // Record the earning
    const { data: earning, error: earningError } = await supabase
      .from("ambassador_earnings")
      .insert({
        user_id: visit.referrer_user_id,
        referral_visit_id: visit.id,
        amount: totalCommission,
        commission_rate: commissionRate,
        commission_type: commissionType,
        product_id: productId,
        subscription_id: subscriptionId,
        billing_cycle_number: billingCycle,
        campaign_boost_applied: boostAmount > 0,
        campaign_boost_amount: boostAmount,
        status: "pending",
      })
      .select()
      .single();

    if (earningError) {
      console.error("[Track Conversion] Error recording earning:", earningError);
      throw earningError;
    }

    // Update visit as converted
    await supabase
      .from("referral_visits")
      .update({ 
        converted: true, 
        conversion_date: new Date().toISOString(),
        conversion_value: totalCommission,
        converted_user_id: userId
      })
      .eq("id", visit.id);

    // Update ambassador tier
    const { data: tier } = await supabase
      .from("ambassador_tiers")
      .select("monthly_conversions, current_tier")
      .eq("user_id", visit.referrer_user_id)
      .single();

    if (tier) {
      const newCount = (tier.monthly_conversions || 0) + 1;
      let newTier = tier.current_tier;

      if (settings?.tiered_commissions_enabled) {
        if (newCount >= (settings.gold_threshold || 25)) {
          newTier = "gold";
        } else if (newCount >= (settings.silver_threshold || 10)) {
          newTier = "silver";
        } else {
          newTier = "bronze";
        }
      }

      await supabase
        .from("ambassador_tiers")
        .update({ 
          monthly_conversions: newCount,
          current_tier: newTier,
          tier_calculated_at: new Date().toISOString()
        })
        .eq("user_id", visit.referrer_user_id);
    }

    console.log(`[Track Conversion] Conversion recorded: $${totalCommission}`);

    // Check referral link notification preferences before queuing
    const { data: linkPrefs } = await supabase
      .from("referral_links")
      .select("notifications_enabled")
      .eq("id", visit.referral_link_id)
      .single();

    if (linkPrefs?.notifications_enabled) {
      // Queue notification based on user preferences
      await supabase
        .from("notification_queue")
        .insert({
          user_id: visit.referrer_user_id,
          notification_type: "conversion",
          channel: "email", // Could be made dynamic based on user preference
          data: {
            amount: totalCommission,
            product_id: productId,
            link_type: visit.link_type
          }
        });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        earningId: earning.id,
        commissionAmount: totalCommission
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[Track Conversion] Error:", error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
