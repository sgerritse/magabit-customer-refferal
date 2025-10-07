# DadderUp Tracking Widget API Documentation

## Overview

The DadderUp Tracking Widget allows you to track referral visits and conversions on external websites. This guide covers installation, configuration, and usage.

---

## Quick Start

### 1. Generate Your Tracking Widget

1. Log into your DadderUp dashboard
2. Navigate to **Settings → Tracking Widget**
3. Click "Generate Widget Code"
4. Copy the provided JavaScript snippet

### 2. Install the Widget

Paste the widget code just before the closing `</body>` tag on your website:

```html
<script src="https://yourdomain.com/track.js"></script>
<script>
  DadderUpTracker.init({
    referralCode: 'YOUR_REFERRAL_CODE'
  });
</script>
```

### 3. Track Conversions

When a user completes a purchase or signup, call:

```javascript
DadderUpTracker.trackConversion({
  userId: 'user-123',
  orderValue: 99.00,
  productId: 'product-456'
});
```

---

## API Reference

### Initialization

#### `DadderUpTracker.init(options)`

Initializes the tracking widget with your referral code.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `referralCode` | string | Yes | Your unique referral code |
| `debug` | boolean | No | Enable console logging (default: false) |
| `cookieDays` | number | No | Cookie lifetime in days (default: 365) |

**Example:**

```javascript
DadderUpTracker.init({
  referralCode: 'john.doe.main',
  debug: true,
  cookieDays: 30
});
```

**Returns:** `void`

**Side Effects:**
- Sets `dadderup_ref` cookie with the referral code
- Automatically sends visit tracking event

---

### Track Visit

#### `DadderUpTracker.trackVisit()`

Manually track a page visit. Automatically called on `init()`.

**Parameters:** None

**Example:**

```javascript
DadderUpTracker.trackVisit();
```

**Returns:** `Promise<void>`

**What It Does:**
- Records visitor IP, user agent, and timestamp
- Increments click count for the referral link
- Associates visit with referrer ambassador

---

### Track Conversion

#### `DadderUpTracker.trackConversion(data)`

Track a conversion event (purchase, signup, subscription).

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userId` | string | Yes | Unique user identifier |
| `orderValue` | number | No | Total order value in USD |
| `productId` | string | No | Product/package identifier |
| `subscriptionId` | string | No | Subscription ID (for recurring) |
| `billingCycle` | number | No | Billing cycle number (default: 1) |

**Example:**

```javascript
DadderUpTracker.trackConversion({
  userId: 'user-123',
  orderValue: 99.00,
  productId: 'monthly-pro-plan',
  subscriptionId: 'sub_abc123',
  billingCycle: 1
});
```

**Returns:** `Promise<{success: boolean, earningId: string}>`

**Response:**

```json
{
  "success": true,
  "earningId": "earning-uuid",
  "commissionAmount": 29.70
}
```

**What It Does:**
- Calculates commission based on ambassador tier
- Applies campaign boost if active
- Creates earning record in database
- Updates ambassador tier progress
- Queues notification to ambassador

---

### Check Attribution

#### `DadderUpTracker.getAttribution()`

Check if current visitor has referral attribution.

**Parameters:** None

**Example:**

```javascript
const attribution = DadderUpTracker.getAttribution();
console.log(attribution);
// { referralCode: 'john.doe.main', timestamp: 1704067200000 }
```

**Returns:** `{referralCode: string, timestamp: number} | null`

---

### Clear Attribution

#### `DadderUpTracker.clearAttribution()`

Remove referral cookie (for testing or user request).

**Parameters:** None

**Example:**

```javascript
DadderUpTracker.clearAttribution();
```

**Returns:** `void`

---

## Cookie Management

### Cookie Name

`dadderup_ref`

### Cookie Structure

```
Value: john.doe.main|1704067200000
```

- Part 1: Referral code
- Part 2: Timestamp of first visit (Unix milliseconds)

### Cookie Lifetime

- Default: 365 days
- Configurable via `cookieDays` parameter
- First-click attribution (cookie not overwritten by subsequent referral links)

### Cookie Scope

- Domain: Your website domain
- Path: `/` (entire site)
- Secure: `false` (works on HTTP and HTTPS)
- SameSite: `Lax`

---

## Error Handling

### Common Errors

**Error: "No referral code provided"**
- **Cause:** `init()` called without `referralCode`
- **Fix:** Pass valid referral code to `init()`

**Error: "User ID required for conversion"**
- **Cause:** `trackConversion()` called without `userId`
- **Fix:** Provide valid user identifier

**Error: "No referral attribution found"**
- **Cause:** Conversion tracked without prior visit/cookie
- **Fix:** Ensure user visited via referral link first

**Error: "Network error"**
- **Cause:** API endpoint unreachable
- **Fix:** Check network connectivity and API status

### Error Response Format

```json
{
  "success": false,
  "error": "Error message here"
}
```

---

## Testing

### Test Mode

Enable debug mode to see console logs:

```javascript
DadderUpTracker.init({
  referralCode: 'john.doe.main',
  debug: true
});
```

### Manual Testing Steps

1. **Test Visit Tracking:**
   - Clear cookies
   - Visit page with widget installed
   - Check console for "Visit tracked" message
   - Verify cookie set in browser DevTools

2. **Test Conversion Tracking:**
   - Complete a test purchase/signup
   - Trigger `trackConversion()`
   - Check console for "Conversion tracked" message
   - Verify earning record in database

3. **Test Attribution Window:**
   - Set `cookieDays: 1` for testing
   - Wait 24+ hours
   - Try tracking conversion
   - Should fail due to expired cookie

### Automated Testing

Use this cURL command to test the track-visit endpoint:

```bash
curl -X POST https://ctmzlorgzptgeluwjxwk.supabase.co/functions/v1/track-visit \
  -H "Content-Type: application/json" \
  -d '{
    "referralCode": "john.doe.main",
    "visitorIP": "192.168.1.1",
    "userAgent": "Mozilla/5.0..."
  }'
