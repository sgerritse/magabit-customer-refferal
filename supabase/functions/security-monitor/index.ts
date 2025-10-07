import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function generateSecurityReportEmail({ status, date, summary, healthData, anomalousData, fraudData }: any): string {
  const statusEmoji = status === 'OK' ? '🟢' : status === 'WARNING' ? '🟡' : '🔴';
  const statusColor = status === 'OK' ? '#10b981' : status === 'WARNING' ? '#f59e0b' : '#ef4444';
  
  let healthChecksHtml = '';
  if (healthData && Array.isArray(healthData)) {
    healthChecksHtml = healthData.map((check: any) => {
      const checkEmoji = check.status === 'OK' ? '✅' : check.status === 'WARNING' ? '⚠️' : '❌';
      return `
        <div style="margin: 10px 0; padding: 10px; background: #f9fafb; border-left: 3px solid ${check.status === 'OK' ? '#10b981' : check.status === 'WARNING' ? '#f59e0b' : '#ef4444'};">
          <strong>${checkEmoji} ${check.check_name}</strong>: ${check.status}
          ${check.details ? `<div style="font-size: 14px; color: #6b7280; margin-top: 5px;">${JSON.stringify(check.details, null, 2)}</div>` : ''}
        </div>
      `;
    }).join('');
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 20px;">
      
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center; color: white;">
        <h1 style="margin: 0; font-size: 24px;">🔒 Daily Security Monitoring Report</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">MAGAbit Security System</p>
      </div>

      <div style="background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
        
        <div style="text-align: center; padding: 20px; background: #f9fafb; border-radius: 8px; margin-bottom: 30px;">
          <div style="font-size: 18px; color: #6b7280; margin-bottom: 10px;">Overall Status</div>
          <div style="font-size: 48px; margin-bottom: 10px;">${statusEmoji}</div>
          <div style="font-size: 24px; font-weight: bold; color: ${statusColor};">${status}</div>
          <div style="font-size: 14px; color: #9ca3af; margin-top: 10px;">${date} • 08:00 UTC</div>
        </div>

        <div style="border-top: 2px solid #e5e7eb; padding-top: 20px; margin-top: 20px;">
          <h2 style="font-size: 18px; margin-bottom: 15px; color: #374151;">📊 Summary Metrics</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 12px; background: #f9fafb; border-bottom: 1px solid #e5e7eb;"><strong>Fraud Alerts</strong></td>
              <td style="padding: 12px; background: #f9fafb; border-bottom: 1px solid #e5e7eb; text-align: right;">${summary.fraud_alerts} unresolved</td>
            </tr>
            <tr>
              <td style="padding: 12px; background: white; border-bottom: 1px solid #e5e7eb;"><strong>Anomalous Access</strong></td>
              <td style="padding: 12px; background: white; border-bottom: 1px solid #e5e7eb; text-align: right;">${summary.anomalous_access} detected</td>
            </tr>
            <tr>
              <td style="padding: 12px; background: #f9fafb; border-bottom: 1px solid #e5e7eb;"><strong>Unencrypted PII</strong></td>
              <td style="padding: 12px; background: #f9fafb; border-bottom: 1px solid #e5e7eb; text-align: right;">${summary.unencrypted_pii} records</td>
            </tr>
            <tr>
              <td style="padding: 12px; background: white; border-bottom: 1px solid #e5e7eb;"><strong>Critical Checks</strong></td>
              <td style="padding: 12px; background: white; border-bottom: 1px solid #e5e7eb; text-align: right;">${summary.critical_checks}</td>
            </tr>
            <tr>
              <td style="padding: 12px; background: #f9fafb;"><strong>Warning Checks</strong></td>
              <td style="padding: 12px; background: #f9fafb; text-align: right;">${summary.warning_checks}</td>
            </tr>
          </table>
        </div>

        <div style="border-top: 2px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
          <h2 style="font-size: 18px; margin-bottom: 15px; color: #374151;">🔍 Detailed Findings</h2>
          ${healthChecksHtml}
        </div>

        ${fraudData && fraudData.length > 0 ? `
          <div style="border-top: 2px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
            <h2 style="font-size: 18px; margin-bottom: 15px; color: #374151;">⚠️ Unresolved Fraud Alerts</h2>
            <div style="background: #fef2f2; padding: 15px; border-radius: 8px; border-left: 4px solid #ef4444;">
              ${fraudData.map((alert: any) => `
                <div style="margin-bottom: 10px;">
                  <strong>${alert.alert_type}</strong> - Severity: ${alert.severity}
                  <div style="font-size: 14px; color: #6b7280;">${new Date(alert.created_at).toLocaleString()}</div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        ${anomalousData && anomalousData.length > 0 ? `
          <div style="border-top: 2px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
            <h2 style="font-size: 18px; margin-bottom: 15px; color: #374151;">👁️ Anomalous Access Detected</h2>
            <div style="background: #fffbeb; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b;">
              ${anomalousData.map((access: any) => `
                <div style="margin-bottom: 10px;">
                  <strong>User:</strong> ${access.user_id}
                  <div style="font-size: 14px; color: #6b7280;">Accesses: ${access.access_count} | Tables: ${access.unique_tables}</div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <div style="border-top: 2px solid #e5e7eb; padding-top: 20px; margin-top: 30px; text-align: center;">
          <p style="color: #6b7280; font-size: 14px; margin-bottom: 15px;">View full security logs in your Supabase dashboard</p>
          <a href="https://supabase.com/dashboard/project/ctmzlorgzptgeluwjxwk/editor" style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">Open Dashboard</a>
        </div>

      </div>

      <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
        <p>This is an automated security report from MAGAbit Security System</p>
        <p>To disable these emails, go to Admin → Notifications → Email Settings</p>
      </div>

    </body>
    </html>
  `;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting daily security health check...');

    // Check if email reports are enabled
    const { data: emailSettings } = await supabase
      .from('email_notification_settings')
      .select('security_reports_enabled, enabled, from_email, from_name')
      .single();

    const shouldSendEmail = emailSettings?.security_reports_enabled && emailSettings?.enabled;
    console.log('Email reports enabled:', shouldSendEmail);

    // Run security health check
    const { data: healthData, error: healthError } = await supabase
      .rpc('security_health_check');

    if (healthError) {
      console.error('Security health check failed:', healthError);
      throw healthError;
    }

    console.log('Health check results:', healthData);

    // Run anomalous access detection
    const { data: anomalousData, error: anomalousError } = await supabase
      .rpc('detect_anomalous_access');

    if (anomalousError) {
      console.error('Anomalous access detection failed:', anomalousError);
      throw anomalousError;
    }

    console.log('Anomalous access count:', anomalousData?.length || 0);

    // Check for unresolved fraud alerts
    const { data: fraudData, error: fraudError } = await supabase
      .from('fraud_alerts')
      .select('*')
      .eq('resolved', false);

    if (fraudError) {
      console.error('Fraud alerts check failed:', fraudError);
      throw fraudError;
    }

    console.log('Unresolved fraud alerts:', fraudData?.length || 0);

    // Check encryption key rotation status
    const { data: keyRotationData, error: keyRotationError } = await supabase
      .rpc('check_encryption_key_rotation_alert');
    
    if (keyRotationError) {
      console.error('Encryption key rotation check failed:', keyRotationError);
    } else {
      console.log('Encryption key status:', keyRotationData?.[0]?.alert_message || 'Unknown');
    }

    // Determine overall status
    let overallStatus = 'OK';
    let criticalCount = 0;
    let warningCount = 0;
    let unresolvedFraudCount = fraudData?.length || 0;
    let anomalousAccessCount = anomalousData?.length || 0;
    let unencryptedPiiCount = 0;

    // Parse health check results
    if (healthData && Array.isArray(healthData)) {
      for (const check of healthData) {
        if (check.status === 'CRITICAL') {
          criticalCount++;
          overallStatus = 'CRITICAL';
        } else if (check.status === 'WARNING' && overallStatus !== 'CRITICAL') {
          warningCount++;
          overallStatus = 'WARNING';
        }

        // Extract unencrypted PII count
        if (check.check_name === 'Unencrypted PII Found' && check.details) {
          const piiArray = check.details;
          if (Array.isArray(piiArray)) {
            unencryptedPiiCount = piiArray.reduce((sum: number, item: any) => sum + (item.count || 0), 0);
          }
        }
      }
    }

    // Check encryption key age and update status if critical
    if (keyRotationData && keyRotationData.length > 0 && keyRotationData[0].requires_rotation) {
      criticalCount++;
      overallStatus = 'CRITICAL';
      console.warn('[Security Monitor] 🚨 ENCRYPTION KEY ROTATION OVERDUE:', keyRotationData[0].alert_message);
    }

    // Log the results
    const { error: logError } = await supabase
      .from('security_monitor_logs')
      .insert({
        check_date: new Date().toISOString().split('T')[0],
        health_status: overallStatus,
        fraud_alerts_count: unresolvedFraudCount,
        anomalous_access_count: anomalousAccessCount,
        unencrypted_pii_count: unencryptedPiiCount,
        details: {
          health_checks: healthData,
          anomalous_access: anomalousData,
          fraud_alerts: fraudData,
          encryption_key_status: keyRotationData?.[0] || null,
          critical_count: criticalCount,
          warning_count: warningCount
        }
      });

    if (logError) {
      console.error('Failed to log security monitor results:', logError);
      throw logError;
    }

    console.log(`Security monitoring complete. Status: ${overallStatus}`);

    // Send email report if enabled
    if (shouldSendEmail) {
      try {
        const emailHtml = generateSecurityReportEmail({
          status: overallStatus,
          date: new Date().toISOString().split('T')[0],
          summary: {
            fraud_alerts: unresolvedFraudCount,
            anomalous_access: anomalousAccessCount,
            unencrypted_pii: unencryptedPiiCount,
            critical_checks: criticalCount,
            warning_checks: warningCount
          },
          healthData,
          anomalousData,
          fraudData
        });

        const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({
            recipients: ['security@magabit.net'],
            subject: `🔒 Daily Security Report - ${new Date().toISOString().split('T')[0]} - ${overallStatus === 'OK' ? '✅ OK' : overallStatus === 'WARNING' ? '⚠️ WARNING' : '🔴 CRITICAL'}`,
            message: emailHtml
          })
        });

        if (!emailResponse.ok) {
          const errorText = await emailResponse.text();
          console.error('Failed to send security report email:', errorText);
        } else {
          console.log('Security report email sent successfully');
        }
      } catch (emailError) {
        console.error('Error sending security report email:', emailError);
        // Don't fail the security check if email fails
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        status: overallStatus,
        summary: {
          fraud_alerts: unresolvedFraudCount,
          anomalous_access: anomalousAccessCount,
          unencrypted_pii: unencryptedPiiCount,
          critical_checks: criticalCount,
          warning_checks: warningCount
        },
        details: healthData,
        email_sent: shouldSendEmail
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Security monitor error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
