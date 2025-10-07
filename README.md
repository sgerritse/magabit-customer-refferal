# MAGAbit Customer Referral Program

## Project info

**URL**: https://lovable.dev/projects/2f7aaafd-6359-42d6-88a7-3d4ba5c27ffe

## About

MAGAbit Customer Referral is a streamlined referral program platform that allows users to share referral links and earn commissions for successful customer conversions.

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

---

## Developer Documentation

### Data Architecture

#### Database Schema

**users table**
```sql
- id (uuid, primary key)
- email (text, unique)
- username (text, unique)
- created_at (timestamp)
- updated_at (timestamp)
```

**referral_links table**
```sql
- id (uuid, primary key)
- user_id (uuid, foreign key -> users.id)
- product_type (text) -- 'fractional', 'full', 'hosted'
- referral_code (text, unique) -- e.g., 'user123_fractional'
- commission_rate (decimal) -- e.g., 0.05 for 5%
- is_active (boolean)
- created_at (timestamp)
- updated_at (timestamp)
```

**clicks table**
```sql
- id (uuid, primary key)
- referral_link_id (uuid, foreign key -> referral_links.id)
- user_id (uuid, foreign key -> users.id)
- ip_address (text)
- user_agent (text)
- referrer (text)
- utm_source (text, nullable)
- utm_medium (text, nullable)
- utm_campaign (text, nullable)
- clicked_at (timestamp)
- session_id (text) -- for deduplication
```

**conversions table**
```sql
- id (uuid, primary key)
- click_id (uuid, foreign key -> clicks.id)
- referral_link_id (uuid, foreign key -> referral_links.id)
- user_id (uuid, foreign key -> users.id) -- the referrer
- customer_email (text) -- the buyer
- product_type (text)
- order_amount (decimal)
- commission_amount (decimal)
- status (text) -- 'pending', 'approved', 'paid', 'rejected'
- converted_at (timestamp)
- approved_at (timestamp, nullable)
- created_at (timestamp)
```

### Click Tracking Implementation

#### Frontend Implementation

When a user shares their referral link, the URL should include tracking parameters:

```
https://magabit.com/products/fractional?ref=john_fractional
```

**Tracking Script (to be embedded on product pages):**

```javascript
// Track click when page loads with referral parameter
const urlParams = new URLSearchParams(window.location.search);
const refCode = urlParams.get('ref');

if (refCode) {
  // Store in localStorage with timestamp for attribution window
  localStorage.setItem('magabit_ref', JSON.stringify({
    code: refCode,
    timestamp: Date.now()
  }));
  
  // Send click event to backend
  fetch('/api/track/click', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      referralCode: refCode,
      referrer: document.referrer,
      userAgent: navigator.userAgent,
      utmSource: urlParams.get('utm_source'),
      utmMedium: urlParams.get('utm_medium'),
      utmCampaign: urlParams.get('utm_campaign')
    })
  });
}
```

#### Backend Click Tracking Endpoint

**POST /api/track/click**

Request:
```json
{
  "referralCode": "john_fractional",
  "referrer": "https://twitter.com",
  "userAgent": "Mozilla/5.0...",
  "utmSource": "twitter",
  "utmMedium": "social",
  "utmCampaign": "launch"
}
```

Logic:
1. Look up referral_link by referral_code
2. Get client IP address from request headers
3. Create session_id hash from (IP + UserAgent + Date)
4. Check if click already exists with same session_id within last 24 hours (deduplication)
5. If new, insert into clicks table
6. Return success response

Response:
```json
{
  "success": true,
  "clickId": "uuid-here"
}
```

### Conversion Tracking Implementation

#### When Purchase Occurs

When a customer completes a purchase, trigger conversion tracking:

**POST /api/track/conversion**

Request:
```json
{
  "customerEmail": "buyer@example.com",
  "productType": "fractional",
  "orderAmount": 500.00,
  "orderId": "order_123"
}
```

Logic:
1. Check localStorage for stored referral code
2. Validate attribution window (e.g., 30 days from click)
3. Look up the original click record by referral_code and timestamp range
4. If valid attribution exists:
   - Get referral_link details including commission_rate
   - Calculate commission_amount = orderAmount * commission_rate
   - Insert into conversions table with status 'pending'
   - Link to original click_id
5. Clear localStorage referral data
6. Return success

Response:
```json
{
  "success": true,
  "conversionId": "uuid-here",
  "commissionAmount": 25.00
}
```

#### Attribution Window

Default: 30 days from click timestamp

```javascript
const ATTRIBUTION_WINDOW_DAYS = 30;
const clickTimestamp = storedRef.timestamp;
const isWithinWindow = (Date.now() - clickTimestamp) < (ATTRIBUTION_WINDOW_DAYS * 24 * 60 * 60 * 1000);
```

### Analytics & Calculations

#### Conversion Rate Formula

```
Conversion Rate = (Total Conversions / Total Clicks) × 100
```

#### Dashboard Statistics Query

**GET /api/stats/:userId**

Should aggregate and return:

```sql
SELECT 
  COUNT(DISTINCT c.id) as total_clicks,
  COUNT(DISTINCT conv.id) as total_conversions,
  ROUND(
    (COUNT(DISTINCT conv.id)::decimal / NULLIF(COUNT(DISTINCT c.id), 0)) * 100, 
    2
  ) as conversion_rate,
  SUM(CASE WHEN conv.status = 'approved' THEN conv.commission_amount ELSE 0 END) as total_earnings
FROM referral_links rl
LEFT JOIN clicks c ON c.referral_link_id = rl.id
LEFT JOIN conversions conv ON conv.referral_link_id = rl.id
WHERE rl.user_id = :userId
GROUP BY rl.id
```

#### Per-Product Statistics

