# DadderUp Admin Documentation

## Brand Ambassador Program Administration

This guide covers all administrative functions for managing the DadderUp Brand Ambassador program.

---

## Table of Contents

1. [Overview](#overview)
2. [Managing Ambassadors](#managing-ambassadors)
3. [Approving Landing Pages](#approving-landing-pages)
4. [Processing Payouts](#processing-payouts)
5. [Configuring Commission Rates](#configuring-commission-rates)
6. [Fraud Monitoring](#fraud-monitoring)
7. [Tax Compliance (1099)](#tax-compliance-1099)
8. [Notification Management](#notification-management)
9. [Analytics & Reporting](#analytics-and-reporting)

---

## Overview

The Brand Ambassador Admin interface is located at `/admin` under the **Affiliates** tab.

### Admin Capabilities

- View all ambassador performance metrics
- Approve/reject custom landing pages
- Process payout requests
- Configure commission structures
- Monitor fraud and suspicious activity
- Generate 1099 tax forms
- Manage notification templates
- Upload marketing creatives

---

## Managing Ambassadors

### Ambassador Management Tab

Access: **Admin → Affiliates → Ambassadors**

#### View Ambassador List

The ambassador list shows:
- Display name
- Total clicks
- Total conversions
- Total earnings
- Current tier (Bronze/Silver/Gold)

#### Ambassador Actions

**Manual Tier Assignment:**
While tiers are calculated automatically, admins can override:
1. Navigate to the Ambassadors tab
2. Find the ambassador
3. (Future feature: Manual tier override)

**Commission Overrides:**
Set custom commission rates for specific ambassadors:
1. Go to **Settings** tab
2. Find "User Commission Overrides"
3. Add override:
   - Select user
   - Set commission rate
   - Choose type (percentage or flat)
   - Set active status

---

## Approving Landing Pages

### Landing Page Submission Flow

1. Ambassador creates landing page
2. Submission enters "pending" status
3. Admin reviews content
4. Admin approves or rejects with reason

### Review Process

Access: **Admin → Affiliates → Ambassadors**

**Review Checklist:**
- ✅ Content is appropriate and family-friendly
- ✅ No spam keywords detected
- ✅ Accurate representation of DadderUp
- ✅ No false or misleading claims
- ✅ Properly formatted (no broken HTML)
- ✅ YouTube video (if provided) is relevant

**To Approve:**
1. Click "Approve" button
2. Landing page becomes publicly accessible
3. Ambassador receives notification

**To Reject:**
1. Click "Reject" button
2. Enter clear rejection reason
3. Ambassador can revise and resubmit

### Spam Detection

The system automatically flags landing pages with spam keywords:
- Check keywords in **Settings → Affiliate Settings → Spam Keywords**
- Flagged pages appear in **Fraud Dashboard**
- Review flagged content carefully before approving

---

## Processing Payouts

### Payout Management Tab

Access: **Admin → Affiliates → Payouts**

#### Payout Request Flow

1. Ambassador requests payout (min $1.00)
2. Request appears in "Pending" status
3. Admin reviews and processes
4. Status updates to "Processing" → "Completed"

#### Review Checklist Before Approving

- ✅ Verify available balance is accurate
- ✅ Check for fraudulent activity
- ✅ Confirm payout method is verified
- ✅ Review recent conversion activity
- ✅ Check W-9 status if earnings >= $600

#### Processing a Payout

**Option 1: PayPal**
1. Log into PayPal business account
2. Send payment to ambassador's email
3. Copy transaction ID
4. Update payout status in dashboard
5. Add transaction ID

**Option 2: Stripe (Bank Transfer)**
1. Access Stripe dashboard
2. Create payout to connected account
3. Copy transaction ID
4. Update status in dashboard

**Option 3: Manual Bank Transfer**
1. Use ambassador's bank details
2. Process transfer through your bank
3. Save confirmation number
4. Update payout status

#### Bulk Payout Processing

For multiple payouts:
1. Export payout list as CSV
2. Process in batch through payment provider
3. Upload transaction IDs via CSV import
4. System updates all statuses

---

## Configuring Commission Rates

### Affiliate Settings Tab

Access: **Admin → Affiliates → Settings**

#### Default Commission Settings

**Commission Type:**
- **Percentage:** Commission based on order value (e.g., 30%)
- **Flat:** Fixed amount per conversion (e.g., $10)

**Default Commission Rate:**
- Set the baseline rate for all new ambassadors
- Default: 30%

**Tiered Commissions:**
Enable/disable tiered commission structure:

**Bronze Tier:**
- Threshold: 0 conversions
- Rate: 30% (default)

**Silver Tier:**
- Threshold: 10 conversions/month
- Rate: 35%

**Gold Tier:**
- Threshold: 25 conversions/month
- Rate: 40%

#### Campaign Boosts

Temporarily boost commissions for all or selected ambassadors:

**Settings:**
- Enable campaign boost: On/Off
- Boost amount: Additional $ or % on top of tier rate
- Start date: When boost begins
- End date: When boost ends
- Target: All ambassadors or selected list

**Example Use Cases:**
- Holiday promotions
- New product launches
- Quarterly contests
- Anniversary celebrations

---

## Fraud Monitoring

### Fraud Dashboard

Access: **Admin → Affiliates → Fraud Dashboard**

#### Velocity Limit Violations

**What It Detects:**
- Ambassadors exceeding hourly referral limits
- Ambassadors exceeding daily referral limits

**Thresholds (Configurable):**
- Max referrals per hour: 10 (default)
- Max referrals per day: 50 (default)

**Actions:**
- Review user activity
- Temporarily suspend account
- Contact ambassador for explanation
- Ban if confirmed fraud

#### Duplicate IP Addresses

**What It Detects:**
- Multiple conversions from same IP address
- Potential self-referral or bot activity

**Red Flags:**
- 3+ conversions from same IP
- All conversions in short time window
- Geographic inconsistencies

**Actions:**
- Investigate conversion details
- Contact customers to verify legitimacy
- Reverse fraudulent earnings
- Ban offending ambassador

#### Spam Content Detection

**What It Detects:**
- Landing pages with spam keywords
- Suspicious patterns in custom content

**Spam Keywords (Configurable):**
- click here
- free money
- urgent
- act now
- limited time

**Actions:**
- Auto-flag for manual review
- Reject landing page
- Warn ambassador
- Monitor for repeat violations

#### Automated Alerts

Admins receive email alerts for:
- High-severity fraud patterns
- Sudden spikes in referrals
- Unusual geographic distribution
- Multiple rejections from same ambassador

---

## Tax Compliance (1099)

### Tax Compliance Tab

Access: **Admin → Affiliates → Tax / 1099**

#### W-9 Collection

**Requirements:**
- Ambassadors earning $600+ must submit W-9
- System prompts automatically at threshold
- Admin can manually request W-9 submission

**Viewing W-9 Data:**
- Navigate to Tax Compliance tab
- See list of ambassadors with W-9 status
- View submitted W-9 forms (last 4 digits only for security)

#### Generating 1099 Forms

**Annual Process (Before January 31st):**

1. Navigate to Tax Compliance tab
2. Select tax year (e.g., 2024)
3. Click "Generate 1099 Data"
4. System compiles all earnings >= $600
5. Download CSV with:
   - Ambassador name
   - Address
   - Tax ID (encrypted)
   - Total earnings
   - Form 1099-NEC fields

**Using the Data:**
1. Import CSV into tax software (TurboTax, TaxAct, etc.)
2. Generate official 1099-NEC forms
3. Mail/email forms to ambassadors
4. File copies with IRS

**Important Dates:**
- December 31: End of tax year
- January 15: Generate 1099 data
- January 31: Mail 1099s to ambassadors
- January 31: File with IRS

#### Tax Compliance Checklist

- [ ] Verify all W-9 forms collected
- [ ] Run final earnings report for tax year
- [ ] Generate 1099 data CSV
- [ ] Create 1099-NEC forms
- [ ] Mail forms to ambassadors
- [ ] File Copy A with IRS
- [ ] Keep Copy C for records (3 years)

---

## Notification Management

### Email Notifications

Access: **Admin → Notifications → Email**

#### Configuring Mailgun

1. Set up Mailgun account at mailgun.com
2. Verify domain
3. Get API key
4. Enter credentials in Email Settings:
   - Mailgun API Key
   - Mailgun Domain
   - From Email
   - From Name

#### Email Templates

Create templates for:
- Conversion notifications
- Payout confirmations
- Landing page approvals/rejections
- Tier advancement
- Campaign announcements

**Template Variables:**
- `{{amount}}` - Commission amount
- `{{conversion_date}}` - Date of conversion
- `{{tier}}` - Current tier
- `{{link_type}}` - Type of referral link
- `{{payout_amount}}` - Payout amount

#### Email Sequences

Create automated email sequences:
1. **Welcome Sequence** (5 emails):
   - Day 0: Welcome & overview
   - Day 1: How to generate links
   - Day 3: Landing page setup
   - Day 5: Best practices
   - Day 7: Commission structure

2. **Re-engagement Sequence**:
   - Triggered after 30 days of inactivity
   - Remind ambassadors of their potential
   - Offer tips and support

#### Email Triggers

Set up triggers for automatic emails:
- New ambassador signup → Welcome email
- First conversion → Congratulations email
- Tier advancement → Tier celebration email
- Payout processed → Confirmation email
- Landing page approved → Approval notification

### SMS Notifications

Access: **Admin → Notifications → SMS**

**Twilio Configuration:**
1. Create Twilio account
2. Get phone number
3. Get Account SID and Auth Token
4. Enter in SMS Settings

**SMS Templates:**
- Brief conversion alerts
- Payout confirmations
- Urgent fraud alerts

---

## Analytics and Reporting

### Earnings Overview Tab

Access: **Admin → Affiliates → Earnings**

**Metrics Available:**
- Total commissions paid (all time)
- Total pending payouts
- Average commission per conversion
- Top earning ambassadors
- Earnings by month/quarter/year

### Export Reports

**Available Exports:**
- Ambassador performance CSV
- Payout history CSV
- Conversion details CSV
- 1099 tax data CSV
- Fraud activity log CSV

### Key Performance Indicators (KPIs)

Monitor these metrics:
1. **Total Active Ambassadors** - Ambassadors with >= 1 referral in last 30 days
2. **Average Conversion Rate** - Clicks to conversions ratio
3. **Top 10% Earnings** - Identify super-performers
4. **Payout Velocity** - Time from request to processing
5. **Fraud Detection Rate** - % of conversions flagged

---

## Best Practices

### Ambassador Communication

- Send monthly newsletter with tips and updates
- Recognize top performers publicly
- Provide feedback on rejected landing pages
- Respond to support requests within 24 hours

### Payout Processing

- Process payouts weekly (same day each week)
- Maintain 5-7 day processing window
- Communicate delays proactively
- Keep detailed transaction records

### Fraud Prevention

- Review fraud dashboard daily
- Investigate all high-severity alerts
- Document investigation outcomes
- Update spam keywords regularly

### Commission Strategy

- Review tier thresholds quarterly
- Adjust rates based on profitability
- Run campaign boosts strategically (holidays, launches)
- A/B test different incentive structures

---

## Troubleshooting

### Common Issues

**Payout Request Errors:**
- Check available balance calculation
- Verify payout method is set up
- Ensure no pending fraud flags

**Email Not Sending:**
- Verify Mailgun credentials
- Check domain verification
- Review rate limit settings

**Landing Page Not Saving:**
- Check for HTML validation errors
- Verify user has permission
- Review spam keyword detection

---

## Support

For technical support or questions about the admin system:

**Email:** admin-support@dadderup.com
**Documentation:** docs.dadderup.com/admin
**System Status:** status.dadderup.com

---

**Last Updated:** January 2025
**Version:** 1.0
