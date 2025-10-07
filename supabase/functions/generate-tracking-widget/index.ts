import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    const trackingScript = `
(function() {
  'use strict';
  
  const SUPABASE_URL = '${supabaseUrl}';
  const SUPABASE_ANON_KEY = '${supabaseAnonKey}';
  
  // Get referral code from URL
  function getReferralCode() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('ref') || urlParams.get('referral');
  }
  
  // Get visitor IP (will be handled server-side in production)
  function getVisitorInfo() {
    return {
      userAgent: navigator.userAgent,
      referrer: document.referrer,
      landingPageUrl: window.location.href
    };
  }
  
  // Track the visit
  async function trackVisit() {
    const referralCode = getReferralCode();
    
    if (!referralCode) {
      console.log('[MAGAbit Tracking] No referral code found');
      return;
    }
    
    const visitorInfo = getVisitorInfo();
    
    try {
      const response = await fetch(\`\${SUPABASE_URL}/functions/v1/track-visit\`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY
        },
        body: JSON.stringify({
          referralCode,
          visitorIp: 'will-be-set-server-side',
          ...visitorInfo
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log('[MAGAbit Tracking] Visit tracked successfully');
        
        // Store referral code in localStorage for conversion tracking
        localStorage.setItem('magabit_ref', referralCode);
      }
    } catch (error) {
      console.error('[MAGAbit Tracking] Error tracking visit:', error);
    }
  }
  
  // Track conversion (call this after successful signup/purchase)
  window.MAGAbitTracking = {
    trackConversion: async function(userId, orderValue, productId = null, subscriptionId = null) {
      const referralCode = localStorage.getItem('magabit_ref') || getReferralCode();
      
      if (!referralCode) {
        console.log('[MAGAbit Tracking] No referral code for conversion');
        return;
      }
      
      try {
        const response = await fetch(\`\${SUPABASE_URL}/functions/v1/track-conversion\`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY
          },
          body: JSON.stringify({
            userId,
            referralCode,
            orderValue,
            productId,
            subscriptionId
          })
        });
        
        const data = await response.json();
        
        if (data.success) {
          console.log('[MAGAbit Tracking] Conversion tracked successfully');
          
          // Clear the referral code after successful conversion
          localStorage.removeItem('magabit_ref');
        }
        
        return data;
      } catch (error) {
        console.error('[MAGAbit Tracking] Error tracking conversion:', error);
        throw error;
      }
    }
  };
  
  // Auto-track visit on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', trackVisit);
  } else {
    trackVisit();
  }
})();
`;

    return new Response(trackingScript, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/javascript",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("[Generate Tracking Widget] Error:", error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
