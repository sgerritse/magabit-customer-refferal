import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting sensitive access monitoring...');

    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
    const alerts = [];

    // Check 1: Monitor excessive billing address access
    const { data: billingAccess, error: billingError } = await supabase
      .from('billing_address_access_logs')
      .select('admin_user_id, accessed_user_id')
      .gte('accessed_at', oneHourAgo);

    if (!billingError && billingAccess) {
      const accessCounts = billingAccess.reduce((acc: any, log) => {
        acc[log.admin_user_id] = (acc[log.admin_user_id] || 0) + 1;
        return acc;
      }, {});

      for (const [adminId, count] of Object.entries(accessCounts)) {
        if ((count as number) > 50) {
          alerts.push({
            user_id: adminId,
            alert_type: 'excessive_billing_access',
            severity: 'high',
            details: {
              access_count: count,
              time_window: '1 hour',
              threshold: 50
            }
          });
        }
      }
    }

    // Check 2: Monitor tax document access
    const { data: taxAccess, error: taxError } = await supabase
      .from('tax_document_access_logs')
      .select('admin_user_id, accessed_user_id, access_type')
      .gte('accessed_at', oneHourAgo);

    if (!taxError && taxAccess) {
      const taxAccessCounts = taxAccess.reduce((acc: any, log) => {
        acc[log.admin_user_id] = (acc[log.admin_user_id] || 0) + 1;
        return acc;
      }, {});

      for (const [adminId, count] of Object.entries(taxAccessCounts)) {
        if ((count as number) > 20) {
          alerts.push({
            user_id: adminId,
            alert_type: 'excessive_tax_doc_access',
            severity: 'critical',
            details: {
              access_count: count,
              time_window: '1 hour',
              threshold: 20
            }
          });
        }
      }
    }

    // Check 3: Monitor payment data access
    const { data: paymentAccess, error: paymentError } = await supabase
      .from('payment_access_audit')
      .select('admin_user_id, accessed_user_id, accessed_table')
      .gte('created_at', oneHourAgo);

    if (!paymentError && paymentAccess) {
      const paymentAccessCounts = paymentAccess.reduce((acc: any, log) => {
        acc[log.admin_user_id] = (acc[log.admin_user_id] || 0) + 1;
        return acc;
      }, {});

      for (const [adminId, count] of Object.entries(paymentAccessCounts)) {
        if ((count as number) > 30) {
          alerts.push({
            user_id: adminId,
            alert_type: 'excessive_payment_access',
            severity: 'high',
            details: {
              access_count: count,
              time_window: '1 hour',
              threshold: 30
            }
          });
        }
      }
    }

    // Check 4: Detect anomalous access patterns using enhanced function
    const { data: anomalousAccess, error: anomalousError } = await supabase
      .rpc('detect_anomalous_access');

    if (!anomalousError && anomalousAccess) {
      for (const access of anomalousAccess) {
        if (access.risk_level === 'critical' || access.risk_level === 'high') {
          alerts.push({
            user_id: access.user_id,
            alert_type: 'anomalous_access_pattern',
            severity: access.risk_level,
            details: {
              access_count: access.access_count,
              unique_tables: access.unique_tables,
              first_access: access.first_access,
              last_access: access.last_access,
              risk_level: access.risk_level
            }
          });
        }
      }
    }

    // Insert all alerts
    if (alerts.length > 0) {
      const { error: insertError } = await supabase
        .from('fraud_alerts')
        .insert(alerts);

      if (insertError) {
        console.error('Error inserting fraud alerts:', insertError);
      } else {
        console.log(`Created ${alerts.length} fraud alerts`);
      }
    }

    console.log('Sensitive access monitoring completed');

    return new Response(
      JSON.stringify({
        success: true,
        alerts_created: alerts.length,
        timestamp: new Date().toISOString()
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error: any) {
    console.error('Monitoring error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
