import React from 'react';
import { renderHook } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAmbassadorAnalytics } from '../useAmbassadorAnalytics';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
      }),
    },
    rpc: vi.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useAmbassadorAnalytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches analytics data for default 30 days', async () => {
    const mockData = {
      total_clicks: 150,
      total_conversions: 12,
      total_earnings: 360.50,
      visits_by_date: [
        { date: '2025-01-01', visits: 10, conversions: 1 },
        { date: '2025-01-02', visits: 15, conversions: 2 },
      ],
      visits_by_link_type: [
        { link_type: 'main', visits: 50, conversions: 5 },
        { link_type: 'shop', visits: 100, conversions: 7 },
      ],
    };

    const { supabase } = await import('@/integrations/supabase/client');
    (supabase.rpc as any).mockResolvedValue({ data: mockData, error: null });

    const { result } = renderHook(() => useAmbassadorAnalytics(), {
      wrapper: createWrapper(),
    });

    // Wait for query to complete
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(result.current.data?.totalClicks).toBe(150);
    expect(result.current.data?.totalConversions).toBe(12);
    expect(result.current.data?.totalEarnings).toBe(360.50);
  });

  it('transforms link types to readable names', async () => {
    const mockData = {
      total_clicks: 100,
      total_conversions: 10,
      total_earnings: 300,
      visits_by_date: [],
      visits_by_link_type: [
        { link_type: 'main', visits: 50, conversions: 5 },
        { link_type: 'waitlist_a', visits: 30, conversions: 3 },
      ],
    };

    const { supabase } = await import('@/integrations/supabase/client');
    (supabase.rpc as any).mockResolvedValue({ data: mockData, error: null });

    const { result } = renderHook(() => useAmbassadorAnalytics(), {
      wrapper: createWrapper(),
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    expect(result.current.data?.visitsByLinkType[0].name).toBe('Main');
    expect(result.current.data?.visitsByLinkType[1].name).toBe('Waitlist A');
  });

  it('handles custom date ranges', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    (supabase.rpc as any).mockResolvedValue({ data: {}, error: null });

    renderHook(() => useAmbassadorAnalytics(90), {
      wrapper: createWrapper(),
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    expect(supabase.rpc).toHaveBeenCalledWith(
      'get_ambassador_analytics',
      expect.objectContaining({
        p_user_id: 'test-user-id',
      })
    );
  });

  it('handles errors gracefully', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    (supabase.rpc as any).mockResolvedValue({
      data: null,
      error: { message: 'Database error' },
    });

    const { result } = renderHook(() => useAmbassadorAnalytics(), {
      wrapper: createWrapper(),
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    expect(result.current.isError).toBe(true);
  });
});
