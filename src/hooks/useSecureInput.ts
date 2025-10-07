import { useState, useCallback } from 'react';
import { sanitizeText, sanitizeHtml } from '@/utils/inputValidation';

interface UseSecureInputOptions {
  sanitize?: 'text' | 'html' | 'none';
  maxLength?: number;
}

/**
 * Hook for managing secure input with automatic sanitization
 */
export const useSecureInput = (
  initialValue: string = '',
  options: UseSecureInputOptions = {}
) => {
  const { sanitize = 'text', maxLength } = options;
  const [value, setValue] = useState(initialValue);
  const [rawValue, setRawValue] = useState(initialValue);

  const handleChange = useCallback(
    (newValue: string) => {
      // Store raw value before sanitization
      setRawValue(newValue);

      // Apply max length if specified
      let processedValue = maxLength 
        ? newValue.substring(0, maxLength) 
        : newValue;

      // Apply sanitization based on type
      switch (sanitize) {
        case 'text':
          processedValue = sanitizeText(processedValue);
          break;
        case 'html':
          processedValue = sanitizeHtml(processedValue);
          break;
        case 'none':
        default:
          break;
      }

      setValue(processedValue);
    },
    [sanitize, maxLength]
  );

  const reset = useCallback(() => {
    setValue(initialValue);
    setRawValue(initialValue);
  }, [initialValue]);

  return {
    value,
    rawValue,
    onChange: handleChange,
    reset,
    hasChanged: value !== initialValue,
    charactersRemaining: maxLength ? maxLength - value.length : undefined,
  };
};
