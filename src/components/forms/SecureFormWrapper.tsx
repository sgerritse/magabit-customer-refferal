import React, { useState } from 'react';
import { RateLimiter } from '@/utils/inputValidation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface SecureFormWrapperProps {
  children: React.ReactNode;
  onSubmit: (e: React.FormEvent) => Promise<void> | void;
  rateLimitKey: string;
  maxAttempts?: number;
  windowMs?: number;
  className?: string;
}

// Global rate limiter instance
const rateLimiters = new Map<string, RateLimiter>();

/**
 * Wrapper component that adds rate limiting and security features to forms
 */
export const SecureFormWrapper: React.FC<SecureFormWrapperProps> = ({
  children,
  onSubmit,
  rateLimitKey,
  maxAttempts = 5,
  windowMs = 60000, // 1 minute
  className = '',
}) => {
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [rateLimitResetTime, setRateLimitResetTime] = useState<number>(0);

  // Get or create rate limiter for this form
  if (!rateLimiters.has(rateLimitKey)) {
    rateLimiters.set(rateLimitKey, new RateLimiter(maxAttempts, windowMs));
  }
  const rateLimiter = rateLimiters.get(rateLimitKey)!;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check rate limit
    if (!rateLimiter.isAllowed(rateLimitKey)) {
      setIsRateLimited(true);
      setRateLimitResetTime(Date.now() + windowMs);
      
      // Auto-reset after window expires
      setTimeout(() => {
        setIsRateLimited(false);
        rateLimiter.reset(rateLimitKey);
      }, windowMs);
      
      return;
    }

    // Call the actual submit handler
    await onSubmit(e);
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      {isRateLimited && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Rate Limit Exceeded</AlertTitle>
          <AlertDescription>
            Too many attempts. Please wait {Math.ceil((rateLimitResetTime - Date.now()) / 1000)} seconds before trying again.
          </AlertDescription>
        </Alert>
      )}
      {children}
    </form>
  );
};
