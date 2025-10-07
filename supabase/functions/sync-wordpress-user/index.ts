import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

interface WordPressWebhookPayload {
  user_id: number;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  date_of_birth?: string;
  father_type: 'blood_father' | 'flex_dad';
  how_many_kids: number;
  child_names?: string[];
  child_ages?: string[];
  due_date?: string;
}

async function findUserByEmail(admin: any, email: string) {
  try {
    let page = 1;
    const perPage = 100;
    while (page <= 20) {
      const { data, error } = await admin.listUsers({ page, perPage });
      if (error) break;
      const found = data?.users?.find((u: any) => (u.email || '').toLowerCase() === email.toLowerCase());
      if (found) return found;
      if (!data || !Array.isArray(data.users) || data.users.length < perPage) break;
      page += 1;
    }
  } catch (_) {}
  return null;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: WordPressWebhookPayload = await req.json();
    console.log('Received WordPress webhook for user:', payload.email);

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

// Check if user already exists by email (paginate to be safe)
const existing = await findUserByEmail(supabaseAdmin.auth.admin as any, payload.email);
let createdAuthUserId: string | null = existing?.id || null;
if (createdAuthUserId) {
  console.log('User already exists in Supabase:', payload.email);
}

// Create Supabase auth user if needed
if (!createdAuthUserId) {
  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: payload.email,
    password: payload.password,
    email_confirm: true, // Auto-confirm email
    user_metadata: {
      wp_user_id: payload.user_id,
      first_name: payload.first_name,
      last_name: payload.last_name,
    },
  });

  if (authError) {
    console.error('Failed to create Supabase auth user:', authError);
    // If creation failed, try to find existing user by email and continue if found
    const foundAfterError = await findUserByEmail(supabaseAdmin.auth.admin as any, payload.email);
    if (foundAfterError?.id) {
      createdAuthUserId = foundAfterError.id;
      console.log('Proceeding with existing Supabase user after create error:', createdAuthUserId);
    } else {
      throw new Error(`Auth user creation failed: ${authError.message}`);
    }
  } else {
    createdAuthUserId = authUser!.user.id;
    console.log('Created Supabase auth user:', createdAuthUserId);
  }
}

// Create or update profile record
const { error: profileError } = await supabaseAdmin
  .from('profiles')
  .upsert({
    user_id: createdAuthUserId!,
    display_name: `${payload.first_name} ${payload.last_name}`,
    role: 'user',
  }, { onConflict: 'user_id' } as any);

    if (profileError) {
      console.error('Failed to create profile:', profileError);
      // Don't throw - profile might exist from trigger
    }

    // Encrypt PII fields before storing
    const { data: encryptedFirstName, error: firstNameError } = await supabaseAdmin
      .rpc('encrypt_sensitive_data', { data: payload.first_name });
    
    if (firstNameError) {
      console.error('Failed to encrypt first name:', firstNameError);
      throw new Error(`First name encryption failed: ${firstNameError.message}`);
    }

    const { data: encryptedLastName, error: lastNameError } = await supabaseAdmin
      .rpc('encrypt_sensitive_data', { data: payload.last_name });
    
    if (lastNameError) {
      console.error('Failed to encrypt last name:', lastNameError);
      throw new Error(`Last name encryption failed: ${lastNameError.message}`);
    }

    let encryptedDateOfBirth = null;
    if (payload.date_of_birth) {
      const { data: encrypted, error: dobError } = await supabaseAdmin
        .rpc('encrypt_sensitive_data', { data: payload.date_of_birth });
      
      if (dobError) {
        console.error('Failed to encrypt date of birth:', dobError);
        throw new Error(`Date of birth encryption failed: ${dobError.message}`);
      }
      encryptedDateOfBirth = encrypted;
    }

    // Encrypt email
    const { data: encryptedEmail, error: emailError } = await supabaseAdmin
      .rpc('encrypt_sensitive_data', { data: payload.email });
    
    if (emailError) {
      console.error('Failed to encrypt email:', emailError);
      throw new Error(`Email encryption failed: ${emailError.message}`);
    }

    // Encrypt phone if provided
    let encryptedPhone = null;
    if (payload.phone) {
      const { data: encrypted, error: phoneError } = await supabaseAdmin
        .rpc('encrypt_sensitive_data', { data: payload.phone });
      
      if (phoneError) {
        console.error('Failed to encrypt phone:', phoneError);
        throw new Error(`Phone encryption failed: ${phoneError.message}`);
      }
      encryptedPhone = encrypted;
    }

// Create or update users table record with encrypted PII
const { error: usersError } = await supabaseAdmin
  .from('users')
  .upsert({
    id: createdAuthUserId!,
    email_encrypted: encryptedEmail,
    phone_encrypted: encryptedPhone,
    first_name_encrypted: encryptedFirstName,
    last_name_encrypted: encryptedLastName,
    date_of_birth_encrypted: encryptedDateOfBirth,
    father_type: payload.father_type,
    number_of_kids: payload.how_many_kids,
    age_of_kids: payload.child_ages?.join(', ') || null,
    due_date: payload.due_date || null,
    wp_user_id: payload.user_id,
    sync_status: 'synced',
  }, { onConflict: 'id' } as any);

    if (usersError) {
      console.error('Failed to create users record:', usersError);
      throw new Error(`Users record creation failed: ${usersError.message}`);
    }

    console.log('Successfully synced WordPress user to Supabase');

return new Response(
  JSON.stringify({
    success: true,
    supabase_user_id: createdAuthUserId!,
    message: 'User synced successfully',
  }),
  {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status: 200,
  }
);
  } catch (error) {
    console.error('Webhook processing error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
