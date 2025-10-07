import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { getCorsHeaders } from "../_shared/cors.ts"

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Verify the request is from an authenticated admin user
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    )

    // Get the current user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user is admin using secure RPC function
    const { data: isAdmin, error: roleError } = await supabaseClient
      .rpc('has_role', {
        _user_id: user.id,
        _role: 'admin'
      })

    if (roleError || !isAdmin) {
      console.error('Admin check failed:', roleError)
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get the user ID to delete from the request body
    const { userId } = await req.json()
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Prevent admin from deleting themselves
    if (userId === user.id) {
      return new Response(
        JSON.stringify({ error: 'Cannot delete your own account' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get target user info before deletion
    const { data: targetUser } = await supabaseAdmin.auth.admin.getUserById(userId)
    const authExisted = Boolean(targetUser?.user)
    
    // Create audit log entry BEFORE deleting to avoid trigger issues
    const { error: auditError } = await supabaseAdmin
      .from('security_audit_logs')
      .insert({
        user_id: user.id,
        admin_user_id: user.id,
        action: 'DELETE_USER',
        target_user_id: userId,
        old_values: { 
          email: targetUser?.user?.email,
          deleted_at: new Date().toISOString()
        }
      })
    
    if (auditError) {
      console.error('Error creating audit log:', auditError)
    }

    // Delete user from auth - CASCADE constraints will automatically delete all related data
    console.log('Deleting user (CASCADE will handle all related data)...')

    let authDeleted = false
    if (authExisted) {
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)
      if (deleteError) {
        // Treat user_not_found (404) as a successful, idempotent outcome
        const code = (deleteError as any).code
        const status = (deleteError as any).status
        if (code === 'user_not_found' || status === 404) {
          console.warn('Auth user already deleted; continuing')
        } else {
          console.error('Error deleting user:', deleteError)
          return new Response(
            JSON.stringify({ error: 'Failed to delete user' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      } else {
        authDeleted = true
        console.log('User and all related data deleted via CASCADE')
      }
    } else {
      console.log('Auth user not found; skipping auth deletion')
    }

    const message = authExisted
      ? (authDeleted ? 'User and all related data deleted successfully' : 'User was already deleted')
      : 'User did not exist'

    return new Response(
      JSON.stringify({ success: true, auth_deleted: authDeleted, message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in delete-user function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})