# Security Monitoring Guide

## Overview
This document provides SQL queries and procedures for monitoring the security health of your DadderUp application.

## Daily Security Health Check

Run this query every morning to get an overall security status:

```sql
SELECT public.security_health_check();
```

**Example output:**
```json
{
  "timestamp": "2025-10-06T12:00:00Z",
  "unresolved_fraud_alerts": 0,
  "audit_logs_24h": 234,
  "anomalous_access_patterns": 0,
  "encryption_status": "enabled",
  "status": "healthy"
}
```

**Status Levels:**
- `healthy`: No issues detected
- `warning`: 5+ unresolved fraud alerts OR 2+ anomalous access patterns
- `critical`: 10+ unresolved fraud alerts OR 5+ anomalous access patterns

## Monitoring Queries

### 1. Unresolved Fraud Alerts

Get all unresolved fraud alerts sorted by severity:

```sql
SELECT 
  id,
  user_id,
  alert_type,
  severity,
  details,
  created_at
FROM public.fraud_alerts
WHERE resolved = false
ORDER BY 
  CASE severity
    WHEN 'critical' THEN 1
    WHEN 'high' THEN 2
    WHEN 'medium' THEN 3
    ELSE 4
  END,
  created_at DESC;
```

### 2. Anomalous Access Patterns

Detect users with unusual access patterns in the last hour:

```sql
SELECT * FROM public.detect_anomalous_access();
```

### 3. Recent Admin Actions

View all admin actions in the last 24 hours:

```sql
SELECT 
  admin_user_id,
  action,
  target_user_id,
  old_values,
  new_values,
  created_at
FROM public.security_audit_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

### 4. Failed Decryption Attempts

Monitor for encryption key issues:

```sql
-- Check edge function logs for decryption errors
-- Run in Supabase Dashboard > Edge Functions > decrypt-sensitive-field > Logs
-- Look for: "Decryption error" or "Encryption key not found"
```

### 5. High-Volume Access Users

Identify users accessing sensitive data frequently:

```sql
SELECT 
  admin_user_id,
  COUNT(*) as access_count,
  COUNT(DISTINCT target_user_id) as unique_users_accessed,
  MIN(created_at) as first_access,
  MAX(created_at) as last_access
FROM public.security_audit_logs
WHERE created_at > NOW() - INTERVAL '7 days'
  AND action LIKE '%ADMIN%'
GROUP BY admin_user_id
HAVING COUNT(*) > 100
ORDER BY access_count DESC;
```

### 6. Tax Document Access Audit

Review who has accessed tax documents:

```sql
SELECT 
  admin_user_id,
  accessed_user_id,
  access_type,
  accessed_at
FROM public.tax_document_access_logs
WHERE accessed_at > NOW() - INTERVAL '7 days'
ORDER BY accessed_at DESC;
```

### 7. Payment Data Access Audit

Monitor access to payment information:

```sql
SELECT 
  admin_user_id,
  accessed_user_id,
  access_type,
  accessed_table,
  accessed_columns,
  created_at
FROM public.payment_access_audit
WHERE created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;
```

### 8. Billing Address Access Audit

Track billing address access:

```sql
SELECT 
  admin_user_id,
  accessed_user_id,
  access_type,
  accessed_fields,
  accessed_at
