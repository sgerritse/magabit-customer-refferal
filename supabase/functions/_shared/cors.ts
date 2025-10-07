/**
 * CORS Configuration for Edge Functions
 * SECURITY: Restrict origins to known domains only
 */

// List of allowed origins (add your production domains here)
const ALLOWED_ORIGINS = [
  'https://ctmzlorgzptgeluwjxwk.supabase.co',
  'http://localhost:8000',
  'http://localhost:5173',
  'http://localhost:3000',
  // Production domains
  'https://app.magabit.net',
  'https://magabit.net',
  'https://www.magabit.net',
];

/**
 * Get CORS headers for the requesting origin
 * Only returns Access-Control-Allow-Origin if the origin is whitelisted
 */
export function getCorsHeaders(req: Request): HeadersInit {
  const origin = req.headers.get('origin') || '';
  
  // Check if origin is in whitelist or is a Lovable preview domain
  const isAllowed = ALLOWED_ORIGINS.includes(origin) || 
    (origin.includes('.lovableproject.com') || origin.includes('.lovable.app'));
  
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
    'Access-Control-Max-Age': '86400',
  };
}

/**
 * For backwards compatibility, export standard CORS headers
 * These use the first allowed origin (Supabase domain)
 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGINS[0],
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};
