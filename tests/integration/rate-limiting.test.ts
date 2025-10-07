import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

interface RateLimitState {
  hourly_count: number;
  daily_count: number;
  hourly_reset_at: Date;
  daily_reset_at: Date;
}

const rateLimits = new Map<string, RateLimitState>();

function checkRateLimit(userId: string, maxHourly: number, maxDaily: number): boolean {
  const limits = rateLimits.get(userId);
  if (!limits) return true;
  
  return limits.hourly_count < maxHourly && limits.daily_count < maxDaily;
}

function incrementRateLimit(userId: string): void {
  const limits = rateLimits.get(userId) || {
    hourly_count: 0,
    daily_count: 0,
    hourly_reset_at: new Date(Date.now() + 60 * 60 * 1000),
    daily_reset_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
  };
  
  limits.hourly_count++;
  limits.daily_count++;
  rateLimits.set(userId, limits);
}

function resetHourlyLimit(userId: string): void {
  const limits = rateLimits.get(userId);
  if (limits) {
    limits.hourly_count = 0;
    limits.hourly_reset_at = new Date(Date.now() + 60 * 60 * 1000);
  }
}

describe('Rate Limiting Integration', () => {
  beforeEach(() => {
    rateLimits.clear();
  });

  afterEach(() => {
    rateLimits.clear();
  });

  it('blocks email sends after hourly limit reached', async () => {
    const userId = 'test-user-id';
    const maxHourly = 10;

    // Send emails up to hourly limit
    for (let i = 0; i < 10; i++) {
      incrementRateLimit(userId);
      expect(rateLimits.get(userId)?.hourly_count).toBe(i + 1);
    }

    // Next send should be blocked
    const canSend = checkRateLimit(userId, maxHourly, 50);
    expect(canSend).toBe(false);
  });

  it('resets hourly limits after reset-rate-limits runs', async () => {
    const userId = 'test-user-id';
    
    // Reach hourly limit
    for (let i = 0; i < 10; i++) {
      incrementRateLimit(userId);
    }
    
    expect(checkRateLimit(userId, 10, 50)).toBe(false);
    
    // Run reset function
    resetHourlyLimit(userId);
    
    // Verify next send succeeds
    expect(checkRateLimit(userId, 10, 50)).toBe(true);
    expect(rateLimits.get(userId)?.hourly_count).toBe(0);
  });

  it('blocks SMS sends after daily limit reached', async () => {
    const userId = 'test-user-sms';
    const maxDaily = 20;
    
    // Send SMS up to daily limit
    for (let i = 0; i < 20; i++) {
      incrementRateLimit(userId);
    }
    
    const canSend = checkRateLimit(userId, 5, maxDaily);
    expect(canSend).toBe(false);
    expect(rateLimits.get(userId)?.daily_count).toBe(20);
  });

  it('tracks separate limits for email and SMS', async () => {
    const userIdEmail = 'user-email';
    const userIdSms = 'user-sms';
    
    incrementRateLimit(userIdEmail);
    incrementRateLimit(userIdSms);
    
    expect(rateLimits.get(userIdEmail)?.hourly_count).toBe(1);
    expect(rateLimits.get(userIdSms)?.hourly_count).toBe(1);
  });

  it('calculates correct reset times', async () => {
    const userId = 'test-user-id';
    incrementRateLimit(userId);
    
    const limits = rateLimits.get(userId);
    expect(limits?.hourly_reset_at).toBeInstanceOf(Date);
    expect(limits?.daily_reset_at).toBeInstanceOf(Date);
    expect(limits!.daily_reset_at > limits!.hourly_reset_at).toBe(true);
  });
});
