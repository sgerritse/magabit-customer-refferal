(function() {
  'use strict';
  
  const SUPABASE_URL = 'https://ctmzlorgzptgeluwjxwk.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN0bXpsb3JnenB0Z2VsdXdqeHdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5MTMyNzcsImV4cCI6MjA3MzQ4OTI3N30.sSt9h440CZ6aYyCdkALmGO5WEwL1z-6BBrnZeTJNkTI';
  const COOKIE_NAME = 'magabit_ref';
  const COOKIE_DAYS = 30;
  
  // Utility: Get cookie by name
  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  }
  
  // Utility: Set cookie
  function setCookie(name, value, days) {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; domain=${window.location.hostname.split('.').slice(-2).join('.')}; SameSite=Lax`;
  }
  
  // Get referral code from URL
  function getReferralCode() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('ref') || urlParams.get('referral');
  }
  
  // Get visitor info
  function getVisitorInfo() {
    return {
      userAgent: navigator.userAgent,
      referrer: document.referrer,
      landingPageUrl: window.location.href,
      screenResolution: `${screen.width}x${screen.height}`,
      language: navigator.language
    };
  }
  
  // Track the visit
  async function trackVisit() {
    const referralCode = getReferralCode();
    
    // Check if already tracked in cookie
    const existingCookie = getCookie(COOKIE_NAME);
    if (existingCookie) {
      console.log('[MAGAbit Tracking] Already tracked with code:', existingCookie);
      return;
    }
    
    if (!referralCode) {
      console.log('[MAGAbit Tracking] No referral code found');
      return;
    }
    
    const visitorInfo = getVisitorInfo();
    
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/track-visit`, {
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
        
        // Store referral code in cookie
        setCookie(COOKIE_NAME, referralCode, COOKIE_DAYS);
      } else {
        console.warn('[MAGAbit Tracking] Visit tracking failed:', data.error);
      }
    } catch (error) {
      console.error('[MAGAbit Tracking] Error tracking visit:', error);
    }
  }
  
  // Expose conversion tracking API
  window.MAGAbitTracking = {
    trackConversion: async function(userId, orderValue, productId = null, subscriptionId = null) {
      const referralCode = getCookie(COOKIE_NAME) || getReferralCode();
      
      if (!referralCode) {
        console.log('[MAGAbit Tracking] No referral code for conversion');
        return { success: false, error: 'No referral code found' };
      }
      
      try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/track-conversion`, {
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
          document.cookie = `${COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        }
        
        return data;
      } catch (error) {
        console.error('[MAGAbit Tracking] Error tracking conversion:', error);
        return { success: false, error: error.message };
      }
    },
    
    getAttribution: function() {
      const referralCode = getCookie(COOKIE_NAME);
      return referralCode ? { referralCode, expiresIn: COOKIE_DAYS } : null;
    },
    
    clearAttribution: function() {
      document.cookie = `${COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      console.log('[MAGAbit Tracking] Attribution cleared');
    }
  };
  
  // Auto-track visit on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', trackVisit);
  } else {
    trackVisit();
  }
})();
