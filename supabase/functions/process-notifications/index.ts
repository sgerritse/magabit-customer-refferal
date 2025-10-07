import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { getCorsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch unprocessed notifications
    const { data: notifications, error: fetchError } = await supabase
      .from('notification_queue')
      .select('*')
      .eq('processed', false)
      .limit(50);

    if (fetchError) {
      throw fetchError;
    }

    if (!notifications || notifications.length === 0) {
      console.log('[Process Notifications] No pending notifications');
      return new Response(
        JSON.stringify({ message: 'No pending notifications', processed: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[Process Notifications] Processing ${notifications.length} notifications`);

    let successCount = 0;
    let failureCount = 0;

    for (const notification of notifications) {
      try {
        // Route to appropriate channel
        if (notification.channel === 'email') {
          // Get user's email
          const { data: userData } = await supabase.auth.admin.getUserById(notification.user_id);
          
          if (userData?.user?.email) {
            // Get template based on notification type
            const { data: template } = await supabase
              .from('email_templates')
              .select('*')
              .eq('name', notification.notification_type)
              .eq('is_active', true)
              .single();

            if (template) {
              // Replace variables in template
              let emailBody = template.body_html;
              if (notification.data) {
                Object.keys(notification.data).forEach(key => {
                  emailBody = emailBody.replace(new RegExp(`{{${key}}}`, 'g'), notification.data[key]);
                });
              }

              // Send email using send-email function
              await supabase.functions.invoke('send-email', {
                body: {
                  recipients: [userData.user.email],
                  subject: template.subject,
                  message: emailBody
                }
              });

              successCount++;
            } else {
              console.warn(`[Process Notifications] No template found for ${notification.notification_type}`);
              failureCount++;
            }
          }
        } else if (notification.channel === 'sms') {
          // Get user's phone number
          const { data: profile } = await supabase
            .from('profiles')
            .select('phone')
            .eq('user_id', notification.user_id)
            .single();

          if (profile?.phone) {
            // Get SMS template
            const { data: template } = await supabase
              .from('sms_templates')
              .select('*')
              .eq('name', notification.notification_type)
              .eq('is_active', true)
              .single();

            if (template) {
              let smsBody = template.message_text;
              if (notification.data) {
                Object.keys(notification.data).forEach(key => {
                  smsBody = smsBody.replace(new RegExp(`{{${key}}}`, 'g'), notification.data[key]);
                });
              }

              // Send SMS using send-sms function
              await supabase.functions.invoke('send-sms', {
                body: {
                  phoneNumbers: [profile.phone],
                  message: smsBody
                }
              });

              successCount++;
            } else {
              failureCount++;
            }
          }
        }

        // Mark as processed
        await supabase
          .from('notification_queue')
          .update({ 
            processed: true, 
            processed_at: new Date().toISOString() 
          })
          .eq('id', notification.id);

      } catch (notificationError) {
        console.error(`[Process Notifications] Failed to process notification ${notification.id}:`, notificationError);
        failureCount++;
        
        // Mark as processed to avoid infinite retries (could implement retry logic here)
        await supabase
          .from('notification_queue')
          .update({ 
            processed: true, 
            processed_at: new Date().toISOString() 
          })
          .eq('id', notification.id);
      }
    }

    console.log(`[Process Notifications] Completed: ${successCount} success, ${failureCount} failures`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: successCount,
        failed: failureCount 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[Process Notifications] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