```

Test the track-conversion endpoint:

```bash
curl -X POST https://ctmzlorgzptgeluwjxwk.supabase.co/functions/v1/track-conversion \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "referralCode": "john.doe.main",
    "orderValue": 99.00,
    "productId": "monthly-plan"
  }'
```

---

## Security Considerations

### Preventing Fraud

**Client-Side Protection:**
- Rate limiting prevents spam clicks
- IP tracking detects duplicate conversions
- Velocity limits flag suspicious activity

**Server-Side Validation:**
- All conversions validated against database
- Duplicate conversion checks
- Fraud detection algorithms

### Data Privacy

**What We Track:**
- Visitor IP address (hashed)
- User agent string
- Referral code
- Conversion data (user ID, order value)

**What We DON'T Track:**
- Personal information (unless explicitly passed)
- Credit card details
- Passwords
- Email addresses (unless passed in conversion data)

**GDPR Compliance:**
- Minimal data collection
- Cookie consent recommended (implement separately)
- Data retention: 2 years
- User can request data deletion

---

## Integration Examples

### WordPress

```php
// Add to footer.php or use a plugin like "Insert Headers and Footers"
<script src="https://yourdomain.com/track.js"></script>
<script>
  DadderUpTracker.init({
    referralCode: '<?php echo get_option('dadderup_referral_code'); ?>'
  });

  // Track conversion on WooCommerce thank-you page
  <?php if (is_order_received_page()): ?>
    DadderUpTracker.trackConversion({
      userId: '<?php echo $order->get_user_id(); ?>',
      orderValue: <?php echo $order->get_total(); ?>,
      productId: '<?php echo implode(',', $order->get_items()); ?>'
    });
  <?php endif; ?>
</script>
```

### Shopify

```liquid
<!-- Add to theme.liquid before </body> -->
<script src="https://yourdomain.com/track.js"></script>
<script>
  DadderUpTracker.init({
    referralCode: '{{ settings.dadderup_referral_code }}'
  });

  {% if template == 'page.thank-you' %}
    DadderUpTracker.trackConversion({
      userId: '{{ customer.id }}',
      orderValue: {{ checkout.total_price | divided_by: 100.0 }},
      productId: '{{ checkout.line_items | map: 'product_id' | join: ',' }}'
    });
  {% endif %}
