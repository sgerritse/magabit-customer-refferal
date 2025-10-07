# Cron Job Configuration

This document explains how to set up the automated cron jobs for the DadderUp brand ambassador system.

## Prerequisites

Before setting up cron jobs, ensure:
1. The `pg_cron` extension is enabled in your Supabase project
2. The edge functions `reset-rate-limits` and `process-notifications` are deployed

## Enabling pg_cron Extension

1. Go to your Supabase Dashboard
2. Navigate to **Database** → **Extensions**
3. Search for `pg_cron`
4. Click **Enable** on the `pg_cron` extension

## Cron Job 1: Reset Rate Limits (Hourly)

This job resets the email and SMS rate limit counters every hour.

**SQL Command:**
```sql
SELECT cron.schedule(
  'reset-rate-limits-hourly',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://ctmzlorgzptgeluwjxwk.supabase.co/functions/v1/reset-rate-limits',
    headers := jsonb_build_object('Content-Type', 'application/json')
  );
  $$
);
```

**Schedule:** Runs at the top of every hour (e.g., 1:00, 2:00, 3:00)

**Purpose:** 
- Resets hourly email/SMS counters that have passed their reset time
- Resets daily counters that have passed their reset time
- Prevents ambassadors from being permanently blocked by rate limits

## Cron Job 2: Process Notifications (Every 5 Minutes)

This job processes pending notifications in the queue and sends them via email/SMS.

**SQL Command:**
```sql
SELECT cron.schedule(
  'process-notifications-5min',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://ctmzlorgzptgeluwjxwk.supabase.co/functions/v1/process-notifications',
    headers := jsonb_build_object('Content-Type', 'application/json')
  );
  $$
);
```

**Schedule:** Runs every 5 minutes (e.g., 1:00, 1:05, 1:10, 1:15)

**Purpose:**
- Processes pending notifications from the `notification_queue` table
- Sends email notifications via Resend
- Sends SMS notifications via Twilio
- Manages email sequences (ambassador welcome, etc.)

## How to Set Up

1. Open your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy and paste **both** SQL commands above
5. Click **Run** to execute
6. Verify the jobs are scheduled by running:
   ```sql
   SELECT * FROM cron.job;
   ```

## Monitoring Cron Jobs

### View All Scheduled Jobs
```sql
SELECT * FROM cron.job;
```

### View Cron Job Execution History
```sql
SELECT * FROM cron.job_run_details 
ORDER BY start_time DESC 
LIMIT 20;
```

### Check for Failed Jobs
```sql
SELECT * FROM cron.job_run_details 
WHERE status = 'failed' 
ORDER BY start_time DESC;
```

## Unscheduling Jobs

If you need to remove a cron job:

```sql
-- Remove rate limits job
SELECT cron.unschedule('reset-rate-limits-hourly');

-- Remove notifications job
SELECT cron.unschedule('process-notifications-5min');
```

## Troubleshooting

### Job Not Running
1. Check if `pg_cron` extension is enabled
2. Verify edge functions are deployed and accessible
3. Check edge function logs for errors
4. Review `cron.job_run_details` for error messages

### Rate Limits Not Resetting
1. Check edge function logs: `reset-rate-limits`
2. Verify database tables exist: `email_rate_limits`, `sms_rate_limits`
3. Run the edge function manually to test

### Notifications Not Sending
1. Check edge function logs: `process-notifications`
2. Verify secrets are configured: `RESEND_API_KEY`, `TWILIO_*`
3. Check `notification_queue` table for pending items
4. Verify email/SMS templates exist

## Cron Job 3: Security Monitor (Daily)

This job runs daily security health checks and logs results for monitoring.

### Purpose
- Detects anomalous access patterns
- Monitors fraud alerts
- Checks for unencrypted PII
- Logs results for audit trail

### Schedule SQL Command

```sql
SELECT cron.schedule(
  'security-monitor-daily',
  '0 8 * * *',  -- Every day at 8:00 AM UTC
  $$
  SELECT net.http_post(
    url := 'https://ctmzlorgzptgeluwjxwk.supabase.co/functions/v1/security-monitor',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
    body := '{"source": "cron"}'::jsonb
  ) as request_id;
  $$
);
```

**Schedule:** Runs daily at 8:00 AM UTC

**Purpose:**
- Runs `security_health_check()` database function
- Detects anomalous access via `detect_anomalous_access()`
- Checks for unresolved fraud alerts
- Logs all results to `security_monitor_logs` table
- Sends formatted HTML email report to administrators (if enabled in settings)

**Email Configuration:**
- Email reports are optional and controlled via Admin → Notifications → Email Settings
- Security checks run daily regardless of email settings
- Reports sent to: steven@dadderup.com

### View Security Monitor Logs

```sql
-- View recent security monitoring results
SELECT 
  check_date,
  health_status,
  fraud_alerts_count,
  anomalous_access_count,
  unencrypted_pii_count,
  created_at
FROM public.security_monitor_logs
ORDER BY check_date DESC
LIMIT 30;
```

### Check Recent Status

```sql
-- Check last 7 days of security status
SELECT * FROM public.security_monitor_logs 
WHERE check_date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY check_date DESC;
```

### Unschedule Security Monitor

```sql
SELECT cron.unschedule('security-monitor-daily');
```

## Production Recommendations

1. **Monitor daily** via `cron.job_run_details`
2. **Set up alerts** for failed cron jobs
3. **Test edge functions** manually before scheduling
4. **Review logs** regularly to catch issues early
5. **Backup configuration** - save cron job SQL somewhere safe
6. **Monitor security status** - check `security_monitor_logs` for CRITICAL/WARNING status
7. **Investigate anomalies** - follow up on non-OK security checks

## Related Documentation

- [Edge Function: reset-rate-limits](../supabase/functions/reset-rate-limits/index.ts)
- [Edge Function: process-notifications](../supabase/functions/process-notifications/index.ts)
- [Edge Function: security-monitor](../supabase/functions/security-monitor/index.ts)
- [Security Monitoring Guide](./SECURITY_MONITORING.md)
- [Rate Limiting System](./RATE_LIMITING.md)
- [Notification System](./NOTIFICATIONS.md)
