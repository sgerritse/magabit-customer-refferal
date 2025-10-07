/**
 * Security headers for edge functions
 * Use these headers in all edge function responses
 */

export const securityHeaders = {
  // CORS headers
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  
  // Security headers
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  
  // Content Security Policy
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // React needs unsafe-eval
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://ctmzlorgzptgeluwjxwk.supabase.co",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; '),
};

/**
 * Get security headers as a flat object for Response
 */
export const getSecurityHeaders = (): Record<string, string> => {
  return { ...securityHeaders };
};

/**
 * Create a secure Response with security headers
 */
export const createSecureResponse = (
  body: any,
  options?: ResponseInit
): Response => {
  return new Response(
    typeof body === 'string' ? body : JSON.stringify(body),
    {
      ...options,
      headers: {
        ...getSecurityHeaders(),
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    }
  );
};