FROM public.billing_address_access_logs
WHERE accessed_at > NOW() - INTERVAL '7 days'
ORDER BY accessed_at DESC;
```

## Alert Thresholds

Set up automated alerts for these conditions:

### Critical Alerts (Immediate Action Required)
- **10+ unresolved fraud alerts** in the fraud_alerts table
- **5+ anomalous access patterns** detected by `detect_anomalous_access()`
- **Any encryption/decryption errors** in edge function logs
- **Vault secret access failures**

### Warning Alerts (Review Within 24 Hours)
- **5-9 unresolved fraud alerts**
- **2-4 anomalous access patterns**
- **Single admin accessing 50+ user records** in one hour
- **Failed login attempts spike** (monitor auth logs)

## Automated Monitoring Setup

### ✅ IMPLEMENTED: Daily Security Monitor

The system now includes automated daily security monitoring via the `security-monitor` edge function and cron job.

**Schedule:** Daily at 8:00 AM UTC

**What it monitors:**
- Runs `security_health_check()` function
- Detects anomalous access via `detect_anomalous_access()`
- Checks for unresolved fraud alerts
- Identifies unencrypted PII
- Logs all results to `security_monitor_logs` table
- Sends email reports to administrators (if enabled)

**Important:** Security checks run daily regardless of email settings. The email report is optional and can be enabled/disabled from the admin interface.

### Email Report Configuration

Daily security reports can be enabled/disabled from the admin interface:

1. Navigate to **Admin → Notifications → Email Settings**
2. Enable **"Email Notifications"** (master switch)
3. Enable **"Daily Security Reports"** to receive automated reports
4. Reports are sent to: `steven@dadderup.com`

**Email Report Contents:**
- Overall security status (🟢 OK / 🟡 WARNING / 🔴 CRITICAL)
- Summary metrics (fraud alerts, anomalous access, unencrypted PII)
- Detailed findings from health checks
- List of unresolved fraud alerts (if any)
- Anomalous access patterns (if detected)
- Link to view full logs in Supabase dashboard

**Note:** Even if email reports are disabled, security checks continue to run daily and results are logged to the `security_monitor_logs` table.

**View monitoring logs:**
```sql
SELECT 
  check_date,
  health_status,
  fraud_alerts_count,
  anomalous_access_count,
  unencrypted_pii_count,
  details
FROM public.security_monitor_logs
ORDER BY check_date DESC
LIMIT 30;
```

**Check recent status:**
```sql
SELECT * FROM public.security_monitor_logs 
WHERE check_date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY check_date DESC;
```

**Test the monitor manually:**
```bash
# Call via Supabase Functions dashboard or:
curl -X POST https://ctmzlorgzptgeluwjxwk.supabase.co/functions/v1/security-monitor \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"source": "manual"}'
```

**Cron job details:** See [CRON_JOBS.md](./CRON_JOBS.md#cron-job-3-security-monitor-daily)

### Option 2: External Monitoring Service (Alternative)

### Option 2: External Monitoring Service

Use a service like Datadog, New Relic, or Grafana to:
1. Query the `security_health_check()` function every hour
2. Create dashboards for fraud alerts and audit logs
3. Set up automated alerting

## Response Procedures

### Critical Alert Response

1. **Immediately** review the specific alert in the fraud_alerts table
2. **Check** the user_id and alert_type
3. **Investigate** using the relevant monitoring query above
4. **Take action:**
   - Suspend suspicious accounts if needed
   - Mark fraud alert as resolved after investigation
   - Document findings in the security_audit_logs

### Anomalous Access Response

1. **Identify** the admin user_id with unusual access patterns
2. **Review** their recent actions in security_audit_logs
3. **Verify** their role and permissions in user_roles table
4. **Contact** the admin to confirm legitimate activity
5. **Revoke access** if unauthorized activity is confirmed

## Weekly Security Review Checklist

- [ ] Run `security_health_check()` and review status
- [ ] Check for unresolved fraud alerts
- [ ] Review anomalous access patterns
- [ ] Audit high-volume admin access
- [ ] Verify encryption key health (no decryption errors)
- [ ] Review tax document access logs
- [ ] Check payment data access audit
- [ ] Verify RLS policies are functioning correctly

## Quarterly Security Audit

- [ ] Review all admin users and their access patterns
- [ ] Test encryption/decryption functions
- [ ] Verify backup of encryption key
- [ ] Review and update fraud detection thresholds
- [ ] Audit all RLS policies for correctness
- [ ] Test key rotation procedure (dry run)
- [ ] Review security audit logs for patterns

## Dashboard Recommendations

Create a security dashboard displaying:

1. **Current Health Status** (healthy/warning/critical)
2. **Unresolved Fraud Alerts** (count by severity)
3. **24-Hour Audit Log Volume** (chart)
4. **Anomalous Access Patterns** (list)
5. **Recent Admin Actions** (table)
6. **Failed Decryption Attempts** (count)
7. **Top 10 Active Admins** (by access count)

## Resources

- [Supabase Security Best Practices](https://supabase.com/docs/guides/security)
- [Encryption Guide](./ENCRYPTION_GUIDE.md)
- [Key Rotation Procedure](./KEY_ROTATION_PROCEDURE.md)
- [Fraud Detection](./ADMIN_DOCUMENTATION.md#fraud-detection)
