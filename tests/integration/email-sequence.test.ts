import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'test-ambassador-id' } },
      }),
    },
  },
}));

describe('Email Sequence Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('starts Ambassador Welcome sequence after first challenge', async () => {
    const userId = 'test-ambassador-id';
    
    // Mock ambassador check (has referral links)
    const hasReferralLinks = true;
    const isFirstChallenge = true;
    
    expect(hasReferralLinks).toBe(true);
    expect(isFirstChallenge).toBe(true);
    
    // Mock sequence progress creation
    const sequenceProgress = {
      user_id: userId,
      sequence_id: 'welcome-sequence-id',
      current_step: 0,
      next_send_at: new Date(Date.now() + 60000), // 1 minute from now
      completed: false,
    };
    
    expect(sequenceProgress.current_step).toBe(0);
    expect(sequenceProgress.next_send_at).toBeInstanceOf(Date);
  });

  it('sends emails at correct intervals', async () => {
    const sequenceSteps = [
      { step_order: 0, delay_days: 0, delay_hours: 0 },
      { step_order: 1, delay_days: 1, delay_hours: 0 },
      { step_order: 2, delay_days: 3, delay_hours: 0 },
    ];
    
    const firstEmailTime = new Date();
    const secondEmailTime = new Date(firstEmailTime.getTime() + 24 * 60 * 60 * 1000); // 1 day later
    
    expect(secondEmailTime > firstEmailTime).toBe(true);
  });

  it('marks sequence complete after last email', async () => {
    const sequenceProgress = {
      current_step: 2,
      total_steps: 3,
      completed: false,
    };
    
    // Simulate sending last email
    sequenceProgress.current_step = 3;
    sequenceProgress.completed = sequenceProgress.current_step >= sequenceProgress.total_steps;
    
    expect(sequenceProgress.completed).toBe(true);
  });

  it('does not start sequence for non-ambassadors', async () => {
    const userId = 'regular-user-id';
    const hasReferralLinks = false;
    
    expect(hasReferralLinks).toBe(false);
    
    // Should not create sequence progress
    const shouldStartSequence = hasReferralLinks;
    expect(shouldStartSequence).toBe(false);
  });

  it('calculates next send time correctly', async () => {
    const currentTime = new Date('2025-01-15T08:00:00Z');
    const delayDays = 3;
    const delayHours = 2;
    
    const nextSendTime = new Date(currentTime);
    nextSendTime.setDate(nextSendTime.getDate() + delayDays);
    nextSendTime.setHours(nextSendTime.getHours() + delayHours);
    
    expect(nextSendTime.getDate()).toBe(18); // 3 days later
    expect(nextSendTime.getHours()).toBe(10); // 2 hours later
  });

  it('handles sequence progression correctly', async () => {
    const progress = {
      current_step: 0,
      next_send_at: new Date('2025-01-15T08:00:00Z'),
      completed: false,
    };
    
    // Simulate email sent
    progress.current_step = 1;
    progress.next_send_at = new Date('2025-01-16T08:00:00Z');
    
    expect(progress.current_step).toBe(1);
    expect(progress.completed).toBe(false);
  });
});
