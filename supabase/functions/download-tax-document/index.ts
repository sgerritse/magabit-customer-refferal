// Download Tax Document with Audit Logging
// This edge function creates time-limited signed URLs for tax document downloads
// and logs all access for security compliance

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
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

    // Get authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get request parameters
    const { filePath, userId } = await req.json();

    if (!filePath) {
      return new Response(
        JSON.stringify({ error: 'Missing filePath parameter' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if user is authorized to access this document
    const isOwnDocument = filePath.startsWith(`${user.id}/`);
    
    // Check if user is admin
    const { data: roleData } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    const isAdmin = !!roleData;

    if (!isOwnDocument && !isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized access to tax document' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Extract target user ID from file path
    const targetUserId = filePath.split('/')[0];

    // Log the access
    await supabaseClient.from('tax_document_access_logs').insert({
      admin_user_id: user.id,
      accessed_user_id: targetUserId || user.id,
      access_type: 'DOWNLOAD_W9',
      ip_address: req.headers.get('x-forwarded-for')?.split(',')[0] || null,
      user_agent: req.headers.get('user-agent') || null,
    });

    // Create signed URL (5 minute expiration for security)
    const { data: signedUrlData, error: signedUrlError } = await supabaseClient
      .storage
      .from('tax-documents')
      .createSignedUrl(filePath, 300); // 5 minutes

    if (signedUrlError) {
      console.error('Error creating signed URL:', signedUrlError);
      return new Response(
        JSON.stringify({ error: 'Failed to generate download URL' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // If admin is accessing someone else's document, create additional audit entry
    if (isAdmin && !isOwnDocument) {
      console.log(`Admin ${user.id} accessed tax document for user ${targetUserId}`);
      
      // Create security audit log
      await supabaseClient.from('security_audit_logs').insert({
        user_id: user.id,
        admin_user_id: user.id,
        action: 'ADMIN_DOWNLOAD_TAX_DOCUMENT',
        target_user_id: targetUserId,
        new_values: {
          file_path: filePath,
          download_timestamp: new Date().toISOString(),
        },
      });
    }

    return new Response(
      JSON.stringify({
        signedUrl: signedUrlData.signedUrl,
        expiresIn: 300,
        message: 'This link will expire in 5 minutes',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in download-tax-document function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
