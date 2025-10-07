import { z } from 'zod';
import DOMPurify from 'dompurify';

/**
 * Sanitize HTML content to prevent XSS attacks
 */
export const sanitizeHtml = (dirty: string): string => {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href', 'target'],
    ALLOW_DATA_ATTR: false,
  });
};

/**
 * Sanitize plain text input (remove HTML tags, trim whitespace)
 */
export const sanitizeText = (input: string): string => {
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] }).trim();
};

/**
 * Validate and sanitize URL
 */
export const sanitizeUrl = (url: string): string | null => {
  try {
    const urlObj = new URL(url);
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return null;
    }
    return urlObj.toString();
  } catch {
    return null;
  }
};

/**
 * Common validation schemas
 */
export const validationSchemas = {
  email: z.string()
    .trim()
    .email({ message: 'Invalid email address' })
    .max(255, { message: 'Email must be less than 255 characters' }),

  phoneNumber: z.string()
    .trim()
    .regex(/^\+?[1-9]\d{1,14}$/, { message: 'Invalid phone number format' })
    .optional(),

  password: z.string()
    .min(8, { message: 'Password must be at least 8 characters' })
    .max(128, { message: 'Password must be less than 128 characters' })
    .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
    .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
    .regex(/[0-9]/, { message: 'Password must contain at least one number' })
    .regex(/[^A-Za-z0-9]/, { message: 'Password must contain at least one special character' }),

  name: z.string()
    .trim()
    .min(1, { message: 'Name cannot be empty' })
    .max(100, { message: 'Name must be less than 100 characters' })
    .regex(/^[a-zA-Z\s\-']+$/, { message: 'Name can only contain letters, spaces, hyphens, and apostrophes' }),

  taxId: z.object({
    type: z.enum(['ssn', 'ein']),
    value: z.string()
      .trim()
      .refine((val) => {
        // SSN: XXX-XX-XXXX or XXXXXXXXX
        const ssnPattern = /^(\d{3}-?\d{2}-?\d{4})$/;
        // EIN: XX-XXXXXXX or XXXXXXXXX
        const einPattern = /^(\d{2}-?\d{7})$/;
        return ssnPattern.test(val) || einPattern.test(val);
      }, { message: 'Invalid Tax ID format' }),
  }),

  bankAccount: z.object({
    accountNumber: z.string()
      .trim()
      .regex(/^\d{4,17}$/, { message: 'Account number must be 4-17 digits' }),
    routingNumber: z.string()
      .trim()
      .regex(/^\d{9}$/, { message: 'Routing number must be 9 digits' }),
    accountHolderName: z.string()
      .trim()
      .min(1, { message: 'Account holder name is required' })
      .max(100, { message: 'Name must be less than 100 characters' }),
    bankName: z.string()
      .trim()
      .max(100, { message: 'Bank name must be less than 100 characters' })
      .optional(),
  }),

  address: z.object({
    addressLine1: z.string()
      .trim()
      .min(1, { message: 'Address line 1 is required' })
      .max(255, { message: 'Address must be less than 255 characters' }),
    addressLine2: z.string()
      .trim()
      .max(255, { message: 'Address must be less than 255 characters' })
      .optional(),
    city: z.string()
      .trim()
      .min(1, { message: 'City is required' })
      .max(100, { message: 'City must be less than 100 characters' }),
    state: z.string()
      .trim()
      .length(2, { message: 'State must be 2 characters' })
      .regex(/^[A-Z]{2}$/, { message: 'State must be 2 uppercase letters' }),
    postalCode: z.string()
      .trim()
      .regex(/^\d{5}(-\d{4})?$/, { message: 'Invalid postal code format' }),
    country: z.string()
      .trim()
      .default('United States'),
  }),

  challengeResponse: z.object({
    response: z.string()
      .trim()
      .min(1, { message: 'Response cannot be empty' })
      .max(10000, { message: 'Response must be less than 10,000 characters' }),
    rating: z.number()
      .int()
      .min(0)
      .max(5),
    timeSpent: z.number()
      .int()
      .min(0)
      .max(86400), // Max 24 hours
  }),

  communityPost: z.object({
    title: z.string()
      .trim()
      .min(3, { message: 'Title must be at least 3 characters' })
      .max(200, { message: 'Title must be less than 200 characters' }),
    content: z.string()
      .trim()
      .min(10, { message: 'Content must be at least 10 characters' })
      .max(10000, { message: 'Content must be less than 10,000 characters' }),
    category: z.string()
      .trim()
      .max(50, { message: 'Category must be less than 50 characters' })
      .optional(),
  }),

  referralCode: z.string()
    .trim()
    .regex(/^[A-Za-z0-9_-]{6,20}$/, { message: 'Invalid referral code format' }),
};

/**
 * Rate limiting utility (client-side)
 */
export class RateLimiter {
  private attempts: Map<string, number[]> = new Map();

  constructor(
    private maxAttempts: number,
    private windowMs: number
  ) {}

  isAllowed(key: string): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    
    // Remove old attempts outside the window
    const recentAttempts = attempts.filter(time => now - time < this.windowMs);
    
    if (recentAttempts.length >= this.maxAttempts) {
      return false;
    }
    
    recentAttempts.push(now);
    this.attempts.set(key, recentAttempts);
    
    return true;
  }

  reset(key: string): void {
    this.attempts.delete(key);
  }
}

/**
 * Validate file upload
 */
export const validateFileUpload = (
  file: File,
  options: {
    maxSizeBytes: number;
    allowedTypes: string[];
  }
): { valid: boolean; error?: string } => {
  if (file.size > options.maxSizeBytes) {
    return {
      valid: false,
      error: `File size must be less than ${Math.round(options.maxSizeBytes / 1024 / 1024)}MB`,
    };
  }

  if (!options.allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed`,
    };
  }

  return { valid: true };
};

/**
 * Prevent SQL injection in search queries (for display purposes only - Supabase client handles actual SQL safety)
 */
export const sanitizeSearchQuery = (query: string): string => {
  return query
    .trim()
    .replace(/[%_]/g, '') // Remove SQL wildcards
    .substring(0, 100); // Limit length
};
