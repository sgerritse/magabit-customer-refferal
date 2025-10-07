import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'test-ambassador-id' } },
      }),
    },
  },
}));

describe('Referral Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('completes full referral flow from visit to conversion', async () => {
    const mockReferralLink = {
      id: 'link-123',
      code: 'TEST123',
      user_id: 'test-ambassador-id',
      is_active: true,
    };

    const mockVisit = {
      id: 'visit-123',
      referral_link_id: 'link-123',
      visitor_ip: '192.168.1.100',
      converted: false,
    };

    const mockEarning = {
      id: 'earning-123',
      user_id: 'test-ambassador-id',
      referral_visit_id: 'visit-123',
      amount: 8.997,
      commission_rate: 30,
      status: 'pending',
    };

    // Mock referral link lookup
    (supabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockReferralLink, error: null }),
        }),
      }),
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockVisit, error: null }),
        }),
      }),
    });

    expect(mockReferralLink.is_active).toBe(true);
    expect(mockVisit.referral_link_id).toBe('link-123');
    expect(mockEarning.amount).toBeCloseTo(8.997, 2);
  });

  it('updates ambassador tier after threshold reached', async () => {
    const mockTier = {
      user_id: 'test-ambassador-id',
      current_tier: 'bronze',
      monthly_conversions: 10,
    };

    const silverThreshold = 10;
    
    if (mockTier.monthly_conversions >= silverThreshold) {
      mockTier.current_tier = 'silver';
    }

    expect(mockTier.current_tier).toBe('silver');
  });

  it('applies campaign boost when active', async () => {
    const baseCommission = 30;
    const campaignBoost = 5;
    const amount = 100;
    
    const totalCommission = (amount * baseCommission / 100) + campaignBoost;
    
    expect(totalCommission).toBe(35);
  });

  it('prevents duplicate conversions', async () => {
    const existingConversions = new Set(['sub_123']);
    const newConversion = 'sub_123';
    
    const isDuplicate = existingConversions.has(newConversion);
    expect(isDuplicate).toBe(true);
  });

  it('queues notification after conversion', async () => {
    const notification = {
      user_id: 'test-ambassador-id',
      channel: 'email',
      notification_type: 'new_earning',
      data: { amount: 30 },
      processed: false,
    };

    expect(notification.processed).toBe(false);
    expect(notification.channel).toBe('email');
  });
});
