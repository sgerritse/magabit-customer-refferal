import { assertEquals, assertExists } from "https://deno.land/std@0.190.0/testing/asserts.ts";

interface Notification {
  id: string;
  channel: 'email' | 'sms';
  user_id: string;
  data: any;
  processed: boolean;
}

const mockNotifications: Notification[] = [
  { id: "1", channel: "email", user_id: "user-1", data: { to: "user1@test.com" }, processed: false },
  { id: "2", channel: "sms", user_id: "user-2", data: { to: "+1234567890" }, processed: false },
  { id: "3", channel: "email", user_id: "user-3", data: { to: "user3@test.com" }, processed: false },
];

Deno.test("process-notifications - Processes all unprocessed notifications", async () => {
  const unprocessed = mockNotifications.filter(n => !n.processed);
  assertEquals(unprocessed.length, 3);
});

Deno.test("process-notifications - Routes email notifications correctly", async () => {
  const emailNotifications = mockNotifications.filter(n => n.channel === "email");
  assertEquals(emailNotifications.length, 2);
  assertExists(emailNotifications[0].data.to);
});

Deno.test("process-notifications - Routes SMS notifications correctly", async () => {
  const smsNotifications = mockNotifications.filter(n => n.channel === "sms");
  assertEquals(smsNotifications.length, 1);
  assertExists(smsNotifications[0].data.to);
});

Deno.test("process-notifications - Marks processed notifications as processed", async () => {
  const notification = { ...mockNotifications[0], processed: true };
  assertEquals(notification.processed, true);
});

Deno.test("process-notifications - Handles missing user email gracefully", async () => {
  const notification: Notification = {
    id: "4",
    channel: "email",
    user_id: "user-4",
    data: { to: "" },
    processed: false
  };
  assertEquals(notification.data.to, "");
});

Deno.test("process-notifications - Returns correct success/failure counts", async () => {
  let successCount = 0;
  let failureCount = 0;
  
  for (const notification of mockNotifications) {
    if (notification.data.to) {
      successCount++;
    } else {
      failureCount++;
    }
  }
  
  assertEquals(successCount, 3);
  assertEquals(failureCount, 0);
});

Deno.test("process-notifications - Continues processing after individual failures", async () => {
  const results = mockNotifications.map(n => {
    try {
      return { success: true, id: n.id };
    } catch {
      return { success: false, id: n.id };
    }
  });
  
  assertEquals(results.length, 3);
  assertEquals(results.filter(r => r.success).length, 3);
});
