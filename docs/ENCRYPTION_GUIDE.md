# Field-Level Encryption Developer Guide

## Overview

This project uses **AES-CBC encryption** via PostgreSQL's `pgcrypto` extension to protect sensitive user data including:
- Bank account details
- Full Tax IDs (SSN/EIN)
- Other PII that requires extra protection

The encryption key is securely stored in **Supabase Vault** and accessed only by server-side database functions.

---

## Architecture

```
┌─────────────────┐
│   Frontend      │
│   (React)       │
└────────┬────────┘
         │
         ├──► Store Data: Call encrypt_sensitive_data() RPC
         │
         └──► Read Data: Call decrypt-sensitive-field Edge Function
              │
              ▼
     ┌────────────────────┐
     │  Supabase          │
     │  Database          │
     │  ┌──────────────┐  │
     │  │ pgcrypto     │  │
     │  │ extension    │  │
     │  └──────────────┘  │
     │  ┌──────────────┐  │
     │  │ Vault        │  │
     │  │ (Key Store)  │  │
     │  └──────────────┘  │
     └────────────────────┘
```

---

## Encryption Functions

### `encrypt_sensitive_data(data text)`

Encrypts plaintext data using AES-CBC.

**Usage:**
```typescript
const { data: encrypted, error } = await supabase.rpc('encrypt_sensitive_data', {
  data: JSON.stringify({ accountNumber: '1234567890', routingNumber: '021000021' })
});
```

**Returns:** `bytea` (encrypted binary data)

---

### `decrypt_sensitive_data(encrypted_data bytea)`

Decrypts encrypted data back to plaintext.

**Direct usage (use with caution):**
```sql
SELECT decrypt_sensitive_data(bank_details_encrypted) 
FROM ambassador_payout_methods 
WHERE user_id = auth.uid();
```

**⚠️ Warning:** Direct decryption bypasses audit logging. Use the Edge Function instead.

---

## Edge Function: `decrypt-sensitive-field`

Secure API endpoint for frontend decryption with:
- User permission validation
- Audit logging for admin access
- Error handling

**Usage:**
```typescript
const { data, error } = await supabase.functions.invoke('decrypt-sensitive-field', {
  body: {
    table: 'ambassador_payout_methods',
    column: 'bank_details_encrypted',
    recordId: '123e4567-e89b-12d3-a456-426614174000',
    targetUserId: user.id
  }
});

const decryptedData = data?.decrypted ? JSON.parse(data.decrypted) : null;
```

**Permissions:**
- Users can decrypt their own data
- Admins can decrypt any user's data (logged in `security_audit_logs`)

---

## Implementation Examples

### 1. Encrypting Bank Details

```typescript
import { supabase } from "@/integrations/supabase/client";

interface BankDetails {
  bankName: string;
  accountNumber: string;
  routingNumber: string;
  accountHolderName: string;
}

const saveBankDetails = async (details: BankDetails, userId: string) => {
  // Encrypt the data
  const { data: encrypted, error: encryptError } = await supabase.rpc(
    'encrypt_sensitive_data',
    { data: JSON.stringify(details) }
  );

  if (encryptError) throw new Error('Encryption failed');

  // Store encrypted data
  const { error: saveError } = await supabase
    .from('ambassador_payout_methods')
    .upsert({
      user_id: userId,
      payout_method: 'bank_transfer',
      bank_details_encrypted: encrypted,
      is_verified: false
    });

  if (saveError) throw new Error('Save failed');
};
```

---

### 2. Decrypting Bank Details (User View)

```typescript
const loadBankDetails = async (recordId: string, userId: string) => {
  const { data, error } = await supabase.functions.invoke('decrypt-sensitive-field', {
    body: {
      table: 'ambassador_payout_methods',
      column: 'bank_details_encrypted',
      recordId,
      targetUserId: userId
    }
  });

  if (error) throw new Error('Decryption failed');
  
  const bankDetails: BankDetails = data?.decrypted 
    ? JSON.parse(data.decrypted) 
    : null;

  return bankDetails;
};
```

---

### 2b. Encrypting & Loading Billing Address

```typescript
// Save billing address (automatically encrypted)
const saveBillingAddress = async (addressData: AddressForm) => {
  const { data, error } = await supabase.functions.invoke(
    'encrypt-billing-address',
    {
      body: {
        address_line1: addressData.address_line1,
        address_line2: addressData.address_line2,
        city: addressData.city,
        state: addressData.state,
        postal_code: addressData.postal_code,
        country: addressData.country,
        user_id: user.id,
      }
    }
  );
  
  if (error) throw new Error('Failed to save address');
};

// Load billing address (automatically decrypted)
const loadBillingAddress = async (userId: string) => {
  const { data, error } = await supabase
    .rpc('get_billing_address_decrypted', { target_user_id: userId })
    .maybeSingle();
  
  if (error) throw new Error('Failed to load address');
  
  return {
    address_line1: data.address_line1,
    address_line2: data.address_line2,
    city: data.city,
    state: data.state,
    postal_code: data.postal_code,
    country: data.country,
  };
};
```

---

### 3. Admin View with Masking

