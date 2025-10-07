# WordPress & WooCommerce Integration Guide

Complete guide for integrating DadderUp referral tracking with WordPress and WooCommerce.

---

## Quick Start

### Prerequisites

- WordPress 5.0 or higher
- WooCommerce 3.0+ (for e-commerce tracking)
- Admin access to WordPress dashboard

---

## Part 1: Install Tracking Script

### Option A: Manual Installation (Recommended)

1. **Add tracking script to header:**
   - Go to **Appearance → Theme Editor**
   - Click **header.php** (or Theme Header)
   - Find the closing `</head>` tag
   - Paste this code **BEFORE** the `</head>` tag:

```html
<script src="https://ctmzlorgzptgeluwjxwk.supabase.co/storage/v1/object/public/challenge-media/tracking.js"></script>
```

2. **Click "Update File"**

3. **Test the installation:**
   - Visit your site with `?ref=TEST` in the URL
   - Open browser DevTools (F12) → Console
   - Look for: `[DadderUp Tracking] Visit tracked successfully`

### Option B: Using a Plugin

**Using "Insert Headers and Footers" plugin:**

1. Install plugin: **Plugins → Add New → Search "Insert Headers and Footers"**
2. Go to **Settings → Insert Headers and Footers**
3. Paste the script tag into **Scripts in Header**
4. Click **Save**

---

## Part 2: Track Conversions (WooCommerce)

### Automatic Conversion Tracking

Add this code to your theme's `functions.php` or create a custom plugin:

```php
<?php
/**
 * DadderUp Conversion Tracking
 */

// Track WooCommerce order completion
add_action('woocommerce_thankyou', 'dadderup_track_conversion');

function dadderup_track_conversion($order_id) {
    if (!$order_id) return;
    
    $order = wc_get_order($order_id);
    if (!$order) return;
    
    $user_id = $order->get_user_id();
    $order_total = $order->get_total();
    
    // Get products
    $product_ids = array();
    foreach ($order->get_items() as $item) {
        $product_ids[] = $item->get_product_id();
    }
    
    ?>
    <script>
    if (typeof DadderUpTracking !== 'undefined') {
        DadderUpTracking.trackConversion(
            '<?php echo esc_js($user_id ? $user_id : 'guest-' . $order_id); ?>',
            <?php echo floatval($order_total); ?>,
            '<?php echo esc_js(implode(',', $product_ids)); ?>',
            null
        ).then(response => {
            console.log('DadderUp conversion tracked:', response);
        });
    }
    </script>
    <?php
}
?>
```

### Manual Conversion Tracking

For custom signup forms or non-WooCommerce conversions:

```javascript
// After successful signup/purchase
DadderUpTracking.trackConversion(
    'user-123',      // User ID or email
    49.99,           // Order value (0 for free signups)
    'product-abc',   // Product ID (optional)
    'sub-xyz'        // Subscription ID (optional)
);
```

---

## Part 3: Configure WooCommerce Webhooks (Optional)

For real-time conversion tracking without JavaScript:

### Create Webhook

1. **Go to WooCommerce → Settings → Advanced → Webhooks**
2. **Click "Add Webhook"**
3. **Configure:**
   - **Name:** DadderUp Conversion Tracking
   - **Status:** Active
   - **Topic:** Order Created
   - **Delivery URL:** `https://ctmzlorgzptgeluwjxwk.supabase.co/functions/v1/track-conversion`
   - **Secret:** Leave blank
   - **API Version:** WP REST API Integration v3

4. **Click "Save Webhook"**

### Webhook Payload Example

WooCommerce will send this data automatically:

```json
{
  "order_id": 12345,
  "user_id": 678,
  "total": "49.99",
  "line_items": [
    {
      "product_id": 123,
      "name": "Monthly Subscription"
    }
  ]
}
```

---

## Part 4: Customize Referral Links

### Create Custom Landing Pages

Ambassadors can link to any page on your site:

```
https://yoursite.com/signup?ref=AMBASSADOR_CODE
https://yoursite.com/pricing?ref=AMBASSADOR_CODE
https://yoursite.com/product/membership?ref=AMBASSADOR_CODE
```

The tracking script will automatically capture the referral code on any page.

### Preserve Referral Code Across Pages

The tracking script uses cookies that work across your entire domain automatically. No additional setup needed.

---

## Part 5: Testing Your Integration

### Test Referral Tracking

1. **Create a test referral link:**
   ```
   https://yoursite.com/?ref=TEST123
   ```

2. **Open the link in an incognito/private window**

3. **Open DevTools (F12) → Console tab**

4. **Look for these messages:**
   ```
   [DadderUp Tracking] Visit tracked successfully
   [DadderUp Tracking] Already tracked with code: TEST123
   ```

5. **Check cookie storage:**
   - DevTools → Application → Cookies
   - Look for `dadderup_ref` cookie

### Test Conversion Tracking

1. **Complete a test purchase/signup**

