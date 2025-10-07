import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { getCorsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
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

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { table, column, recordId, targetUserId } = await req.json();

    // Validate required fields
    if (!table || !column || !recordId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: table, column, recordId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // SECURITY: Whitelist validation for table and column names to prevent SQL injection
    const ALLOWED_TABLES = ['users', 'billing_addresses', 'tax_documents', 'ambassador_payout_methods'];
    const ALLOWED_COLUMNS: Record<string, string[]> = {
      'users': ['email_encrypted', 'phone_encrypted', 'first_name_encrypted', 'last_name_encrypted', 'date_of_birth_encrypted'],
      'billing_addresses': ['address_line1_encrypted', 'address_line2_encrypted', 'city_encrypted', 'state_encrypted', 'postal_code_encrypted'],
      'tax_documents': ['tax_id_encrypted'],
      'ambassador_payout_methods': ['bank_details_encrypted', 'paypal_email_encrypted']
    };
    
    // SECURITY: Rate limiting for tax document decryption
    if (table === 'tax_documents' && column === 'tax_id_encrypted') {
      const { data: rateLimitCheck, error: rateLimitError } = await supabaseClient
        .rpc('check_tax_decrypt_rate_limit', {
          p_user_id: user.id,
          p_target_user_id: targetUserId
        });
      
      if (rateLimitError) {
        console.error('Rate limit check error:', rateLimitError);
        return new Response(
          JSON.stringify({ error: 'Rate limit check failed' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (!rateLimitCheck.allowed) {
        console.warn(`Rate limit exceeded for user ${user.id} accessing tax doc for ${targetUserId}`);
        return new Response(
          JSON.stringify({ 
            error: 'Rate limit exceeded for tax document access',
            reason: rateLimitCheck.reason,
            blocked_until: rateLimitCheck.blocked_until
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      console.log(`Rate limit check passed. Remaining: ${rateLimitCheck.remaining}`);
    }

    if (!ALLOWED_TABLES.includes(table)) {
      console.warn('Attempted access to unauthorized table:', table);
      return new Response(
        JSON.stringify({ error: 'Invalid table name' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!ALLOWED_COLUMNS[table]?.includes(column)) {
      console.warn('Attempted access to unauthorized column:', { table, column });
      return new Response(
        JSON.stringify({ error: 'Invalid column name for this table' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin or accessing their own data
    const { data: userRole } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    const isAdmin = userRole?.role === 'admin';
    const isOwnData = targetUserId === user.id;

    if (!isAdmin && !isOwnData) {
      console.log('Access denied:', { userId: user.id, targetUserId, isAdmin });
      return new Response(
        JSON.stringify({ error: 'Forbidden - insufficient permissions' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch encrypted data
    const { data: record, error: fetchError } = await supabaseClient
      .from(table)
      .select(column)
      .eq('id', recordId)
      .single();

    if (fetchError || !record) {
      console.error('Error fetching record:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Record not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const encryptedData = record[column];
    if (!encryptedData) {
      return new Response(
        JSON.stringify({ decrypted: null }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Decrypt using database function
    const { data: decrypted, error: decryptError } = await supabaseClient
      .rpc('decrypt_sensitive_data', { encrypted_data: encryptedData });

    if (decryptError) {
      console.error('Decryption error:', decryptError);
      return new Response(
        JSON.stringify({ error: 'Decryption failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log access if admin is accessing another user's data
    if (isAdmin && !isOwnData) {
      await supabaseClient.from('security_audit_logs').insert({
        user_id: user.id,
        admin_user_id: user.id,
        action: `DECRYPT_${table.toUpperCase()}_${column.toUpperCase()}`,
        target_user_id: targetUserId,
        new_values: { table, column, recordId }
      });
    }

    return new Response(
      JSON.stringify({ decrypted }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in decrypt-sensitive-field:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
