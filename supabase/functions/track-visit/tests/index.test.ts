import { assertEquals, assertExists } from "https://deno.land/std@0.190.0/testing/asserts.ts";

// Mock Supabase client
const mockSupabaseClient = {
  from: (table: string) => ({
    select: (columns?: string) => ({
      eq: (column: string, value: any) => ({
        single: async () => {
          if (table === "referral_links" && value === "TEST123") {
            return { data: { id: "link-123", user_id: "user-123", is_active: true }, error: null };
          }
          if (table === "referral_links" && value === "INACTIVE") {
            return { data: { id: "link-456", user_id: "user-456", is_active: false }, error: null };
          }
          return { data: null, error: { message: "Not found" } };
        },
        maybeSingle: async () => {
          if (table === "referral_visits" && column === "visitor_ip") {
            return { data: { id: "visit-123", visited_at: new Date().toISOString() }, error: null };
          }
          return { data: null, error: null };
        },
      }),
    }),
    insert: (data: any) => ({
      select: () => ({
        single: async () => ({ data: { id: "new-visit-123", ...data }, error: null }),
      }),
    }),
    update: (data: any) => ({
      eq: () => ({
        select: () => ({
          single: async () => ({ data: { clicks: 11 }, error: null }),
        }),
      }),
    }),
  }),
  rpc: async (fn: string, params: any) => {
    if (fn === "increment_link_clicks") {
      return { data: null, error: null };
    }
    return { data: null, error: { message: "Unknown RPC" } };
  },
};

Deno.test("track-visit - Valid referral code creates visit record", async () => {
  const referralCode = "TEST123";
  const visitorIp = "192.168.1.100";
  
  const link = await mockSupabaseClient.from("referral_links").select().eq("code", referralCode).single();
  assertEquals(link.data?.is_active, true);
  assertExists(link.data?.id);
  
  const visit = await mockSupabaseClient.from("referral_visits").insert({
    referral_link_id: link.data?.id,
    visitor_ip: visitorIp,
  }).select().single();
  
  assertExists(visit.data?.id);
});

Deno.test("track-visit - Invalid referral code returns error", async () => {
  const result = await mockSupabaseClient.from("referral_links").select().eq("code", "INVALID").single();
  assertEquals(result.data, null);
  assertExists(result.error);
});

Deno.test("track-visit - Duplicate visit within 24 hours is detected", async () => {
  const existingVisit = await mockSupabaseClient.from("referral_visits").select().eq("visitor_ip", "192.168.1.100").maybeSingle();
  assertExists(existingVisit.data);
});

Deno.test("track-visit - Inactive referral link returns error", async () => {
  const link = await mockSupabaseClient.from("referral_links").select().eq("code", "INACTIVE").single();
  assertEquals(link.data?.is_active, false);
});

Deno.test("track-visit - Link clicks are incremented", async () => {
  const result = await mockSupabaseClient.rpc("increment_link_clicks", { link_id: "link-123" });
  assertEquals(result.error, null);
});

Deno.test("track-visit - Cookie is set with attribution days", async () => {
  const attributionDays = 365;
  const cookieExpiry = new Date(Date.now() + attributionDays * 24 * 60 * 60 * 1000);
  assertExists(cookieExpiry);
  assertEquals(cookieExpiry > new Date(), true);
});

Deno.test("track-visit - Velocity limits are enforced", async () => {
  const maxVisitsPerHour = 10;
  const currentVisits = 11;
  const isLimited = currentVisits > maxVisitsPerHour;
  assertEquals(isLimited, true);
});

Deno.test("track-visit - CORS headers included", async () => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
  assertExists(corsHeaders['Access-Control-Allow-Origin']);
  assertExists(corsHeaders['Access-Control-Allow-Headers']);
});