2. **Check the console for:**
   ```
   [DadderUp Tracking] Conversion tracked successfully
   ```

3. **Verify in Admin Panel:**
   - Go to Admin → Affiliates → Analytics
   - Look for the conversion in the ambassador's stats

---

## Troubleshooting

### Tracking Script Not Loading

**Problem:** Console shows `DadderUpTracking is not defined`

**Solutions:**
1. Clear WordPress cache (if using caching plugin)
2. Verify script tag is in `<head>` section
3. Check for JavaScript errors blocking the script
4. Test with cache/minification plugins disabled

### Conversions Not Tracking

**Problem:** Visits work but conversions don't register

**Solutions:**
1. Check that referral cookie exists (DevTools → Application → Cookies)
2. Verify conversion tracking code runs AFTER page load
3. Check console for errors
4. Ensure user ID is being passed correctly

### Cookie Not Persisting

**Problem:** Referral code cookie disappears

**Solutions:**
1. Check cookie domain is set correctly (automatic)
2. Verify browser allows third-party cookies
3. Test in different browsers
4. Check for cookie-blocking browser extensions

---

## Advanced Configuration

### Custom Cookie Duration

Default: 30 days. To change, modify the tracking script:

```javascript
const COOKIE_DAYS = 60; // Change to 60 days
```

### Multiple Domain Support

If you have multiple domains (e.g., `shop.yoursite.com`, `blog.yoursite.com`):

1. Host tracking script on your main domain
2. Reference it from all subdomains
3. Cookie will work across all `*.yoursite.com` domains

### Exclude Admin/Test Traffic

Add this to your theme's functions.php:

```php
<?php
// Don't load tracking for logged-in admins
add_action('wp_head', function() {
    if (current_user_can('administrator')) {
        echo '<script>window.DadderUpTrackingDisabled = true;</script>';
    }
}, 1);
?>
```

---

## Plugin Development (Optional)

### Create Custom WordPress Plugin

**File: `wp-content/plugins/dadderup-tracking/dadderup-tracking.php`**

```php
<?php
/**
 * Plugin Name: DadderUp Tracking
 * Description: Referral tracking integration for DadderUp
 * Version: 1.0.0
 * Author: DadderUp
 */

// Add tracking script to head
add_action('wp_head', 'dadderup_add_tracking_script', 1);
function dadderup_add_tracking_script() {
    ?>
    <script src="https://ctmzlorgzptgeluwjxwk.supabase.co/storage/v1/object/public/challenge-media/tracking.js"></script>
    <?php
}

// Track WooCommerce conversions
add_action('woocommerce_thankyou', 'dadderup_track_woo_conversion');
function dadderup_track_woo_conversion($order_id) {
    if (!$order_id) return;
    
    $order = wc_get_order($order_id);
    $user_id = $order->get_user_id() ? $order->get_user_id() : 'guest-' . $order_id;
    $total = $order->get_total();
    
    ?>
    <script>
    if (typeof DadderUpTracking !== 'undefined') {
        DadderUpTracking.trackConversion(
            '<?php echo esc_js($user_id); ?>',
            <?php echo floatval($total); ?>
        );
    }
    </script>
    <?php
}

// Add settings page
add_action('admin_menu', 'dadderup_add_admin_menu');
function dadderup_add_admin_menu() {
    add_options_page(
        'DadderUp Tracking Settings',
        'DadderUp',
        'manage_options',
        'dadderup-tracking',
        'dadderup_settings_page'
    );
}

function dadderup_settings_page() {
    ?>
    <div class="wrap">
        <h1>DadderUp Tracking</h1>
        <p>✅ Tracking script is active on your site.</p>
        <p>Visit the <a href="https://yoursite.lovable.app/admin" target="_blank">Admin Dashboard</a> to view analytics.</p>
    </div>
    <?php
}
?>
```

---

## Security Best Practices

1. **Never expose API keys in JavaScript** - The tracking script uses public Supabase anon key (safe)
2. **Validate webhook signatures** - WooCommerce webhooks should use secret validation
3. **Sanitize user input** - Always escape output in PHP
4. **Use HTTPS** - Required for cookie security

---

## Support

### Common Issues

| Issue | Solution |
|-------|----------|
| Script not loading | Check `<head>` placement, clear cache |
| Conversions not tracking | Verify cookie exists, check console logs |
| Cookie not persisting | Check browser settings, test without extensions |
| Webhook failing | Verify delivery URL, check endpoint logs |

### Get Help

- **Documentation:** [DadderUp Tracking Widget API](./TRACKING_WIDGET_API.md)
- **Edge Function Logs:** [View Logs](https://supabase.com/dashboard/project/ctmzlorgzptgeluwjxwk/functions/track-visit/logs)
- **Support:** Contact your DadderUp admin

---

## Changelog

### Version 1.0.0
- Initial WordPress integration guide
- WooCommerce conversion tracking
- Webhook setup instructions
- Custom plugin example