</script>
```

### React/Next.js

```javascript
// components/DadderUpTracker.tsx
import { useEffect } from 'react';
import Script from 'next/script';

export function DadderUpTracker({ referralCode }) {
  useEffect(() => {
    if (typeof window !== 'undefined' && window.DadderUpTracker) {
      window.DadderUpTracker.init({ referralCode });
    }
  }, [referralCode]);

  return <Script src="https://yourdomain.com/track.js" strategy="afterInteractive" />;
}

// app/layout.tsx
import { DadderUpTracker } from '@/components/DadderUpTracker';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <DadderUpTracker referralCode={process.env.NEXT_PUBLIC_DADDERUP_REF} />
      </body>
    </html>
  );
}

// app/checkout/success/page.tsx
'use client';
import { useEffect } from 'react';

export default function CheckoutSuccess({ searchParams }) {
  useEffect(() => {
    if (window.DadderUpTracker) {
      window.DadderUpTracker.trackConversion({
        userId: searchParams.userId,
        orderValue: parseFloat(searchParams.amount),
        productId: searchParams.productId
      });
    }
  }, [searchParams]);

  return <h1>Thank you for your purchase!</h1>;
}
```

### Custom HTML Site

```html
<!DOCTYPE html>
<html>
<head>
  <title>My Website</title>
</head>
<body>
  <h1>Welcome</h1>
  
  <!-- Add before closing body tag -->
  <script src="https://yourdomain.com/track.js"></script>
  <script>
    DadderUpTracker.init({
      referralCode: 'john.doe.main',
      debug: false
    });
  </script>

  <!-- Track conversion on thank you page -->
  <script>
    // Assuming you have order data available
    if (window.location.pathname === '/thank-you') {
      const orderData = JSON.parse(localStorage.getItem('order'));
      DadderUpTracker.trackConversion({
        userId: orderData.userId,
        orderValue: orderData.total,
        productId: orderData.productId
      });
    }
  </script>
</body>
</html>
```

---

## Advanced Features

### Custom Event Tracking

Track custom events beyond conversions:

```javascript
// Track email signup
DadderUpTracker.trackEvent('email_signup', {
  userId: 'user-123',
  email: 'user@example.com'
});

// Track content engagement
DadderUpTracker.trackEvent('video_watched', {
  videoId: 'video-456',
  duration: 120 // seconds
});
```

### A/B Testing Integration

Use different referral codes for A/B tests:

```javascript
const variantA = 'john.doe.main';
const variantB = 'john.doe.shop';
const referralCode = Math.random() < 0.5 ? variantA : variantB;

DadderUpTracker.init({ referralCode });
```

### Multi-Touch Attribution

Track multiple touchpoints (coming soon):

```javascript
DadderUpTracker.addTouchpoint('email_click');
DadderUpTracker.addTouchpoint('social_share');
DadderUpTracker.trackConversion({ ... }); // Credits all touchpoints
```

---

## API Endpoints

### POST /functions/v1/track-visit

**Request Body:**

```json
{
  "referralCode": "john.doe.main",
  "visitorIP": "192.168.1.1",
  "userAgent": "Mozilla/5.0..."
}
```

**Response:**

```json
{
  "success": true,
  "visitId": "visit-uuid"
}
```

### POST /functions/v1/track-conversion

**Request Body:**

```json
{
  "userId": "user-123",
  "referralCode": "john.doe.main",
  "orderValue": 99.00,
  "productId": "monthly-plan",
  "subscriptionId": "sub_abc",
  "billingCycle": 1
}
```

**Response:**

```json
{
  "success": true,
  "earningId": "earning-uuid",
  "commissionAmount": 29.70
}
```

---

## Changelog

### v1.0.0 (January 2025)
- Initial release
- Visit tracking
- Conversion tracking
- Cookie-based attribution
- 365-day attribution window

---

## Support

**Technical Support:** developer@dadderup.com
**Documentation:** docs.dadderup.com/widget
**Report Issues:** github.com/dadderup/tracking-widget/issues

---

**Last Updated:** January 2025
