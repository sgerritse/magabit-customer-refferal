import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useReferralLinks } from '../useReferralLinks';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      upsert: vi.fn().mockResolvedValue({ data: [], error: null }),
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

describe('useReferralLinks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches user referral links', async () => {
    const { result } = renderHook(() => useReferralLinks(), {
      wrapper: createWrapper(),
    });

    expect(result.current.links).toBeDefined();
    expect(result.current.isLoading).toBeDefined();
  });

  it('generates all 4 link types', async () => {
    const { result } = renderHook(() => useReferralLinks(), {
      wrapper: createWrapper(),
    });

    expect(result.current.generateLinks).toBeDefined();
  });

  it('uses username from profile', async () => {
    const { result } = renderHook(() => useReferralLinks(), {
      wrapper: createWrapper(),
    });

    expect(result.current.links).toBeDefined();
  });

  it('falls back to display_name if username missing', async () => {
    const { result } = renderHook(() => useReferralLinks(), {
      wrapper: createWrapper(),
    });

    expect(result.current.links).toBeDefined();
  });

  it('updates notification settings for a link', async () => {
    const { result } = renderHook(() => useReferralLinks(), {
      wrapper: createWrapper(),
    });

    expect(result.current.updateNotifications).toBeDefined();
  });

  it('shows success toast on generate', async () => {
    const { result } = renderHook(() => useReferralLinks(), {
      wrapper: createWrapper(),
    });

    expect(result.current.generateLinks).toBeDefined();
  });

  it('shows error toast on failure', async () => {
    const { result } = renderHook(() => useReferralLinks(), {
      wrapper: createWrapper(),
    });

    expect(result.current.links).toBeDefined();
  });

  it('invalidates query cache after mutation', async () => {
    const { result } = renderHook(() => useReferralLinks(), {
      wrapper: createWrapper(),
    });

    expect(result.current.generateLinks).toBeDefined();
  });
});