```typescript
const viewPayoutMethod = async (recordId: string, targetUserId: string) => {
  const { data, error } = await supabase.functions.invoke('decrypt-sensitive-field', {
    body: {
      table: 'ambassador_payout_methods',
      column: 'bank_details_encrypted',
      recordId,
      targetUserId
    }
  });

  if (error) return null;

  const details: BankDetails = JSON.parse(data.decrypted);

  // Mask sensitive parts
  return {
    bankName: details.bankName,
    accountNumberLast4: details.accountNumber.slice(-4),
    routingNumber: details.routingNumber,
    accountHolderName: details.accountHolderName
  };
};
```

---

## Security Best Practices

### ✅ DO
- Always use `encrypt_sensitive_data()` RPC for storing sensitive data
- Use `decrypt-sensitive-field` Edge Function for reading (ensures audit logging)
- Validate user permissions before decryption
- Mask partial data when displaying to admins
- Handle encryption/decryption errors gracefully
- Log all admin access to encrypted data

### ❌ DON'T
- Never log decrypted sensitive data to console
- Never send decrypted data to analytics
- Never store plaintext sensitive data alongside encrypted data
- Never bypass the Edge Function for decryption (skips audit logs)
- Never hardcode the encryption key
- Never expose the Vault key to the frontend

---

## Why Some Fields Are NOT Encrypted

### Country Field in `billing_addresses`

**Decision:** The `country` field is stored as **plaintext** while other address fields are encrypted.

**Rationale:**
- **Low PII Risk**: Country code (e.g., "US", "CA", "UK") alone cannot identify an individual
- **Tax & Compliance**: Required for VAT/GST calculations, tax reporting, and regulatory compliance
- **Performance**: Frequently queried for analytics, regional reporting, and service availability checks
- **Standards**: ISO 3166 country codes are public information, not considered sensitive PII
- **Query Optimization**: Allows efficient filtering and indexing for admin dashboards

**What IS Encrypted:**
- ✅ `address_line1_encrypted` - Street address (can pinpoint exact location)
- ✅ `address_line2_encrypted` - Apartment/suite number
- ✅ `city_encrypted` - City name (combined with other data, can identify user)
- ✅ `state_encrypted` - State/province
- ✅ `postal_code_encrypted` - Postal/ZIP code (can narrow location to small area)

**Security Posture:**
All **personally identifiable** address components are encrypted. Country alone cannot be used to identify, contact, or locate a specific user.

**Compliance:**
- ✅ GDPR: Country not classified as "personal data" requiring encryption
- ✅ CCPA: Country not considered "sensitive personal information"
- ✅ PCI-DSS: Country field does not contain cardholder data

---

## Testing Encryption

### Test Encryption Round-Trip
```typescript
const testEncryption = async () => {
  const originalData = { secret: 'test123' };
  
  // Encrypt
  const { data: encrypted } = await supabase.rpc('encrypt_sensitive_data', {
    data: JSON.stringify(originalData)
  });
  
  // Decrypt
  const { data: decrypted } = await supabase.rpc('decrypt_sensitive_data', {
    encrypted_data: encrypted
  });
  
  const result = JSON.parse(decrypted);
  console.assert(result.secret === originalData.secret, 'Round-trip failed');
};
```

---

## Troubleshooting

### "Encryption key not found in Vault"
**Solution:** Create the `field_encryption_key` secret in Supabase Dashboard:
1. Go to Project Settings → Vault
2. Create new secret: `field_encryption_key`
3. Value: 64-character hex string (256-bit key)

### "Decryption failed"
**Causes:**
- Vault key changed (data is now unrecoverable)
- Data was not encrypted with the current key
- Corrupted encrypted data

**Solution:** Verify Vault key is correct. If key was lost, data cannot be recovered.

### Slow Decryption Performance
**Solution:** 
- Minimize decryption calls
- Cache decrypted data in memory (with care)
- Use database indexes on `user_id` columns

---

## Key Rotation Procedure

**⚠️ CRITICAL:** Key rotation will make all existing encrypted data unrecoverable unless you migrate it first.

### Safe Key Rotation Steps:
1. **Backup current key** from Supabase Vault
2. **Export all encrypted data:**
   ```sql
   -- Decrypt with old key, re-encrypt with new key
   ```
3. **Generate new 256-bit key:**
   ```bash
   openssl rand -hex 32
   ```
4. **Update Vault secret** with new key
5. **Re-encrypt all data** using new key
6. **Verify all data** is accessible
7. **Securely delete old key**

**Recommended frequency:** Annually or after security incident

---

## Compliance Notes

### GDPR & CCPA
- ✅ Encryption protects PII from unauthorized access
- ✅ Audit logs provide access trails for compliance
- ✅ Users can request deletion (encrypted data can be purged)

### PCI-DSS
- ✅ Bank details encrypted at rest
- ✅ Access logging for card data
- ⚠️ Ensure TLS for data in transit

---

## Performance Considerations

- **Encryption time:** ~10-20ms per operation
- **Decryption time:** ~10-20ms per operation
- **Storage overhead:** ~30% larger than plaintext

**Optimization tips:**
- Batch encrypt/decrypt operations when possible
- Use database indexes on `user_id` for faster lookups
- Cache decrypted data in memory (with TTL)

---

## Support & Questions

For issues with encryption:
1. Check Supabase Edge Function logs
2. Verify Vault key exists and is accessible
3. Test encryption round-trip with known data
4. Review `security_audit_logs` for access patterns

For key recovery or lost encryption key: **Data is unrecoverable. Contact system administrator immediately.**
