import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock environment variables
process.env.VITE_SUPABASE_URL = 'https://ctmzlorgzptgeluwjxwk.supabase.co';
process.env.VITE_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN0bXpsb3JnenB0Z2VsdXdqeHdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5MTMyNzcsImV4cCI6MjA3MzQ4OTI3N30.sSt9h440CZ6aYyCdkALmGO5WEwL1z-6BBrnZeTJNkTI';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
