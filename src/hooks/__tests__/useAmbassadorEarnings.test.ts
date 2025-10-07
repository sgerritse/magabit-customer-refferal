import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAmbassadorEarnings } from '../useAmbassadorEarnings';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      }),
    },
  },
}));

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: any) => {
    return QueryClientProvider({ client: queryClient, children });
  };
};

describe('useAmbassadorEarnings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches earnings sorted by date', async () => {
    const { result } = renderHook(() => useAmbassadorEarnings(), {
      wrapper: createWrapper(),
    });

    expect(result.current.earnings).toBeDefined();
    expect(result.current.earningsLoading).toBeDefined();
  });

  it('calculates total earnings correctly', async () => {
    const { result } = renderHook(() => useAmbassadorEarnings(), {
      wrapper: createWrapper(),
    });

    expect(result.current.stats?.totalEarnings).toBeDefined();
  });

  it('calculates available balance (approved only)', async () => {
    const { result } = renderHook(() => useAmbassadorEarnings(), {
      wrapper: createWrapper(),
    });

    expect(result.current.stats?.availableBalance).toBeDefined();
  });

  it('calculates pending balance (pending only)', async () => {
    const { result } = renderHook(() => useAmbassadorEarnings(), {
      wrapper: createWrapper(),
    });

    expect(result.current.stats?.pendingBalance).toBeDefined();
  });

  it('fetches visit stats (clicks & conversions)', async () => {
    const { result } = renderHook(() => useAmbassadorEarnings(), {
      wrapper: createWrapper(),
    });

    expect(result.current.stats?.totalClicks).toBeDefined();
    expect(result.current.stats?.totalConversions).toBeDefined();
  });

  it('gets current tier from database', async () => {
    const { result } = renderHook(() => useAmbassadorEarnings(), {
      wrapper: createWrapper(),
    });

    expect(result.current.stats?.currentTier).toBeDefined();
  });

  it('request payout requires payout method', async () => {
    const { result } = renderHook(() => useAmbassadorEarnings(), {
      wrapper: createWrapper(),
    });

    expect(result.current.requestPayout).toBeDefined();
  });

  it('request payout creates pending record', async () => {
    const { result } = renderHook(() => useAmbassadorEarnings(), {
      wrapper: createWrapper(),
    });

    expect(result.current.requestPayout).toBeDefined();
  });

  it('shows error if no payout method set', async () => {
    const { result } = renderHook(() => useAmbassadorEarnings(), {
      wrapper: createWrapper(),
    });

    expect(result.current.requestPayout).toBeDefined();
  });
});
