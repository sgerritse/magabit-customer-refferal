# MAGAbit Customer Referral Program

## Project info

**URL**: https://lovable.dev/projects/2f7aaafd-6359-42d6-88a7-3d4ba5c27ffe

## About

MAGAbit Customer Referral is a streamlined referral program platform that allows users to share referral links and earn commissions for successful customer conversions.

---

## 🎯 Developer Documentation: Tracking System Architecture

### Table of Contents
1. [System Overview](#system-overview)
2. [How Visits Are Tracked](#how-visits-are-tracked)
3. [How Conversions Are Tracked](#how-conversions-are-tracked)
4. [Statistics Calculation](#statistics-calculation)
5. [Recent Activity Tracking](#recent-activity-tracking)
6. [Integration Guide](#integration-guide)
7. [Mock vs Production Data](#mock-vs-production-data)

---

### System Overview

The MAGAbit tracking system is a cookie-based attribution platform that tracks customer referrals from initial click through final conversion. The system consists of:

- **Client-side tracking script** (`public/tracking.js`)
- **Cookie-based attribution** (30-day attribution window)
- **Supabase Edge Functions** (backend API endpoints)
- **PostgreSQL database** (data persistence)
- **React dashboard** (`src/pages/BrandAmbassador.tsx`)

**Architecture Flow:**
```
User clicks referral link (with ?ref=CODE)
    ↓
tracking.js detects referral code
    ↓
Supabase Edge Function: track-visit
    ↓
Visit logged in database + Cookie set (30 days)
    ↓
User completes purchase
    ↓
MAGAbitTracking.trackConversion() called
    ↓
Supabase Edge Function: track-conversion
    ↓
Conversion logged + Cookie cleared
    ↓
Dashboard displays stats & activity
```

---

### How Visits Are Tracked

#### 1. URL Parameter Detection
The tracking script automatically detects referral codes from URL parameters:
- `?ref=REFERRAL_CODE`
- `?referral=REFERRAL_CODE`

Example: `https://example.com/shop?ref=user123`

#### 2. Cookie Storage
When a referral code is detected:
- **Cookie name**: `magabit_ref`
- **Expiration**: 30 days
- **Domain**: Automatically set to root domain (e.g., `.example.com`)
- **Attributes**: `SameSite=Lax`, `path=/`

This ensures attribution is preserved across the entire site for 30 days.

#### 3. Automatic Visit Tracking
The script runs automatically on page load (`DOMContentLoaded` or immediately if document is already loaded).

**Visitor metadata collected:**
```javascript
{
  referralCode: "user123",
  visitorIp: "auto-detected-server-side",
  userAgent: "Mozilla/5.0...",
  referrer: "https://google.com",
  landingPageUrl: "https://example.com/shop?ref=user123",
  screenResolution: "1920x1080",
  language: "en-US"
}
```

#### 4. Duplicate Prevention
- If cookie already exists, visit tracking is skipped
- Prevents inflating click counts from page reloads
- Cookie is cleared only after successful conversion

#### 5. Backend API Endpoint
**Supabase Edge Function**: `/functions/v1/track-visit`

**Request:**
```json
POST https://ctmzlorgzptgeluwjxwk.supabase.co/functions/v1/track-visit
Headers:
  - Content-Type: application/json
  - apikey: <SUPABASE_ANON_KEY>

Body:
{
  "referralCode": "user123",
  "visitorIp": "will-be-set-server-side",
  "userAgent": "Mozilla/5.0...",
  "referrer": "https://google.com",
  "landingPageUrl": "https://example.com/shop?ref=user123",
  "screenResolution": "1920x1080",
  "language": "en-US"
}
```

**Response:**
```json
{
  "success": true,
  "visitId": "uuid-here"
}
```

---

### How Conversions Are Tracked

#### 1. Manual Conversion Tracking
Conversions are tracked manually via the global JavaScript API:

```javascript
window.MAGAbitTracking.trackConversion(
  userId,           // Required: Customer user ID
  orderValue,       // Required: Order total (e.g., 1200.00)
  productId,        // Optional: Product SKU or ID
  subscriptionId    // Optional: Subscription ID (if applicable)
);
```

#### 2. Example Implementation
```javascript
// After successful purchase
const result = await window.MAGAbitTracking.trackConversion(
  'customer_abc123',
  1200.00,
  'magabit-fractional',
  null
);

if (result.success) {
  console.log('Conversion tracked!');
}
```

#### 3. Attribution Logic
1. Script checks for `magabit_ref` cookie
2. If no cookie, checks URL parameters as fallback
3. If no referral code found, returns error
4. Sends conversion data to Edge Function
5. On success, **clears the cookie** (one conversion per attribution)

#### 4. Backend API Endpoint
**Supabase Edge Function**: `/functions/v1/track-conversion`

**Request:**
```json
POST https://ctmzlorgzptgeluwjxwk.supabase.co/functions/v1/track-conversion
Headers:
  - Content-Type: application/json
  - apikey: <SUPABASE_ANON_KEY>

Body:
{
  "userId": "customer_abc123",
  "referralCode": "user123",
  "orderValue": 1200.00,
  "productId": "magabit-fractional",
  "subscriptionId": null
}
```

**Response:**
```json
{
  "success": true,
  "conversionId": "uuid-here",
  "commission": 120.00
}
```

#### 5. Additional API Methods

**Check current attribution:**
```javascript
const attribution = window.MAGAbitTracking.getAttribution();
// Returns: { referralCode: "user123", expiresIn: 30 } or null
```

**Clear attribution manually:**
```javascript
window.MAGAbitTracking.clearAttribution();
// Removes cookie, useful for testing
```

---

### Statistics Calculation

The dashboard displays four key metrics:

#### 1. Total Clicks
**Definition**: Total number of unique visitors who arrived via referral links

**Calculation**:
```sql
SELECT COUNT(DISTINCT visit_id) 
FROM visits 
WHERE referral_code = 'user123'
```

**Current Implementation**: Mock data in `mockStats.totalClicks` (859)

**Production**: Query the `visits` table, counting unique visit records per referral code

---

#### 2. Total Conversions
**Definition**: Total number of completed purchases attributed to referral links

**Calculation**:
```sql
SELECT COUNT(*) 
FROM conversions 
WHERE referral_code = 'user123'
```

**Current Implementation**: Mock data in `mockStats.totalConversions` (26)

**Production**: Query the `conversions` table, counting all conversion records per referral code

---

#### 3. Conversion Rate
**Definition**: Percentage of visitors who complete a purchase

**Formula**:
```
Conversion Rate = (Total Conversions / Total Clicks) × 100
```

**Example**:
```
26 conversions / 859 clicks × 100 = 3.0%
```

**Current Implementation**: Mock data in `mockStats.conversionRate` (3.0)

**Production**: Calculate dynamically from visits and conversions tables

---

#### 4. Total Earnings
**Definition**: Sum of all commissions earned from conversions

**Calculation**:
```sql
SELECT SUM(commission_amount) 
FROM conversions 
WHERE referral_code = 'user123'
```

**Current Implementation**: Mock data in `mockStats.totalEarnings` ($117,600.00)

**Production**: Sum commission amounts from conversions table

---

#### Per-Link Statistics
Each referral link displays:
- **Clicks**: Visits specific to that product link
- **Conversions**: Purchases of that specific product

**Current Implementation**: Mock data in `mockReferralLinks` array:
```javascript
{
  id: '1',
  type: 'MAGAbit+ Fractional',
  clicks: 547,
  conversions: 18
}
```

**Production**: Query visits and conversions filtered by `productId` or link-specific referral codes

---

### Recent Activity Tracking

The "Recent Activity" table shows chronological log of referral events.

#### Data Structure
```javascript
{
  id: '1',
  date: '2 days ago',
  linkType: 'MAGAbit+ Fractional',
  clicks: 15,
  status: 'Converted' | 'Pending'
}
```

#### Status Badges
- **Converted** (Green): Purchase was completed
- **Pending** (Amber): Clicks recorded but no conversion yet

#### Current Implementation
Mock data in `mockRecentActivity` array (5 items)

#### Production Implementation

**Query Logic**:
```sql
SELECT 
  DATE(created_at) as date,
  product_type as linkType,
  COUNT(*) as clicks,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM conversions 
      WHERE conversions.visit_id = visits.id
    ) 
    THEN 'Converted' 
    ELSE 'Pending' 
  END as status
FROM visits
WHERE referral_code = 'user123'
GROUP BY DATE(created_at), product_type, status
ORDER BY created_at DESC
LIMIT 10
```

**Time-based filtering**: Show activity from last 30 days by default

---

### Integration Guide

#### Step 1: Install Tracking Script

Add to `<head>` or before `</body>` on all pages where you want to track referrals:

```html
<script src="https://your-domain.com/tracking.js"></script>
```

#### Step 2: Configure Your Domain

Update `tracking.js` with your Supabase project credentials:

```javascript
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key-here';
```

#### Step 3: Create Supabase Edge Functions

**Function 1: track-visit**
- Location: `supabase/functions/track-visit/index.ts`
- Purpose: Log visit to database, return success response
- Required table: `visits` (visit_id, referral_code, visitor_ip, user_agent, created_at, etc.)

**Function 2: track-conversion**
- Location: `supabase/functions/track-conversion/index.ts`
- Purpose: Log conversion, calculate commission, update ambassador earnings
- Required table: `conversions` (conversion_id, referral_code, user_id, order_value, commission_amount, created_at)

#### Step 4: Database Schema

**Visits Table:**
```sql
CREATE TABLE visits (
  visit_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referral_code TEXT NOT NULL,
  visitor_ip INET,
  user_agent TEXT,
  referrer TEXT,
  landing_page_url TEXT,
  screen_resolution TEXT,
  language TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_visits_referral_code ON visits(referral_code);
CREATE INDEX idx_visits_created_at ON visits(created_at);
```

**Conversions Table:**
```sql
CREATE TABLE conversions (
  conversion_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  visit_id UUID REFERENCES visits(visit_id),
  referral_code TEXT NOT NULL,
  user_id TEXT NOT NULL,
  order_value DECIMAL(10,2) NOT NULL,
  commission_amount DECIMAL(10,2) NOT NULL,
  product_id TEXT,
  subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_conversions_referral_code ON conversions(referral_code);
CREATE INDEX idx_conversions_user_id ON conversions(user_id);
```

#### Step 5: Track Conversions on Purchase

Add to your checkout success page:

```javascript
// After successful payment processing
if (window.MAGAbitTracking) {
  window.MAGAbitTracking.trackConversion(
    userId,        // From your auth system
    orderTotal,    // Final order amount
    productId,     // Product SKU
    subscriptionId // If applicable
  );
}
```

#### Step 6: Testing the Flow

1. **Test Visit Tracking:**
   - Visit: `https://your-site.com/shop?ref=test123`
   - Open DevTools Console, look for: `[MAGAbit Tracking] Visit tracked successfully`
   - Check cookie: `document.cookie` should show `magabit_ref=test123`

2. **Test Conversion Tracking:**
   - In console: `window.MAGAbitTracking.trackConversion('user1', 1200, 'product1')`
   - Should see: `[MAGAbit Tracking] Conversion tracked successfully`
   - Cookie should be cleared after successful conversion

3. **Test Attribution:**
   - Check current attribution: `window.MAGAbitTracking.getAttribution()`
   - Should return: `{ referralCode: "test123", expiresIn: 30 }`

---

### Mock vs Production Data

#### Current State: MOCKUP
The dashboard currently uses **hardcoded mock data** for demonstration purposes.

**Mock Data Locations:**
- `src/pages/BrandAmbassador.tsx` lines 10-63:
  - `mockReferralLinks`: Array of sample referral links
  - `mockStats`: Sample statistics (clicks, conversions, rate, earnings)
  - `mockRecentActivity`: Sample activity log

**What's Production-Ready:**
- ✅ Tracking script (`public/tracking.js`) - fully functional
- ✅ Cookie-based attribution system - working
- ✅ Client-side API (`window.MAGAbitTracking`) - ready to use
- ✅ Dashboard UI components - complete

**What Needs Production Implementation:**
- ❌ Supabase Edge Functions (`track-visit`, `track-conversion`) - need to be created
- ❌ Database tables (`visits`, `conversions`) - need to be created
- ❌ Dashboard data fetching - replace mock data with real Supabase queries
- ❌ Real-time statistics calculation - implement aggregation queries

#### Migration Path to Production

1. **Create Supabase project** (if not already done)
2. **Run database migrations** to create `visits` and `conversions` tables
3. **Deploy Edge Functions** for visit and conversion tracking
4. **Update `tracking.js`** with production Supabase URL and keys
5. **Replace mock data** in `BrandAmbassador.tsx` with Supabase client queries
6. **Test end-to-end** flow: click → cookie → conversion → dashboard update

---

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/2f7aaafd-6359-42d6-88a7-3d4ba5c27ffe) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/2f7aaafd-6359-42d6-88a7-3d4ba5c27ffe) and click on Share -> Publish.

## Can I connect a custom domain to my MAGAbit project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)