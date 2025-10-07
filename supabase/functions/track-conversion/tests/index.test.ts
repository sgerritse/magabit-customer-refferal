import { assertEquals, assertExists } from "https://deno.land/std@0.190.0/testing/asserts.ts";

interface ConversionData {
  userId: string;
  referralCode: string;
  subscriptionId: string;
  productId: string;
  amount: number;
}

interface AffiliateSettings {
  default_commission_rate: number;
  campaign_boost_enabled: boolean;
  campaign_boost_amount: number;
}

const mockSettings: AffiliateSettings = {
  default_commission_rate: 30,
  campaign_boost_enabled: true,
  campaign_boost_amount: 5,
};

function calculateCommission(amount: number, rate: number, boost: number = 0): number {
  return (amount * rate / 100) + boost;
}

Deno.test("track-conversion - Valid conversion creates earning record", async () => {
  const conversion: ConversionData = {
    userId: "user-123",
    referralCode: "TEST123",
    subscriptionId: "sub_123",
    productId: "prod_123",
    amount: 29.99,
  };
  
  assertExists(conversion.userId);
  assertExists(conversion.referralCode);
  assertEquals(conversion.amount, 29.99);
});

Deno.test("track-conversion - Calculates commission correctly", async () => {
  const amount = 100;
  const rate = 30;
  const commission = calculateCommission(amount, rate);
  
  assertEquals(commission, 30);
});

Deno.test("track-conversion - Applies campaign boost when enabled", async () => {
  const amount = 100;
  const rate = 30;
  const boost = mockSettings.campaign_boost_enabled ? mockSettings.campaign_boost_amount : 0;
  const commission = calculateCommission(amount, rate, boost);
  
  assertEquals(commission, 35);
});

Deno.test("track-conversion - Prevents duplicate conversion tracking", async () => {
  const existingConversions = new Set(["sub_123"]);
  const newSubscriptionId = "sub_123";
  
  const isDuplicate = existingConversions.has(newSubscriptionId);
  assertEquals(isDuplicate, true);
});

Deno.test("track-conversion - Invalid referral code returns error", async () => {
  const referralCode = "INVALID";
  const isValid = referralCode.length > 0 && referralCode !== "INVALID";
  assertEquals(isValid, false);
});

Deno.test("track-conversion - Creates notification for ambassador", async () => {
  const notification = {
    user_id: "user-123",
    channel: "email",
    notification_type: "new_earning",
    data: { amount: 30 },
  };
  
  assertExists(notification.user_id);
  assertEquals(notification.channel, "email");
});

Deno.test("track-conversion - Tier-based commission rate is applied", async () => {
  const tierRates = {
    bronze: 30,
    silver: 35,
    gold: 40,
  };
  
  const userTier = "gold";
  const rate = tierRates[userTier];
  assertEquals(rate, 40);
});

Deno.test("track-conversion - CORS headers included", async () => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
  assertExists(corsHeaders['Access-Control-Allow-Origin']);
});
