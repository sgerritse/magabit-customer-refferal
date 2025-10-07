# Testing Documentation

## Overview

This directory contains all tests for the DadderUp brand ambassador/affiliate system, organized into unit tests, integration tests, and end-to-end tests.

## Running Tests

### All Tests
```bash
npm run test
```

### Unit Tests Only
```bash
npm run test:unit
```

### Integration Tests Only
```bash
npm run test:integration
```

### Edge Function Tests
```bash
npm run test:edge
```

### With Coverage
```bash
npm run test:coverage
```

### Watch Mode
```bash
npm run test:watch
```

### UI Mode
```bash
npm run test:ui
```

## Test Structure

```
tests/
├── setup.ts                      # Global test setup
├── utils/
│   └── mockSupabase.ts          # Supabase client mocks
├── integration/                  # Integration tests
│   ├── referral-flow.test.ts
│   ├── rate-limiting.test.ts
│   └── email-sequence.test.ts
└── README.md

src/hooks/__tests__/              # React hook tests
├── useReferralLinks.test.ts
└── useAmbassadorEarnings.test.ts

supabase/functions/*/tests/       # Edge function tests
├── track-visit/tests/
├── send-email/tests/
└── process-notifications/tests/
```

## Writing New Tests

### Unit Tests (React Hooks)

```typescript
import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

describe('MyHook', () => {
  it('should do something', async () => {
    const { result } = renderHook(() => useMyHook(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });
  });
});
```

### Edge Function Tests (Deno)

```typescript
import { assertEquals } from "https://deno.land/std@0.190.0/testing/asserts.ts";

Deno.test("my-function - does something", async () => {
  const mockRequest = new Request("https://example.com", {
    method: "POST",
    body: JSON.stringify({ test: "data" }),
  });

  // Test logic here
  assertEquals(true, true);
});
```

### Integration Tests

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('Feature Integration', () => {
  beforeEach(() => {
    // Setup test data
  });

  afterEach(() => {
    // Cleanup test data
  });

  it('completes full flow', async () => {
    // Test multiple functions working together
  });
});
```

## Mocking

### Supabase Client

```typescript
import { mockSupabaseClient } from '@/tests/utils/mockSupabase';

// Use in tests
vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabaseClient,
}));
```

### Toast Notifications

```typescript
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));
```

## Test Data

Test data should be:
- Isolated per test
- Cleaned up after each test
- Use realistic but fake data
- Not depend on production database

## Coverage Goals

| Category | Target |
|----------|--------|
| Edge Functions | 85%+ |
| React Hooks | 80%+ |
| Components | 70%+ |
| Integration Flows | 100% |

## Continuous Integration

Tests run automatically on:
- Every pull request
- Every commit to main
- Nightly builds

## Troubleshooting

### Tests Timing Out
- Increase timeout in vitest.config.ts
- Check for unresolved promises

### Mock Not Working
- Ensure mock is defined before importing module
- Use `vi.clearAllMocks()` in beforeEach

### Database Connection Errors
- Verify test environment variables
- Check Supabase credentials

## Best Practices

1. **Test Behavior, Not Implementation**
   - Focus on what the code does, not how
   - Avoid testing internal details

2. **Keep Tests Simple**
   - One assertion per test when possible
   - Clear test names that describe what's being tested

3. **Use Factories for Test Data**
   - Create helper functions for common test objects
   - Makes tests more maintainable

4. **Avoid Test Interdependence**
   - Each test should run independently
   - Don't rely on test execution order

5. **Mock External Services**
   - Don't make real API calls in tests
   - Use mocks for Supabase, Mailgun, Twilio, etc.

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Deno Testing](https://deno.land/manual/testing)
