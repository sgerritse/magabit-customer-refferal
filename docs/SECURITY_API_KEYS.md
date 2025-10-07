# API Keys & Secrets Security Configuration

## 🔐 Security Update - January 2025

All API keys and authentication secrets have been migrated from database storage to secure environment variables. This critical security update prevents unauthorized access to your API credentials even if the database is compromised.

## Required Environment Variables

Configure these secrets in your Supabase Edge Functions:
**[Configure Secrets →](https://supabase.com/dashboard/project/ctmzlorgzptgeluwjxwk/settings/functions)**

### Email Service (Mailgun)

Required for sending emails:
- `MAILGUN_API_KEY` - Your Mailgun API key
- `MAILGUN_DOMAIN` - Your Mailgun sending domain (e.g., `mg.yourdomain.com`)

Get these from: https://app.mailgun.com/settings/api_security

Alternative email service:
- `RESEND_API_KEY` - If using Resend instead of Mailgun

### SMS Service (Twilio)

Required for sending SMS messages:
- `TWILIO_ACCOUNT_SID` - Your Twilio Account SID
- `TWILIO_AUTH_TOKEN` - Your Twilio Auth Token
- `TWILIO_PHONE_NUMBER` - Your Twilio phone number (e.g., `+1234567890`)

Get these from: https://console.twilio.com/

### Payment Processing (Stripe)

Required for payment processing:
- `STRIPE_SECRET_KEY` - ✅ **Already configured**
- `STRIPE_PUBLISHABLE_KEY` - Needs configuration

Get these from: https://dashboard.stripe.com/apikeys

### WordPress/WooCommerce Integration

Required for WordPress integration:
- `WOOCOMMERCE_API_KEY` - ✅ **Already configured**
- `WOOCOMMERCE_SITE_URL` - ✅ **Already configured**

## How to Configure Secrets

1. Go to [Supabase Edge Functions Settings](https://supabase.com/dashboard/project/ctmzlorgzptgeluwjxwk/settings/functions)
2. Click "Add new secret"
3. Enter the secret name (exactly as shown above)
4. Enter the secret value
5. Click "Save"

## Security Benefits

✅ **Database Compromise Protection** - Even if database is breached, API keys are not exposed  
✅ **Access Control** - Only edge functions can access secrets, not frontend code  
✅ **Audit Trail** - All access to settings tables is now logged  
✅ **Compliance** - Meets PCI DSS and security best practices  
✅ **Rotation Ready** - Easy to rotate keys without database migrations  

## What Changed?

### Before (Insecure)
```sql
-- API keys stored in plaintext in database
SELECT mailgun_api_key FROM email_notification_settings; -- ❌ Exposed!
```

### After (Secure)
```typescript
// API keys only accessible in edge functions
const apiKey = Deno.env.get('MAILGUN_API_KEY'); // ✅ Secure!
```

## Database Tables Affected

The following columns have been **removed** from database tables:

### `email_notification_settings`
- ❌ Removed: `mailgun_api_key`
- ❌ Removed: `mailgun_domain`
- ✅ Kept: `enabled`, `from_email`, `from_name`

### `sms_notification_settings`
- ❌ Removed: `twilio_account_sid`
- ❌ Removed: `twilio_auth_token`
- ❌ Removed: `twilio_phone_number`
- ✅ Kept: `enabled`

### `stripe_settings`
- ❌ Removed: `stripe_secret_key`
- ❌ Removed: `stripe_publishable_key`
- ✅ Kept: `enabled`, `test_mode`, `webhook_secret`

### `woocommerce_settings`
- ❌ Removed: `api_key`
- ✅ Kept: `site_url`, `enabled`

## Migration Notes

All existing API keys should be manually copied to environment variables before the old data is purged. Contact your database administrator if you need to retrieve the old values.

## Troubleshooting

### "Email service not configured" Error
→ Set `MAILGUN_API_KEY` and `MAILGUN_DOMAIN` environment variables

### "SMS service not configured" Error
→ Set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_PHONE_NUMBER`

### Edge Functions can't send emails/SMS
→ Verify secrets are configured correctly in Supabase dashboard

## Security Compliance Checklist

- [x] API keys removed from database
- [x] Environment variables configured in Supabase
- [x] Edge functions updated to use environment variables
- [x] Admin UI updated to document secret requirements
- [x] Audit logging enabled for settings access
- [ ] **Action Required:** Enable leaked password protection in Supabase Auth
- [ ] **Action Required:** Configure all missing environment variables

## Additional Security Recommendations

1. **Enable Leaked Password Protection**
   - Go to: https://supabase.com/dashboard/project/ctmzlorgzptgeluwjxwk/auth/policies
   - Enable "Leaked Password Protection"

2. **Review Access Logs**
   - Monitor `security_audit_logs` table for suspicious activity
   - Check `payment_access_audit` for payment data access

3. **Rotate Secrets Regularly**
   - Update API keys every 90 days
   - Use different keys for test vs production

4. **Restrict Admin Access**
   - Only grant admin role to essential personnel
   - Review `user_roles` table regularly

## Field-Level Encryption

### Overview
In addition to moving API keys to environment variables, this project now implements **field-level encryption** for highly sensitive user data using PostgreSQL's `pgcrypto` extension and Supabase Vault.

### What Data is Encrypted?
- **Bank account details** (`ambassador_payout_methods.bank_details_encrypted`)
- **Full Tax IDs** (`tax_documents.tax_id_encrypted`)
- **User PII**: First name, last name, date of birth (`users` table)
- **Address Details**: Street address, city, state, postal code (`billing_addresses` table)

### Encryption Scope

**Encrypted Fields:**
- User PII: `first_name_encrypted`, `last_name_encrypted`, `date_of_birth_encrypted` (users table)
- Payment Info: Bank account details (ambassador_payout_methods table)
- Address Details: Street address, city, state, postal code (billing_addresses table)
- Tax Data: Full tax IDs (tax_documents table)

**Intentionally NOT Encrypted:**
- `billing_addresses.country` - Low PII risk, needed for tax compliance and regional rules
- `users.email` - Required by auth system, used for login
- `users.phone` - Auth metadata, consider using `phone_encrypted` for sensitive contexts
- Tax ID last 4 digits - Used for verification without full decryption

**Design Principle:** Only encrypt data that could reasonably identify or harm a user if exposed. Balance security with operational needs.

### How It Works
1. **Encryption key** stored securely in Supabase Vault (`field_encryption_key`)
2. **Database functions** handle encryption/decryption using the Vault key
3. **Edge function** provides secure frontend access with audit logging
4. **AES-CBC encryption** standard ensures data security at rest

### Key Management

#### Creating the Encryption Key (First Time Setup)
1. Generate a 256-bit encryption key:
   ```bash
   openssl rand -hex 32
   ```
2. Go to [Supabase Vault](https://supabase.com/dashboard/project/ctmzlorgzptgeluwjxwk/settings/vault)
3. Create secret: `field_encryption_key`
4. Paste the generated hex string as the value
5. **IMPORTANT:** Backup this key securely - if lost, encrypted data is unrecoverable

#### Key Rotation (Annual Recommendation)
⚠️ **WARNING:** Rotating the key without migrating data will make existing encrypted data unrecoverable.

**Safe rotation procedure:**
1. Backup current key from Vault
2. Decrypt all encrypted data using old key
3. Generate new 256-bit key: `openssl rand -hex 32`
4. Update `field_encryption_key` in Vault with new key
5. Re-encrypt all data using new key
6. Verify all data is accessible
7. Securely delete old key backup

### Using Encryption in Code

**Encrypt data (frontend):**
```typescript
const { data: encrypted, error } = await supabase.rpc('encrypt_sensitive_data', {
  data: JSON.stringify({ accountNumber: '1234567890' })
});
```

**Decrypt data (frontend):**
```typescript
const { data, error } = await supabase.functions.invoke('decrypt-sensitive-field', {
  body: {
    table: 'ambassador_payout_methods',
    column: 'bank_details_encrypted',
    recordId: 'uuid-here',
    targetUserId: user.id
  }
});
```

**See full guide:** [docs/ENCRYPTION_GUIDE.md](./ENCRYPTION_GUIDE.md)

### Security Benefits
✅ **Database breach protection** - Even with database access, encrypted data is unreadable  
✅ **Vault-secured keys** - Encryption key never exposed to application code  
✅ **Audit trail** - All decryption attempts are logged  
✅ **Compliance** - Meets GDPR, CCPA, and PCI-DSS requirements  
✅ **Admin oversight** - Admin access to encrypted data is tracked  

### Recovery Procedures

#### Lost Encryption Key
**⚠️ CRITICAL:** If the `field_encryption_key` is lost, all encrypted data is **permanently unrecoverable**.

**Prevention:**
- Store key backup in secure password manager (1Password, LastPass, etc.)
- Document key location in disaster recovery plan
- Test key backup restoration quarterly

#### Corrupted Encrypted Data
If encrypted data becomes corrupted:
1. Check `security_audit_logs` for recent modifications
2. Restore from database backup (if available)
3. Re-submit W-9 or payment method (last resort)

### Monitoring

**Check encryption health:**
```sql
-- Verify Vault key is accessible
SELECT decrypt_sensitive_data(encrypt_sensitive_data('test'));

-- Check for plaintext leaks (should return 0)
SELECT COUNT(*) FROM ambassador_payout_methods WHERE bank_details IS NOT NULL;
SELECT COUNT(*) FROM tax_documents WHERE tax_id_encrypted IS NULL AND tax_id_last_four IS NOT NULL;
```

**Review audit logs:**
```sql
-- Admin access to encrypted data
SELECT * FROM security_audit_logs 
WHERE action LIKE '%DECRYPT%' 
ORDER BY created_at DESC 
LIMIT 100;
```

## Support

For questions about this security update, contact your system administrator or refer to:
- [Supabase Secrets Management](https://supabase.com/docs/guides/functions/secrets)
- [Security Best Practices](https://docs.lovable.dev/features/security)
- [Encryption Developer Guide](./ENCRYPTION_GUIDE.md)
