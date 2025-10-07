import { vi } from 'vitest';

export const createMockSupabaseClient = () => {
  const mockFrom = vi.fn((table: string) => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
  }));

  const mockAuth = {
    getUser: vi.fn().mockResolvedValue({ 
      data: { user: { id: 'test-user-id', email: 'test@example.com' } }, 
      error: null 
    }),
    signIn: vi.fn().mockResolvedValue({ data: {}, error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    onAuthStateChange: vi.fn(),
  };

  const mockRpc = vi.fn().mockResolvedValue({ data: null, error: null });

  return {
    from: mockFrom,
    auth: mockAuth,
    rpc: mockRpc,
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ data: {}, error: null }),
        download: vi.fn().mockResolvedValue({ data: new Blob(), error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/file.jpg' } }),
      })),
    },
  };
};

export const mockSupabaseClient = createMockSupabaseClient();