Return breakdown by product type:

```json
{
  "fractional": {
    "clicks": 156,
    "conversions": 8,
    "conversionRate": 5.13,
    "earnings": 125.00
  },
  "full": {
    "clicks": 89,
    "conversions": 2,
    "conversionRate": 2.25,
    "earnings": 500.00
  },
  "hosted": {
    "clicks": 234,
    "conversions": 12,
    "conversionRate": 5.13,
    "earnings": 180.00
  }
}
```

### Recent Activity Feed

**GET /api/activity/:userId**

Query the most recent 10 events (clicks and conversions):

```sql
(
  SELECT 
    'click' as type,
    c.clicked_at as timestamp,
    rl.product_type,
    NULL as amount,
    c.referrer
  FROM clicks c
  JOIN referral_links rl ON c.referral_link_id = rl.id
  WHERE rl.user_id = :userId
)
UNION ALL
(
  SELECT 
    'conversion' as type,
    conv.converted_at as timestamp,
    conv.product_type,
    conv.commission_amount as amount,
    NULL as referrer
  FROM conversions conv
  WHERE conv.user_id = :userId
)
ORDER BY timestamp DESC
LIMIT 10
```

Response:
```json
[
  {
    "type": "conversion",
    "timestamp": "2025-01-15T10:30:00Z",
    "productType": "fractional",
    "amount": 15.50,
    "status": "pending"
  },
  {
    "type": "click",
    "timestamp": "2025-01-15T09:15:00Z",
    "productType": "full",
    "referrer": "twitter.com"
  }
]
```

### API Endpoints Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/referral-links/:userId` | GET | Fetch all referral links for a user |
| `/api/referral-links` | POST | Create new referral link |
| `/api/track/click` | POST | Record a click event |
| `/api/track/conversion` | POST | Record a purchase conversion |
| `/api/stats/:userId` | GET | Get aggregated statistics |
| `/api/activity/:userId` | GET | Get recent activity feed |
| `/api/commissions/:userId` | GET | Get commission history and payouts |

### Frontend Integration Points

#### Current Mock Data (src/pages/CustomerReferral.tsx)

The frontend currently uses hardcoded mock data starting at line 13. Replace with API calls:

**Replace mock referral links:**
```typescript
// Remove lines 13-24 (mock links)
// Add:
const { data: referralLinks, isLoading } = useQuery({
  queryKey: ['referralLinks', userId],
  queryFn: () => fetch(`/api/referral-links/${userId}`).then(r => r.json())
});
```

**Replace mock stats:**
```typescript
// Remove lines 26-30 (mock stats)
// Add:
const { data: stats } = useQuery({
  queryKey: ['stats', userId],
  queryFn: () => fetch(`/api/stats/${userId}`).then(r => r.json())
});
```

**Replace mock activity:**
```typescript
// Remove lines 32-66 (mock activity)
// Add:
const { data: recentActivity } = useQuery({
  queryKey: ['activity', userId],
  queryFn: () => fetch(`/api/activity/${userId}`).then(r => r.json())
});
```

### Real-time Updates (Optional)

For live dashboard updates, implement WebSocket or Server-Sent Events:

```typescript
useEffect(() => {
  const eventSource = new EventSource(`/api/stream/activity/${userId}`);
  
  eventSource.onmessage = (event) => {
    const newActivity = JSON.parse(event.data);
    // Update state with new click or conversion
    queryClient.invalidateQueries(['stats', userId]);
    queryClient.invalidateQueries(['activity', userId]);
  };
  
  return () => eventSource.close();
}, [userId]);
```

### Testing the Tracking System

#### Manual Testing Flow

1. **Generate referral link** for a test user
2. **Open product page** with `?ref=testuser_fractional`
3. **Verify click tracking**: Check clicks table for new entry
4. **Complete test purchase** with test customer email
5. **Verify conversion tracking**: Check conversions table for new entry
6. **Check dashboard stats** updated correctly
7. **Verify recent activity** shows both click and conversion

#### Test Data Script

```sql
-- Insert test user
INSERT INTO users (id, email, username) VALUES
('test-uuid-1', 'john@test.com', 'john');

-- Insert test referral links
INSERT INTO referral_links (user_id, product_type, referral_code, commission_rate) VALUES
('test-uuid-1', 'fractional', 'john_fractional', 0.05),
('test-uuid-1', 'full', 'john_full', 0.10),
('test-uuid-1', 'hosted', 'john_hosted', 0.03);
```

### Security Considerations

1. **Rate Limiting**: Implement rate limits on tracking endpoints to prevent abuse
2. **IP Validation**: Store and validate IP addresses for fraud detection
3. **Session Deduplication**: Prevent duplicate click tracking from same session
4. **Commission Approval**: All conversions start as 'pending' and require admin approval
5. **Input Sanitization**: Validate all incoming tracking data
6. **CORS Configuration**: Only allow tracking from authorized domains

### Performance Optimization

1. **Index Strategy**:
```sql
CREATE INDEX idx_clicks_referral_link ON clicks(referral_link_id, clicked_at);
CREATE INDEX idx_conversions_user ON conversions(user_id, converted_at);
CREATE INDEX idx_referral_code ON referral_links(referral_code);
```

2. **Caching**: Cache aggregated stats for 5-10 minutes
3. **Batch Processing**: Process conversion approvals in batches
4. **Archiving**: Move old clicks (>90 days) to archive table

### Next Steps for Implementation

1. Set up database schema in Supabase/PostgreSQL
2. Create API endpoints for tracking
3. Implement click tracking script
4. Integrate conversion tracking with checkout
5. Replace mock data in frontend with API calls
6. Add admin dashboard for commission approval
7. Set up automated testing suite
8. Implement monitoring and alerts for tracking failures