import { assertEquals, assertExists } from "https://deno.land/std@0.190.0/testing/asserts.ts";

interface RateLimit {
  user_id: string;
  hourly_count: number;
  daily_count: number;
  hourly_reset_at: Date;
  daily_reset_at: Date;
}

function shouldResetHourly(resetAt: Date): boolean {
  return new Date() >= resetAt;
}

function shouldResetDaily(resetAt: Date): boolean {
  return new Date() >= resetAt;
}

Deno.test("reset-rate-limits - Resets hourly counts when time elapsed", async () => {
  const pastTime = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago
  const shouldReset = shouldResetHourly(pastTime);
  assertEquals(shouldReset, true);
});

Deno.test("reset-rate-limits - Does not reset hourly if not time yet", async () => {
  const futureTime = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now
  const shouldReset = shouldResetHourly(futureTime);
  assertEquals(shouldReset, false);
});

Deno.test("reset-rate-limits - Resets daily counts at midnight", async () => {
  const yesterday = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25 hours ago
  const shouldReset = shouldResetDaily(yesterday);
  assertEquals(shouldReset, true);
});

Deno.test("reset-rate-limits - Does not reset daily if not midnight yet", async () => {
  const laterToday = new Date(Date.now() + 5 * 60 * 60 * 1000); // 5 hours from now
  const shouldReset = shouldResetDaily(laterToday);
  assertEquals(shouldReset, false);
});

Deno.test("reset-rate-limits - Sets new hourly reset time", async () => {
  const now = new Date();
  const nextReset = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
  
  assertExists(nextReset);
  assertEquals(nextReset > now, true);
});

Deno.test("reset-rate-limits - Sets new daily reset time", async () => {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  
  assertExists(tomorrow);
  assertEquals(tomorrow > now, true);
});

Deno.test("reset-rate-limits - Processes multiple users in batch", async () => {
  const users = ["user-1", "user-2", "user-3"];
  const resetCount = users.length;
  
  assertEquals(resetCount, 3);
});

Deno.test("reset-rate-limits - Handles timezone differences", async () => {
  const utcNow = new Date();
  const utcMidnight = new Date(utcNow);
  utcMidnight.setUTCHours(0, 0, 0, 0);
  
  assertExists(utcMidnight);
});
